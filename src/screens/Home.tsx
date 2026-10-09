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
  ShoppingBag,
  Sparkles,
  Ticket,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRide } from "../state/RideProvider";
import { useTheme } from "../state/ThemeContext";
import VehicleShowcase3D from "../components/VehicleShowcase3D";
import Mascot from "../components/Mascot";
import GsmLogo from "../components/GsmLogo";

export default function Home() {
  const { setChatOpen, setChatDraft, dispatch, notify } = useRide();
  const { theme, toggleTheme } = useTheme();
  const [destination, setDestination] = useState("");
  const nav = useNavigate();

  return (
    <>
      <header className="app-header">
        <a className="brand" href="/" aria-label="GSM Trang chủ">
          <GsmLogo size={40} />
        </a>
        <div className="header-actions">
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
            onClick={() => notify("Bạn có thông báo mới: Giảm 25.000đ khi đi VF5 hôm nay!")}
          >
            <Bell size={20} />
            <i />
          </button>
          <button
            className="user-button"
            aria-label="Mở tài khoản"
            onClick={() => nav("/tai-khoan")}
          >
            <User size={20} />
          </button>
        </div>
      </header>
      <div className="home-content">
        <section className="welcome">
          <div>
            <p>
              Xin chào, Quang <span>👋</span>
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
              Hội viên GSM<small>Hạng Kim Cương</small>
            </span>
            <ChevronRight size={15} />
          </button>
        </section>
        <form
          className="destination-search"
          onSubmit={(e) => {
            e.preventDefault();
            setChatDraft(destination);
            setChatOpen(true);
          }}
        >
          <Navigation size={22} />
          <div>
            <label htmlFor="destination">Điểm đến</label>
            <input
              id="destination"
              placeholder="Nhập điểm đến của bạn"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <button aria-label="Đặt xe với AI">
            <Sparkles size={21} />
          </button>
        </form>
        <div className="quick-places">
          {[
            { icon: BriefcaseBusiness, name: "Đi làm" },
            { icon: HomeIcon, name: "Về nhà" },
            { icon: Plane, name: "Sân bay Nội Bài" },
            { icon: ShoppingBag, name: "Vincom" },
          ].map(({ icon: Icon, name }) => (
            <button
              key={name}
              onClick={() => {
                setDestination(name);
                setChatDraft(name);
                setChatOpen(true);
              }}
            >
              <Icon size={16} />
              {name}
            </button>
          ))}
        </div>
        <VehicleShowcase3D
          onBook={(vehicle) => {
            dispatch({ type: "SELECT_VEHICLE", vehicle });
            setChatOpen(true);
          }}
        />
        <section className="eco-section">
          <div className="eco-icon">
            <Leaf size={24} />
          </div>
          <div>
            <span className="eyebrow">Mỗi chuyến đi, một điều tốt đẹp</span>
            <h3>Hành trình xanh của bạn</h3>
            <p>
              Bạn đã góp phần giảm <strong>42,8 kg CO₂</strong>
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
            <span className="eyebrow">Ưu đãi dành cho bạn</span>
            <h3>Đi xanh, tiết kiệm 25.000đ</h3>
            <p>
              Dùng mã <strong>GSMAI25</strong> cho chuyến tiếp theo
            </p>
          </div>
          <button
            aria-label="Lưu mã GSMAI25"
            onClick={() => {
              void navigator.clipboard?.writeText("GSMAI25");
              notify("Đã lưu mã GSMAI25.");
            }}
          >
            Lưu mã
            <ArrowRight size={16} />
          </button>
        </section>
        <button
          className="assistant-invitation"
          onClick={() => setChatOpen(true)}
        >
          <Mascot />
          <span>
            <strong>Một câu nói. Một hành trình.</strong>
            <small>Để AI GSM giúp bạn tìm chuyến xe phù hợp.</small>
          </span>
          <ArrowRight size={20} />
        </button>
        <p className="home-footer">
          <Leaf size={12} />
          Đi nhẹ hơn. Sống xanh hơn. Cùng GSM.
        </p>
      </div>
    </>
  );
}
