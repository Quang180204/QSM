# QSM (Quick Smart Mobility) — Nền Tảng Đặt Xe Thuần Điện 2026

> **Tài liệu chuyển giao kỹ thuật & Yêu cầu phát triển phiên bản Production**  
> Bản cập nhật đặc tả nghiệp vụ dành cho lập trình viên kế nhiệm (`Developer Handover Guide`).

---

## 📌 1. QUY ĐỊNH BẮT BUỘC VỀ QUẢN LÝ MÃ NGUỒN (GIT WORKFLOW)

> [!IMPORTANT]
> **QUY TẮC PHÂN NHÁNH VÀ PUSH CODE:**
> - **Tuyệt đối KHÔNG push code trực tiếp lên nhánh `main`**.
> - Trước khi thực hiện bất kỳ chỉnh sửa nào, lập trình viên **phải tạo nhánh mới có tên `LXH`** từ `main`.
> - Toàn bộ commit và thay đổi phải được push lên nhánh `LXH`.

```bash
# 1. Cập nhật nhánh main mới nhất
git checkout main
git pull origin main

# 2. Tạo và chuyển sang nhánh làm việc LXH
git checkout -b LXH

# 3. Thực hiện công việc, commit có ý nghĩa
git add .
git commit -m "feat(qsm): [tên tính năng/nhiệm vụ thực hiện]"

# 4. Push code lên nhánh LXH trên remote repository
git push -u origin LXH
```

---

## 🚀 2. TỔNG QUAN DỰ ÁN & MỤC TIÊU NÂNG CẤP

Dự án hiện tại là frontend của ứng dụng đặt xe điện đô thị xây dựng bằng **React 19 + TypeScript + Vite**. 

Mục tiêu tiếp theo là **chuyển đổi từ phiên bản nguyên mẫu giao diện sang một sản phẩm phần mềm thực tế hoàn chỉnh (Production-Ready Application)**, phục vụ triển khai vận hành thương mại.

### Tóm tắt các thay đổi cốt lõi:
1. **Đổi tên thương hiệu**: Toàn bộ ứng dụng đổi từ **GSM** $\to$ **QSM** (*Quick Smart Mobility*).
2. **Bỏ hoàn toàn AI Chatbot**: Gỡ bỏ trợ lý ảo, bong bóng chat, smart card AI và nút trò chuyện để tập trung 100% vào nghiệp vụ gọi xe trực quan, tiện lợi.
3. **Thực tế hóa 100% UI/UX**: Loại bỏ mọi nhãn `"demo"`, `"mô phỏng"`, `"thử nghiệm"`; chuẩn hóa các luồng nghiệp vụ thực tế.
4. **Hệ thống Tài khoản & Phân quyền**: Đăng nhập, Đăng ký, phân luồng **Người dùng (User)** và **Quản trị viên (Admin)**.
5. **Cổng Quản trị viên (Admin Portal)**: Tài khoản `admin` / `admin` để quản lý người dùng, quản lý đơn hàng thời gian thực.
6. **Xây dựng Hệ thống Backend hoàn chỉnh**: Bài hiện tại **hoàn toàn chưa có Backend** (chỉ có Frontend chạy mock service trong trình duyệt). Cần xây dựng Server (REST API / WebSocket) kết nối Database thật (PostgreSQL / MongoDB / MySQL).
7. **Tách cấu trúc thư mục rõ ràng (`frontend/` & `backend/`)**: Quy hoạch cấu trúc dự án chuẩn Monorepo, phân chia rành mạch giữa mã nguồn giao diện người dùng và máy chủ dịch vụ.
8. **Tích hợp Bản đồ số thực tế (Real Map Engine)**: Hướng dẫn kết nối Mapbox / Google Maps / Leaflet thay cho SVG giả lập.

---

## 📋 3. CHI TIẾT CÁC YÊU CẦU CẦN THỰC HIỆN

