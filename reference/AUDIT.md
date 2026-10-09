# Audit GSM AI — 07/10/2026

## Nguồn chính

Stitch MCP: projects/13011488694489006533, “GSM AI: Trợ Lý Đặt Xe”. Đã đọc metadata, design system và 10 screen. IAB đã đọc các iframe đang hiển thị và lưu 8 bản HTML thực tế `stitch/rendered-0.html` đến `rendered-7.html`. Tải HTML trực tiếp trả về trang đăng nhập Google; không dùng trang đó làm baseline.

## Kiểm kê trước triển khai

- Workspace ban đầu chỉ có work/ và outputs/. Tìm package.json/AGENTS.md/asset 3D trong C:/Users/PC không tìm thấy repo GSM. Các repo frontend khác không liên quan và được giữ nguyên.
- Không có stack/router/dependency/backend/component GSM cục bộ để refactor. Tạo C:/Users/PC/gsm-ai theo phạm vi được giao.
- Stack mới: React 19, TypeScript, Vite; React Router với /, /chuyen-di, /lich-su, /tai-khoan.
- Không tìm thấy GLB/GLTF/FBX/OBJ GSM. Xe procedural WebGL là asset tạm thời. Robot dùng CSS nhiều lớp, full body, không dùng poster.

## Các màn Stitch

1. Trang chủ — GSM Di Chuyển Thông Minh
2. Trợ lý AI GSM — Đặt xe Thông minh
3. Đang tìm tài xế — GSM
4. Đã tìm thấy tài xế! — GSM
5. Theo dõi Chuyến đi — GSM
6. Tài xế đã đến — GSM
7. Đang trên chuyến đi — GSM
8. Đến nơi & Đánh giá chuyến đi — GSM
9. Lịch sử chuyến đi — GSM
10. Prototype tổng hợp “GSM Xanh SM Ride-Hailing App”

Màn chat đã có thiết kế chọn xe và xác nhận, cần tách thành component/state hoạt động. Chưa có screen tài khoản độc lập trong danh sách MCP. Bổ sung tài khoản theo các mục người dùng chỉ định.

## Kế hoạch đã áp dụng

- Giữ lại: thứ tự trang chủ, GSM teal/mint, Be Vietnam Pro, pill CTA, bốn tab, card tuyến, map/bottom sheet chuyến, phân nhóm lịch sử.
- Refine: hierarchy, khoảng trắng, bóng nhẹ, typography, kích thước nút, mascot floating, chat modal.
- Bổ sung: service layer, reducer có transition guard, ambiguity, edit địa điểm, explicit confirmation, error/retry, rating, chi tiết lịch sử, tài khoản.
- Cần asset: mesh xe chính xác và license sử dụng GLB. Không có asset gốc nên không tuyên bố xe procedural giống hoàn toàn xe thương mại.
- Cần 3D: Canvas, camera perspective góc 3/4, lighting/environment nội bộ, contact shadow, 3 phương tiện, lazy import, DPR 1–1.5, offscreen unmount, reduced motion, fallback WebGL.
- Cần state: một RideProvider dùng chung shell, chat và trip; UI/state/services/data độc lập.

## Token và thay đổi có chủ đích

- GSM #00B4A5, primary tương phản #006A61, mint trắng, text #1A2B28.
- Font Be Vietnam Pro tự host; radius card 20–26px, nút pill; shadows teal nhẹ.
- Bỏ microphone/voice theo yêu cầu. Không sử dụng tên “Xanh SM” trong UI triển khai.
- Xe ảnh 2D được thay bằng procedural WebGL; mascot ảnh được thay bằng robot CSS có blink/wave/head tilt/idle.
- Giữ thứ tự các phần, viết lại một số nội dung để giảm mật độ. Không thêm tab AI.
- Limo Green hiển thị sức chứa 6 hành khách, tách khỏi ghế tài xế.
