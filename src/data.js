// Dummy data ported verbatim (labels, numbers, order) from the DreamHigh
// Voice prototype (docs/06-design/ui-spec-dreamhigh-voice.md), so the UI matches it.

export const ICONS = {
  home: 'M4 4.5h6v6H4zM14 4.5h6v6h-6zM4 13.5h6v6H4zM14 13.5h6v6h-6z',
  studio: 'M5 6h14M5 10.5h9M5 15h11M5 19.5h6',
  script: 'M4 5.5h16v10H9.5L4.5 19.5V5.5zM8 9h8M8 12h5',
  batch:
    'M12 3.2 3.5 7.6 12 12l8.5-4.4L12 3.2zM3.5 12.4 12 16.8l8.5-4.4M3.5 16.6 12 21l8.5-4.4',
  voices:
    'M12 4.2a2.8 2.8 0 0 1 2.8 2.8v4.6a2.8 2.8 0 0 1-5.6 0V7A2.8 2.8 0 0 1 12 4.2zM5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 18v2.4M9 20.4h6',
  clones:
    'M10 4.2A2.6 2.6 0 0 1 12.6 7v3.6a2.6 2.6 0 0 1-5.2 0V7A2.6 2.6 0 0 1 10 4.2zM4.2 20a5.8 5.8 0 0 1 11.6 0M16.4 6.6l1.8-1.8M17.6 10h2.2',
  library:
    'M9 18.2V6.4l10-2v11.4M9 18.2a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0zM19 15.8a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0z',
  settings:
    'M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM12 3.6v2.2M12 18.2v2.2M4.6 12h2.2M17.2 12h2.2M6.7 6.7l1.6 1.6M15.7 15.7l1.6 1.6M17.3 6.7l-1.6 1.6M8.3 15.7l-1.6 1.6',
  admin:
    'M12 3.4l7.2 3v5.8c0 4.1-3.1 6.8-7.2 8.4-4.1-1.6-7.2-4.3-7.2-8.4V6.4l7.2-3zM9.4 12.2l1.9 1.9 3.4-3.6',
  apidocs:
    'M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15',
  providers:
    'M4 5h16v5H4zM4 14h16v5H4zM7.5 7.5h.01M7.5 16.5h.01M11 7.5h6M11 16.5h6',
  pricing:
    'M3.8 12.6V4.4a.6.6 0 0 1 .6-.6h8.2l7.6 7.6a1.2 1.2 0 0 1 0 1.7l-6.5 6.5a1.2 1.2 0 0 1-1.7 0L3.8 12.6zM8.2 8.2h.01',
};

export const SCREEN_TITLES = {
  home: ['Tổng quan', 'Chào Hân — hôm nay bạn muốn tạo bản đọc nào?'],
  studio: [
    'Chuyển văn bản thành giọng nói',
    'VieNeu v3 Turbo · tạo giọng nói',
  ],
  voices: ['Thư viện giọng', 'Nghe thử và chọn giọng mẫu cho dự án'],
  clones: ['Giọng của tôi', 'Tạo và quản lý giọng clone riêng tư'],
  script: [
    'Kịch bản nhiều giọng',
    'Gán vai cho từng lượt thoại, tạo lại riêng từng đoạn',
  ],
  batch: ['Tạo hàng loạt', 'Nhiều nội dung hoặc một nội dung nhiều giọng'],
  library: ['Thư viện âm thanh', 'Tất cả bản ghi đã tạo của bạn'],
  pricing: ['Bảng giá', 'Chọn gói tháng phù hợp và áp dụng mã khuyến mãi'],
  settings: ['Cài đặt tài khoản', 'Hồ sơ, hạn mức và bảo mật'],
  admin: ['Quản trị hệ thống', 'Người dùng, mô hình, hàng đợi và tài nguyên'],
  apidocs: ['Tài liệu API', 'Gọi DreamHigh Voice từ code: API key, ví dụ và giới hạn'],
  providers: ['API & Nguồn giọng', 'Kết nối các dịch vụ TTS và đồng bộ giọng nói vào DreamHigh Voice.'],
};

