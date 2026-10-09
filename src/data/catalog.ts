export type VehicleId = "bike" | "vf5" | "limo";
export interface Vehicle {
  id: VehicleId;
  name: string;
  realModelName: string;
  label: string;
  capacity: number;
  eta: number;
  fare: number;
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
    name: "Green SM Bike",
    realModelName: "VinFast Feliz S / Evo 200",
    label: "Nhanh & tiết kiệm",
    capacity: 1,
    eta: 2,
    fare: 72000,
    image: "/images/bike-clean.png",
    battery: "Pin LFP 3.5 kWh",
    range: "205 km / lần sạc",
    co2Saving: "-0.09 kg CO₂/km",
    power: "3.0 kW · 78 km/h",
    tagline: "Lướt êm ái, đón nhanh mọi con phố",
    description: "Xe máy điện VinFast chính hãng, lướt êm ái trên từng con phố, không tiếng ồn, không khói bụi.",
    benefit: "Một mình đi làm · Di chuyển nhanh giờ cao điểm",
  },
  {
    id: "vf5",
    name: "VinFast VF 5 Plus",
    realModelName: "VinFast VF 5 Plus Taxi Xanh",
    label: "Phổ biến & Êm ái",
    capacity: 4,
    eta: 3,
    fare: 128000,
    image: "/images/vf5-clean.png",
    battery: "Pin Ternary 37.23 kWh",
    range: "326 km / lần sạc",
    co2Saving: "-0.24 kg CO₂/km",
    power: "134 HP · Tăng tốc mượt mà",
    tagline: "Xe điện quốc dân, mát lành & thông minh",
    description: "Êm ái, mát lành, không mùi xăng. Không gian cabin riêng tư hiện đại cho mọi chặng đường hàng ngày.",
    benefit: "Đi làm · Gặp gỡ đối tác · Di chuyển mỗi ngày",
  },
  {
    id: "limo",
    name: "Limo Green",
    realModelName: "VinFast VF 9 Luxury SUV",
    label: "Đẳng cấp thương gia",
    capacity: 6,
    eta: 5,
    fare: 185000,
    image: "/images/limo-clean.png",
    battery: "Pin CATL 123 kWh",
    range: "580 km / lần sạc",
    co2Saving: "-0.38 kg CO₂/km",
    power: "402 HP · Ghế cơ trưởng massage",
    tagline: "SUV thuần điện 7 chỗ hạng thương gia",
    description: "Khoang ghế cơ trưởng massage cao cấp, cách âm tĩnh lặng đỉnh cao, rộng rãi vượt trội cho cả gia đình & đón tiễn VIP.",
    benefit: "Gia đình · Tiếp khách VIP · Đón tiễn sân bay",
  },
];
export const money = (v: number) =>
  new Intl.NumberFormat("vi-VN").format(v) + "đ";
export const vehicleById = (id: VehicleId) =>
  vehicles.find((v) => v.id === id)!;
export interface Place {
  name: string;
  address: string;
}
export interface Route {
  pickup: Place;
  destination: Place;
  distance: number;
  duration: number;
}
export const defaultRoute: Route = {
  pickup: { name: "VinUniversity", address: "Vinhomes Ocean Park, Hà Nội" },
  destination: { name: "Times City", address: "458 Minh Khai, Hà Nội" },
  distance: 11.5,
  duration: 22,
};
export const popularRoutes: Route[] = [
  {
    pickup: { name: "VinUniversity", address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội" },
    destination: { name: "Times City", address: "458 Minh Khai, Hai Bà Trưng, Hà Nội" },
    distance: 11.5,
    duration: 22,
  },
  {
    pickup: { name: "VinUniversity", address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội" },
    destination: { name: "Highlands Bà Triệu", address: "127 Bà Triệu, Hai Bà Trưng, Hà Nội" },
    distance: 7.2,
    duration: 18,
  },
  {
    pickup: { name: "VinUniversity", address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội" },
    destination: { name: "Sân bay Nội Bài", address: "Nhà ga T1/T2, Sóc Sơn, Hà Nội" },
    distance: 34.0,
    duration: 38,
  },
  {
    pickup: { name: "VinUniversity", address: "Vinhomes Ocean Park, Gia Lâm, Hà Nội" },
    destination: { name: "Vincom Metropolis", address: "29 Liễu Giai, Ba Đình, Hà Nội" },
    distance: 14.2,
    duration: 26,
  },
];
export const driver = {
  name: "Nguyễn Minh Nam",
  rating: "4,9",
  plate: "29A–886.92",
  trips: "1.240",
};
export interface HistoryTrip {
  id: string;
  group: string;
  time: string;
  route: Route;
  vehicle: VehicleId;
  fare: number;
  status: "completed" | "cancelled";
}
export const historySeed: HistoryTrip[] = [
  {
    id: "GSM-071026-2408",
    group: "Hôm nay",
    time: "09:42",
    route: defaultRoute,
    vehicle: "vf5",
    fare: 128000,
    status: "completed",
  },
  {
    id: "GSM-061026-1835",
    group: "Hôm qua",
    time: "18:35",
    route: {
      ...defaultRoute,
      pickup: defaultRoute.destination,
      destination: defaultRoute.pickup,
    },
    vehicle: "bike",
    fare: 72000,
    status: "completed",
  },
  {
    id: "GSM-041026-0820",
    group: "Ngày trước đó",
    time: "04/10 · 08:20",
    route: defaultRoute,
    vehicle: "limo",
    fare: 185000,
    status: "completed",
  },
  {
    id: "GSM-041026-0730",
    group: "Ngày trước đó",
    time: "04/10 · 07:30",
    route: defaultRoute,
    vehicle: "vf5",
    fare: 0,
    status: "cancelled",
  },
];
