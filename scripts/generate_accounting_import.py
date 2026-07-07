# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

NS = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
STOP_WORDS = {
    'pour', 'avec', 'sur', 'des', 'une', 'les', 'dans', 'besoin', 'effectuee', 'effectuer',
    'effectue', 'avance', 'commande', 'service', 'bureau', 'mois', 'mr', 'mme', 'miss', 'du',
    'de', 'la', 'le', 'un', 'd', 'l', 'a', 'au', 'aux', 'par', 'en', 'et', 'ou', 'theo',
    'evrard', 'aime', 'gerant'
}
PRODUCT_KEYWORDS = {
    'cachet', 'carnet', 'vinyle', 'badge', 'badges', 'dtf', 'impression', 'photo',
    'photocopie', 'plastification', 'sublimation', 'polo', 'tee', 'shirt', 'ncr',
    'boitier', 'boite', 'carte', 'visite', 'faire', 'part', 'documents', 'etiquettes',
    'bache', 'flyers'
}
GENERIC_FOLLOW_KEYWORDS = {'transport', 'livreur'}
STRONG_EXPENSE_KEYWORDS = {'depot', 'achat'}


@dataclass
class ImportRow:
    sourceId: str
    type: str
    description: str
    category: str
    amount: int
    date: str
    linkedSourceIds: list[str]
    tokens: set[str]


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii').lower()
    normalized = re.sub(r'[^a-z0-9]+', ' ', normalized)
    return ' '.join(normalized.split())


def tokenize(value: str) -> set[str]:
    return {
        token
        for token in normalize_text(value).split()
        if len(token) > 2 and token not in STOP_WORDS
    }


def categorize(description: str, row_type: str) -> str:
    normalized = normalize_text(description)

    if 'transport' in normalized or 'livreur' in normalized:
        return 'Transport'
    if 'salaire' in normalized:
        return 'Salaire'
    if 'wifi' in normalized or 'telephone' in normalized or 'recharge' in normalized or 'appel' in normalized:
        return 'Telecom'
    if 'omo' in normalized or 'entretien' in normalized or 'serpiere' in normalized:
        return 'Entretien'
    if 'pizza' in normalized or 'eau' in normalized or 'repas' in normalized:
        return 'Restauration'
    if (
        'achat' in normalized
        or 'depot' in normalized
        or 'rame' in normalized
        or 'encre' in normalized
        or 'ncr' in normalized
        or 'boite' in normalized
        or 'boitier' in normalized
        or 'bristol' in normalized
    ):
        return 'Achats'
    if any(keyword in normalized for keyword in [
        'cachet', 'vinyle', 'badge', 'dtf', 'impression', 'photo', 'photocopie',
        'plastification', 'sublimation', 'polo', 'shirt', 'carte', 'visite',
        'faire part', 'documents', 'etiquettes', 'reluire', 'bache', 'flyers', 'flocage'
    ]):
        return 'Prestations'
    return 'Recettes' if row_type == 'income' else 'Depenses'


def excel_date_to_iso(serial_value: str) -> str | None:
    try:
        serial = float(serial_value)
    except (TypeError, ValueError):
        return None

    if serial <= 0:
        return None

    base = datetime(1899, 12, 30)
    return (base + timedelta(days=serial)).date().isoformat()


def read_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get('t')
    value_node = cell.find('main:v', NS)
    if value_node is not None:
        raw = value_node.text or ''
        if cell_type == 's' and raw.isdigit():
            return shared_strings[int(raw)]
        return raw

    inline_string = cell.find('main:is', NS)
    if inline_string is not None:
        return ''.join(text_node.text or '' for text_node in inline_string.iterfind('.//main:t', NS))

    return ''