export const NAV_GROUPS = [
  {
    title: 'LÀM VIỆC',
    items: [
      { id: 'home', label: 'Tổng quan' },
      { id: 'studio', label: 'Chuyển văn bản' },
      { id: 'script', label: 'Kịch bản nhiều giọng' },
      { id: 'batch', label: 'Tạo hàng loạt', badge: '2' },
    ],
  },
  {
    title: 'GIỌNG & KẾT QUẢ',
    items: [
      { id: 'voices', label: 'Thư viện giọng' },
      { id: 'clones', label: 'Giọng của tôi', badge: '3' },
      { id: 'library', label: 'Thư viện âm thanh' },
    ],
  },
  {
    title: 'HỆ THỐNG',
    items: [
      { id: 'pricing', label: 'Bảng giá' },
      { id: 'settings', label: 'Cài đặt tài khoản' },
      { id: 'providers', label: 'API & Nguồn giọng' },
      { id: 'apidocs', label: 'Tài liệu API' },
      { id: 'admin', label: 'Quản trị' },
    ],
  },
];

export const BASE_VOICES = [
  {
    id: 'han',
    initial: 'H',
    name: 'Hân',
    tags: 'vi-VN · giọng clone',
    desc: 'Giọng của bạn — trẻ, gần gũi, phù hợp reel và vlog.',
    seed: 1,
  },
  {
    id: 'minh',
    initial: 'M',
    name: 'Minh',
    tags: 'vi-VN · nam trầm',
    desc: 'Trầm, chậm, kể chuyện — phù hợp nội dung dài và podcast.',
    seed: 4,
  },
  {
    id: 'linh',
    initial: 'L',
    name: 'Linh',
    tags: 'vi-VN · nữ trẻ',
    desc: 'Tươi, nhịp nhanh, rõ chữ — tốt cho TikTok và quảng cáo ngắn.',
    seed: 7,
  },
  {
    id: 'quan',
    initial: 'Q',
    name: 'Quân',
    tags: 'vi-VN · nam trung',
    desc: 'Trung tính, đọc tin và hướng dẫn sử dụng.',
    seed: 11,
  },
  {
    id: 'mai',
    initial: 'M',
    name: 'Mai',
    tags: 'vi-VN · nữ ấm',
    desc: 'Ấm, dịu, thích hợp audiobook và nội dung học tập.',
    seed: 3,
  },
  {
    id: 'nam',
    initial: 'N',
    name: 'Nam',
    tags: 'vi-VN · nam trẻ',
    desc: 'Năng lượng cao, tăng nhịp cho nội dung giải trí.',
    seed: 8,
  },
  {
    id: 'thu',
    initial: 'T',
    name: 'Thu',
    tags: 'vi-VN · nữ trung',
    desc: 'Chuyên nghiệp, đọc kịch bản thương hiệu.',
    seed: 13,
  },
  {
    id: 'khoa',
    initial: 'K',
    name: 'Khoa',
    tags: 'en-US · nam',
    desc: 'Song ngữ, dùng cho phần chèn tiếng Anh trong nội dung Việt.',
    seed: 6,
  },
];

export const INITIAL_MY_CLONES = [
  { id: 'c1', name: 'Hân — giọng chính', meta: '3 phút bản ghi · tạo 12/08', tag: 'Riêng tư' },
  {
    id: 'c2',
    name: 'Hân v2 — nói nhanh',
    meta: '1 phút 20 giây · đang kiểm tra',
    tag: 'Đang xử lý',
  },
  { id: 'c3', name: 'Giọng kể chuyện', meta: '2 phút 40 giây · tạo 02/08', tag: 'Riêng tư' },
];

export const INITIAL_TEXT =
  'Bạn học tiếng Anh ba năm mà vẫn không nói được câu nào? Mình từng y hệt vậy — và đây là năm điều mình đổi.\n\n' +
  'Điều đầu tiên: bỏ việc học từ vựng rời rạc. Thay vào đó, hãy nghe một podcast ngắn mỗi ngày và nhắc lại theo từng câu.\n\n' +
  'Thứ hai, đổi cách ghi chú: viết lại câu đầy đủ chứ đừng chỉ ghi nghĩa của từ.';

