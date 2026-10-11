// "Còn 5 giờ" style label for a recording's auto-delete time (expires_at is unix seconds).
export function expiryLabel(expiresAt, now = Date.now()) {
  if (!expiresAt) return null;
  const left = expiresAt * 1000 - now;
  if (left <= 0) return { text: 'Sắp xóa', urgent: true };
  const hours = Math.floor(left / 3600000), minutes = Math.max(1, Math.floor((left % 3600000) / 60000));
  return { text: hours ? `Còn ${hours} giờ` : `Còn ${minutes} phút`, urgent: left < 6 * 3600000 };
}

// "08/10/2026 17:24 · 25 ký tự" for a recording (fields are optional on older takes).
export function recordingFacts(r) {
  const parts = [];
  if (r.created_at) parts.push(new Date(r.created_at * 1000).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
  if (Number.isFinite(r.chars)) parts.push(`${r.chars.toLocaleString('vi-VN')} ký tự`);
  return parts.join(' · ');
}
