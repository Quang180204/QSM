import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  CarFront,
  History as HistoryIcon,
  House,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useEffect } from "react";
import Home from "./screens/Home";
import Trip from "./screens/Trip";
import History from "./screens/History";
import Account from "./screens/Account";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Admin from "./screens/Admin";
import { useAuth } from "./state/AuthProvider";

export default function App() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const tabs = [
    { to: "/", label: "Trang chủ", icon: House },
    { to: "/chuyen-di", label: "Chuyến đi", icon: CarFront },
    { to: "/lich-su", label: "Lịch sử", icon: HistoryIcon },
    { to: "/tai-khoan", label: "Tài khoản", icon: UserRound },
    ...(isAdmin
      ? [{ to: "/admin", label: "Quản trị", icon: ShieldAlert }]
      : []),
  ];

  const hideBottomNav =
    location.pathname === "/dang-nhap" || location.pathname === "/dang-ky";

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Đến nội dung chính
      </a>
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chuyen-di" element={<Trip />} />
          <Route path="/lich-su" element={<History />} />
          <Route path="/tai-khoan" element={<Account />} />
          <Route path="/dang-nhap" element={<Login />} />
          <Route path="/dang-ky" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!hideBottomNav && (
        <nav className="bottom-nav" aria-label="Điều hướng chính">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <span>
                <Icon size={22} strokeWidth={1.7} />
              </span>
              <strong>{label}</strong>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
