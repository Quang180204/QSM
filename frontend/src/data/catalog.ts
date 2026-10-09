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

export interface Place {
  name: string;
  address: string;
  coords: [number, number]; // [lng, lat]
}

export interface Route {
  pickup: Place;
  destination: Place;
  distance: number;
  duration: number;
}

export const defaultRoute: Route = {
  pickup: {
    name: "VinUniversity",
    address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội",
    coords: [105.9445, 20.9905],
  },
  destination: {
    name: "Times City",
    address: "458 Minh Khai, Hai Bà Trưng, Hà Nội",
    coords: [105.8685, 20.9962],
  },
  distance: 11.5,
  duration: 22,
};

export const popularRoutes: Route[] = [
  {
    pickup: {
      name: "VinUniversity",
      address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội",
      coords: [105.9445, 20.9905],
    },
    destination: {
      name: "Times City",
      address: "458 Minh Khai, Hai Bà Trưng, Hà Nội",
      coords: [105.8685, 20.9962],
    },
    distance: 11.5,
    duration: 22,
  },
  {
    pickup: {
      name: "VinUniversity",
      address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội",
      coords: [105.9445, 20.9905],
    },
    destination: {
      name: "Highlands Bà Triệu",
      address: "127 Bà Triệu, Hai Bà Trưng, Hà Nội",
      coords: [105.8492, 21.0124],
    },
    distance: 7.2,
    duration: 18,
  },
  {
    pickup: {
      name: "VinUniversity",
      address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội",
      coords: [105.9445, 20.9905],
    },
    destination: {
      name: "Sân bay Nội Bài",
      address: "Nhà ga T1/T2, Sóc Sơn, Hà Nội",
      coords: [105.8042, 21.2187],
    },
    distance: 34.0,
    duration: 38,
  },
  {
    pickup: {
      name: "VinUniversity",
      address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội",
      coords: [105.9445, 20.9905],
    },
    destination: {
      name: "Vincom Metropolis",
      address: "29 Liễu Giai, Ba Đình, Hà Nội",
      coords: [105.8141, 21.0318],
    },
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