export const INITIAL_RESULTS = [
  { id: 'r1', title: 'Reel — 5 mẹo học tiếng Anh · v3', meta: 'HÂN · CLONE · 1.05× · MP3', dur: '1:12', seed: 2 },
  { id: 'r2', title: 'Reel — 5 mẹo học tiếng Anh · v2', meta: 'HÂN · CLONE · 1.00× · MP3', dur: '1:16', seed: 5 },
  { id: 'r3', title: 'Đoạn mở đầu (nghe thử)', meta: 'MINH · GIỌNG MẪU · WAV', dur: '0:08', seed: 9 },
];

export const INITIAL_SEGMENTS = [
  {
    id: 's1',
    role: 'Người dẫn',
    voice: 'Hân · clone',
    text: 'Hôm nay mình chia sẻ năm điều đã giúp mình nói tiếng Anh tự nhiên hơn.',
    timing: '0:00 – 0:06 · nghỉ 0.4s',
    status: 'Đã tạo',
  },
  {
    id: 's2',
    role: 'Lan',
    voice: 'Lan · giọng mẫu',
    text: 'Nhưng mỗi ngày mình chỉ có hai mươi phút thì học kiểu gì cho hiệu quả?',
    timing: 'nghỉ 0.6s trước khi vào',
    status: 'Đang tạo',
  },
  {
    id: 's3',
    role: 'Minh',
    voice: 'Minh · giọng mẫu',
    text: 'Hai mươi phút là đủ, miễn là bạn nghe và nhắc lại thành tiếng chứ không chỉ đọc thầm.',
    timing: 'nghỉ 0.5s',
    status: 'Chờ',
  },
  {
    id: 's4',
    role: 'Người dẫn',
    voice: 'Hân · clone',
    text: 'Nếu thấy hữu ích, lưu lại để làm theo trong ba mươi ngày nhé.',
    timing: 'nghỉ 0.4s',
    status: 'Chờ',
  },
];

export const ROLES = [
  { name: 'Người dẫn', voice: 'Hân · giọng clone', dot: 'var(--acc)' },
  { name: 'Lan', voice: 'Linh · giọng mẫu', dot: '#1fa971' },
  { name: 'Minh', voice: 'Minh · giọng mẫu', dot: '#2f6fe0' },
];

export const ROLE_COLORS = {
  'Người dẫn': ['var(--accSoft)', 'var(--accDeep)'],
  Lan: ['var(--okBg)', 'var(--okInk)'],
  Minh: ['var(--infoBg)', 'var(--infoInk)'],
};

export const STATUS_COLORS = { 'Đã tạo': '#1fa971', 'Đang tạo': 'var(--acc)', Chờ: 'var(--dim2)' };

export const STATS = [
  { label: 'Ký tự đã dùng', value: '124.500', hint: '62% hạn mức tháng', color: 'var(--dim2)' },
  { label: 'Dự án', value: '18', hint: '+3 tuần này', color: '#1fa971', bold: true },
  { label: 'Giọng clone', value: '3', hint: 'còn 2 lượt clone', color: 'var(--dim2)' },
  { label: 'Tác vụ đang chạy', value: '2', hint: '1 chờ trong hàng đợi', color: 'var(--acc)', bold: true },
];

export const PROJECTS = [
  { name: 'Reel — 5 mẹo học tiếng Anh', meta: '4 đoạn · Hân, Minh', tag: 'Đang tạo', tone: 'accent', time: '19:42' },
  { name: 'Podcast tập 12 — Học sao cho vào', meta: '22 đoạn · Minh', tag: 'Hoàn thành', tone: 'ok', time: 'Hôm qua' },
  { name: 'Quảng cáo 30s — Khóa IELTS', meta: '2 đoạn · Linh', tag: 'Hoàn thành', tone: 'ok', time: '2 ngày' },
  { name: 'Kịch bản hội thoại lớp 9', meta: '31 đoạn · 3 vai', tag: 'Nháp', tone: 'neutral', time: '5 ngày' },
];

export const TASKS = [
  { name: 'Reel — đoạn 2', pct: 42, color: 'var(--acc)' },
  { name: 'Lô 30 ngày · 12/30 mục', pct: 40, color: '#f0a020' },
  { name: 'Clone "Hân v2" · kiểm tra bản ghi', pct: 85, color: '#1fa971' },
];