### 3.1. Rebranding: Chuyển đổi tên thương hiệu từ GSM $\to$ QSM
- **Phạm vi áp dụng**: Tất cả các màn hình, tiêu đề, logo, thông báo, nhãn, dữ liệu và văn bản.
- **Chi tiết thực hiện**:
  - Đổi tên ứng dụng thành **QSM** hoặc **QSM AI / QSM Mobility**.
  - Thiết kế lại biểu tượng logo tại `src/components/GsmLogo.tsx` thành `QsmLogo.tsx` (chữ **Q** cách điệu công nghệ, gradient xanh Cyan năng lượng).
  - Cập nhật title tag: `<title>QSM — Di chuyển thông minh & thuần điện</title>`.
  - Thay đổi tiền tố mã chuyến đi: `QSM-xxxxxx` (thay cho `GSM-xxxxxx`).
  - Các phân khúc dịch vụ:
    - **Green SM Bike** $\to$ **QSM Bike** (VinFast Feliz S / Evo 200).
    - **VinFast VF 5 Plus Taxi** $\to$ **QSM Car / QSM Taxi** (VinFast VF 5 Plus).
    - **Limo Green** $\to$ **QSM Luxury / QSM Limo** (VinFast VF 9).
  - Ưu đãi voucher: `GSMAI25` $\to$ `QSM2026` hoặc `QSMFIRST`.

---

### 3.2. Loại bỏ hoàn toàn tính năng AI Chatbot
- **Lý do**: Khách hàng cần thao tác đặt xe trực tiếp trên giao diện bản đồ nhanh chóng, không thông qua hội thoại chat bot.
- **Các thành phần cần gỡ bỏ**:
  - Thư mục `src/components/chat/` (`ChatAssistant.tsx`, `SmartCards.tsx`).
  - Nút bấm nổi mở chat (`.assistant-fab`, `.ask-trip-ai`).
  - Banner mời gọi trợ lý AI ở cuối trang chủ (`.assistant-invitation`).
  - Các state liên quan đến chat trong `RideProvider.tsx`: `chatOpen`, `setChatOpen`, `chatDraft`, `setChatDraft`.
- **Tái cấu trúc**: Các thao tác chọn điểm đón, điểm đến, chọn xe và thanh toán sẽ thao tác trực tiếp qua Modal hoặc Bottom Sheet bản đồ thuần túy.

---

### 3.3. Xóa bỏ nhãn "Demo/Mô phỏng" & Chuẩn hóa luồng thực tế (Production-Ready)
- **Rà soát và xóa sạch**:
  - Không còn chữ *"Chuyến đi mô phỏng"*, *"Thanh toán mô phỏng"*, *"Không phát sinh giao dịch"*, *"Chế độ demo"*, *"Tài xế mô phỏng"*.
  - Thay bằng các trạng thái thực tế:
    - *"Đã thanh toán thành công qua [Phương thức]"*.
    - *"Tài xế đang đến điểm đón"*.
    - *"Hành trình đang diễn ra"*.
    - *"Chuyến đi hoàn tất"*.
- **Đảm bảo tính logic của các chức năng**:
  - Nút **"Gọi tài xế"**: Khi bấm trên thiết bị di động, kích hoạt giao thức `tel:09xxxxxxxx` (hoặc mở giao diện gọi VoIP chuyên nghiệp nếu có backend).
  - Nút **"Nhắn tin"**: Chat 1-1 trực tiếp với tài xế (lưu tin nhắn vào state hoặc backend).
  - Nút **"Hủy chuyến"**: Chỉ cho phép hủy khi xe chưa đến hoặc có phí hủy chuyến theo đúng quy chế ứng dụng gọi xe.
  - Nút **"Đánh giá"**: Lưu nhận xét, số sao và gửi cảm ơn khách hàng.

---

### 3.4. Hệ thống Đăng nhập / Đăng ký & Phân quyền Người dùng (Auth & RBAC)

Cần xây dựng phân hệ xác thực hoàn chỉnh bao gồm màn hình và lưu trữ trạng thái người dùng (Local State / Context / Backend API):

```
                   ┌───────────────────────────────────┐
                   │    Màn hình Đăng nhập / Đăng ký   │
                   └─────────────────┬─────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    [Tài khoản Khách hàng]                      [Tài khoản Quản trị viên]
    - SĐT / Email người dùng                     - Tài khoản: admin
    - Tự động vào Giao diện Khách hàng           - Mật khẩu: admin
                                                 - Chuyển hướng vào: /admin
```

