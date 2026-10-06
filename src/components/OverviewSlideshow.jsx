import {useEffect,useState} from 'react';
import './OverviewSlideshow.css';

const slides=[
 {src:'/images/overview-slide-1.jpg',alt:'AI Voice Cloning — công nghệ nhân bản giọng nói'},
 {src:'/images/overview-slide-2.jpg',alt:'Khuôn mặt kỹ thuật số và sóng âm cyan'},
 {src:'/images/overview-slide-3.jpg',alt:'Trí tuệ nhân tạo phát ra những ký tự ánh sáng'},
];
export default function OverviewSlideshow(){
 const [index,setIndex]=useState(0),[hover,setHover]=useState(false),[focus,setFocus]=useState(false);
 const [hidden,setHidden]=useState(()=>document.hidden),[reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const visibility=()=>setHidden(document.hidden),motion=()=>setReduced(media.matches);
  document.addEventListener('visibilitychange',visibility);media.addEventListener('change',motion);
  return()=>{document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',motion);};
 },[]);
 useEffect(()=>{
  if(hover||focus||hidden||reduced)return;
  const timer=setInterval(()=>setIndex(i=>(i+1)%slides.length),3000);return()=>clearInterval(timer);
 },[hover,focus,hidden,reduced]);
 return <section className="overview-slideshow" tabIndex={0} aria-label="Hình ảnh công nghệ giọng nói — tự chuyển sau 3 giây, tạm dừng khi trỏ chuột hoặc chọn bằng bàn phím" aria-roledescription="slideshow" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}}>
  <div className="overview-slide-images">{slides.map((slide,i)=><img key={slide.src} src={slide.src} alt={slide.alt} aria-hidden={index!==i} className={index===i?'is-current':''} decoding="async" width="1200" height="675"/>)}</div>
 </section>;
}
