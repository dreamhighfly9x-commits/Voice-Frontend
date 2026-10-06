import {useId} from 'react';
import './BrandLogo.css';

export default function BrandLogo({iconOnly=false,className=''}) {
 const gradient='dreamhigh-'+useId().replace(/:/g,'');
 return <div className={`dh-logo ${iconOnly?'dh-logo-icon':''} ${className}`} role="img" aria-label="DreamHigh Voice - Text to Speech">
  <svg className="dh-logo-mark" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
   <defs><linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7e99c5"/><stop offset="1" stopColor="#3c6095"/></linearGradient></defs>
   <rect width="100" height="100" rx="20" fill={`url(#${gradient})`}/>
   <path d="M24 19H47C68 19 81 32 81 50S68 81 47 81H24Z" fill="white"/>
   <g fill={`url(#${gradient})`}><rect className="dh-wave dh-wave-one" x="35" y="41" width="7" height="20" rx="3.5"/><rect className="dh-wave dh-wave-two" x="46" y="33" width="7" height="36" rx="3.5"/><rect className="dh-wave dh-wave-three" x="57" y="41" width="7" height="20" rx="3.5"/></g>
  </svg>
  {!iconOnly&&<div className="dh-logo-type"><div className="dh-logo-name"><b>DreamHigh</b><span>Voice</span></div><div className="dh-logo-tagline">Text to Speech</div></div>}
 </div>;
}
