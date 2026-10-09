const units = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
];

const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
const scales = ['', 'mille', 'million', 'milliard', 'billion', 'billiard'];

function underHundred(value: number, terminal = true): string {
  if (value < units.length) return units[value];
  if (value < 20) return `dix-${units[value - 10]}`;
  if (value < 70) {
    const ten = Math.floor(value / 10);
    const rest = value % 10;
    return rest === 0 ? tens[ten] : `${tens[ten]}${rest === 1 ? ' et ' : '-'}${units[rest]}`;
  }
  if (value < 80) {
    return value === 71 ? 'soixante et onze' : `soixante-${underHundred(value - 60)}`;
  }
  const rest = value - 80;
  return rest === 0 ? `quatre-vingt${terminal ? 's' : ''}` : `quatre-vingt-${underHundred(rest)}`;
}

function underThousand(value: number, terminal = true): string {
  if (value < 100) return underHundred(value, terminal);
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const prefix = hundreds === 1 ? 'cent' : `${units[hundreds]} cent${rest === 0 && terminal ? 's' : ''}`;
  return rest === 0 ? prefix : `${prefix} ${underHundred(rest, terminal)}`;
}

export function xofInWords(amount: number): string {
  const rounded = Math.round(amount);
  if (!Number.isSafeInteger(rounded)) throw new RangeError('Montant FCFA invalide');
  if (rounded === 0) return 'zéro franc CFA';

  const negative = rounded < 0;
  let remaining = Math.abs(rounded);
  const parts: string[] = [];
  for (let scale = 0; remaining > 0; scale += 1) {
    const group = remaining % 1000;
    remaining = Math.floor(remaining / 1000);
    if (group === 0) continue;
    if (scale === 1) {
      parts.unshift(group === 1 ? 'mille' : `${underThousand(group, false)} mille`);
    } else if (scale > 1) {
      parts.unshift(`${underThousand(group)} ${scales[scale]}${group > 1 ? 's' : ''}`);
    } else {
      parts.unshift(underThousand(group));
    }
  }
  const words = `${negative ? 'moins ' : ''}${parts.join(' ')} franc${Math.abs(rounded) > 1 ? 's' : ''} CFA`;
  return words;
}
