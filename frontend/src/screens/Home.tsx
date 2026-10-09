import { useState } from "react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  Home as HomeIcon,
  Leaf,
  Navigation,
  Plane,
  ShieldAlert,
  ShoppingBag,
  Ticket,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRide } from "../state/RideProvider";
import { useAuth } from "../state/AuthProvider";
import { useTheme } from "../state/ThemeContext";
import { popularRoutes } from "../data/catalog";
import VehicleShowcase3D from "../components/VehicleShowcase3D";
import QsmLogo from "../components/QsmLogo";

export default function Home() {
  const { dispatch, notify } = useRide();
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [destination, setDestination] = useState("");
  const nav = useNavigate();

  const firstName = user?.name
    ? user.name.trim().split(/\s+/).slice(-1)[0]
    : "Khách";

  const handleSelectQuickDestination = (placeName: string) => {
    setDestination(placeName);
    const matchedRoute =
      popularRoutes.find((r) =>
        r.destination.name.toLowerCase().includes(placeName.toLowerCase()),
      ) || {
        ...popularRoutes[0],
        destination: {
          name: placeName,
          address: `${placeName}, Hà Nội`,
          coords: [105.8542, 21.0285] as [number, number],
        },
      };

    dispatch({ type: "RESET" });
    dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
    dispatch({ type: "SET_ROUTE", route: matchedRoute });
    nav("/chuyen-di");
  };

  return (
    <>
      <header className="app-header">
        <a className="brand" href="/" aria-label="QSM Trang chủ">
          <QsmLogo size={40} />
        </a>
        <div className="header-actions">
          {isAdmin && (
            <button
              className="icon-button"
              aria-label="Cổng Quản trị QSM"
              title="Mở Cổng Quản trị viên (/admin)"
              onClick={() => nav("/admin")}
            >
              <ShieldAlert size={20} />
            </button>
          )}
          <button
            className="icon-button theme-toggle-btn"
            aria-label={
              theme === "dark"
                ? "Bật đèn (Giao diện sáng)"
                : "Tắt đèn (Giao diện tối)"
            }
            title={
              theme === "dark"
                ? "Bật đèn (Chế độ ban ngày)"
                : "Tắt đèn (Chế độ ban đêm 2026)"
            }
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun size={20} className="theme-icon sun animate-glow" />
            ) : (
              <Moon size={20} className="theme-icon moon" />
            )}
          </button>
          <button
            className="icon-button notification-button"
            aria-label="Thông báo"
            onClick={() =>
              notify(
                "Ưu đãi QSM 2026: Nhập mã QSM2026 giảm ngay 25.000đ cho chuyến xe thuần điện hôm nay!",
              )
            }
          >
            <Bell size={20} />
            <i />
          </button>
          <button
            className="user-button"
            aria-label="Mở tài khoản"
            onClick={() => nav(user ? "/tai-khoan" : "/dang-nhap")}
          >
            <User size={20} />
          </button>
        </div>
      </header>
      <div className="home-content">
        <section className="welcome">
          <div>
            <p>
              Xin chào, {firstName} <span>👋</span>
            </p>
            <h1>
              Hôm nay bạn
              <br />
              muốn đi đâu?
            </h1>
          </div>
          <button className="club" onClick={() => nav("/tai-khoan")}>
            <Leaf size={17} />
            <span>
              Hội viên QSM
              <small>
                {user?.membership_tier === "platinum"
                  ? "Hạng Kim Cương"
                  : user?.membership_tier === "gold"
                    ? "Hạng Vàng"
                    : "Hạng Tiêu Chuẩn"}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
        </section>

        <form
          className="destination-search"
          onSubmit={(e) => {
            e.preventDefault();
            handleSelectQuickDestination(destination.trim() || "Times City");
          }}
        >
          <Navigation size={22} />
          <div>
            <label htmlFor="destination">Điểm đến</label>
            <input
              id="destination"
              placeholder="Nhập điểm đến của bạn (VD: Times City, Nội Bài...)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <button type="submit" aria-label="Tìm chuyến xe QSM">
            <ArrowRight size={21} />
          </button>
        </form>

        <div className="quick-places">
          {[
            { icon: BriefcaseBusiness, name: "Times City" },
            { icon: HomeIcon, name: "Highlands Bà Triệu" },
            { icon: Plane, name: "Sân bay Nội Bài" },
            { icon: ShoppingBag, name: "Vincom Metropolis" },
          ].map(({ icon: Icon, name }) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelectQuickDestination(name)}
            >
              <Icon size={16} />
              {name}
            </button>
          ))}
        </div>

        <VehicleShowcase3D
          onBook={(vehicle) => {
            dispatch({ type: "SELECT_VEHICLE", vehicle });
            nav("/chuyen-di");
          }}
        />

        <section className="eco-section">
          <div className="eco-icon">
            <Leaf size={24} />
          </div>
          <div>
            <span className="eyebrow">Mỗi chuyến đi, một điều tốt đẹp</span>
            <h3>Hành trình thuần điện QSM</h3>
            <p>
              Bạn đã góp phần giảm <strong>42,8 kg CO₂</strong> cho đô thị
            </p>
          </div>
          <div className="eco-progress">
            <span>
              72<small>%</small>
            </span>
            <i />
          </div>
        </section>

        <section className="offer">
          <div className="offer-icon">
            <Ticket size={23} />
          </div>
          <div>
            <span className="eyebrow">Ưu đãi độc quyền QSM</span>
            <h3>Di chuyển xanh, giảm 25.000đ</h3>
            <p>
              Dùng mã <strong>QSM2026</strong> cho chuyến xe tiếp theo
            </p>
          </div>
          <button
            type="button"
            aria-label="Lưu mã QSM2026"
            onClick={() => {
              void navigator.clipboard?.writeText("QSM2026");
              notify("Đã sao chép mã ưu đãi QSM2026 (-25.000đ).");
            }}
          >
            Lưu mã
            <ArrowRight size={16} />
          </button>
        </section>

        <p className="home-footer">
          <Leaf size={12} />
          Đi nhẹ hơn. Sống xanh hơn. Cùng QSM (Quick Smart Mobility).
        </p>
      </div>
    </>
  );
}
