export type VehicleId = "bike" | "vf5" | "limo";

export interface Vehicle {
  id: VehicleId;
  name: string;
  realModelName: string;
  label: string;
  capacity: number;
  eta: number;
  fare: number;
  ratePerKm: number;
  image: string;
  battery: string;
  range: string;
  co2Saving: string;
  power: string;
  tagline: string;
  description: string;
  benefit: string;
  modelUrl?: string;
  modelScale?: number;
}

export const vehicles: Vehicle[] = [
  {
    id: "bike",
    name: "QSM Bike",
    realModelName: "VinFast Feliz S / Evo 200",
    label: "Nhanh & tiết kiệm",
    capacity: 1,
    eta: 2,
    fare: 72000,
    ratePerKm: 12000,
    image: "/images/bike-clean.png",
    battery: "Pin LFP 3.5 kWh",
    range: "205 km / lần sạc",
    co2Saving: "-0.09 kg CO₂/km",
    power: "3.0 kW · 78 km/h",
    tagline: "Lướt êm ái, đón nhanh mọi con phố",
    description:
      "Xe máy điện VinFast chính hãng của QSM, lướt êm ái trên từng con phố, không tiếng ồn, không khói bụi.",
    benefit: "Một mình đi làm · Di chuyển nhanh giờ cao điểm",
  },
  {
    id: "vf5",
    name: "QSM Taxi",
    realModelName: "VinFast VF 5 Plus",
    label: "Phổ biến & Êm ái",
    capacity: 4,
    eta: 3,
    fare: 128000,
    ratePerKm: 21000,
    image: "/images/vf5-clean.png",
    battery: "Pin Ternary 37.23 kWh",
    range: "326 km / lần sạc",
    co2Saving: "-0.24 kg CO₂/km",
    power: "134 HP · Tăng tốc mượt mà",
    tagline: "Taxi điện thông minh, mát lành & chuẩn mực",
    description:
      "Êm ái, mát lành, không mùi xăng. Không gian cabin riêng tư hiện đại cho mọi chặng đường hàng ngày cùng QSM.",
    benefit: "Đi làm · Gặp gỡ đối tác · Di chuyển mỗi ngày",
  },
  {
    id: "limo",
    name: "QSM Luxury",
    realModelName: "VinFast VF 9 Luxury SUV",
    label: "Đẳng cấp thương gia",
    capacity: 6,
    eta: 5,
    fare: 185000,
    ratePerKm: 35000,
    image: "/images/limo-clean.png",
    battery: "Pin CATL 123 kWh",
    range: "580 km / lần sạc",
    co2Saving: "-0.38 kg CO₂/km",
    power: "402 HP · Ghế cơ trưởng massage",
    tagline: "SUV thuần điện 7 chỗ hạng thương gia",
    description:
      "Khoang ghế cơ trưởng massage cao cấp, cách âm tĩnh lặng đỉnh cao, rộng rãi vượt trội cho cả gia đình & đón tiễn VIP.",
    benefit: "Gia đình · Tiếp khách VIP · Đón tiễn sân bay",
  },
];

export const money = (v: number) =>
  new Intl.NumberFormat("vi-VN").format(v) + "đ";

export const vehicleById = (id: VehicleId) =>
  vehicles.find((v) => v.id === id) || vehicles[1];

export type PlaceCategory =
  | "Khu đô thị"
  | "TT Thương mại"
  | "Sân bay & Bến xe"
  | "Trường & Bệnh viện"
  | "Điểm trung tâm";

export interface Place {
  name: string;
  address: string;
  coords: [number, number]; // [lng, lat]
  category?: PlaceCategory;
}

export interface Route {
  pickup: Place;
  destination: Place;
  distance: number;
  duration: number;
}