export const VOICE_FILTERS = ['Tất cả', 'Yêu thích', 'Giọng clone', 'Nữ', 'Nam', 'Kể chuyện', 'Quảng cáo'];
export const LIB_FILTERS = ['Tất cả', 'Tuần này', 'Giọng clone', 'Lô hàng loạt', 'Đã tải'];

export const TIPS = [
  { text: 'Thu 60–120 giây, đọc tự nhiên như khi bạn làm video.' },
  { text: 'Phòng kín, tắt quạt và điều hòa; tránh vọng âm.' },
  { text: 'Giữ khoảng cách micro ổn định, không đổi giọng giữa bản ghi.' },
  { text: 'Không dùng nhạc nền hay bản ghi có nhiều người nói.' },
];

export const CLONE_CHECKS = [
  { text: 'Định dạng WAV · 48 kHz · mono', ok: '✓' },
  { text: 'Thời lượng 1 phút 12 giây (đủ 30–120 giây)', ok: '✓' },
  { text: 'Chỉ một người nói, không nhạc nền', ok: '✓' },
  { text: 'Nhiễu nền thấp · khoảng lặng đầu/cuối đã cắt', ok: '✓' },
];

export const LIBRARY_ITEMS = [
  { id: 'l1', title: 'Reel — 5 mẹo học tiếng Anh · v3', meta: 'Hân · clone · hôm nay 19:44', dur: '1:12', seed: 2 },
  { id: 'l2', title: 'Podcast tập 12 — bản ghép đầy đủ', meta: 'Minh · hôm qua 21:03', dur: '18:26', seed: 6 },
  { id: 'l3', title: 'Quảng cáo 30s — Khóa IELTS', meta: 'Linh · 2 ngày trước', dur: '0:31', seed: 10 },
  { id: 'l4', title: 'ngay-02-tu-vung.mp3', meta: 'Lô 30 ngày · Hân · clone', dur: '1:04', seed: 14 },
  { id: 'l5', title: 'Kịch bản hội thoại lớp 9 — đoạn 1–8', meta: '3 vai · 4 ngày trước', dur: '3:47', seed: 18 },
];

export const QUOTA_ROWS = [
  { label: 'Ký tự tạo giọng', value: '124.500 / 200.000', pct: 62, color: 'var(--acc)' },
  { label: 'Giọng clone', value: '3 / 5', pct: 60, color: 'var(--acc)' },
  { label: 'Dung lượng lưu trữ', value: '318 MB / 2 GB', pct: 16, color: '#1fa971' },
  { label: 'Tác vụ đồng thời', value: '2 / 3', pct: 66, color: '#f0a020' },
];

export const ADMIN_STATS = [
  { label: 'Người dùng hoạt động', value: '1.284' },
  { label: 'Ký tự xử lý (30 ngày)', value: '48,2 M' },
  { label: 'Tác vụ trong hàng đợi', value: '10' },
  { label: 'Dung lượng đã dùng', value: '412 GB' },
];

export const ADMIN_USERS = [
  { name: 'Ngọc Hân', email: 'ngochan@example.com', role: 'Creator', usage: '124.500' },
  { name: 'Trần Bảo', email: 'bao@studio.vn', role: 'Creator', usage: '96.200' },
  { name: 'Lê Vy', email: 'levy@example.com', role: 'Free', usage: '8.400' },
  { name: 'Phạm Đức', email: 'duc@agency.vn', role: 'Team', usage: '310.700' },
  { name: 'Admin', email: 'admin@dreamhigh.vn', role: 'Quản trị', usage: '—' },
];

export const GPU_BARS = [62, 48, 80, 34, 72, 90, 56, 44, 68, 30, 76, 52];

export const MODELS = [
  { name: 'TTS Việt · v1.4', note: 'ĐANG BẬT', dot: '#1fa971' },
  { name: 'Clone giọng · tham chiếu', note: 'ĐANG BẬT', dot: '#1fa971' },
  { name: 'OCR tài liệu scan', note: 'THỬ NGHIỆM', dot: '#f0a020' },
];


export const QUOTA_LIMIT_DEFAULT = 200000;
export const QUOTA_USED = 124500;

export const PLAY_ICON_PLAY = 'M8.5 5.2l10 6.8-10 6.8z';
export const PLAY_ICON_PAUSE = 'M9 5h2.6v14H9zM12.4 5H15v14h-2.6z';