#### A. Màn hình Đăng ký / Đăng nhập (`/dang-nhap`, `/dang-ky`)
- Form nhập Số điện thoại / Email, Mật khẩu.
- Xác thực định dạng input, hiển thị thông báo lỗi rõ ràng.
- Ghi nhớ trạng thái đăng nhập qua `localStorage` / `sessionStorage`.

#### B. Phân luồng quyền (Role-Based Access Control):
1. **Khách hàng (`role = "user"`)**:
   - Truy cập giao diện hiện tại:
     - Trang chủ (`/`): Đặt xe, xem bục xoay 360°, thông số xe.
     - Chuyến đi (`/chuyen-di`): Bản đồ GPS, chọn lộ trình, theo dõi tài xế.
     - Lịch sử (`/lich-su`): Xem các chuyến đã đi, hóa đơn điện tử, đánh giá.
     - Tài khoản (`/tai-khoan`): Xem thông tin cá nhân, hạng hội viên, đổi mật khẩu, đăng xuất.
2. **Quản trị viên (`role = "admin"`)**:
   - **Tài khoản đăng nhập mặc định**:
     - **Tên đăng nhập (Username)**: `admin`
     - **Mật khẩu (Password)**: `admin`
   - Đăng nhập thành công sẽ tự động chuyển hướng đến route riêng: `/admin`.

---

### 3.5. Xây dựng Cổng Quản trị viên (Admin Portal — `/admin`)

Giao diện Quản trị viên phải **đồng bộ ngôn ngữ thiết kế Galaxy Cyber Cyan** với giao diện người dùng (hỗ trợ Dark Mode, viền laser, card glassmorphism, thống kê trực quan).

#### Các phân hệ chức năng Admin bắt buộc có:
1. **Bảng tổng quan (Dashboard Overview)**:
   - Thống kê tổng quan: Tổng doanh thu, Số chuyến hoàn thành, Số chuyến đang chạy, Số tài khoản đăng ký.
   - Biểu đồ trực quan hoặc thẻ tóm tắt doanh số theo ngày/tuần.
2. **Quản lý Tài khoản (User Management)**:
   - Danh sách toàn bộ tài khoản người dùng trong hệ thống (Họ tên, SĐT, Email, Hạng thành viên, Số chuyến đã đi, Trạng thái hoạt động).
   - Chức năng: Tìm kiếm tài khoản, xem chi tiết, khóa/kích hoạt tài khoản.
3. **Quản lý Chuyến xe (Trip / Order Management)**:
   - **Đơn đang tiến hành (Active Trips)**: Mã chuyến, Khách hàng, Tài xế tiếp nhận, Dòng xe, Điểm đón $\to$ Điểm đến, Cước phí, Trạng thái (Đang đón / Đang di chuyển).
   - **Đơn đã hoàn thành (Completed Trips)**: Lịch sử hoàn tất, thời gian, số km, đánh giá của khách hàng.
   - **Đơn đã hủy (Cancelled Trips)**: Lý do hủy, thời gian hủy, người hủy.
   - Khả năng lọc chuyến đi theo từng tài khoản người dùng cụ thể.
4. **Quản lý Đội xe & Tài xế (Fleet & Drivers)**:
   - Danh sách các xe QSM: VF 5, Limo Green, QSM Bike (Biển số xe, Mức pin, Trạng thái sẵn sàng/Đang chở khách).
   - Danh sách tài xế: Họ tên, Số điện thoại, Đánh giá sao, Số cuốc đã nhận.

---

## 🗂️ 4. KIẾN TRÚC TỔ CHỨC THƯ MỤC: PHÂN TÁCH RÕ RÀNG FRONTEND & BACKEND (MONOREPO)