export const locationDirectory: Place[] = [
  {
    name: "VinUniversity",
    address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội",
    coords: [105.9445, 20.9905],
    category: "Trường & Bệnh viện",
  },
  {
    name: "Times City",
    address: "458 Minh Khai, Hai Bà Trưng, Hà Nội",
    coords: [105.8685, 20.9962],
    category: "Khu đô thị",
  },
  {
    name: "Vinhomes Royal City",
    address: "72A Nguyễn Trãi, Thanh Xuân, Hà Nội",
    coords: [105.8155, 21.0025],
    category: "Khu đô thị",
  },
  {
    name: "Vinhomes Smart City",
    address: "Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội",
    coords: [105.7418, 21.0052],
    category: "Khu đô thị",
  },
  {
    name: "Highlands Bà Triệu",
    address: "127 Bà Triệu, Hai Bà Trưng, Hà Nội",
    coords: [105.8492, 21.0124],
    category: "Điểm trung tâm",
  },
  {
    name: "Hồ Hoàn Kiếm (Phố đi bộ)",
    address: "Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
    coords: [105.8525, 21.0285],
    category: "Điểm trung tâm",
  },
  {
    name: "Nhà Hát Lớn Hà Nội",
    address: "Số 1 Tràng Tiền, Hoàn Kiếm, Hà Nội",
    coords: [105.8577, 21.0244],
    category: "Điểm trung tâm",
  },
  {
    name: "Vincom Center Metropolis",
    address: "29 Liễu Giai, Ba Đình, Hà Nội",
    coords: [105.8141, 21.0318],
    category: "TT Thương mại",
  },
  {
    name: "Lotte Mall West Lake",
    address: "272 Võ Chí Công, Tây Hồ, Hà Nội",
    coords: [105.8091, 21.0764],
    category: "TT Thương mại",
  },
  {
    name: "Aeon Mall Long Biên",
    address: "27 Cổ Linh, Long Biên, Hà Nội",
    coords: [105.9012, 21.0268],
    category: "TT Thương mại",
  },
  {
    name: "Keangnam Landmark 72",
    address: "Phạm Hùng, Nam Từ Liêm, Hà Nội",
    coords: [105.7841, 21.0168],
    category: "Điểm trung tâm",
  },
  {
    name: "Sân bay Nội Bài (Ga T1/T2)",
    address: "Phú Minh, Sóc Sơn, Hà Nội",
    coords: [105.8042, 21.2187],
    category: "Sân bay & Bến xe",
  },
  {
    name: "Ga Hà Nội",
    address: "120 Lê Duẩn, Đống Đa, Hà Nội",
    coords: [105.8411, 21.0242],
    category: "Sân bay & Bến xe",
  },
  {
    name: "Bến xe Mỹ Đình",
    address: "20 Phạm Hùng, Mỹ Đình, Nam Từ Liêm, Hà Nội",
    coords: [105.7785, 21.0288],
    category: "Sân bay & Bến xe",
  },
  {
    name: "Đại học Bách Khoa Hà Nội",
    address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
    coords: [105.8431, 21.0051],
    category: "Trường & Bệnh viện",
  },
  {
    name: "Bệnh viện Đa khoa Quốc tế Vinmec",
    address: "458 Minh Khai, Hai Bà Trưng, Hà Nội",
    coords: [105.8698, 20.9972],
    category: "Trường & Bệnh viện",
  },
];

export function computeRouteFromPlaces(pickup: Place, destination: Place): Route {
  const [lng1, lat1] = pickup.coords;
  const [lng2, lat2] = destination.coords;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadDist = Math.max(1.2, Number((R * c * 1.28).toFixed(1)));
  const duration = Math.max(4, Math.round(roadDist * 1.9 + 2));

  return {
    pickup,
    destination,
    distance: roadDist,
    duration,
  };
}

export function calculateVehicleFare(
  vehicleId: VehicleId,
  distanceKm: number,
): number {
  const v = vehicleById(vehicleId);
  const minFare =
    vehicleId === "bike" ? 25000 : vehicleId === "vf5" ? 45000 : 85000;
  const raw = Math.round((Math.max(1, distanceKm) * v.ratePerKm) / 1000) * 1000;
  return Math.max(minFare, raw);
}

export const defaultRoute: Route = {
  pickup: locationDirectory[0],
  destination: locationDirectory[1],
  distance: 11.5,
  duration: 22,
};

export const popularRoutes: Route[] = [
  defaultRoute,
  {
    pickup: locationDirectory[0],
    destination: locationDirectory[4],
    distance: 7.2,
    duration: 18,
  },
  {
    pickup: locationDirectory[0],
    destination: locationDirectory[11],
    distance: 34.0,
    duration: 38,
  },
  {
    pickup: locationDirectory[0],
    destination: locationDirectory[7],
    distance: 14.2,
    duration: 26,
  },
];

export const driver = {
  name: "Nguyễn Minh Nam",
  phone: "0988668892",
  rating: "4,95",
  plate: "29A–886.92",
  trips: "1.240",
};

export interface HistoryTrip {
  id: string;
  userId?: string;
  group: string;
  time: string;
  route: Route;
  vehicle: VehicleId;
  fare: number;
  status: "completed" | "cancelled";
  paymentMethod?: string;
  ratingStars?: number;
  feedbackNote?: string;
  cancelReason?: string;
}

// Khởi tạo rỗng — lịch sử chuyến đi được lưu riêng biệt cho từng tài khoản người dùng
export const historySeed: HistoryTrip[] = [];
