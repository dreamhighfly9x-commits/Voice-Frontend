// Stable generated portraits: no remote image requests, same portrait across models.
export default function VoiceAvatar({voice}){
  const id=voice.remote_id||voice.id;
  let hash=2166136261;for(const c of id)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
  const hue=hash%360, hair=['#263147','#57382e','#a15f35','#d7ac6e'][hash%4];
  return <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" data-testid="voice-avatar">
    <rect width="48" height="48" rx="14" fill={`hsl(${hue} 65% 86%)`}/>
    <path d="M7 48c0-16 34-16 34 0" fill={`hsl(${(hue+55)%360} 48% 43%)`}/>
    <ellipse cx="24" cy="23" rx="12" ry="14" fill={['#f6caa4','#dca278','#bd805c'][hash%3]}/>
    <path d={hash%2?'M12 23V17C11 3 39 4 36 21L29 12 18 19Z':'M12 21C6 4 37 3 37 20L31 14 24 16 18 12Z'} fill={hair}/>
    <path d="M19 24h1m8 0h1" stroke="#342b30" strokeWidth="2.5" strokeLinecap="round"/>
    <path d={hash%3?'M20 30q4 4 8 0':'M21 31h6'} fill="none" stroke="#9c514e" strokeWidth="1.5" strokeLinecap="round"/>
    {hash%4===0&&<path d="M15 22h9v6h-9zm10 0h9v6h-9z" fill="none" stroke="#3d405b"/>}
    <circle cx="40" cy="40" r="5" fill={`hsl(${hash%360} 80% 48%)`}/>
  </svg>;
}
