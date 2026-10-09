"use client";

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { DeliveryNote, Invoice, PurchaseOrder } from '@/lib/definitions';
import { getDocumentFooter } from '@/lib/firebase/document-settings';
import { xofInWords } from '@/lib/format/french-amount';

type CommercialDocument =
  | { type: 'invoice'; value: Invoice }
  | { type: 'purchaseOrder'; value: PurchaseOrder }
  | { type: 'deliveryNote'; value: DeliveryNote };

const blue: [number, number, number] = [83, 139, 209];
const lightBlue: [number, number, number] = [202, 220, 242];
const red: [number, number, number] = [238, 27, 32];
const xof = (value: number) => `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} F CFA`;

async function loadCenturyGothic(pdf: jsPDF): Promise<boolean> {
  try {
    for (const [file, style] of [['century-gothic.ttf', 'normal'], ['century-gothic-bold.ttf', 'bold']]) {
      const response = await fetch(`/fonts/${file}`);
      if (!response.ok) return false;
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
      }
      pdf.addFileToVFS(file, btoa(binary));
      pdf.addFont(file, 'CenturyGothic', style);
    }
    return true;
  } catch (error) {
    console.warn('Century Gothic could not be loaded for the proforma PDF.', error);
    return false;
  }
}

function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = '/logo.jpeg';
  });
}

function drawHeader(pdf: jsPDF, document: CommercialDocument, logo: HTMLImageElement | null) {
  const { value, type } = document;
  const font = type === 'invoice' && pdf.getFontList().CenturyGothic ? 'CenturyGothic' : 'helvetica';
  const title = type === 'invoice' ? 'PROFORMA' : type === 'purchaseOrder' ? 'BON DE COMMANDE' : 'BON DE LIVRAISON';
  const date = type === 'deliveryNote' ? value.deliveryDate : value.issueDate;

  if (logo) pdf.addImage(logo, 'JPEG', 15, 8, 43, 22);
  pdf.setDrawColor(...blue);
  pdf.setLineWidth(0.35);
  pdf.rect(62, 16, 133, 9);
  pdf.setTextColor(0);
  pdf.setFont(font, 'bold');
  pdf.setFontSize(9.5);
  pdf.text('IMPRESSION NUMERIQUE - OFFSET & COMMUNICATION VISUELLE', 65, 22);

  pdf.setTextColor(...blue);
  pdf.setFontSize(type === 'invoice' ? 18 : 15);
  pdf.text(title, 70, 42);
  pdf.setTextColor(...red);
  pdf.setFont(font, 'normal');
  pdf.setFontSize(10);
  pdf.text(`N° ${value.id}`, 70, 48);

  pdf.setTextColor(...blue);
  pdf.setFont(font, 'bold');
  pdf.setFontSize(13);
  pdf.text('SMART VISUEL', 15, 58);
  pdf.setFont(font, 'normal');
  pdf.setTextColor(0);
  pdf.setFontSize(9.5);
  pdf.text('YAMOUSSOUKRO', 15, 64);
  pdf.text('N° : CC2242970-A', 15, 69);
  pdf.text('TEL : 2730640278 - 0759725272', 15, 74);

  pdf.setFont(font, 'bold');
  pdf.setFontSize(12);
  pdf.text('CLIENT :', 108, 58);
  pdf.setFont(font, 'normal');
  pdf.setFontSize(9.5);
  pdf.text(pdf.splitTextToSize(value.client.name, 86), 108, 64);
  pdf.text(pdf.splitTextToSize(`VILLE : ${value.client.address || ''}`, 86), 108, 70);
  pdf.text(`TEL : ${value.client.phone || ''}`, 108, 79);
  pdf.setFontSize(8);
  pdf.setTextColor(90);
  pdf.text(`Date : ${format(date, 'dd/MM/yyyy')}`, 15, 82);
  if (type === 'deliveryNote' && value.invoiceId) pdf.text(`Proforma : ${value.invoiceId}`, 108, 84);
}

function drawFooter(pdf: jsPDF, footer: string, font: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setDrawColor(...blue);
  pdf.setLineWidth(1.3);
  pdf.line(15, 267, pageWidth - 15, 267);
  pdf.setDrawColor(...lightBlue);
  pdf.setLineWidth(0.8);
  pdf.line(15, 268, pageWidth - 15, 268);
  pdf.setTextColor(50);
  pdf.setFont(font, 'normal');
  pdf.setFontSize(6.2);
  const lines = pdf.splitTextToSize(footer, pageWidth - 30);
  const spacing = Math.min(3, 22 / Math.max(lines.length, 1));
  lines.forEach((line: string, index: number) => pdf.text(line, pageWidth / 2, 273 + index * spacing, { align: 'center' }));
}

