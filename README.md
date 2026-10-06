# DreamHigh Voice

## Giao diện & Tổng quan

Giao diện dùng Plus Jakarta Sans, khung màu than, vùng nội dung bo góc và thẻ pastel xanh/lavender/mint/kem theo mẫu tham chiếu. Menu có thể mở rộng để xem tên mục; hỗ trợ giao diện sáng/tối và màn hình điện thoại. Tổng quan là màn hình mặc định sau đăng nhập.

- Bộ lọc **7/30 ngày** điều khiển đường tần suất tạo bản ghi, ngày hoạt động, lượt tạo/nghe/tải và **Top 5 giọng đọc**. Có bảng số liệu thay thế biểu đồ và nút làm mới.
- Xếp hạng chỉ tính bản ghi thuộc tài khoản hiện tại, theo giọng đã tạo trong khoảng ngày chọn. Giọng còn khả dụng chưa có lượt tạo được bổ sung theo tên và ghi rõ là gợi ý khám phá. Không dùng số liệu phổ biến giả hoặc dữ liệu của tài khoản khác. Nghe thử tạo bản ghi mẫu và tính hạn mức TTS.
- Lượt nghe/tải chỉ bắt đầu ghi nhận từ bản cập nhật này, khi nghe thành công hoặc trình duyệt nhận file tải. Các lần lặp trong 5 giây được gộp. Biểu đồ không đo thời gian nghe hết, đăng nhập hay số khách truy cập website.
- Bản ghi mới lưu thời điểm tạo và mã giọng; bản ghi cũ lấy thời gian lưu tệp và tên giọng trong metadata nếu xác định được. Không gán bừa giọng cho bản ghép nhiều giọng. Mốc ngày theo múi giờ trình duyệt.
- API `/api/dashboard` và `/api/dashboard/events` yêu cầu đăng nhập; tương tác lưu trong `Voice-Backend/storage/dashboard.sqlite3`, không lưu IP hoặc nội dung lời thoại. Khởi động lại Python backend sau cập nhật để nạp các API này.

Kiểm tra: `pytest tests/test_dashboard.py`, `npx playwright test e2e/dashboard.spec.js`. Ảnh trong `test-results/dashboard-*.png` dùng dữ liệu kiểm thử; giao diện thực lấy dữ liệu tài khoản qua API.

## Kịch bản nhiều giọng & cài đặt tài khoản

- **Kịch bản nhiều giọng:** đặt tên, thêm nhân vật và chọn giọng thật; nhập từng đoạn hoặc dán dạng `Lan: Xin chào`. Sắp xếp bằng kéo thả hoặc mũi tên, đặt khoảng nghỉ 0–5 giây. Lưu/mở/xóa kịch bản theo tài khoản. Tạo các đoạn còn thiếu, tạo lại từng đoạn, nghe/tải WAV và ghép thành bản đọc 48 kHz. Đổi lời hoặc giọng sẽ yêu cầu tạo lại đoạn trước khi ghép. Bản ghép có trong Thư viện âm thanh.
- Tối đa 100 đoạn, 30 nhân vật, 100.000 ký tự/kịch bản; bản ghép tối đa 30 phút. Mỗi đoạn tuân theo hạn mức TTS của tài khoản. Có thể chuyển menu khi đang tạo; đóng trình duyệt sẽ dừng sau yêu cầu đang gửi, các đoạn đã lưu vẫn còn. Bấm **Lưu kịch bản** trước khi đóng trang. Hai phiên sửa cùng kịch bản sẽ được báo xung đột phiên bản.
- **Cài đặt tài khoản:** sửa tên/ảnh đại diện, giọng mặc định, giao diện và âm thanh thao tác; xem hạn mức thực tế và phiên đăng nhập. Email là định danh chỉ đọc. Đổi mật khẩu (tối thiểu 12 ký tự) hoặc đăng xuất tất cả sẽ thu hồi phiên trên các thiết bị.
- **Xác thực hai bước:** nhập mật khẩu hiện tại, thêm khóa thiết lập vào ứng dụng Authenticator (loại dựa trên thời gian), rồi nhập mã 6 số. Lưu mã khôi phục hiện một lần; mã khôi phục cũng chỉ dùng được một lần. Khóa thiết lập hết hạn sau 10 phút. Mã OTP đã dùng không thể sử dụng lại; đợi mã mới khi đăng nhập. Khóa được mã hóa tại máy chủ bằng khóa dẫn xuất từ JWT secret, nên phải sao lưu và giữ ổn định secret này cùng dữ liệu.
- Trang **Tổng quan** và tìm kiếm dự án dùng kịch bản đã lưu. **Tạo hàng loạt** có dừng, tiếp tục mục chờ và thử lại mục lỗi.

