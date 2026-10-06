import {useEffect,useState,useSyncExternalStore} from 'react';

let tasks=new Map(), successUntil=0, expiry;
let snapshot={phase:'idle',success:false};
const listeners=new Set();
const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
function publish(){
 const states=[...tasks.values()];
 snapshot={phase:states.includes('generating')?'generating':states.includes('queued')?'queued':states.length?'pending':'idle',success:successUntil>Date.now()};
 listeners.forEach(fn=>fn());
}
export function beginVoiceTask(id){tasks.set(id,'pending');publish();}
export function updateVoiceTask(id,state){if(tasks.has(id)&&['queued','generating'].includes(state)){tasks.set(id,state);publish();}}
export function endVoiceTask(id,recording){
 if(!tasks.has(id))return;
 tasks.delete(id);
 if(recording?.id&&recording?.url){successUntil=Date.now()+2000;clearTimeout(expiry);expiry=setTimeout(publish,2010);}
 publish();
}
export function resetVoiceTasks(){tasks.clear();successUntil=0;clearTimeout(expiry);publish();}
export function chooseBotState({success,playing,phase,welcome}){
 return success?'success':playing?'playing':phase!=='idle'?'generating':welcome?'welcome':'idle';
}
export function useDreamBot(playing=false){
 const activity=useSyncExternalStore(subscribe,()=>snapshot);
 const [welcome,setWelcome]=useState(()=>{try{return !sessionStorage.getItem('dreambot-welcomed');}catch{return true;}});
 useEffect(()=>{
  if(!welcome)return;
  try{sessionStorage.setItem('dreambot-welcomed','1');}catch{/* session storage optional */}
  const timer=setTimeout(()=>setWelcome(false),2600);return()=>clearTimeout(timer);
 },[welcome]);
 return {state:chooseBotState({...activity,playing,welcome}),phase:activity.phase};
}
