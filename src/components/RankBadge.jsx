import {useId} from 'react';

export default function RankBadge({rank}) {
  const id=useId().replace(/:/g,'');
  const palette=rank===1?['#fff6ad','#fbd34d','#c48517']:rank===2?['#f7fcff','#c9d5df','#7b8a98']:rank===3?['#ffe392','#e9a33b','#a9621b']:['#e6e6ff','#aaa6db','#645c9e'];
  return <span className={`game-rank game-rank-${rank}`} aria-label={`Top ${rank}`}>
    <svg className="medal-shield" viewBox="0 0 80 80" aria-hidden="true">
      <defs><linearGradient id={`${id}-metal`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor={palette[0]}/><stop offset=".45" stopColor={palette[1]}/><stop offset="1" stopColor={palette[2]}/></linearGradient><linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={palette[2]}/><stop offset=".3" stopColor={palette[0]}/><stop offset=".55" stopColor={palette[2]}/><stop offset=".8" stopColor={palette[0]}/><stop offset="1" stopColor={palette[2]}/></linearGradient></defs>
      <g fill={`url(#${id}-metal)`} stroke={palette[2]} strokeWidth=".8"><path d="M23 63C5 56 7 42 8 36c10 3 14 11 15 27ZM18 51C5 39 8 26 11 22c9 6 12 14 7 29ZM23 62C8 59 7 63 11 67c7 5 17 4 24 1ZM57 63c18-7 16-21 15-27-10 3-14 11-15 27ZM62 51c13-12 10-25 7-29-9 6-12 14-7 29ZM57 62c15-3 16 1 12 5-7 5-17 4-24 1Z"/></g>
      <path d={rank===1?'M18 19 28 7Q40 19 52 7L64 20 59 27 61 43Q59 63 40 72 21 63 19 43L21 27Z':'M17 18 40 8 63 18 60 45Q57 63 40 72 23 63 20 45Z'} fill={`url(#${id}-metal)`} stroke={`url(#${id}-rim)`} strokeWidth="4"/>
      <path d="M23 23 40 16 57 23 54 44Q52 57 40 64 28 57 26 44Z" fill="none" stroke={palette[0]} strokeWidth="1" opacity=".8"/>
      <text x="41" y="53" textAnchor="middle" style={{fill:palette[2],fontSize:42,fontWeight:900}}> {rank}</text>
      <text x="40" y="51" textAnchor="middle" style={{fill:palette[0],stroke:palette[2],strokeWidth:.5,fontSize:42,fontWeight:900}}>{rank}</text>
      {rank===1&&<g fill={palette[0]} stroke={palette[2]} strokeWidth=".5">{[30,40,50].map((x)=><path key={x} transform={`translate(${x} 60)`} d="m0-4 1.3 2.5 2.7.4-2 2 .5 2.8L0 2.4-2.5 3.7-2 .9-4-1.1-1.3-1.5Z"/>)}</g>}
    </svg><b aria-hidden="true">TOP {rank}</b>
  </span>;
}