export async function exportCommercialDocumentPDF(document: CommercialDocument): Promise<void> {
  const [footer, logo] = await Promise.all([getDocumentFooter(), loadLogo()]);
  const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
  const { value, type } = document;
  if (type === 'invoice') await loadCenturyGothic(pdf);
  const font = type === 'invoice' && pdf.getFontList().CenturyGothic ? 'CenturyGothic' : 'helvetica';
  drawHeader(pdf, document, logo);

  const priced = type !== 'deliveryNote';
  const items = value.lineItems;
  const body = items.map((item, index) => priced ? [
    String(index + 1),
    item.description,
    xof('price' in item ? item.price : 0),
    String(item.quantity),
    xof(('price' in item ? item.price : 0) * item.quantity),
  ] : [String(index + 1), item.description, String(item.quantity)]);
  while (body.length < 12) body.push(priced ? ['', '', '', '', ''] : ['', '', '']);

  (pdf as any).autoTable({
    startY: 90,
    margin: { left: 15, right: 15, top: 90, bottom: 37 },
    head: [priced ? ['REF', 'DESIGNATION', 'PRIX UNIT', 'QTS', 'PRIX TOTAL'] : ['REF', 'DESIGNATION', 'QTS']],
    body,
    theme: 'grid',
    styles: { font, fontSize: 8.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.15, minCellHeight: 8, cellPadding: 2, valign: 'middle' },
    headStyles: { fillColor: lightBlue, textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', minCellHeight: 9 },
    columnStyles: priced
      ? { 0: { cellWidth: 19, halign: 'center' }, 1: { cellWidth: 83 }, 2: { cellWidth: 31, halign: 'right' }, 3: { cellWidth: 17, halign: 'center' }, 4: { cellWidth: 30, halign: 'right' } }
      : { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 140 }, 2: { cellWidth: 20, halign: 'center' } },
    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) drawHeader(pdf, document, logo);
    },
  });

  const subtotal = priced ? items.reduce((sum, item) => sum + ('price' in item ? item.price : 0) * item.quantity, 0) : 0;
  const discount = type === 'invoice' ? value.discountAmount || 0 : 0;
  const total = subtotal - discount;
  const closingText = priced
    ? `Arrêter ${type === 'invoice' ? 'la présente proforma' : 'le présent bon de commande'} à la somme de ${xofInWords(total)}.`
    : '';
  pdf.setFont(font, 'normal');
  pdf.setFontSize(8.5);
  const closingLines = priced ? pdf.splitTextToSize(closingText, 180) as string[] : [];
  const notes = value.notes?.trim() || '';
  const noteWidth = priced ? 102 : 178;
  const noteLines = notes ? pdf.splitTextToSize(notes, noteWidth) : [];
  const standardTerms = type === 'invoice' ? [
    { text: 'NB : Proforma valable 07 jours ouvrable.', bold: true },
    { text: 'Veuillez certifier votre commande par un bon de commande physique ou marquer « bon pour accord », signer et cacheter sur la présente facture proforma', bold: false },
    { text: 'Condition de Règlement :', bold: true },
    { text: '70% à la commande / 30% à la livraison (révisable)', bold: false },
    { text: 'Type de règlement :', bold: true },
    { text: 'Espèce          Chèque          Virement', bold: true },
  ] : [];
  pdf.setFontSize(8.5);
  const termLines = standardTerms.map(({ text, bold }) => {
    pdf.setFont(font, bold ? 'bold' : 'normal');
    return { lines: pdf.splitTextToSize(text, noteWidth) as string[], bold };
  });
  const termsHeight = termLines.reduce((height, { lines }) => height + lines.length * 4.2 + 1, 0);
  const notesHeight = notes ? noteLines.length * 4.2 + (standardTerms.length ? 4 : 5) : 0;
  const contentHeight = termsHeight + notesHeight;
  let summaryY = ((pdf as any).lastAutoTable?.finalY || 170) + 8;
  const requiredHeight = priced
    ? Math.max(36, Math.max(23, contentHeight + 5) + closingLines.length * 4.2)
    : Math.max(22, contentHeight + 5);
  if (summaryY + requiredHeight > 257) {
    pdf.addPage();
    drawHeader(pdf, document, logo);
    summaryY = 94;
  }

  if (standardTerms.length) {
    let termY = summaryY;
    pdf.setTextColor(...red);
    pdf.setFontSize(8.5);
    for (const { lines, bold } of termLines) {
      pdf.setFont(font, bold ? 'bold' : 'normal');
      pdf.text(lines, 15, termY);
      termY += lines.length * 4.2 + 1;
    }
  }

  if (notes) {
    pdf.setTextColor(...red);
    pdf.setFont(font, 'bold');
    pdf.setFontSize(8.5);
    const noteY = summaryY + termsHeight + (standardTerms.length ? 2 : 0);
    pdf.text(standardTerms.length ? 'Notes complémentaires :' : 'NB :', 15, noteY);
    pdf.setFont(font, 'normal');
    pdf.setFontSize(8.5);
    pdf.text(noteLines, 15, noteY + 5);
  }

  if (priced) {
    pdf.setTextColor(0);
    pdf.setFontSize(10);
    pdf.setFont(font, 'normal');
    pdf.text(`Montant total : ${xof(subtotal)}`, 115, summaryY);
    if (type === 'invoice') pdf.text(`Réduction : ${xof(discount)}`, 115, summaryY + 7);
    pdf.setFont(font, 'bold');
    pdf.text(`Net à payer : ${xof(total)}`, 115, summaryY + (type === 'invoice' ? 14 : 7));
    pdf.setFont(font, 'normal');
    pdf.setFontSize(8.5);
    pdf.text(closingLines, 15, summaryY + Math.max(23, contentHeight + 5));
  } else {
    pdf.setTextColor(0);
    pdf.setFont(font, 'normal');
    pdf.setFontSize(8.5);
    const signY = summaryY + Math.max(12, contentHeight + 5);
    pdf.text('Signature du client pour réception', 15, signY);
    pdf.text('Signature Smart Visuel', 120, signY);
  }

  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page);
    drawFooter(pdf, footer, font);
  }
  const prefix = type === 'invoice' ? 'proforma' : type === 'purchaseOrder' ? 'bon-de-commande' : 'bon-de-livraison';
  pdf.save(`${prefix}-${value.id}.pdf`);
}
