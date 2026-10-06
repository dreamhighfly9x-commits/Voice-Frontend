export const normalizeSearch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();

export function searchItems(items, query) {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  return items.filter((item) => {
    const haystack = normalizeSearch([item.title, item.detail, item.keywords].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}
