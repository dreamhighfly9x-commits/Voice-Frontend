# DreamBot

## Thành phần

- `src/components/DreamBot.jsx`: linh vật tái sử dụng, nhận `state`, `phase`, `showMessage`.
- `src/lib/dreamBotActivity.js`: trạng thái tác vụ, ưu tiên success → playing → generating → welcome → idle. Welcome 2,6 giây một lần trong phiên tab; success 2 giây từ kết quả mới, không phát lại khi đổi trang.
- `DailyGreeting`: giữ vị trí nhân vật và khu vực lời nhắn cố định bên cạnh. 132 px desktop, 100/72 px ở màn hình nhỏ.
- `DreamBotCompanion`: thanh đồng hành dưới tiêu đề ở các tab ngoài Tổng quan (Studio, thư viện giọng, clone, kịch bản, hàng loạt, bản ghi, cài đặt, admin). Dùng chung trạng thái với Tổng quan, lời gợi ý riêng cho từng tab khi nghỉ. 80 px desktop/64 px điện thoại; nằm trong luồng trang, không che nút bấm.
- Trang thử: `/dev/dreambot`, chỉ được đóng gói trong môi trường Vite development. Không có nút thử trong giao diện chính.

## Kết nối thật

`apiFetch('/api/synthesize', {method:'POST', ...})` theo dõi yêu cầu của Studio, kịch bản và hàng loạt. Header `X-Voice-Task` dùng UUID; máy chủ chỉ cho chủ sở hữu xem trạng thái tại `/api/tts-activity/{id}`. Khóa xử lý báo queued trước khi được phục vụ, generating khi bắt đầu gọi engine. Trước khi máy chủ xác nhận trạng thái, hiển thị “Đang gửi yêu cầu tạo giọng…”, không đoán hàng đợi hoặc phần trăm. Poll 800 ms, ngừng khi tác vụ kết thúc và không poll khi tab ẩn. Trạng thái tác vụ tạm thời trong bộ nhớ: hiện hỗ trợ một tiến trình TTS như cấu hình local; nhiều worker cần kho trạng thái dùng chung.

Chỉ báo success khi HTTP thành công có `id` và `url` bản ghi (API trả sau khi đã ghi WAV). Lỗi/abort không ăn mừng; thông báo lỗi hiện có được giữ nguyên. Nút dừng hàng loạt/kịch bản hiện tại dừng các mục tiếp theo, không hủy đoạn đang xử lý: đoạn đó vẫn có thể hoàn tất thật. Nghe thử thư viện dùng cache riêng, không ăn mừng mỗi lần tải mẫu cũ.

`Audio.play()` thành công và sự kiện `playing` bật trạng thái nghe; `pause`, `waiting`, `ended`, `error` tắt. Không tự phát lời chào. Sóng trang trí, không đo âm lượng hoặc tuyên bố đồng bộ với nhạc. Sau success, hook xét lại audio và tác vụ hiện tại.

## Tài nguyên và giới hạn

Ảnh gốc `public/images/dreambot.png`: RGBA 1254×1254, khoảng 1,43 MB, có alpha trong suốt. Dùng nguyên ảnh, không bóp méo hoặc thay đổi thiết kế. Trình duyệt cache một ảnh cho mọi trạng thái; không tải mô hình 3D hoặc thư viện animation.

Đã làm: nổi chậm khi nghỉ; nhún chào và hào quang nhẹ; nghiêng toàn thân khi nghe kèm sóng rời; nổi và ba chấm khi tạo; nhún mừng một lần và tia sáng xanh tím. CSS dừng khi tab ẩn; reduced-motion giữ ảnh tĩnh và lời nhắn.

Chưa làm được từ PNG một lớp: vẫy riêng bàn tay, nghiêng riêng đầu, chớp mắt/đổi biểu cảm, giơ tay ăn mừng, thay đổi riêng đèn tai nghe/ngực. Cần bộ ảnh tư thế hoặc sprite đồng nhất góc nhìn/tỉ lệ, PSD/SVG tách lớp, hoặc mô hình 3D có rig. Không gọi nghiêng toàn ảnh là vẫy tay. Ánh sáng hiện tại là glow nhẹ quanh toàn hình.
