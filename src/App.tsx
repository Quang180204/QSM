import { NavLink, Route, Routes } from "react-router-dom";
import {
  CarFront,
  History as HistoryIcon,
  House,
  UserRound,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Home from "./screens/Home";
import Trip from "./screens/Trip";
import History from "./screens/History";
import Account from "./screens/Account";
import ChatAssistant from "./components/chat/ChatAssistant";
const tabs = [
  { to: "/", label: "Trang chủ", icon: House },
  { to: "/chuyen-di", label: "Chuyến đi", icon: CarFront },
  { to: "/lich-su", label: "Lịch sử", icon: HistoryIcon },
  { to: "/tai-khoan", label: "Tài khoản", icon: UserRound },
];
export default function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
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
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
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
      <ChatAssistant />
    </div>
  );
}
