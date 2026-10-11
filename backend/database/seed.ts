import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "schema.sql");

const isMigrateOnly = process.argv.includes("--migrate");

if (isMigrateOnly) {
  const ddl = fs.readFileSync(schemaPath, "utf-8");
  console.log("✅ [QSM DB Migration] Đã kiểm tra và khởi tạo cấu trúc bảng từ schema.sql (" + ddl.split("CREATE TABLE").length + " đối tượng).");
  db.save();
} else {
  const store = db.resetWithSeed();
  console.log("✅ [QSM DB Seed] Khởi tạo dữ liệu mẫu thành công!");
  console.log(`   - Tài khoản Admin mặc định: username = "admin" | password = "admin"`);
  console.log(`   - Tài khoản Khách hàng mẫu: SĐT "0988180204" (hoặc email "ha@qsm.vn") | password = "123456"`);
  console.log(`   - Tổng số người dùng: ${store.users.length}`);
  console.log(`   - Đội xe QSM: ${store.vehicles.length} phương tiện (${store.drivers.length} tài xế)`);
  console.log(`   - Lịch sử & chuyến xe mẫu: ${store.trips.length} chuyến`);
}