Máy mới cần áp dụng `Voice-Backend/migrations/0007_account_settings.up.sql` trước khi chạy API (lệnh `access-setup` đã bao gồm). Kịch bản nằm trong `storage/scripts.sqlite3`; hồ sơ/bảo mật trong PostgreSQL. Không chạy nhiều process Uvicorn chung thư mục dữ liệu.

Kiểm tra bổ sung: `pytest tests/test_scripts.py`, `go test ./internal/auth`, `go run ./cmd/account-check`, `npx playwright test e2e/workspace.spec.js`. `account-check` kiểm tra dịch vụ thật bằng tài khoản tạm và tự xóa tài khoản sau kiểm tra.

## Đăng nhập và quản trị người dùng

Giao diện yêu cầu đăng nhập. Tài khoản Admin trên máy này là `dreamhigh.fly9x@gmail.com`, dùng mật khẩu hiện có. Các giọng clone và bản ghi cũ đã được gán cho tài khoản này.

Trước khi chạy backend âm thanh và frontend bên dưới, bật PostgreSQL, Redis và API tài khoản trong một terminal riêng:

```powershell
cd D:\Text-To-Speech\Voice-Backend
.\start-auth.ps1
```

API tài khoản chạy ở cổng 8080; backend âm thanh ở 8000; truy cập web qua http://127.0.0.1:5173/. Cấu hình cục bộ nằm trong `Voice-Backend/.env.auth` (không đưa vào Git). Cài các phụ thuộc Python bằng `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` khi thiết lập môi trường mới.

Sau khi đăng nhập Admin, chọn **Quản trị → Tài khoản & quyền**:

- Thêm người dùng với email, tên và mật khẩu ban đầu.
- Tìm người dùng, đổi vai trò User/Admin, khóa hoặc mở tài khoản.
- Chọn từng quyền: **Theo vai trò**, **Cho phép**, **Từ chối**; bấm **Lưu quyền & hạn mức**.
- Đặt giới hạn ký tự/tháng, ký tự/lần tạo, tác vụ đồng thời, số giọng clone và dung lượng lưu trữ.
- Xem **Nhật ký thay đổi** để kiểm tra các thao tác quản trị.

Quyền được kiểm tra tại API cho mỗi yêu cầu; đổi vai trò hoặc khóa tài khoản áp dụng cho phiên hiện có. Không thể tự khóa/hạ quyền hoặc loại bỏ Admin hoạt động cuối cùng. Admin có thể chỉnh hạn mức của chính mình.

Giọng clone và bản ghi thuộc riêng từng tài khoản. Quyền Admin không tự cấp quyền xem nội dung người khác; cần cấp riêng quyền **Truy cập nội dung của người khác**. Quyền tải âm thanh kiểm soát nút và API tải file; người có quyền nghe vẫn có thể lưu dữ liệu âm thanh đã nhận trên trình duyệt.

Mức sử dụng hiển thị áp dụng cho Studio, kịch bản và tạo hàng loạt dùng backend `app.main`; pipeline hàng đợi Go cũ có bộ đếm riêng.

Kiểm tra: `npm test -- --reporter=dot`, `npx playwright test e2e/admin-access.spec.js`; backend: `go test ./...` và `.\.venv\Scripts\python.exe -m pytest tests -q`. `go run ./cmd/access-check` kiểm tra tích hợp với các dịch vụ đang chạy, tự tạo rồi xóa tài khoản thử.

## Chạy VieNeu v3 Turbo

### Công cụ Chuyển văn bản

