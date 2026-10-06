import RankBadge from './RankBadge';
import {favoriteRanking} from '../lib/favoriteRanking';
import LottieIcon from './LottieIcon';

const RANKING_BADGES = import.meta.env.BASE_URL + 'animations/ranking-badges.lottie';

export default function FavoriteLeaderboard({voices,favorites,data,days,error,generating,canCreate,playingId,onPlay,onPick,onNavigate}) {
  const ranking = data ? favoriteRanking(voices,favorites,data.voice_counts) : [];
  return <section className="voice-ranking favorite-leaderboard">
    <div className="section-heading"><div><LottieIcon src={RANKING_BADGES} active width={150} height={89} className="leaderboard-badges"/><h2>Top giọng yêu thích</h2><p>Giọng đã đánh dấu ★ · xếp theo lượt tạo trong {days} ngày</p></div><button className="text-link" onClick={()=>onNavigate('voices')}>Chọn giọng ★</button></div>
    {!data&&!error&&<p className="empty-state" role="status">Đang tải bảng xếp hạng…</p>}
    {error&&<p className="empty-state">Chưa tải được bảng xếp hạng. Hãy thử làm mới thống kê.</p>}
    {data&&!ranking.length&&<div className="favorite-empty"><span aria-hidden="true">☆</span><h3>Giọng yêu thích của bạn sẽ ở đây</h3><p>Đánh dấu ★ trong thư viện để tạo bảng xếp hạng riêng.</p><button onClick={()=>onNavigate('voices')}>Khám phá giọng đọc</button></div>}
    {ranking.length>0&&<><div className="ranking-labels"><span>Hạng / Giọng đọc</span><span>Lượt tạo</span><span>Thao tác</span></div><ol className="favorite-ranks">{ranking.map((voice,index)=><li className={`ranking-row favorite-place-${index+1}`} key={voice.id}>
      <div className="rank-identity"><RankBadge rank={index+1}/><div><strong>{voice.name}</strong><small>★ Yêu thích{voice.id.startsWith('clone_')?' · Giọng clone':''}</small></div></div>
      <div className="rank-count"><b>{voice.count.toLocaleString('vi-VN')}</b></div>
      <div className="rank-actions"><button aria-label={'Nghe thử '+voice.name} disabled={generating||!canCreate} onClick={()=>onPlay('v'+voice.id)}>{playingId==='v'+voice.id?'■':'▷'}</button><button disabled={!canCreate} onClick={()=>onPick(voice.id)}>Sử dụng</button></div>
    </li>)}</ol><details className="ranking-info"><summary>Cách xếp hạng & nghe thử</summary><p>Chỉ gồm giọng bạn đánh dấu yêu thích. Cùng lượt tạo được xếp theo tên; giọng chưa dùng có 0 lượt. Nghe thử lần đầu tạo mẫu và tính vào hạn mức, những lần sau dùng mẫu đã lưu.</p></details></>}
  </section>;
}