> [!IMPORTANT]
> **YÊU CẦU CẤU TRÚC DỰ ÁN:**  
> Bài hiện tại **mới chỉ có mã nguồn Frontend** và chưa có Backend. Lập trình viên kế nhiệm **bắt buộc phải tái cấu trúc thư mục thành 2 folder riêng biệt**:
> - `frontend/`: Chứa toàn bộ giao diện người dùng React 19 + TypeScript + Vite hiện có.
> - `backend/`: Chứa toàn bộ máy chủ API, logic nghiệp vụ máy chủ, bảo mật và kết nối Cơ sở dữ liệu.

### 4.1. Sơ đồ cây thư mục tiêu chuẩn:

```
QSM/
├── frontend/                       # [FRONTEND] Ứng dụng giao diện khách hàng & quản trị viên
│   ├── public/                     # Tài nguyên tĩnh (ảnh xe sạch, logo, audio thông báo)
│   │   └── images/                 # bike-clean.png, vf5-clean.png, limo-clean.png, robot-clean.png
│   ├── src/                        # Mã nguồn React 19 + TypeScript
│   │   ├── components/             # QsmLogo, Mascot 3D, RealRouteMap, Modal, VehicleShowcase3D
│   │   ├── data/                   # Catalog xe, bảng giá tham chiếu, gợi ý lộ trình
│   │   ├── screens/                # Màn hình: Home, Trip, History, Account, Admin Dashboard
│   │   ├── services/               # API clients (kết nối sang Backend qua Axios / Fetch)
│   │   │   ├── api.ts              # Cấu hình Axios instance + BaseURL + JWT interceptor
│   │   │   ├── authService.ts      # Gọi API đăng nhập, đăng ký, đăng xuất
│   │   │   ├── tripService.ts      # Gọi API đặt xe, tính giá cước, lấy chuyến đi active
│   │   │   └── adminService.ts     # Gọi API thống kê dashboard, quản lý users/trips
│   │   ├── state/                  # State toàn cục (AuthProvider, RideProvider, ThemeContext)
│   │   ├── styles.css              # Reset & style nền tảng
│   │   ├── tech2026.css            # Design system Galaxy Cyber Cyan (Dark/Light mode)
│   │   ├── App.tsx                 # Routing hệ thống (User routes & Admin protected route)
│   │   └── main.tsx                # Điểm khởi chạy React
│   ├── index.html                  # File HTML chính (Title QSM 2026)
│   ├── package.json                # Thư viện phụ thuộc của Frontend
│   ├── tsconfig.json               # Cấu hình TypeScript Frontend
│   └── vite.config.ts              # Cấu hình Vite dev server & build
│
├── backend/                        # [BACKEND] Hệ thống Server API & Database (CẦN XÂY DỰNG MỚI)
│   ├── src/
│   │   ├── controllers/            # Xử lý Request/Response (auth, trips, users, admin, fleet)
│   │   ├── models/                 # Schemas & Entities ORM (User, Trip, Vehicle, Driver, Payment)
│   │   ├── routes/                 # Khai báo endpoints (/api/auth, /api/trips, /api/admin, ...)
│   │   ├── middlewares/            # JWT verification, Role guard (Admin/User), Error handler
│   │   ├── services/               # Nghiệp vụ: Thuật toán tính cước, phân bổ tài xế, mã hóa mật khẩu
│   │   ├── websocket/              # Socket.io gateway phát tọa độ xe và cập nhật trạng thái thời gian thực
│   │   └── server.ts (hoặc app.js) # Khởi tạo Server (Express / NestJS / FastAPI)
│   ├── database/                   # Kết nối cơ sở dữ liệu, Migration scripts & Seeds mẫu
│   │   ├── seed.ts                 # Tạo sẵn tài khoản Quản trị: admin / admin và đội xe mẫu
│   │   └── schema.sql              # DDL khởi tạo cấu trúc cơ sở dữ liệu
│   ├── .env.example                # Biến môi trường mẫu (PORT, DB_URI, JWT_SECRET, CLIENT_URL)
│   ├── package.json                # (Nếu dùng Node.js) hoặc requirements.txt (nếu dùng Python)
│   └── tsconfig.json               # Cấu hình TypeScript Backend
│
├── docker-compose.yml              # (Khuyến nghị) Khởi chạy 1 lệnh cả Frontend, Backend và Database
├── .gitignore                      # Bỏ qua node_modules, dist, .env ở cả 2 thư mục
└── README.md                       # Tài liệu tổng quan dự án & hướng dẫn chuyển giao
```

