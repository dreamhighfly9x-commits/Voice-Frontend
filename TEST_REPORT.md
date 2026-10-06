# Báo cáo unit test — Voice-Frontend

Ngày: 2026-09-17
Phạm vi: luồng nghiệp vụ + UI/UX của các màn hình backend-wired (Studio, Voices, Library) và logic dùng chung.

## Stack test

- Chưa có test runner trước đó trong repo.
- Đã cài: Vitest + `@testing-library/react` + `@testing-library/user-event` + `jsdom` + `@testing-library/jest-dom`.
- Script: `npm test` (`vitest run`).
- Config: `vite.config.js` (`test.environment: 'jsdom'`, `test.setupFiles: './src/setupTests.js'`).
- `src/setupTests.js`: cleanup RTL sau mỗi test, polyfill `HTMLDialogElement.showModal/close` và `window.matchMedia` (jsdom không hỗ trợ, cần cho `GlobalSearch` và `page-mascot`).

## Kết quả

**46/46 test pass**, 8 file test.

| File | Số test | Nội dung |
|---|---|---|
| `src/lib/search.test.js` | 6 | `normalizeSearch` (bỏ dấu, đ→d, khoảng trắng), `searchItems` (AND nhiều từ khóa, không dấu, không khớp) |
| `src/lib/voiceFilters.test.js` | 13 | `matchesVoiceFilter` (7 loại filter), `readVoicePreferences` (JSON hợp lệ / thiếu key / hỏng / là mảng) |
| `src/components/Toast.test.jsx` | 2 | Có message → hiện text; không có message → không render gì |
| `src/components/GlobalSearch.test.jsx` | 2 | Gõ từ khóa lọc đúng kết quả; nhấn Enter chọn kết quả đầu và đóng dialog |
| `src/screens/StudioScreen.test.jsx` | 6 | Empty state khi chưa có bản ghi; nút "Tạo âm thanh" disabled khi engine chưa sẵn sàng / text rỗng / vượt giới hạn ký tự; enabled khi hợp lệ; chọn giọng nhanh gọi đúng callback |
| `src/screens/VoicesScreen.test.jsx` | 5 | Bấm filter gọi đúng callback; lọc "Nữ" chỉ hiện giọng nữ; sao yêu thích toggle + aria-pressed; đổi phân loại giọng gọi `onClassify` đúng patch; filter rỗng hiện empty state |
| `src/screens/LibraryScreen.test.jsx` | 2 | Bấm filter gọi đúng callback; mỗi bản ghi có link tải WAV đúng href |
| `src/App.test.jsx` | 7 | **Luồng nghiệp vụ** (mock `fetch`/`Audio`): kết nối engine thành công/thất bại; tạo âm thanh thành công (thêm bản ghi + toast); tạo âm thanh lỗi server (hiện đúng message lỗi từ API); phát/dừng bản ghi qua tìm kiếm toàn cục; yêu thích giọng lưu vào `localStorage`; điều hướng sidebar đổi màn hình |

## Điều chỉnh so với plan ban đầu (34 case đã duyệt)

3 case bị loại vì không thể tái hiện qua UI thật:

- `generate_emptyText_...`, `generate_textOverMaxChars_...`, `generate_engineNotReady_...` — các guard này nằm trong `App.jsx`, nhưng nút "Tạo âm thanh"/"Nghe thử" đã bị `disabled` bởi chính các điều kiện đó ở `StudioScreen`, nên không bấm được để kích hoạt guard nội bộ. Hành vi người dùng thấy được (nút bị vô hiệu hoá) đã được test trong `StudioScreen.test.jsx`. Test lại ở tầng `App` sẽ trùng lặp, không thêm giá trị.
- `play_unknownItem_showsToast` — nhánh "không tìm thấy bản ghi/giọng" trong hàm `play()` không có đường dẫn UI nào tạo ra id không khớp; mọi nút Play trong app đều truyền đúng id bản ghi hoặc `'v' + voiceId`. Bỏ vì không kiểm chứng được qua public API mà không gọi thẳng hàm nội bộ.

## Finding phát sinh (UI/UX)

`PlayButton` (`src/components/PlayButton.jsx`) là `<div onClick>` thuần, không có `role`/`aria-label`/hỗ trợ bàn phím → không thể thao tác bằng screen reader hoặc Tab, và không truy vấn được bằng accessibility query trong test. Riêng nút Nghe/Dừng trong `GlobalSearch` là `<button>` có label rõ ràng nên dùng bình thường. Đề xuất: thêm `role="button"` + `aria-label` cho `PlayButton` nếu muốn cải thiện khả năng tiếp cận — chưa tự sửa vì ngoài phạm vi yêu cầu ban đầu.

## Ghi chú

Tại thời điểm review có 3 phiên Claude Code khác chạy song song trong cùng thư mục workspace; một phiên đã tạo thêm `src/App.integration.test.jsx` (không thuộc phạm vi báo cáo này) và tự thêm polyfill `matchMedia` vào `src/setupTests.js` dùng chung. File đó có 4/6 test đang fail (lỗi truy vấn text trùng "Minh") — không thuộc trách nhiệm của báo cáo này, để phiên tương ứng tự xử lý.
