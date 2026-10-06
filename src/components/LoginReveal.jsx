import {useLayoutEffect, useRef} from 'react';
import './LoginReveal.css';

export default function LoginReveal({snapshot,onComplete}) {
  const root=useRef(null);
  useLayoutEffect(()=>{
    const overlay=root.current;
    overlay.querySelectorAll('.login-reveal-content').forEach(container=>{
      const copy=snapshot.node.cloneNode(true);
      copy.style.width=`${snapshot.width}px`;
      copy.style.transform=`translateY(-${snapshot.scrollY}px)`;
      container.replaceChildren(copy);
    });
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const timer=setTimeout(onComplete,1400);
    return ()=>{clearTimeout(timer);document.body.style.overflow=previousOverflow;};
  },[snapshot,onComplete]);
  return <div ref={root} className="login-reveal" aria-hidden="true" inert>
    <div className="login-reveal-half login-reveal-left"><div className="login-reveal-content"/></div>
    <div className="login-reveal-half login-reveal-right" onAnimationEnd={e=>{if(e.target===e.currentTarget)onComplete();}}><div className="login-reveal-content"/></div>
    <div className="login-reveal-seam"/>
  </div>;
}
