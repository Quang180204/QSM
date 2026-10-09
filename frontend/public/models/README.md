# Thay thế mô hình 3D

Thêm GLB có quyền sử dụng vào thư mục này. Trong `src/data/catalog.ts`, khai báo `modelUrl:'/models/vf5.glb'` và `modelScale` cho phương tiện tương ứng. `VehicleModel` tự chuyển từ geometry tạm sang GLB, dùng `useGLTF`, clone scene và preload các URL đã cấu hình.

Chuẩn asset: trục Y hướng lên, mặt xe hướng -X, tâm X/Z bằng 0, mặt đất Y=0; VF 5 khoảng 3,5 đơn vị dài, Limo Green khoảng 4,5, bike khoảng 2. Giữ màu xanh ngọc GSM và vật liệu PBR. Giới hạn khoảng 100k triangle, texture 1k–2k, ưu tiên KTX2/Draco khi đã chuẩn bị decoder tương ứng. Loader GLTF hỗ trợ Draco qua drei; asset phải được kiểm tra mạng/CORS và decoder trước triển khai offline.

ModelScale chỉ hiệu chỉnh kích thước; nếu asset khác trục/tâm, chỉnh asset bằng công cụ 3D trước hoặc thêm transform vào GLBModel. Không điền modelUrl cho file chưa có. Asset GLB lỗi sẽ vào graceful fallback nhờ SceneBoundary.
