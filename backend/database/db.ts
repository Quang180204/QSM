import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import type { DatabaseStore } from "../src/models/entities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_JSON_PATH = path.join(__dirname, "qsm-store.json");

export function createDefaultSeedData(): DatabaseStore {
  const adminHash = bcrypt.hashSync("admin", 10);
  const userHash = bcrypt.hashSync("123456", 10);

  return {
    users: [
      {
        id: "usr-admin-01",
        username: "admin",
        name: "Quản Trị Viên QSM",
        phone: "0900000001",
        email: "admin@qsm.vn",
        password_hash: adminHash,
        role: "admin",
        membership_tier: "platinum",
        avatar_url: "/images/driver-avatar.png",
        is_active: true,
        created_at: "2026-01-01T08:00:00.000Z",
      },
      {
        id: "usr-customer-01",
        username: "quang",
        name: "Nguyễn Khắc Quang",
        phone: "0988180204",
        email: "quang@qsm.vn",
        password_hash: userHash,
        role: "user",
        membership_tier: "platinum",
        is_active: true,
        created_at: "2026-09-15T09:30:00.000Z",
      },
      {
        id: "usr-customer-02",
        username: "minhanh",
        name: "Trần Minh Anh",
        phone: "0912345678",
        email: "minhanh@gmail.com",
        password_hash: userHash,
        role: "user",
        membership_tier: "gold",
        is_active: true,
        created_at: "2026-09-20T14:15:00.000Z",
      },
      {
        id: "usr-customer-03",
        username: "hoanglong",
        name: "Lê Hoàng Long",
        phone: "0977654321",
        email: "hoanglong@vinuni.edu.vn",
        password_hash: userHash,
        role: "user",
        membership_tier: "standard",
        is_active: true,
        created_at: "2026-10-01T10:00:00.000Z",
      },
      {
        id: "usr-customer-04",
        username: "phuongthao",
        name: "Phạm Phương Thảo",
        phone: "0933889900",
        email: "thaopham@outlook.com",
        password_hash: userHash,
        role: "user",
        membership_tier: "gold",
        is_active: false,
        created_at: "2026-10-03T16:45:00.000Z",
      },
    ],
    vehicles: [
      {
        id: "veh-vf5-01",
        model_name: "VinFast VF 5 Plus",
        service_name: "QSM Taxi",
        license_plate: "29A-886.92",
        type: "car",
        battery_percentage: 86,
        status: "ready",
      },
      {
        id: "veh-bike-01",
        model_name: "VinFast Feliz S",
        service_name: "QSM Bike",
        license_plate: "29B1-668.19",
        type: "bike",
        battery_percentage: 92,
        status: "ready",
      },
      {
        id: "veh-limo-01",
        model_name: "VinFast VF 9 Luxury",
        service_name: "QSM Luxury",
        license_plate: "30K-999.88",
        type: "luxury",
        battery_percentage: 78,
        status: "on_trip",
      },
      {
        id: "veh-vf5-02",
        model_name: "VinFast VF 5 Plus",
        service_name: "QSM Taxi",
        license_plate: "30H-452.10",
        type: "car",
        battery_percentage: 64,
        status: "on_trip",
      },
      {
        id: "veh-bike-02",
        model_name: "VinFast Evo 200",
        service_name: "QSM Bike",
        license_plate: "29E2-319.45",
        type: "bike",
        battery_percentage: 38,
        status: "charging",
      },
      {
        id: "veh-limo-02",
        model_name: "VinFast VF 9 Luxury",
        service_name: "QSM Luxury",
        license_plate: "30K-518.68",
        type: "luxury",
        battery_percentage: 95,
        status: "ready",
      },
    ],
    drivers: [
      {
        id: "drv-01",
        vehicle_id: "veh-vf5-01",
        full_name: "Nguyễn Minh Nam",
        phone: "0988668892",
        rating: 4.95,
        total_trips: 1240,
        current_lat: 20.9905,
        current_lng: 105.9445,
        status: "available",
      },
      {
        id: "drv-02",
        vehicle_id: "veh-bike-01",
        full_name: "Trần Quốc Bảo",
        phone: "0972112233",
        rating: 4.92,
        total_trips: 985,
        current_lat: 20.9962,
        current_lng: 105.8685,
        status: "available",
      },
      {
        id: "drv-03",
        vehicle_id: "veh-limo-01",
        full_name: "Lê Hoàng Phúc",
        phone: "0904556677",
        rating: 4.98,
        total_trips: 1620,
        current_lat: 21.0124,
        current_lng: 105.8492,
        status: "busy",
      },
      {
        id: "drv-04",
        vehicle_id: "veh-vf5-02",
        full_name: "Phạm Đức Anh",
        phone: "0918990011",
        rating: 4.89,
        total_trips: 742,
        current_lat: 21.0318,
        current_lng: 105.8141,
        status: "busy",
      },
      {
        id: "drv-05",
        vehicle_id: "veh-bike-02",
        full_name: "Vũ Tuấn Kiệt",
        phone: "0966334455",
        rating: 4.91,
        total_trips: 530,
        current_lat: 21.0031,
        current_lng: 105.8205,
        status: "offline",
      },
      {
        id: "drv-06",
        vehicle_id: "veh-limo-02",
        full_name: "Đỗ Quang Huy",
        phone: "0936778899",
        rating: 4.97,
        total_trips: 1108,
        current_lat: 21.2187,
        current_lng: 105.8042,
        status: "available",
      },
    ],
    trips: [
      {
        id: "trp-01",
        trip_code: "QSM-071026",
        user_id: "usr-customer-01",
        driver_id: "drv-01",
        vehicle_type: "car",
        pickup_address: "VinUniversity, Vinhomes Ocean Park, Gia Lâm, Hà Nội",
        pickup_coords: [105.9445, 20.9905],
        dest_address: "Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội",
        dest_coords: [105.8685, 20.9962],
        distance_km: 11.5,
        duration_mins: 22,
        fare_amount: 153000,
        discount_amount: 25000,
        final_amount: 128000,
        payment_method: "qsm_wallet",
        status: "COMPLETED",
        rating_stars: 5,
        feedback_note: "Lái xe êm ái, xe sạch không mùi",
        created_at: "2026-10-09T09:20:00.000Z",
        completed_at: "2026-10-09T09:42:00.000Z",
      },
      {
        id: "trp-02",
        trip_code: "QSM-061026",
        user_id: "usr-customer-01",
        driver_id: "drv-02",
        vehicle_type: "bike",
        pickup_address: "Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội",
        pickup_coords: [105.8685, 20.9962],
        dest_address: "VinUniversity, Vinhomes Ocean Park, Gia Lâm, Hà Nội",
        dest_coords: [105.9445, 20.9905],
        distance_km: 11.5,
        duration_mins: 20,
        fare_amount: 97000,
        discount_amount: 25000,
        final_amount: 72000,
        payment_method: "vnpay",
        status: "COMPLETED",
        rating_stars: 5,
        feedback_note: "Đúng giờ, bác tài nhiệt tình",
        created_at: "2026-10-08T18:15:00.000Z",
        completed_at: "2026-10-08T18:35:00.000Z",
      },
      {
        id: "trp-03",
        trip_code: "QSM-041026",
        user_id: "usr-customer-01",
        driver_id: "drv-03",
        vehicle_type: "luxury",
        pickup_address: "VinUniversity, Vinhomes Ocean Park, Gia Lâm, Hà Nội",
        pickup_coords: [105.9445, 20.9905],
        dest_address: "Sân bay Nội Bài, Sóc Sơn, Hà Nội",
        dest_coords: [105.8042, 21.2187],
        distance_km: 34.0,
        duration_mins: 38,
        fare_amount: 210000,
        discount_amount: 25000,
        final_amount: 185000,
        payment_method: "card",
        status: "COMPLETED",
        rating_stars: 5,
        feedback_note: "Khoang thương gia VF 9 cực kỳ êm ái",
        created_at: "2026-10-04T07:40:00.000Z",
        completed_at: "2026-10-04T08:20:00.000Z",
      },
      {
        id: "trp-04",
        trip_code: "QSM-040730",
        user_id: "usr-customer-01",
        driver_id: "drv-01",
        vehicle_type: "car",
        pickup_address: "VinUniversity, Vinhomes Ocean Park, Gia Lâm, Hà Nội",
        pickup_coords: [105.9445, 20.9905],
        dest_address: "Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội",
        dest_coords: [105.8685, 20.9962],
        distance_km: 11.5,
        duration_mins: 22,
        fare_amount: 128000,
        discount_amount: 0,
        final_amount: 0,
        payment_method: "cash",
        status: "CANCELLED",
        cancel_reason: "Thay đổi lịch trình cá nhân",
        cancelled_by: "user",
        created_at: "2026-10-04T07:30:00.000Z",
      },
      {
        id: "trp-05",
        trip_code: "QSM-882410",
        user_id: "usr-customer-02",
        driver_id: "drv-03",
        vehicle_type: "luxury",
        pickup_address: "Highlands Bà Triệu, 127 Bà Triệu, Hai Bà Trưng, Hà Nội",
        pickup_coords: [105.8492, 21.0124],
        dest_address: "Sân bay Nội Bài, Sóc Sơn, Hà Nội",
        dest_coords: [105.8042, 21.2187],
        distance_km: 28.4,
        duration_mins: 35,
        fare_amount: 345000,
        discount_amount: 25000,
        final_amount: 320000,
        payment_method: "vnpay",
        status: "IN_TRANSIT",
        created_at: "2026-10-09T15:10:00.000Z",
      },
      {
        id: "trp-06",
        trip_code: "QSM-994120",
        user_id: "usr-customer-03",
        driver_id: "drv-04",
        vehicle_type: "car",
        pickup_address: "Vincom Metropolis, 29 Liễu Giai, Ba Đình, Hà Nội",
        pickup_coords: [105.8141, 21.0318],
        dest_address: "Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội",
        dest_coords: [105.8685, 20.9962],
        distance_km: 9.8,
        duration_mins: 21,
        fare_amount: 145000,
        discount_amount: 25000,
        final_amount: 120000,
        payment_method: "momo",
        status: "PICKING_UP",
        created_at: "2026-10-09T15:20:00.000Z",
      },
    ],
    messages: [
      {
        id: "msg-01",
        trip_id: "trp-06",
        sender_role: "driver",
        sender_name: "Phạm Đức Anh",
        content: "Chào bạn, mình đang di chuyển đến sảnh chính Vincom Metropolis, khoảng 2 phút nữa tới nhé!",
        created_at: "2026-10-09T15:21:00.000Z",
      },
    ],
  };
}

class LocalDatabase {
  private store: DatabaseStore;

  constructor() {
    this.store = this.load();
  }

  private load(): DatabaseStore {
    if (fs.existsSync(DB_JSON_PATH)) {
      try {
        const raw = fs.readFileSync(DB_JSON_PATH, "utf-8");
        return JSON.parse(raw) as DatabaseStore;
      } catch {
        // Fallback to default seed
      }
    }
    const seeded = createDefaultSeedData();
    this.save(seeded);
    return seeded;
  }

  public save(nextStore?: DatabaseStore): void {
    if (nextStore) {
      this.store = nextStore;
    }
    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(this.store, null, 2), "utf-8");
  }

  public get data(): DatabaseStore {
    return this.store;
  }

  public resetWithSeed(): DatabaseStore {
    const seeded = createDefaultSeedData();
    this.save(seeded);
    return seeded;
  }
}

export const db = new LocalDatabase();

