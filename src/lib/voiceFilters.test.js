import { describe, it, expect, beforeEach, vi } from 'vitest';
import { matchesVoiceFilter, readVoicePreferences } from './voiceFilters';

describe('matchesVoiceFilter', () => {
  const voice = { id: 'clone_han', gender: 'female', style: 'doc_truyen' };
  const favorites = { clone_han: true };

  it.each([
    ['Yêu thích', voice, favorites, true],
    ['Yêu thích', { id: 'minh' }, favorites, false],
    ['Giọng clone', voice, favorites, true],
    ['Giọng clone', { id: 'minh' }, favorites, false],
    ['Nữ', voice, favorites, true],
    ['Nam', voice, favorites, false],
    ['Kể chuyện', voice, favorites, true],
    ['Quảng cáo', voice, favorites, false],
    ['Tất cả', voice, favorites, true],
  ])('matchesVoiceFilter_%s_%#_returnsExpected', (filter, v, favs, expected) => {
    expect(matchesVoiceFilter(v, filter, favs)).toBe(expected);
  });
});

describe('readVoicePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('readVoicePreferences_validJsonObject_returnsParsedObject', () => {
    localStorage.setItem('voice-favorites', JSON.stringify({ han: true }));
    expect(readVoicePreferences('voice-favorites')).toEqual({ han: true });
  });

  it('readVoicePreferences_missingKey_returnsEmptyObject', () => {
    expect(readVoicePreferences('does-not-exist')).toEqual({});
  });

  it('readVoicePreferences_corruptJson_returnsEmptyObject', () => {
    localStorage.setItem('voice-favorites', '{not json');
    expect(readVoicePreferences('voice-favorites')).toEqual({});
  });

  it('readVoicePreferences_jsonArray_returnsEmptyObject', () => {
    localStorage.setItem('voice-favorites', JSON.stringify(['han']));
    expect(readVoicePreferences('voice-favorites')).toEqual({});
  });
});
