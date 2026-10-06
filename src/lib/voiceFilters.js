export function matchesVoiceFilter(voice, filter, favorites) {
  switch (filter) {
    case 'Yêu thích': return !!favorites[voice.id];
    case 'Giọng clone': return voice.id.startsWith('clone_');
    case 'Nữ': return voice.gender === 'female';
    case 'Nam': return voice.gender === 'male';
    case 'Kể chuyện': return voice.style === 'doc_truyen';
    case 'Quảng cáo': return voice.style === 'quang_cao';
    default: return true;
  }
}

export function readVoicePreferences(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
