import DreamBot, {dreamBotMessage} from './DreamBot';
import './DreamBotCompanion.css';

const hints={
 studio:'Nhập nội dung, chọn giọng và cùng mình tạo bản đọc nhé.',
 voices:'Cùng tìm một giọng đọc phù hợp với câu chuyện của bạn nhé.',
 clones:'Thêm mẫu giọng của bạn để bắt đầu tạo dấu ấn riêng.',
 script:'Gán giọng cho từng nhân vật để câu chuyện thêm sống động.',
 batch:'Chuẩn bị danh sách nội dung, mình sẽ cùng bạn tạo từng bản đọc.',
 library:'Các bản đọc của bạn ở đây. Chọn một bản để nghe lại nhé.',
 settings:'Điều chỉnh tài khoản và trải nghiệm theo cách bạn thích.',
 admin:'Cùng quản lý tài khoản và quyền truy cập trong không gian của bạn.',
};

export default function DreamBotCompanion({bot,screen}){
 const message=bot.state==='idle'?(hints[screen]||'Mình luôn sẵn sàng đồng hành cùng bạn.'):dreamBotMessage(bot.state,bot.phase);
 return <aside className="dreambot-companion" aria-label="DreamBot đồng hành">
  <DreamBot {...bot} showMessage={false}/>
  <div className="dreambot-companion-copy"><strong>DreamBot <span>Trợ lý sáng tạo</span></strong><p role="status" aria-live="polite">{message}</p></div>
  <span className="dreambot-companion-accent" aria-hidden="true">✧</span>
 </aside>;
}