- **Tải TXT / DOCX / PDF**: tối đa 10 MB, trích tối đa 100.000 ký tự. TXT hỗ trợ UTF-8/UTF-16; DOCX lấy đoạn và bảng theo thứ tự; PDF tối đa 100 trang, không có mật khẩu. PDF ảnh quét cần OCR trước. Nguồn: [python-docx](https://python-docx.readthedocs.io/en/latest/api/document.html), [pypdf](https://pypdf.readthedocs.io/en/stable/user/extract-text.html).
- Xem trước nội dung rồi chọn **Thay nội dung hiện tại** hoặc **Thêm vào cuối**. File gốc không được lưu trên server.
- **Chuẩn hóa văn bản** làm sạch khoảng trắng, ký tự ẩn và chuẩn hóa Unicode; giữ các đoạn văn.
- **Chia đoạn tự động** chia tại dấu câu/khoảng trắng, tối đa 600 ký tự/đoạn (hoặc hạn mức tài khoản nếu thấp hơn), ngay trong ô nhập. Không chuyển sang dữ liệu kịch bản mẫu. Việc chia đoạn không tăng hạn mức tổng của một lần tạo âm thanh.
- **Hoàn tác công cụ** khôi phục nội dung trước thao tác nhập/chuẩn hóa/chia đoạn gần nhất; nhập tay tiếp sẽ kết thúc lượt hoàn tác này.
- **Từ điển phát âm** cho phép thêm/sửa/xóa cách đọc, ví dụ `AI → ây ai`. Từ điển phân biệt hoa/thường, thay cụm từ hoàn chỉnh và không thay dây chuyền. Lưu theo tài khoản trong trình duyệt hiện tại. Văn bản gốc giữ nguyên; số ký tự sau thay thế được kiểm tra theo hạn mức và gửi đến engine.
- **Nghe thử 1 đoạn** đọc tối đa 300 ký tự đầu theo ranh giới câu/từ, kể cả khi toàn bộ tài liệu dài hơn giới hạn. Nghe thử vẫn tạo bản ghi và tính vào hạn mức như yêu cầu tạo âm thanh khác.

Kiểm tra giao diện công cụ: `npx playwright test e2e/studio-tools.spec.js`.

Backend:

```powershell
cd D:\Text-To-Speech\Voice-Backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Giao diện, trong terminal khác:

```powershell
cd D:\Text-To-Speech\Voice-Frontend
npm run dev -- --host 127.0.0.1
```

Mở địa chỉ Vite hiển thị, mặc định http://127.0.0.1:5173/.
VieNeu có giọng preset, xuất WAV 48 kHz; bản ghi lưu trong `Voice-Backend/storage`.
Trong **Giọng của tôi**, chọn hoặc kéo thả WAV/MP3/FLAC (3–30 giây, tối đa 20 MB),
đặt tên rồi bấm **Tải lên và tạo giọng clone**. Giọng được lưu trong
`Voice-Backend/storage/clones` và xuất hiện trong danh sách giọng sau khi tải lại trang.
Có thể nghe thử hoặc bấm **Dùng giọng** để đọc nội dung mới trong Studio.

Mẫu nghe thử dùng câu ngắn và được lưu riêng theo tài khoản/giọng trên máy chủ. Lần đầu cần tạo âm thanh và tính hạn mức ký tự; nghe lại mẫu đã lưu không chạy TTS và không trừ thêm hạn mức. Trình duyệt giữ tối đa 20 mẫu âm thanh trong phiên để giảm tải lại. Khi mẫu bị xóa, hệ thống tạo lại ở lần nghe tiếp theo. Bấm lần nữa khi đang tải để hủy phát; đổi giọng sẽ chỉ phát giọng được chọn sau cùng.

Qwen3 CustomVoice dùng câu nghe thử tiếng Anh; dùng VieNeu cho tiếng Việt. Backend tìm model Qwen3 trong cache Hugging Face của dịch vụ trước, sau đó trong `~/.cache/huggingface/hub`, để dùng lại model đã cài khi `HF_HOME` của dịch vụ thay đổi.


## Engine VieNeu độc lập (phương án cũ, cùng cổng 8000)

Từ thư mục gốc `D:\Text-To-Speech`, cài môi trường engine một lần:

```powershell
powershell -ExecutionPolicy Bypass -File .\Voice-Backend\tts-engine\setup.ps1
```

Mở hai terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\Voice-Backend\tts-engine\start.ps1
```

```powershell
cd Voice-Frontend
npm install
npm run dev -- --host 127.0.0.1
```

Mở địa chỉ Vite hiển thị. Engine chạy tại `127.0.0.1:8000`; Vite chuyển tiếp `/api`.
Lần đầu engine tải model vào `.runtime/huggingface`, cần Internet. Chờ trạng thái sẵn sàng để chọn giọng và tạo WAV.
Engine dùng VieNeu v3 Turbo ONNX/CPU, FP32, xử lý một yêu cầu mỗi lần, tối đa 5.000 ký tự.
Bản ghi WAV và metadata được lưu trong `Voice-Backend/tts-engine/outputs`, có thể mở lại trong Thư viện.

Engine độc lập cũ chỉ hỗ trợ giọng preset. Để dùng upload/clone, chạy backend `app.main` theo hướng dẫn đầu trang. Batch, tài khoản và quản trị vẫn là prototype.
Service chỉ dành cho local; chưa có xác thực hoặc hàng đợi nhiều người dùng.

Kiểm tra API (không tải model):

```powershell
cd Voice-Backend/tts-engine
../.venv/Scripts/python.exe -m unittest -v test_server
```

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