### 4.2. Hướng dẫn di chuyển mã nguồn hiện tại vào `frontend/`:
Để chuyển code hiện tại vào thư mục `frontend/` mà vẫn giữ nguyên lịch sử git trên nhánh `LXH`:
```bash
# 1. Đảm bảo đang ở nhánh LXH
git checkout LXH

# 2. Tạo thư mục frontend và backend
mkdir frontend backend

# 3. Di chuyển các thư mục & tệp mã nguồn vào frontend/
# (Trên Windows PowerShell):
Move-Item -Path src, public, tests, reference, index.html, vite.config.ts, tsconfig.json, tsconfig.app.json, eslint.config.js, package.json, package-lock.json -Destination frontend/

# 4. Kiểm tra trạng thái và commit
git status
git add .
git commit -m "refactor(structure): re-organize project into frontend and backend directories"
```

---

## ⚙️ 5. ĐẶC TẢ YÊU CẦU PHÁT TRIỂN HỆ THỐNG BACKEND (SERVER & DATABASE)

> [!WARNING]
> **TÌNH TRẠNG HIỆN TẠI:**  
> Dự án hiện tại **hoàn toàn chưa có Backend**. Toàn bộ dữ liệu hiển thị (danh mục xe, tài xế, ước tính giá, lịch sử chuyến đi) đang chạy bằng mock data trong file `src/data/catalog.ts` và lưu tạm trong RAM/state React.  
> Lập trình viên kế nhiệm **bắt buộc phải xây dựng hoàn chỉnh phần Backend** để dự án có thể vận hành thực tế.

### 5.1. Công nghệ đề xuất cho Backend (Lựa chọn 1 trong các stack sau):
- **Lựa chọn 1 (Khuyến nghị cao nhất)**: **Node.js + Express / NestJS (TypeScript)**
  - Đồng bộ ngôn ngữ TypeScript từ Frontend đến Backend.
  - Sử dụng **Prisma ORM** hoặc **TypeORM** hoặc **Mongoose**.
  - Dễ dàng tích hợp **Socket.io** cho tính năng định vị xe real-time.
- **Lựa chọn 2**: **Python (FastAPI)**
  - Viết API cực nhanh, tự động sinh tài liệu Swagger/OpenAPI tại `/docs`.
  - Hiệu năng xử lý cao, dễ tích hợp các thuật toán tối ưu hóa đường đi và định giá cước linh hoạt.
- **Lựa chọn 3**: **Java Spring Boot / Go Fiber** (cho môi trường doanh nghiệp tải cao).

### 5.2. Cơ sở dữ liệu (Database Design):
Sử dụng **PostgreSQL** (khuyến nghị cho hệ thống địa lý với PostGIS), **MySQL**, hoặc **MongoDB**.

Cần thiết kế tối thiểu các bảng/collection sau:
1. **`users`**:
   - `id`, `name`, `phone`, `email`, `password_hash`, `role` (`"user"` | `"admin"`), `membership_tier` (`"standard"` | `"gold"` | `"platinum"`), `avatar_url`, `is_active`, `created_at`.
   - **Tài khoản mặc định bắt buộc seed sẵn**:
     - Username: `admin` | Password: `admin` | Role: `admin`.
2. **`vehicles`**:
   - `id`, `model_name` (VinFast VF 5, VinFast VF 9, Xe máy điện Feliz S), `license_plate`, `type` (`"car"` | `"bike"` | `"luxury"`), `battery_percentage`, `status` (`"ready"` | `"on_trip"` | `"charging"` | `"maintenance"`).
3. **`drivers`**:
   - `id`, `vehicle_id`, `full_name`, `phone`, `rating` (ví dụ: 4.95), `total_trips`, `current_lat`, `current_lng`, `status` (`"available"` | `"busy"` | `"offline"`).