def parse_workbook(xlsx_path: Path) -> list[ImportRow]:
    rows: list[ImportRow] = []

    with zipfile.ZipFile(xlsx_path) as archive:
        shared_strings: list[str] = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared_root = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            for shared_item in shared_root.findall('main:si', NS):
                shared_strings.append(''.join(node.text or '' for node in shared_item.iterfind('.//main:t', NS)))

        workbook_root = ET.fromstring(archive.read('xl/workbook.xml'))
        rels_root = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        rel_map = {rel.attrib['Id']: rel.attrib['Target'] for rel in rels_root}

        counter = 1
        for sheet in workbook_root.find('main:sheets', NS):
            rel_id = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
            target = rel_map[rel_id]
            sheet_path = target if target.startswith('xl/') else f'xl/{target}'
            sheet_root = ET.fromstring(archive.read(sheet_path))
            sheet_rows = sheet_root.findall('.//main:sheetData/main:row', NS)
            last_known_date: str | None = None

            for row in sheet_rows[3:]:
                data: dict[str, str] = {}
                for cell in row.findall('main:c', NS):
                    reference = cell.attrib.get('r', '')
                    column_match = re.match(r'[A-Z]+', reference)
                    if not column_match:
                        continue
                    data[column_match.group(0)] = read_cell_value(cell, shared_strings).strip()

                description = (data.get('C') or '').strip()
                income = (data.get('D') or '').strip()
                expense = (data.get('E') or '').strip()
                if not description or (not income and not expense):
                    continue

                row_type = 'income' if income else 'expense'
                amount = int(float(income or expense))
                date = excel_date_to_iso(data.get('B') or '') or last_known_date
                if not date:
                    continue

                last_known_date = date

                rows.append(
                    ImportRow(
                        sourceId=f'caisse-smart-visuel-2026-{counter:04d}',
                        type=row_type,
                        description=description,
                        category=categorize(description, row_type),
                        amount=amount,
                        date=date,
                        linkedSourceIds=[],
                        tokens=tokenize(description),
                    )
                )
                counter += 1

    return rows


def link_expenses(rows: list[ImportRow]) -> None:
    for index, row in enumerate(rows):
        if row.type != 'expense':
            continue

        expense_product_tokens = row.tokens & PRODUCT_KEYWORDS
        previous_income = next((candidate for candidate in rows[max(0, index - 6):index][::-1] if candidate.type == 'income'), None)

        best_candidate: ImportRow | None = None
        best_score = -1

        for candidate in rows[max(0, index - 8):index][::-1]:
            if candidate.type != 'income' or candidate.date != row.date:
                continue

            candidate_product_tokens = candidate.tokens & PRODUCT_KEYWORDS
            product_overlap = len(expense_product_tokens & candidate_product_tokens)
            score = product_overlap * 10

            if row.tokens & GENERIC_FOLLOW_KEYWORDS and previous_income and candidate.sourceId == previous_income.sourceId:
                score += 3
            if row.tokens & STRONG_EXPENSE_KEYWORDS and product_overlap > 0:
                score += 3

            if score > best_score:
                best_candidate = candidate
                best_score = score

        if best_candidate and best_score >= 3:
            best_candidate.linkedSourceIds.append(row.sourceId)


def write_module(rows: list[ImportRow], output_path: Path) -> None:
    payload = [
        {
            'sourceId': row.sourceId,
            'type': row.type,
            'description': row.description,
            'category': row.category,
            'amount': row.amount,
            'date': row.date,
            'linkedSourceIds': row.linkedSourceIds,
        }
        for row in rows
    ]

    output_path.write_text(
        "import type { TransactionImportSeed } from '@/lib/definitions';\n\n"
        "export const CAISSE_SMART_VISUEL_2026_IMPORT_NAME = 'CAISSE SMART VISUEL 2026';\n\n"
        f"export const CAISSE_SMART_VISUEL_2026_IMPORT: TransactionImportSeed[] = {json.dumps(payload, ensure_ascii=False, indent=2)};\n",
        encoding='utf-8',
    )


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    xlsx_path = Path("E:/T\u00e9l\u00e9chargements/CAISSE SMART VISUEL_2026 (1).xlsx")
    output_path = project_root / 'src' / 'lib' / 'generated' / 'caisse-smart-visuel-2026.ts'

    rows = parse_workbook(xlsx_path)
    link_expenses(rows)
    write_module(rows, output_path)

    linked_expense_ids = {linked_id for row in rows if row.type == 'income' for linked_id in row.linkedSourceIds}
    print(f'Generated {output_path} with {len(rows)} rows and {len(linked_expense_ids)} linked expenses.')


if __name__ == '__main__':
    main()
