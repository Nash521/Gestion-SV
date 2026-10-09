import { xofInWords } from './french-amount';

describe('xofInWords', () => {
  it.each([
    [0, 'zéro franc CFA'],
    [1, 'un franc CFA'],
    [71, 'soixante et onze francs CFA'],
    [80, 'quatre-vingts francs CFA'],
    [81, 'quatre-vingt-un francs CFA'],
    [200, 'deux cents francs CFA'],
    [201, 'deux cent un francs CFA'],
    [1000, 'mille francs CFA'],
    [80000, 'quatre-vingt mille francs CFA'],
    [201000, 'deux cent un mille francs CFA'],
    [1200000, 'un million deux cent mille francs CFA'],
  ])('writes %i as %s', (amount, expected) => {
    expect(xofInWords(amount)).toBe(expected);
  });
});
