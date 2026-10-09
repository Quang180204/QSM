import { useState } from "react";
import {
  ArrowRight,
  Lock,
  Mail,
  Phone,
  UserRound,
  Sun,
  Moon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import QsmLogo from "../components/QsmLogo";
import { useAuth } from "../state/AuthProvider";
import { useRide } from "../state/RideProvider";
import { useTheme } from "../state/ThemeContext";

export default function Register() {
  const { register } = useAuth();
  const { notify } = useRide();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^(0|\+84)[0-9]{8,10}$/.test(phone.trim())) {
      setError("Số điện thoại không hợp lệ (VD: 0988180204).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Địa chỉ Email không đúng định dạng.");
      return;
    }
    if (password.length < 4) {
      setError("Mật khẩu phải có ít nhất 4 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const newUser = await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      notify(`Chào mừng ${newUser.name} gia nhập QSM Mobility!`);
      nav("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể đăng ký tài khoản. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="standard-screen auth-screen">
      <header className="app-header" style={{ margin: "-16px -20px 12px" }}>
        <Link className="brand" to="/" aria-label="QSM Trang chủ">
          <QsmLogo size={38} />
        </Link>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Đổi giao diện"
          >
            {theme === "dark" ? (
              <Sun size={20} className="theme-icon sun animate-glow" />
            ) : (
              <Moon size={20} className="theme-icon moon" />
            )}
          </button>
        </div>
      </header>

      <section className="auth-card">
        <div className="auth-card-header">
          <span className="eyebrow">THÀNH VIÊN MỚI QSM 2026</span>
          <h1>Đăng ký tài khoản</h1>
          <p>
            Tạo tài khoản khách hàng QSM để đặt xe thuần điện nhanh chóng và nhận
            ngay ưu đãi mã <strong>QSM2026</strong>.
          </p>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Họ và tên</span>
            <div className="auth-input-wrap">
              <UserRound size={18} />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Số điện thoại di động</span>
            <div className="auth-input-wrap">
              <Phone size={18} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0988180204"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Địa chỉ Email</span>
            <div className="auth-input-wrap">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: khachhang@qsm.vn"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <div className="auth-input-wrap">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 4 ký tự"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Xác nhận mật khẩu</span>
            <div className="auth-input-wrap">
              <Lock size={18} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            className="button primary wide"
            disabled={loading}
          >
            <span>{loading ? "Đang khởi tạo..." : "Hoàn tất đăng ký"}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer-links">
          <span>Đã có tài khoản QSM?</span>
          <Link to="/dang-nhap" className="auth-link">
            Đăng nhập ngay
          </Link>
        </div>
      </section>
    </div>
  );
}

