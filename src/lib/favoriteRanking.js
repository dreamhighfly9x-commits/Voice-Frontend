// Only starred, currently accessible voices can appear in this personal ranking.
export function favoriteRanking(voices, favorites, counts = {}) {
  return voices.filter(voice => favorites[voice.id]).map(voice => ({
    ...voice, count: Math.max(0, Number(counts[voice.id]) || 0),
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi') || a.id.localeCompare(b.id)).slice(0, 5);
}
