import { toToolTypeSlug } from './004-normalize-tool-type-slugs';

describe('normalize tool type slugs', () => {
  it.each([
    ['бензоинструмент', 'benzoinstrument'],
    ['аксессуары', 'aksessuary'],
    ['ручной инструмент', 'ruchnoy-instrument'],
    ['Электроинструмент', 'elektroinstrument'],
    ['Power tools 18V', 'power-tools-18v'],
  ])('transliterates %s to %s', (name, expectedSlug) => {
    expect(toToolTypeSlug(name)).toBe(expectedSlug);
  });
});
