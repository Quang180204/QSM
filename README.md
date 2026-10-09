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
6. **Tích hợp Bản đồ số thực tế (Real Map Engine)**: Hướng dẫn kết nối Mapbox / Google Maps / Leaflet thay cho SVG giả lập.

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

## 🗺️ 4. HƯỚNG DẪN KỸ THUẬT: TÍCH HỢP BẢN ĐỒ THỰC TẾ (REAL MAP INTEGRATION)

Hiện tại, bản đồ trong `src/components/RouteMap.tsx` đang vẽ bằng SVG minh họa vector nội bộ. Lập trình viên kế nhiệm cần tích hợp bản đồ địa lý thực tế theo hướng dẫn dưới đây:

### 4.1. Lựa chọn thư viện bản đồ (Khuyến nghị)
- **Lựa chọn 1 (Tối ưu nhất - Đẹp và mượt)**: **Mapbox GL JS** (`mapbox-gl` & `@types/mapbox-gl`)
  - Hỗ trợ Dark Mode vector map tuyệt đẹp, xoay 3D, camera chuyển động mượt mà.
  - Cung cấp sẵn Geocoding API (tìm địa điểm) và Directions API (tìm lộ trình thực tế).
- **Lựa chọn 2 (Phổ biến tại Việt Nam)**: **Leaflet + OpenStreetMap** (`leaflet` & `react-leaflet`)
  - Miễn phí 100%, không yêu cầu thẻ tín dụng, nhẹ và dễ cài đặt.
  - Kết hợp với OSRM (Open Source Routing Machine) để vẽ đường đi thực.
- **Lựa chọn 3**: **Google Maps JavaScript API** (`@react-google-maps/api`)
  - Dữ liệu địa chỉ tại Việt Nam chính xác nhất, có tính năng giao thông thực tế.

---

### 4.2. Kiến trúc các bước triển khai tích hợp Map

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

---

## 💻 5. CẤU TRÚC THƯ MỤC DỰ ÁN HIỆN TẠI

```
gsm-ai/
├── public/
│   └── images/               # Hình ảnh xe sạch tách nền (bike-clean, vf5-clean, limo-clean, robot-clean)
├── src/
│   ├── components/           # Components dùng chung
│   │   ├── GsmLogo.tsx       # Logo thương hiệu (Cần đổi thành QsmLogo)
│   │   ├── Mascot.tsx        # Linh vật Robot 3D
│   │   ├── Modal.tsx         # Hộp thoại modal dùng chung
│   │   ├── RouteMap.tsx      # Bản đồ mô phỏng hiện tại (Cần nâng cấp thành RealRouteMap)
│   │   └── VehicleShowcase3D.tsx # Bục xe tự động xoay 360 độ công nghệ cao
│   ├── data/
│   │   └── catalog.ts        # Dữ liệu phương tiện, tài xế, lộ trình
│   ├── screens/              # Các màn hình chính của ứng dụng
│   │   ├── Home.tsx          # Trang chủ người dùng
│   │   ├── Trip.tsx          # Màn hình đặt xe & theo dõi chuyến đi (Dạng mở)
│   │   ├── History.tsx       # Màn hình Lịch sử chuyến đi & Báo cáo Carbon
│   │   ├── Account.tsx       # Màn hình Tài khoản & Cài đặt
│   │   └── [Admin]/          # (CẦN TẠO MỚI) Thư mục chứa các màn hình Admin
│   ├── services/             # Mock services (maps, fare, ride, trip)
│   ├── state/                # Quản lý state toàn cục (RideProvider, ThemeContext, rideMachine)
│   ├── styles.css            # CSS cốt lõi của giao diện
│   ├── tech2026.css          # Hệ thống thiết kế Galaxy Cyber Cyan 2026 (Dark/Light mode)
│   ├── App.tsx               # Routing, bottom navigation
│   └── main.tsx              # Điểm khởi động ứng dụng
├── package.json              # Quản lý thư viện phụ thuộc
├── tsconfig.json             # Cấu hình TypeScript
└── vite.config.ts            # Cấu hình Vite
```

---

## 🛠️ 6. LỆNH KHỞI CHẠY & KIỂM TRA MÃ NGUỒN

```bash
# Cài đặt thư viện
npm install

# Chạy server phát triển (Local dev server trên http://localhost:5173)
npm run dev

# Kiểm tra lỗi biên dịch TypeScript (Bắt buộc chạy trước khi commit)
npx tsc --noEmit

# Chạy unit tests
npm test

# Đóng gói sản phẩm hoàn chỉnh (Production Build)
npm run build
```

---

## ✅ 7. DANH SÁCH CÔNG VIỆC ƯU TIÊN (DEVELOPER ACTION CHECKLIST)

| Thứ tự | Hạng mục | Chi tiết thực hiện | Mức độ |
| :---: | :--- | :--- | :---: |
| **1** | **Git Setup** | Tạo nhánh `LXH` từ `main`. Cam kết không push đè lên `main`. | 🔴 Bắt buộc |
| **2** | **Rebrand QSM** | Đổi toàn bộ tên, logo, typography từ `GSM` $\to$ `QSM`. | 🔴 Bắt buộc |
| **3** | **Gỡ bỏ AI Chatbot** | Xóa sạch ChatAssistant, smart cards, icon chat, các state dư thừa. | 🔴 Bắt buộc |
| **4** | **Xóa nhãn Demo/Test** | Chuẩn hóa toàn bộ text sang nghiệp vụ thực tế, chạy đúng luồng. | 🔴 Bắt buộc |
| **5** | **Auth & Phân quyền** | Xây dựng Đăng nhập / Đăng ký, phân quyền Người dùng & Admin. | 🟡 Quan trọng |
| **6** | **Trang Admin (`/admin`)** | Xây dựng Dashboard, quản lý tài khoản (`admin`/`admin`), quản lý đơn hàng. | 🟡 Quan trọng |
| **7** | **Bản đồ thật** | Cài đặt Mapbox/Leaflet, tích hợp Geocoding & Directions API. | 🟢 Tiếp theo |

---

> 💡 **Lưu ý dành cho Developer kế nhiệm:**  
> Hệ thống thiết kế CSS tại [tech2026.css](file:///c:/Users/PC/gsm-ai/src/tech2026.css) đã được tối ưu hoàn hảo với bảng màu **Galaxy Cyber Cyan** và hỗ trợ Dark/Light Mode bằng biến CSS tokens (`[data-theme="dark"]` / `[data-theme="light"]`). Khi xây dựng các màn hình mới (Login, Register, Admin Portal), hãy tái sử dụng các biến tokens và class có sẵn (`.button.primary`, `.button.secondary`, `var(--bg-card)`, `var(--brand)`, `var(--line-color)`) để đảm bảo toàn bộ hệ thống đạt độ thẩm mỹ cao nhất và đồng nhất 100%.
