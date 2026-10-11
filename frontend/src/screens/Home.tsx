import { useState } from "react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  Edit3,
  Home as HomeIcon,
  Leaf,
  LocateFixed,
  MapPin,
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
import {
  computeRouteFromPlaces,
  locationDirectory,
  popularRoutes,
  type Place,
} from "../data/catalog";
import VehicleShowcase3D from "../components/VehicleShowcase3D";
import QsmLogo from "../components/QsmLogo";
import LocationPickerModal from "../components/LocationPickerModal";
import { geocodeSearch, reverseGeocodeCoords } from "../services/geocodeService";

export default function Home() {
  const { ride, history, dispatch, notify } = useRide();
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [destination, setDestination] = useState("");
  const [pickerMode, setPickerMode] = useState<"pickup" | "destination" | null>(
    null,
  );
  const nav = useNavigate();

  const currentRoute = ride.route || popularRoutes[0];

  const firstName = user?.name
    ? user.name.trim().split(/\s+/).slice(-1)[0]
    : "Khách";

  const completedTrips = history.filter((t) => t.status === "completed");
  const co2SavedKg = (
    completedTrips.reduce((sum, t) => sum + t.route.distance * 0.24, 0)
  )
    .toFixed(2)
    .replace(".", ",");
  const ecoProgressPct = Math.min(100, completedTrips.length * 20);

  const handleSelectQuickDestination = async (placeName: string) => {
    setDestination(placeName);

    // 1. Kiểm tra danh mục mẫu hoặc tuyến phổ biến
    const matchedDest =
      locationDirectory.find((p) =>
        p.name.toLowerCase().includes(placeName.toLowerCase()),
      ) ||
      popularRoutes.find((r) =>
        r.destination.name.toLowerCase().includes(placeName.toLowerCase()),
      )?.destination;

    let targetDest: Place;
    if (matchedDest) {
      targetDest = matchedDest;
    } else {
      notify(`Đang tìm kiếm tọa độ thực tế cho "${placeName}"...`);
      const geocoded = await geocodeSearch(placeName);
      targetDest = geocoded || {
        name: placeName,
        address: `${placeName}, Hà Nội`,
        coords: [105.8542, 21.0285] as [number, number],
      };
    }

    const nextRoute = computeRouteFromPlaces(currentRoute.pickup, targetDest);

    dispatch({ type: "RESET" });
    dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
    dispatch({ type: "SET_ROUTE", route: nextRoute });
    nav("/chuyen-di");
  };

  const handleHomeGpsPickup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      setPickerMode("pickup");
      return;
    }
    notify("Đang lấy vị trí GPS hiện tại của bạn...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLng = Number(pos.coords.longitude.toFixed(5));
        const userLat = Number(pos.coords.latitude.toFixed(5));

        const gpsPlace = await reverseGeocodeCoords(
          userLng,
          userLat,
          "Vị trí GPS hiện tại của bạn",
        );

        const updated = computeRouteFromPlaces(
          gpsPlace,
          currentRoute.destination,
        );
        dispatch({ type: "SET_ROUTE", route: updated });
        notify(`Đã cập nhật điểm đón: ${gpsPlace.name}`);
      },
      () => {
        setPickerMode("pickup");
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
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

        {/* Quick Pickup Selector Bar right on Home Screen */}
        <div
          className="home-pickup-bar"
          role="button"
          tabIndex={0}
          onClick={() => setPickerMode("pickup")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setPickerMode("pickup");
          }}
        >
          <div className="home-pickup-left">
            <span className="home-pickup-dot" />
            <div className="home-pickup-text">
              <small>Điểm đón hiện tại (Chạm để đổi nhanh)</small>
              <strong>{currentRoute.pickup.name}</strong>
              <span>{currentRoute.pickup.address}</span>
            </div>
          </div>
          <div className="home-pickup-actions">
            <button
              type="button"
              className="point-mini-btn gps"
              onClick={handleHomeGpsPickup}
              title="Định vị GPS điểm đón hiện tại"
            >
              <LocateFixed size={13} />
              <span>GPS</span>
            </button>
            <span className="point-edit-pill">
              <Edit3 size={12} />
              Đổi
            </span>
          </div>
        </div>

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
          <button
            type="button"
            className="search-open-modal-btn"
            onClick={() => setPickerMode("destination")}
            title="Chọn điểm đến từ danh mục địa điểm"
          >
            <MapPin size={17} />
          </button>
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
              Tài khoản của bạn đã giảm <strong>{co2SavedKg} kg CO₂</strong> (
              {completedTrips.length} chuyến)
            </p>
          </div>
          <div className="eco-progress">
            <span>
              {ecoProgressPct}
              <small>%</small>
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

      {pickerMode && (
        <LocationPickerModal
          initialMode={pickerMode}
          currentRoute={currentRoute}
          onSelectRoute={(nextRoute) => {
            dispatch({ type: "SET_ROUTE", route: nextRoute });
            if (pickerMode === "destination") {
              setDestination(nextRoute.destination.name);
              nav("/chuyen-di");
            }
          }}
          onClose={() => setPickerMode(null)}
          onNotify={notify}
        />
      )}
    </>
  );
}