4. **`trips`**:
   - `id`, `trip_code` (`QSM-xxxxxx`), `user_id`, `driver_id`, `vehicle_type`, `pickup_address`, `pickup_coords` (lat, lng), `dest_address`, `dest_coords` (lat, lng), `fare_amount`, `discount_amount`, `final_amount`, `payment_method` (`"cash"` | `"vnpay"` | `"momo"` | `"card"`), `status` (`"PENDING"` | `"PICKING_UP"` | `"IN_TRANSIT"` | `"COMPLETED"` | `"CANCELLED"`), `cancel_reason`, `rating_stars`, `feedback_note`, `created_at`, `completed_at`.

### 5.3. Danh sách các RESTful API bắt buộc:

#### A. Phân hệ Xác thực & Người dùng (`/api/auth`, `/api/users`)
- `POST /api/auth/register`: Đăng ký tài khoản khách hàng mới (kiểm tra trùng SĐT/email, mã hóa mật khẩu bằng bcrypt).
- `POST /api/auth/login`: Đăng nhập bằng SĐT/Email hoặc `admin` / `admin`. Trả về JWT Access Token & thông tin tài khoản.
- `GET /api/auth/me`: Xác thực JWT Token và trả về thông tin người dùng đang đăng nhập.
- `PUT /api/users/profile`: Cập nhật thông tin cá nhân của người dùng.

#### B. Phân hệ Đặt xe & Chuyến đi (`/api/trips`)
- `POST /api/trips/estimate`: Tính cước phí thực tế dựa trên khoảng cách (km) và dòng xe chọn (`bike`: 12.000đ/km, `car`: 21.000đ/km, `luxury`: 35.000đ/km).
- `POST /api/trips/book`: Tạo cuốc xe mới $\to$ tìm tài xế gần nhất $\to$ chuyển trạng thái sang tiếp nhận.
- `GET /api/trips/active`: Lấy chuyến xe đang diễn ra của người dùng (nếu có).
- `GET /api/trips/history`: Lấy lịch sử chuyến đi của tài khoản đang đăng nhập (hỗ trợ phân trang).
- `PUT /api/trips/:id/cancel`: Khách hàng hoặc tài xế hủy chuyến (kèm lý do).
- `POST /api/trips/:id/rate`: Khách hàng đánh giá sao và gửi nhận xét sau khi cuốc xe hoàn tất.

#### C. Phân hệ Quản trị viên (`/api/admin`) — Bảo vệ bằng Middleware `requireAdmin`
- `GET /api/admin/stats`: Trả về dữ liệu thống kê bảng điều khiển:
  - Tổng doanh thu (VNĐ).
  - Tổng số chuyến đi (chia theo: đang chạy, hoàn tất, đã hủy).
  - Tổng số tài khoản khách hàng đăng ký.
- `GET /api/admin/users`: Danh sách toàn bộ tài khoản người dùng, hỗ trợ tìm kiếm theo tên/SĐT và phân trang.
- `PUT /api/admin/users/:id/status`: Khóa hoặc kích hoạt lại tài khoản người dùng.
- `GET /api/admin/trips`: Danh sách toàn bộ các chuyến đi trong hệ thống, lọc theo trạng thái (`active`, `completed`, `cancelled`) hoặc lọc theo `userId`.
- `GET /api/admin/fleet`: Xem danh sách toàn bộ đội xe và tài xế trong hệ thống (vị trí, mức pin, trạng thái).

#### D. Phân hệ Thời gian thực (Real-time WebSocket / Socket.io)
- Sự kiện `driver:location_update`: Tài xế truyền tọa độ GPS mới $\to$ Server gửi trực tiếp tới màn hình khách hàng để hiển thị xe di chuyển trên bản đồ.
- Sự kiện `trip:status_change`: Phát thông báo cập nhật trạng thái cuốc xe (Đã nhận cuốc $\to$ Tài xế đã đến $\to$ Bắt đầu chuyến đi $\to$ Hoàn tất).

---

## 🗺️ 6. HƯỚNG DẪN KỸ THUẬT: TÍCH HỢP BẢN ĐỒ THỰC TẾ (REAL MAP INTEGRATION)

