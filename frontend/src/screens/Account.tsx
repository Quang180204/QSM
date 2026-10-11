import { useState } from "react";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Headphones,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Sun,
  Moon,
  Sparkles,
  Phone,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRide } from "../state/RideProvider";
import { useAuth } from "../state/AuthProvider";
import { useTheme } from "../state/ThemeContext";
import Modal from "../components/Modal";

const items = [
  { label: "Thông tin cá nhân & Đổi mật khẩu", icon: UserRound },
  { label: "Địa điểm đã lưu", icon: MapPin },
  { label: "Phương thức thanh toán", icon: CreditCard },
  { label: "Cài đặt thông báo", icon: Bell },
  { label: "Tùy chỉnh ứng dụng", icon: Settings },
  { label: "Trung tâm Hỗ trợ 24/7", icon: Headphones },
  { label: "Bảo mật & Quyền riêng tư", icon: ShieldCheck },
];

export default function Account() {
  const { history, notify } = useRide();
  const { user, isAuthenticated, isAdmin, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();

  const [section, setSection] = useState("");
  const [name, setName] = useState(user?.name || "Lê Xuân Hạ");
  const [phone, setPhone] = useState(user?.phone || "0988180204");
  const [email, setEmail] = useState(user?.email || "ha@qsm.vn");
  const [newPassword, setNewPassword] = useState("");
  const [notifications, setNotifications] = useState(true);

  const completedTrips = history.filter((t) => t.status === "completed");
  const co2SavedNum = completedTrips.reduce(
    (sum, t) => sum + t.route.distance * 0.24,
    0,
  );
  const co2SavedStr = co2SavedNum.toFixed(2).replace(".", ",");
  const treesEquivalent = (co2SavedNum / 20).toFixed(1).replace(".", ",");

  const openSection = (label: string) => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setEmail(user.email);
    }
    setNewPassword("");
    setSection(label);
  };

  const handleSwitchTier = async (newTier: "standard" | "gold" | "platinum") => {
    if (!user) {
      notify("Vui lòng đăng nhập để trải nghiệm phân quyền hội viên!");
      return;
    }
    try {
      await updateProfile({ membership_tier: newTier });
      const tierLabels = {
        standard: "Hội viên Tiêu chuẩn (Standard)",
        gold: "Hội viên Hạng Vàng (Gold)",
        platinum: "Hội viên Kim Cương VIP (Platinum)",
      };
      notify(`Đã chuyển đổi sang ${tierLabels[newTier]} thành công!`);
    } catch (err) {
      notify("Không thể cập nhật thứ hạng: " + (err instanceof Error ? err.message : "Lỗi"));
    }
  };

  return (
    <div className="standard-screen">
      <header className="page-heading">
        <span className="eyebrow">Hệ sinh thái di chuyển thuần điện QSM 2026</span>
        <h1>Tài khoản</h1>
      </header>

      <section className="profile">
        <div className="profile-avatar">
          {(user?.name || "Q").trim().charAt(0).toUpperCase()}
          <span>
            <Leaf size={14} />
          </span>
        </div>
        <h2>{user ? user.name : "Khách hàng chưa đăng nhập"}</h2>
        <p>
          {user
            ? `${user.phone} · ${user.email}`
            : "Đăng nhập để đồng bộ lịch sử chuyến đi và ưu đãi QSM"}
        </p>
        <span className="badge diamond-badge">
          <Sparkles size={14} />
          {isAdmin
            ? "Quản trị viên Hệ thống QSM (Admin)"
            : user?.membership_tier === "platinum"
              ? "Hội viên QSM · Hạng Kim Cương VIP"
              : user?.membership_tier === "gold"
                ? "Hội viên QSM · Hạng Vàng"
                : "Hội viên QSM · Hạng Tiêu Chuẩn"}
        </span>

        {isAdmin && (
          <button
            type="button"
            className="button primary"
            style={{ marginTop: "12px" }}
            onClick={() => nav("/admin")}
          >
            <ShieldAlert size={17} />
            <span>Mở Cổng Quản trị viên (/admin)</span>
          </button>
        )}
      </section>

      {/* Membership Tier & Voucher Privilege Selector */}
      <section className="demo-tier-switcher-card">
        <div className="demo-tier-header">
          <div className="demo-tier-icon-box">
            <Crown size={20} className="crown-icon" />
          </div>
          <div className="demo-tier-text-block">
            <strong className="demo-tier-title">Hạng Thẻ Hội Viên & Đặc Quyền Voucher</strong>
            <span className="demo-tier-desc">
              Nâng cấp hoặc chuyển đổi hạng thẻ QSM để mở khóa đặc quyền ưu đãi Gold & Kim Cương VIP
            </span>
          </div>
        </div>

        <div className="demo-tier-btn-group">
          <button
            type="button"
            className={`demo-tier-btn ${(!user?.membership_tier || user?.membership_tier === "standard") ? "active tier-standard" : ""}`}
            onClick={() => handleSwitchTier("standard")}
          >
            <span className="tier-rank-pill">Hạng 1</span>
            <span className="tier-btn-label">🥉 Tiêu Chuẩn</span>
            <small className="tier-btn-sub">Mã phổ thông (All)</small>
          </button>

          <button
            type="button"
            className={`demo-tier-btn ${user?.membership_tier === "gold" ? "active tier-gold" : ""}`}
            onClick={() => handleSwitchTier("gold")}
          >
            <span className="tier-rank-pill">Hạng 2</span>
            <span className="tier-btn-label">🥇 Hạng Vàng</span>
            <small className="tier-btn-sub">Mã Gold & All</small>
          </button>

          <button
            type="button"
            className={`demo-tier-btn ${user?.membership_tier === "platinum" ? "active tier-platinum" : ""}`}
            onClick={() => handleSwitchTier("platinum")}
          >
            <span className="tier-rank-pill">Hạng 3 VIP</span>
            <span className="tier-btn-label">👑 Kim Cương VIP</span>
            <small className="tier-btn-sub">Mở toàn bộ mã VIP</small>
          </button>
        </div>
      </section>

      {/* Quick Theme Switcher Card */}
      <section className="theme-switcher-card">
        <div className="theme-switcher-info">
          <div className="theme-icon-box">
            {theme === "dark" ? (
              <Sun size={20} className="sun-icon animate-glow" />
            ) : (
              <Moon size={20} className="moon-icon" />
            )}
          </div>
          <div className="theme-text-block">
            <strong className="theme-mode-title">
              Giao diện:{" "}
              <span className="theme-mode-highlight">
                {theme === "dark"
                  ? "Chế độ Tối (Galaxy Cyber)"
                  : "Chế độ Sáng (Solar Cyan)"}
              </span>
            </strong>
            <span className="theme-mode-desc">
              {theme === "dark"
                ? "Ánh sáng công nghệ Cyan, tối ưu hiển thị ban đêm"
                : "Thanh lịch, độ tương phản cao ngoài trời"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="button-theme-switch"
          onClick={toggleTheme}
          aria-label="Đổi giao diện sáng/tối"
        >
          {theme === "dark" ? (
            <>
              <Sun size={15} />
              <span>Bật đèn</span>
            </>
          ) : (
            <>
              <Moon size={15} />
              <span>Tắt đèn</span>
            </>
          )}
        </button>
      </section>

      <section className="membership">
        <div>
          <span className="eyebrow">Đóng góp môi trường của bạn</span>
          <h3>
            {co2SavedStr} <small>kg CO₂ đã cắt giảm</small>
          </h3>
          <p>
            Đã hoàn thành <strong>{completedTrips.length} chuyến đi</strong> (tương
            đương trồng mới <strong>{treesEquivalent} cây xanh</strong>).
          </p>
        </div>
        <Leaf size={43} strokeWidth={1} />
      </section>

      <div className="account-list">
        {items.map(({ label, icon: Icon }) => (
          <button key={label} type="button" onClick={() => openSection(label)}>
            <span className="account-icon">
              <Icon size={20} />
            </span>
            <strong>{label}</strong>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>

      {isAuthenticated ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            className="button secondary wide"
            onClick={() => nav("/dang-nhap")}
          >
            <LogIn size={18} />
            <span>Chuyển đổi tài khoản (User / Admin)</span>
          </button>
          <button
            type="button"
            className="logout"
            onClick={() => {
              logout();
              notify("Đã đăng xuất khỏi tài khoản QSM.");
              nav("/dang-nhap");
            }}
          >
            <LogOut size={18} />
            Đăng xuất tài khoản
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="button primary wide"
          onClick={() => nav("/dang-nhap")}
        >
          <LogIn size={18} />
          <span>Đăng nhập / Đăng ký tài khoản QSM</span>
        </button>
      )}

      <p className="account-footer">
        QSM (Quick Smart Mobility) · Di chuyển thông minh & thuần điện
        <br />
        Phiên bản Thương mại 2026.2.0
      </p>

      {section ? (
        <Modal title={section} onClose={() => setSection("")}>
          {section === "Thông tin cá nhân & Đổi mật khẩu" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void updateProfile({
                  name,
                  phone,
                  email,
                  newPassword: newPassword.trim() || undefined,
                }).then(() => {
                  notify("Đã lưu thông tin hồ sơ cá nhân lên hệ thống QSM!");
                  setSection("");
                });
              }}
            >
              <label className="field">
                Họ và tên
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Số điện thoại
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Địa chỉ Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Mật khẩu mới (Bỏ trống nếu giữ nguyên)
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                />
              </label>
              <button type="submit" className="button primary wide">
                Cập nhật hồ sơ
              </button>
            </form>
          ) : section === "Địa điểm đã lưu" ? (
            <div className="saved-places">
              <p>
                <strong>Nhà riêng</strong>
                <br />
                Vinhomes Ocean Park, Gia Lâm, Hà Nội
              </p>
              <p>
                <strong>Cơ quan / Trường học</strong>
                <br />
                VinUniversity, Gia Lâm, Hà Nội
              </p>
              <p>
                <strong>Điểm đến thường xuyên</strong>
                <br />
                Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội
              </p>
            </div>
          ) : section === "Phương thức thanh toán" ? (
            <div className="saved-places">
              <p>
                <strong>Ví điện tử QSM Pay</strong> · Mặc định (Đã xác thực sinh
                trắc học)
              </p>
              <p>
                <strong>VNPay QR & Thẻ Quốc tế Visa/Mastercard</strong> · Sẵn sàng
                thanh toán tự động
              </p>
              <p>
                <strong>Tiền mặt</strong> · Thanh toán trực tiếp cho tài xế khi kết
                thúc hành trình
              </p>
            </div>
          ) : section === "Cài đặt thông báo" ||
            section === "Tùy chỉnh ứng dụng" ? (
            <label className="setting-row">
              <span>Nhận thông báo trạng thái tài xế & ưu đãi QSM</span>
              <input
                type="checkbox"
                role="switch"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </label>
          ) : section === "Trung tâm Hỗ trợ 24/7" ? (
            <div className="support-dialog-content">
              <p>
                Tổng đài Chăm sóc Khách hàng và Cứu hộ hành trình QSM hoạt động
                xuyên suốt 24/7.
              </p>
              <div className="support-hotline-card">
                <small>Đường dây nóng toàn quốc</small>
                <strong>1900 2088</strong>
                <span>Email: support@qsm.vn</span>
              </div>
              <a
                href="tel:19002088"
                className="button primary wide"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Phone size={16} />
                <span>Gọi ngay 1900 2088</span>
              </a>
            </div>
          ) : (
            <p>
              Dữ liệu tài khoản, tọa độ GPS hành trình và hóa đơn điện tử của quý
              khách được mã hóa chuẩn TLS 1.3 và bảo vệ nghiêm ngặt theo Chính sách
              Bảo mật Dữ liệu Cá nhân của QSM Mobility.
            </p>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
