import { describe, it, expect } from 'vitest';
import { normalizeSearch, searchItems } from './search';

describe('normalizeSearch', () => {
  it.each([
    ['Tiếng Việt', 'tieng viet'],
    ['Đà Nẵng', 'da nang'],
    ['nhiều   khoảng   trắng', 'nhieu khoang trang'],
    ['HOA thường', 'hoa thuong'],
  ])('normalizeSearch_%s_normalizedForm', (input, expected) => {
    expect(normalizeSearch(input)).toBe(expected);
  });
});

describe('searchItems', () => {
  const items = [
    { key: 'a', title: 'Hân', detail: 'Giọng clone', keywords: 'nữ trẻ' },
    { key: 'b', title: 'Minh', detail: 'Nam trầm', keywords: 'kể chuyện' },
    { key: 'c', title: 'Podcast tập 12', detail: 'Minh đọc', keywords: '' },
  ];

  it('searchItems_emptyQuery_returnsAllItems', () => {
    expect(searchItems(items, '')).toEqual(items);
  });

  it('searchItems_matchingTerm_filtersToMatchingTitle', () => {
    const result = searchItems(items, 'Minh');
    expect(result.map((i) => i.key)).toEqual(['b', 'c']);
  });

  it('searchItems_multiTermAND_allTermsMustMatch', () => {
    const result = searchItems(items, 'Minh đọc');
    expect(result.map((i) => i.key)).toEqual(['c']);
  });

  it('searchItems_accentedQuery_matchesUnaccentedText', () => {
    const result = searchItems(items, 'HAN');
    expect(result.map((i) => i.key)).toEqual(['a']);
  });

  it('searchItems_noMatch_returnsEmptyArray', () => {
    expect(searchItems(items, 'khong ton tai')).toEqual([]);
  });
});