Hiện tại, bản đồ trong `src/components/RouteMap.tsx` đang vẽ bằng SVG minh họa vector nội bộ. Lập trình viên kế nhiệm cần tích hợp bản đồ địa lý thực tế theo hướng dẫn dưới đây:

### 6.1. Lựa chọn thư viện bản đồ (Khuyến nghị)
- **Lựa chọn 1 (Tối ưu nhất - Đẹp và mượt)**: **Mapbox GL JS** (`mapbox-gl` & `@types/mapbox-gl`)
  - Hỗ trợ Dark Mode vector map tuyệt đẹp, xoay 3D, camera chuyển động mượt mà.
  - Cung cấp sẵn Geocoding API (tìm địa điểm) và Directions API (tìm lộ trình thực tế).
- **Lựa chọn 2 (Phổ biến tại Việt Nam)**: **Leaflet + OpenStreetMap** (`leaflet` & `react-leaflet`)
  - Miễn phí 100%, không yêu cầu thẻ tín dụng, nhẹ và dễ cài đặt.
  - Kết hợp với OSRM (Open Source Routing Machine) để vẽ đường đi thực.
- **Lựa chọn 3**: **Google Maps JavaScript API** (`@react-google-maps/api`)
  - Dữ liệu địa chỉ tại Việt Nam chính xác nhất, có tính năng giao thông thực tế.

---

### 6.2. Kiến trúc các bước triển khai tích hợp Map

#### Bước 1: Cài đặt thư viện (Ví dụ với Mapbox)
```bash
npm install mapbox-gl
npm install -D @types/mapbox-gl
```
Thêm CSS Mapbox vào `index.html` hoặc `src/main.tsx`:
```html
<link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
```

#### Bước 2: Khởi tạo Component Bản đồ thật (`src/components/RealRouteMap.tsx`)
```tsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

// Lấy Access Token miễn phí từ https://account.mapbox.com/
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "YOUR_MAPBOX_PUBLIC_TOKEN";

interface RealRouteMapProps {
  pickupCoords: [number, number];       // [kinh độ, vĩ độ] ví dụ: [105.932, 20.995]
  destCoords: [number, number];         // [kinh độ, vĩ độ] ví dụ: [105.867, 20.997]
  driverCoords?: [number, number];      // Vị trí tài xế thời gian thực
  isDarkMode?: boolean;
}

export default function RealRouteMap({
  pickupCoords,
  destCoords,
  driverCoords,
  isDarkMode = true,
}: RealRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Chọn style Dark hoặc Navigation theo theme của QSM
    const mapStyle = isDarkMode
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: pickupCoords,
      zoom: 13,
      pitch: 45, // Tạo góc nghiêng 3D hiện đại
    });

    // Marker điểm đón (Icon xanh Cyan)
    new mapboxgl.Marker({ color: "#00f5d4" })
      .setLngLat(pickupCoords)
      .setPopup(new mapboxgl.Popup().setText("Điểm đón của bạn"))
      .addTo(map.current);

    // Marker điểm đến (Icon xanh ngọc)
    new mapboxgl.Marker({ color: "#10b981" })
      .setLngLat(destCoords)
      .setPopup(new mapboxgl.Popup().setText("Điểm đến"))
      .addTo(map.current);

    return () => map.current?.remove();
  }, [isDarkMode]);

  return <div ref={mapContainer} className="real-map-container" style={{ width: "100%", height: "100%" }} />;
}
```

#### Bước 3: Lấy lộ trình đường đi thực tế từ Directions API
Gọi API tìm tuyến đường thực tế qua mạng lưới giao thông đường bộ:
```ts
async function fetchRealRoute(pickup: [number, number], dest: [number, number]) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup[0]},${pickup[1]};${dest[0]},${dest[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
  );
  const json = await query.json();
  const data = json.routes[0];
  const routeGeometry = data.geometry; // GeoJSON để vẽ line lên bản đồ
  const distanceKm = (data.distance / 1000).toFixed(1);
  const durationMins = Math.round(data.duration / 60);

  return { routeGeometry, distanceKm, durationMins };
}
```

