import './BrandLogo.css';

// "DREAMHIGH" drawn as strokes in the brand's thin, wide, rounded futuristic
// style (crossbar-less A, boxy rounded M/G). Letters sit on a 24×20 cell with
// an 8-unit gap; stroke uses currentColor so the existing theme colors apply.
const LETTERS = [
 ['M0 0H18Q24 0 24 6V14Q24 20 18 20H0Z', 24], // D
 ['M0 20V0H18Q24 0 24 5V6Q24 11 18 11H0M14 11L24 20', 24], // R
 ['M24 0H6Q0 0 0 6V14Q0 20 6 20H24M0 10H20', 24], // E
 ['M0 20L12 0L24 20', 24], // A
 ['M0 20V6Q0 0 6 0H18Q24 0 24 6V20M12 0V14', 24], // M
 ['M0 0V20M24 0V20M0 10H24', 24], // H
 ['M0 0V20', 0], // I
 ['M24 4Q24 0 18 0H6Q0 0 0 6V14Q0 20 6 20H18Q24 20 24 14V10H14', 24], // G
 ['M0 0V20M24 0V20M0 10H24', 24], // H
];
const GAP = 8;
const WORDMARK = LETTERS.reduce((acc, [d, width]) => ({ x: acc.x + width + GAP, paths: [...acc.paths, { d, x: acc.x }] }), { x: 0, paths: [] });
const WIDTH = WORDMARK.x - GAP;

function Wordmark() {
 return <svg className="dh-wordmark" viewBox={`-2 -2 ${WIDTH + 4} 24`} aria-hidden="true" focusable="false">
  <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
   {WORDMARK.paths.map(({ d, x }, i) => <path key={i} d={d} transform={`translate(${x} 0)`} />)}
  </g>
 </svg>;
}

export default function BrandLogo({iconOnly=false,className=''}) {
 return <div className={`dh-logo ${iconOnly?'dh-logo-icon':''} ${className}`} role="img" aria-label="DreamHigh Voice - Text to Speech">
  <img className="dh-logo-mark" src="/brand/dreamhigh-logo-256.png" alt="" aria-hidden="true" draggable="false"/>
  {!iconOnly&&<div className="dh-logo-type"><div className="dh-logo-name"><b><Wordmark/></b><span>Voice</span></div><div className="dh-logo-tagline">Text to Speech</div></div>}
 </div>;
}
