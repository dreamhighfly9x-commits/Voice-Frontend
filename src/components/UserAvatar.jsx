import { useState } from 'react';

export default function UserAvatar({ user, className }) {
  const [failed, setFailed] = useState(null);
  const style = { width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 };
  return user?.avatar && failed !== user.avatar
    ? <img className={className} style={style} src={user.avatar} alt="Ảnh đại diện của bạn" onError={()=>setFailed(user.avatar)}/>
    : <b className={className}>{(user?.name || user?.email || 'U').slice(0,1).toUpperCase()}</b>;
}