#### Bước 4: Tích hợp GPS thiết bị người dùng thật
Sử dụng API chuẩn của trình duyệt để tự động lấy tọa độ thực tế của người dùng:
```ts
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    // Cập nhật điểm đón tự động theo vị trí người dùng
  },
  (err) => console.warn("Không lấy được GPS, dùng vị trí mặc định", err),
  { enableHighAccuracy: true }
);
```

## 🛠️ 7. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG (DEVELOPMENT & BUILD)

### 7.1. Chạy mã nguồn Frontend:
```bash
# Di chuyển vào thư mục frontend (hoặc thư mục gốc nếu chưa di chuyển)
cd frontend

# Cài đặt các gói phụ thuộc
npm install

# Khởi động máy chủ phát triển (Local dev server trên http://localhost:5173)
npm run dev

# Kiểm tra lỗi biên dịch TypeScript (Bắt buộc chạy trước khi commit)
npx tsc --noEmit

# Chạy unit tests
npm test

# Đóng gói sản phẩm hoàn chỉnh (Production Build)
npm run build
```

### 7.2. Chạy máy chủ Backend (Khi đã khởi tạo):
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt phụ thuộc Backend
npm install # hoặc pip install -r requirements.txt (nếu dùng Python)

# Khởi động dịch vụ phát triển Backend (Cổng http://localhost:5000 hoặc 8000)
npm run dev # hoặc uvicorn main:app --reload

# Chạy migrate cơ sở dữ liệu & seed tài khoản admin/admin
npm run db:migrate
npm run db:seed
```

---

## ✅ 8. DANH SÁCH CÔNG VIỆC ƯU TIÊN (DEVELOPER ACTION CHECKLIST)

| Thứ tự | Hạng mục | Chi tiết thực hiện | Mức độ |
| :---: | :--- | :--- | :---: |
| **1** | **Git Setup** | Làm việc trên nhánh `LXH`. Cam kết không push đè lên `main`. | 🔴 Bắt buộc |
| **2** | **Cấu trúc Monorepo** | Tách mã nguồn rõ ràng thành 2 thư mục `frontend/` và `backend/`. | 🔴 Bắt buộc |
| **3** | **Rebrand QSM** | Đổi toàn bộ tên, logo, typography từ `GSM` $\to$ `QSM`. | 🔴 Bắt buộc |
| **4** | **Gỡ bỏ AI Chatbot** | Xóa sạch ChatAssistant, smart cards, icon chat, các state dư thừa. | 🔴 Bắt buộc |
| **5** | **Xóa nhãn Demo/Test** | Chuẩn hóa toàn bộ text sang nghiệp vụ thực tế, chạy đúng luồng. | 🔴 Bắt buộc |
| **6** | **Xây dựng Backend & DB** | Lập trình API Server (Auth, Trips, Users, Admin), kết nối Database, seed `admin`/`admin`. | 🔴 Bắt buộc |
| **7** | **Auth & Phân quyền** | Tích hợp Đăng nhập / Đăng ký qua JWT API, phân luồng Người dùng & Admin. | 🟡 Quan trọng |
| **8** | **Trang Admin (`/admin`)** | Xây dựng Dashboard, quản lý tài khoản, quản lý đơn hàng active/completed. | 🟡 Quan trọng |
| **9** | **Bản đồ thật** | Cài đặt Mapbox/Leaflet, GPS thiết bị, vẽ đường thực tế qua Directions API. | 🟢 Tiếp theo |

---

> 💡 **Lưu ý dành cho Developer kế nhiệm:**  
> Hệ thống thiết kế CSS tại [tech2026.css](file:///c:/Users/PC/gsm-ai/src/tech2026.css) đã được tối ưu hoàn hảo với bảng màu **Galaxy Cyber Cyan** và hỗ trợ Dark/Light Mode bằng biến CSS tokens (`[data-theme="dark"]` / `[data-theme="light"]`). Khi xây dựng các màn hình mới (Login, Register, Admin Portal), hãy tái sử dụng các biến tokens và class có sẵn (`.button.primary`, `.button.secondary`, `var(--bg-card)`, `var(--brand)`, `var(--line-color)`) để đảm bảo toàn bộ hệ thống đạt độ thẩm mỹ cao nhất và đồng nhất 100%.
