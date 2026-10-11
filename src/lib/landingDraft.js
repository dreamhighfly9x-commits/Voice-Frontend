const KEY = 'dreamhigh-public-draft';
export function saveLandingDraft(text) {
  try { sessionStorage.setItem(KEY, text.slice(0, 5000)); } catch { /* Storage is optional. */ }
}
export function readLandingDraft() {
  try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; }
}
export function clearLandingDraft() {
  try { sessionStorage.removeItem(KEY); } catch { /* Storage is optional. */ }
}
