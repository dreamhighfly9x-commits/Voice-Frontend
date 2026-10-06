export function normalizeText(text) {
  return text.normalize('NFC').replace(/\r\n?/g, '\n').replace(/[\u200B\uFEFF]/g, '')
    .replace(/[\t\u00A0 ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Preserve every non-whitespace character. Prefer sentence and word boundaries.
export function splitText(text, limit = 600) {
  const parts = [];
  for (let paragraph of normalizeText(text).split(/\n\s*\n/)) {
    while (paragraph.length > limit) {
      const head = paragraph.slice(0, limit + 1);
      const ends = [...head.matchAll(/[.!?…][”"')\]]?\s+/g)];
      let at = ends.length ? ends.at(-1).index + ends.at(-1)[0].trimEnd().length : head.lastIndexOf(' ');
      if (at <= 0) at = limit;
      // Keep supported non-verbal cues intact when splitting for preview/batches.
      for (const match of paragraph.matchAll(/\[(?:cười|thở dài|hắng giọng)\]/g)) {
        if (match.index < at && at < match.index + match[0].length) {
          at = match.index || match[0].length;
          break;
        }
      }
      parts.push(paragraph.slice(0, at).trim());
      paragraph = paragraph.slice(at).trim();
    }
    if (paragraph) parts.push(paragraph);
  }
  return parts;
}

// Text that already has line breaks: one segment per line, periods are not split points.
// Otherwise one segment per sentence (split after . ! ? …). Anything longer than the
// limit falls back to splitText so no segment exceeds it.
export function splitSentences(text, limit = 600) {
  const clean = normalizeText(text);
  return clean.split(clean.includes('\n') ? /\n+/ : /(?<=[.!?…][”"')\]]?)\s+/)
    .map((sentence) => sentence.trim()).filter(Boolean)
    .flatMap((sentence) => sentence.length > limit ? splitText(sentence, limit) : [sentence]);
}

export function applyDictionary(text, entries) {
  const valid = entries.filter(e => e.from.trim() && e.to.trim());
  if (!valid.length) return text;
  const rules = new Map(valid.map(e => [e.from.trim(), e.to.trim()]));
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = [...rules.keys()].sort((a,b) => b.length-a.length).map(escape).join('|');
  // Unicode word boundaries keep “AI” from matching inside another word.
  return text.split(/(\[(?:cười|thở dài|hắng giọng)\])/g).map((part, index) => index % 2 ? part
    : part.replace(new RegExp(`(?<![\\p{L}\\p{N}_])(?:${expression})(?![\\p{L}\\p{N}_])`, 'gu'), match => rules.get(match))).join('');
}

export function readDictionary(userId) {
  try {
    const data = JSON.parse(localStorage.getItem(`studio-dictionary:${userId}`) || '[]');
    return Array.isArray(data) ? data.filter(e => typeof e?.from === 'string' && typeof e?.to === 'string').slice(0,100) : [];
  } catch { return []; }
}
