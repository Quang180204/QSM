import { useState } from "react";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Headphones,
  Leaf,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRide } from "../state/RideProvider";
import { useTheme } from "../state/ThemeContext";
import Modal from "../components/Modal";
import { Sun, Moon, Sparkles } from "lucide-react";

const items = [
  { label: "Thông tin cá nhân", icon: UserRound },
  { label: "Địa điểm đã lưu", icon: MapPin },
  { label: "Thanh toán", icon: CreditCard },
  { label: "Thông báo", icon: Bell },
  { label: "Cài đặt", icon: Settings },
  { label: "Hỗ trợ", icon: Headphones },
  { label: "Quyền riêng tư", icon: ShieldCheck },
];

export default function Account() {
  const { notify, setChatOpen } = useRide();
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState("");
  const [name, setName] = useState("Nguyễn Khắc Quang");
  const [notifications, setNotifications] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  return (
    <div className="standard-screen">
      <header className="page-heading">
        <span className="eyebrow">Hệ sinh thái di chuyển xanh 2026</span>
        <h1>Tài khoản</h1>
      </header>
      <section className="profile">
        <div className="profile-avatar">
          Q
          <span>
            <Leaf size={14} />
          </span>
        </div>
        <h2>{signedOut ? "Khách trải nghiệm" : name}</h2>
        <p>
          {signedOut
            ? "Khám phá hành trình cùng GSM"
            : "Thành viên từ tháng 10, 2026 · ID: GSM-VIP-8899"}
        </p>
        <span className="badge diamond-badge">
          <Sparkles size={14} />
          Hội viên GSM · Hạng Kim Cương VIP
        </span>
      </section>

      {/* Quick Theme Switcher Card */}
      <section className="theme-switcher-card">
        <div className="theme-switcher-info">
          <span className="theme-icon-box">
            {theme === "dark" ? <Sun size={20} className="sun-icon" /> : <Moon size={20} className="moon-icon" />}
          </span>
          <div>
            <strong>Giao diện: {theme === "dark" ? "Chế độ Tối (Ban đêm)" : "Chế độ Sáng (Ban ngày)"}</strong>
            <small>{theme === "dark" ? "Ánh sáng công nghệ, tiết kiệm pin OLED" : "Thanh lịch, tương phản cao ban ngày"}</small>
          </div>
        </div>
        <button
          className="button-theme-switch"
          onClick={toggleTheme}
          aria-label="Đổi giao diện sáng/tối"
        >
          {theme === "dark" ? "Bật đèn" : "Tắt đèn"}
        </button>
      </section>

      <section className="membership">
        <div>
          <span className="eyebrow">Hành trình xanh của bạn</span>
          <h3>
            42,8 <small>kg CO₂ đã giảm</small>
          </h3>
          <p>Tương đương trồng mới <strong>2,1 cây xanh</strong> cho đô thị.</p>
        </div>
        <Leaf size={43} strokeWidth={1} />
      </section>
      <div className="account-list">
        {items.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => setSection(label)}>
            <span className="account-icon">
              <Icon size={20} />
            </span>
            <strong>{label}</strong>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      <button
        className="logout"
        onClick={() => setSection(signedOut ? "Đăng nhập" : "Đăng xuất")}
      >
        <LogOut size={18} />
        {signedOut ? "Đăng nhập" : "Đăng xuất"}
      </button>
      <p className="account-footer">
        GSM · Di chuyển xanh & thông minh
        <br />
        Phiên bản trải nghiệm 1.0
      </p>
      {section ? (
        <Modal title={section} onClose={() => setSection("")}>
          {section === "Thông tin cá nhân" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                notify("Đã lưu thông tin trên phiên trải nghiệm.");
                setSection("");
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
              <p className="muted">
                Tài khoản mô phỏng. Chưa kết nối dịch vụ xác thực.
              </p>
              <button className="button primary wide">Lưu thông tin</button>
            </form>
          ) : section === "Địa điểm đã lưu" ? (
            <div className="saved-places">
              <p>
                <strong>Nhà</strong>
                <br />
                Vinhomes Ocean Park, Hà Nội
              </p>
              <p>
                <strong>Trường học</strong>
                <br />
                VinUniversity, Hà Nội
              </p>
            </div>
          ) : section === "Thanh toán" ? (
            <>
              <p>
                <strong>Tiền mặt</strong> · Đang sử dụng
              </p>
              <p>
                Ví GSM là lựa chọn mô phỏng trong bước xác nhận chuyến. Chưa có
                liên kết ngân hàng.
              </p>
            </>
          ) : section === "Thông báo" || section === "Cài đặt" ? (
            <label className="setting-row">
              <span>Thông báo chuyến đi</span>
              <input
                type="checkbox"
                role="switch"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </label>
          ) : section === "Hỗ trợ" ? (
            <>
              <p>
                AI GSM có thể giúp bạn tìm hiểu giá, địa điểm và trạng thái
                chuyến.
              </p>
              <button
                className="button primary wide"
                onClick={() => {
                  setSection("");
                  setChatOpen(true);
                }}
              >
                Mở trợ lý AI
              </button>
            </>
          ) : section === "Quyền riêng tư" ? (
            <p>
              Phiên trải nghiệm sử dụng dữ liệu mô phỏng. Nội dung hội thoại chỉ
              tồn tại trong bộ nhớ phiên, không gửi đến nhà cung cấp AI. Chưa
              thu thập vị trí GPS hoặc thông tin thanh toán.
            </p>
          ) : (
            <>
              <p>
                {signedOut
                  ? "Đăng nhập tài khoản trải nghiệm?"
                  : "Bạn muốn đăng xuất khỏi tài khoản trải nghiệm?"}
              </p>
              <button
                className="button primary wide"
                onClick={() => {
                  setSignedOut(!signedOut);
                  setSection("");
                  notify(
                    signedOut
                      ? "Đã đăng nhập tài khoản trải nghiệm."
                      : "Đã đăng xuất.",
                  );
                }}
              >
                Xác nhận
              </button>
            </>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
