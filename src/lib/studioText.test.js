import { describe, expect, it } from 'vitest';
import { applyDictionary, normalizeText, splitSentences, splitText } from './studioText';

describe('Studio text processing', () => {
  it('preserves non-verbal cues through dictionary and chunk boundaries', () => {
    expect(applyDictionary('[cười] cười', [{from:'cười',to:'vui'}])).toBe('[cười] vui');
    const parts = splitText('Xin chào [hắng giọng] rồi nói tiếp.', 18);
    expect(parts.some(part=>part.includes('[hắng giọng]'))).toBe(true);
    expect(parts.every(part=>part.length<=18)).toBe(true);
  });
  it('normalizes without collapsing paragraph boundaries', () => {
    expect(normalizeText('  Xin\tchào  \r\n\r\n Việt Nam \u200B')).toBe('Xin chào\n\nViệt Nam');
  });
  it('splits at sentences and handles unbroken tokens without losing characters', () => {
    const text = 'Xin chào. Hôm nay trời đẹp! ' + 'a'.repeat(80) + '\n\nKết thúc.';
    const parts = splitText(text, 30);
    expect(parts.every(p=>p.length<=30)).toBe(true);
    expect(parts.join('').replace(/\s/g,'')).toBe(text.replace(/\s/g,''));
    expect(parts[0]).toBe('Xin chào. Hôm nay trời đẹp!');
  });
  it('uses literal whole terms, prioritizes long terms, does not cascade replacements', () => {
    const rules=[{from:'AI',to:'ây ai'},{from:'AI voice',to:'giọng AI'},{from:'C++',to:'xi cộng cộng'}];
    expect(applyDictionary('AI voice, AI, RAIN, ai; C++.',rules)).toBe('giọng AI, ây ai, RAIN, ai; xi cộng cộng.');
    expect(applyDictionary('Việt Nam và Việt', [{from:'Việt',to:'việt'}])).toBe('việt Nam và việt');
  });
  it('splits into one sentence per segment and caps long sentences', () => {
    expect(splitSentences('Giá 3.5 triệu.  Xong! Tiếp theo… hết')).toEqual(['Giá 3.5 triệu.', 'Xong!', 'Tiếp theo…', 'hết']);
    expect(splitSentences('Câu một. Câu hai.\n\nDòng hai. Vẫn dòng hai.')).toEqual(['Câu một. Câu hai.', 'Dòng hai. Vẫn dòng hai.']);
    expect(splitSentences('một hai ba bốn năm sáu', 10).every(s => s.length <= 10)).toBe(true);
  });
});
