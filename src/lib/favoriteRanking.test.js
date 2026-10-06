import {describe,it,expect} from 'vitest';
import {favoriteRanking} from './favoriteRanking';

describe('personal favorite leaderboard',()=>{
  it('excludes unstarred and unavailable voices, orders by actual usage',()=>{
    const voices=[{id:'a',name:'An'},{id:'b',name:'Bình'},{id:'c',name:'Chi'}];
    expect(favoriteRanking(voices,{a:true,b:true,c:false,removed:true},{a:2,b:8,c:99,removed:100}).map(v=>[v.id,v.count])).toEqual([['b',8],['a',2]]);
  });
  it('uses names for ties and never invents usage for unused favorites',()=>{
    const voices=[{id:'b',name:'Bình'},{id:'a',name:'An'}];
    expect(favoriteRanking(voices,{a:true,b:true}).map(v=>[v.id,v.count])).toEqual([['a',0],['b',0]]);
    expect(favoriteRanking(voices,{})).toEqual([]);
  });
  it('limits the leaderboard to five voices without mutating the library',()=>{
    const voices=Array.from({length:8},(_,i)=>({id:String(i),name:`Voice ${i}`}));
    const favorites=Object.fromEntries(voices.map(v=>[v.id,true]));
    expect(favoriteRanking(voices,favorites)).toHaveLength(5);
    expect(voices).toHaveLength(8);
  });
});
