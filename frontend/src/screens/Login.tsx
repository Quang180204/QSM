import { useState } from "react";
import {
  ArrowRight,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCheck,
  UserRound,
  Sun,
  Moon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import QsmLogo from "../components/QsmLogo";
import { useAuth } from "../state/AuthProvider";
import { useRide } from "../state/RideProvider";
import { useTheme } from "../state/ThemeContext";

export default function Login() {
  const { login } = useAuth();
  const { notify } = useRide();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Vui lòng nhập đầy đủ Tên đăng nhập / SĐT / Email và Mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(identifier.trim(), password);
      notify(`Xin chào ${loggedUser.name}! Đăng nhập QSM thành công.`);
      if (loggedUser.role === "admin") {
        nav("/admin");
      } else {
        nav("/");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (id: string, pw: string) => {
    setIdentifier(id);
    setPassword(pw);
    setError("");
    setLoading(true);
    try {
      const loggedUser = await login(id, pw);
      notify(`Đã đăng nhập với quyền ${loggedUser.role === "admin" ? "Quản trị viên (Admin)" : "Khách hàng"}!`);
      nav(loggedUser.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi đăng nhập.");
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
          <span className="eyebrow">HỆ THỐNG XÁC THỰC QSM 2026</span>
          <h1>Đăng nhập tài khoản</h1>
          <p>
            Nhập Số điện thoại, Email hoặc tài khoản Quản trị viên để truy cập
            nền tảng di chuyển thuần điện QSM.
          </p>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Số điện thoại / Email / Tên đăng nhập</span>
            <div className="auth-input-wrap">
              <UserRound size={18} />
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="VD: 0988180204, ha@qsm.vn hoặc admin"
                autoComplete="username"
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
                placeholder="Nhập mật khẩu của bạn"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            className="button primary wide"
            disabled={loading}
          >
            <span>{loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Quick Role Access Box */}
        <div className="auth-quick-roles">
          <span className="quick-role-title">
            <KeyRound size={14} /> Đăng nhập nhanh theo phân quyền:
          </span>
          <div className="quick-role-grid">
            <button
              type="button"
              className="button secondary"
              onClick={() => void quickLogin("0988180204", "123456")}
            >
              <UserCheck size={16} />
              <span>Khách hàng (User)</span>
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => void quickLogin("admin", "admin")}
            >
              <ShieldCheck size={16} />
              <span>Quản trị (admin / admin)</span>
            </button>
          </div>
        </div>

        <div className="auth-footer-links">
          <span>Chưa có tài khoản khách hàng QSM?</span>
          <Link to="/dang-ky" className="auth-link">
            Đăng ký tài khoản mới
          </Link>
        </div>
      </section>
    </div>
  );
}

