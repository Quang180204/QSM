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
        is_active: true,
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
        battery_percentage: 94,
        status: "ready",
      },
      {
        id: "veh-bike-01",
        model_name: "VinFast Feliz S",
        service_name: "QSM Bike",
        license_plate: "29B1-668.19",
        type: "bike",
        battery_percentage: 96,
        status: "ready",
      },
      {
        id: "veh-limo-01",
        model_name: "VinFast VF 9 Luxury",
        service_name: "QSM Luxury",
        license_plate: "30K-999.88",
        type: "luxury",
        battery_percentage: 91,
        status: "ready",
      },
      {
        id: "veh-vf5-02",
        model_name: "VinFast VF 5 Plus",
        service_name: "QSM Taxi",
        license_plate: "30H-452.10",
        type: "car",
        battery_percentage: 88,
        status: "ready",
      },
      {
        id: "veh-bike-02",
        model_name: "VinFast Evo 200",
        service_name: "QSM Bike",
        license_plate: "29E2-319.45",
        type: "bike",
        battery_percentage: 85,
        status: "ready",
      },
      {
        id: "veh-limo-02",
        model_name: "VinFast VF 9 Luxury",
        service_name: "QSM Luxury",
        license_plate: "30K-518.68",
        type: "luxury",
        battery_percentage: 98,
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
        total_trips: 0,
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
        total_trips: 0,
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
        total_trips: 0,
        current_lat: 21.0124,
        current_lng: 105.8492,
        status: "available",
      },
      {
        id: "drv-04",
        vehicle_id: "veh-vf5-02",
        full_name: "Phạm Đức Anh",
        phone: "0918990011",
        rating: 4.89,
        total_trips: 0,
        current_lat: 21.0318,
        current_lng: 105.8141,
        status: "available",
      },
      {
        id: "drv-05",
        vehicle_id: "veh-bike-02",
        full_name: "Vũ Tuấn Kiệt",
        phone: "0966334455",
        rating: 4.91,
        total_trips: 0,
        current_lat: 21.0031,
        current_lng: 105.8205,
        status: "available",
      },
      {
        id: "drv-06",
        vehicle_id: "veh-limo-02",
        full_name: "Đỗ Quang Huy",
        phone: "0936778899",
        rating: 4.97,
        total_trips: 0,
        current_lat: 21.2187,
        current_lng: 105.8042,
        status: "available",
      },
    ],
    // Xóa toàn bộ dữ liệu chuyến đi và lịch sử mẫu để mỗi tài khoản quản lý chuyến đi độc lập
    trips: [],
    messages: [],
    vouchers: [
      {
        code: "QSM2026",
        title: "Khai xuân di chuyển xanh 2026",
        discount_amount: 25000,
        discount_type: "fixed",
        min_order_val: 40000,
        target_tier: "all",
        expires_at: "2026-12-31T23:59:59.000Z",
        is_active: true,
        usage_count: 142,
        max_usage: 1000,
      },
      {
        code: "DIENGREEN",
        title: "Ưu đãi xe thuần điện VinFast",
        discount_amount: 30000,
        discount_type: "fixed",
        min_order_val: 50000,
        target_tier: "all",
        expires_at: "2026-12-31T23:59:59.000Z",
        is_active: true,
        usage_count: 89,
        max_usage: 500,
      },
      {
        code: "QSMAIRPORT",
        title: "Đưa đón sân bay Nội Bài",
        discount_amount: 50000,
        discount_type: "fixed",
        min_order_val: 120000,
        target_tier: "gold",
        expires_at: "2026-12-31T23:59:59.000Z",
        is_active: true,
        usage_count: 65,
        max_usage: 300,
      },
      {
        code: "VIPMEMBER",
        title: "Đặc quyền Hội viên Kim Cương",
        discount_amount: 40000,
        discount_type: "fixed",
        min_order_val: 70000,
        target_tier: "platinum",
        expires_at: "2026-12-31T23:59:59.000Z",
        is_active: true,
        usage_count: 28,
        max_usage: 200,
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
        const parsed = JSON.parse(raw) as DatabaseStore;
        if (!parsed.vouchers) {
          parsed.vouchers = createDefaultSeedData().vouchers;
          this.save(parsed);
        } else {
          // Migration: Đảm bảo phân quyền target_tier cho các voucher sẵn có
          let hasMigrated = false;
          for (const v of parsed.vouchers) {
            if (!v.target_tier) {
              if (v.code === "VIPMEMBER") v.target_tier = "platinum";
              else if (v.code === "QSMAIRPORT") v.target_tier = "gold";
              else v.target_tier = "all";
              hasMigrated = true;
            }
          }
          if (hasMigrated) this.save(parsed);
        }
        return parsed;
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
