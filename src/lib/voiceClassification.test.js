import {it,expect} from 'vitest';
import {classifyVoice} from './voiceClassification';
it('preserves GenMax categories and age without inferring over them',()=>{
 const v=classifyVoice({name:'Podcast',metadata:{age:'young',categories:[{key:'doc-truyen',name:'Đọc truyện'}]}});
 expect(v.age).toBe('young');expect(v.automatic).toBe(false);expect(v.categories.map(c=>c.key)).toEqual(['doc-truyen']);
});
it('infers categories from description and use case, leaves unknown age empty',()=>{
 const v=classifyVoice({name:'Test',metadata:{description:'Warm storytelling voice for podcast'}});
 expect(v.categories.map(c=>c.key)).toEqual(['podcast','ke-chuyen']);expect(v.age).toBe('');expect(v.automatic).toBe(true);
 expect(classifyVoice({metadata:{use_case:'characters_animation'}}).categories[0].key).toBe('hoat-hinh');
});
