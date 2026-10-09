import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  Headphones,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Wallet,
  Zap,
  MapPin,
  RotateCcw,
  Sparkles,
  Tag,
  Radio,
  ChevronRight,
  Thermometer,
  VolumeX,
  Gauge,
  BatteryCharging,
  Leaf,
  PhoneCall,
  PhoneOff,
  Mic,
  Volume2,
  Sun,
  Moon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRide } from "../state/RideProvider";
import { useTheme } from "../state/ThemeContext";
import { isActiveTrip } from "../state/rideMachine";
import {
  driver,
  money,
  popularRoutes,
  vehicleById,
  vehicles,
} from "../data/catalog";
import type { Route, VehicleId } from "../data/catalog";
import RouteMap from "../components/RouteMap";
import { RouteDetails } from "../components/chat/SmartCards";
import Modal from "../components/Modal";
import Mascot from "../components/Mascot";

const tripStepTitles = {
  SEARCHING_DRIVER: "Đang tìm tài xế phù hợp quanh bạn…",
  DRIVER_ASSIGNED: "Đã tìm thấy tài xế!",
  DRIVER_ARRIVING: "Tài xế đang đến điểm đón",
  DRIVER_ARRIVED: "Tài xế đã đến sảnh đón",
  TRIP_STARTED: "Bạn đang trên hành trình di chuyển",
  TRIP_COMPLETED: "Chuyến đi đã hoàn thành an toàn",
};

export default function Trip() {
  const { ride, dispatch, setChatOpen, notify } = useRide();
  const nav = useNavigate();

  const { theme, toggleTheme } = useTheme();

  // Booking & Route state (for pre-booking mode)
  const [selectedRoute, setSelectedRoute] = useState<Route>(ride.route || popularRoutes[0]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<VehicleId>(ride.vehicle || "vf5");
  const [paymentMethod, setPaymentMethod] = useState("Ví Xanh SM");
  const [promoApplied, setPromoApplied] = useState(true);

  // In-cabin comfort preferences
  const [cabinTemp, setCabinTemp] = useState(23);
  const [quietTrip, setQuietTrip] = useState(true);

  // Modals & interaction state
  const [cancel, setCancel] = useState(false);
  const [contact, setContact] = useState<"call" | "message" | "support" | null>(null);
  const [driverMessage, setDriverMessage] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [stars, setStars] = useState(5);
  const [rated, setRated] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Lái xe êm ái", "Xe sạch không mùi"]);
  const [progress, setProgress] = useState(0);

  const sheet = useRef<HTMLElement>(null);
  const v = vehicleById(ride.vehicle || selectedVehicleId);
  const searching = ride.status === "SEARCHING_DRIVER";
  const started = ride.status === "TRIP_STARTED";
  const complete = ride.status === "TRIP_COMPLETED";
  const active = isActiveTrip(ride.status);

  // Smooth scroll when trip starts or completes
  useEffect(() => {
    if (started || complete) sheet.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [started, complete]);

  // Trip progress simulation
  useEffect(() => {
    if (!started) {
      setProgress(0);
      return;
    }
    const timer = setInterval(() => {
      setProgress((p) => Math.min(1, p + 0.04));
    }, 1000);
    return () => clearInterval(timer);
  }, [started]);

  // Handle instant booking
  const handleBookNow = () => {
    const bookingId = "GSM-" + Math.floor(100000 + Math.random() * 900000);
    dispatch({ type: "SELECT_VEHICLE", vehicle: selectedVehicleId });
    dispatch({ type: "SET_ROUTE", route: selectedRoute });
    dispatch({ type: "PAYMENT", payment: paymentMethod });
    dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
    dispatch({ type: "TRANSITION", status: "RESOLVING_LOCATION" });
    dispatch({ type: "TRANSITION", status: "LOCATION_CONFIRMED" });
    dispatch({ type: "TRANSITION", status: "QUOTED" });
    dispatch({ type: "TRANSITION", status: "AWAITING_CONFIRMATION" });
    dispatch({ type: "BOOKED", id: bookingId });
    notify("Hệ thống GSM đang điều phối xe gần bạn nhất...");
  };

  // Step accelerator for demo / simulation testing
  const handleNextStage = () => {
    if (ride.status === "SEARCHING_DRIVER") {
      dispatch({ type: "TRANSITION", status: "DRIVER_ASSIGNED" });
      notify("Tài xế Nguyễn Minh Nam đã nhận chuyến!");
    } else if (ride.status === "DRIVER_ASSIGNED") {
      dispatch({ type: "TRANSITION", status: "DRIVER_ARRIVING" });
      notify("Tài xế đang di chuyển đến điểm đón (khoảng 3 phút).");
    } else if (ride.status === "DRIVER_ARRIVING") {
      dispatch({ type: "TRANSITION", status: "DRIVER_ARRIVED" });
      notify("Tài xế đã đến sảnh đón!");
    } else if (ride.status === "DRIVER_ARRIVED") {
      dispatch({ type: "TRANSITION", status: "TRIP_STARTED" });
      notify("Bắt đầu hành trình di chuyển cùng GSM.");
    } else if (ride.status === "TRIP_STARTED") {
      dispatch({ type: "TRANSITION", status: "TRIP_COMPLETED" });
      notify("Hành trình hoàn tất! Cảm ơn bạn đã đồng hành cùng GSM.");
    }
  };

  const currentFare = selectedVehicleId === "bike" ? 72000 : selectedVehicleId === "vf5" ? 128000 : 185000;
  const finalFare = promoApplied ? Math.max(20000, currentFare - 25000) : currentFare;

  return (
    <div className="trip-screen gsm-trip-cockpit">
      {/* Cockpit Header - Consistent with Home.tsx app-header */}
      <header className="screen-header app-header-unified">
        <button
          className="icon-button back-nav-btn"
          aria-label="Về trang chủ"
          onClick={() => nav("/")}
        >
          <ChevronLeft size={22} />
        </button>
        <div className="header-title-block">
          <div className="header-brand-line">
            <span className="brand-dot-pulse" />
            <h1>{active ? "Theo dõi chuyến đi" : complete ? "Chi tiết hành trình" : "Điều phối GSM"}</h1>
          </div>
          <div className="radar-status-badge">
            <Radio size={12} className="spin-slow" />
            <span>{active ? "Vệ tinh GPS trực tiếp" : "16 xe thuần điện sẵn sàng · Đón ~2 phút"}</span>
          </div>
        </div>
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
            className="icon-button"
            aria-label="Hỗ trợ GSM"
            onClick={() => setContact("support")}
          >
            <Headphones size={20} />
          </button>
        </div>
      </header>

      {/* Interactive Map View */}
      <div className="trip-map">
        <RouteMap
          route={active || complete ? ride.route : selectedRoute}
          mode={
            searching
              ? "search"
              : started
                ? "trip"
                : complete
                  ? "route"
                  : "pickup"
          }
          progress={progress}
        />

        <div className="trip-map-badge">
          <ShieldCheck size={14} />
          {complete ? "Hành trình an toàn 100%" : "Được bảo chứng bởi GSM SafeTrip"}
        </div>

        {/* Quick AI Assistant Floater */}
        {!complete && (
          <button className="ask-trip-ai" onClick={() => setChatOpen(true)}>
            <Mascot headOnly size={22} />
            <span>{active ? "Hỏi AI về chuyến đi" : "AI Gợi ý lộ trình"}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Bottom Sheet Cockpit */}
      <section className="trip-sheet" ref={sheet}>
        <div className="sheet-handle" />

        {/* ===================================================================
            STATE 1: PRE-BOOKING & VEHICLE SELECTOR (When no trip is active)
            =================================================================== */}
        {!active && !complete ? (
          <div className="prebooking-panel">
            {/* Route Selector Chips */}
            <div className="route-select-box">
              <div className="route-point pickup-point">
                <span className="point-dot pickup" />
                <div className="point-info">
                  <small>Điểm đón (Vị trí hiện tại)</small>
                  <strong>{selectedRoute.pickup.name}</strong>
                  <span>{selectedRoute.pickup.address}</span>
                </div>
              </div>
              <div className="route-divider" />
              <div className="route-point destination-point">
                <span className="point-dot dest" />
                <div className="point-info">
                  <small>Điểm đến</small>
                  <strong>{selectedRoute.destination.name}</strong>
                  <span>{selectedRoute.destination.address}</span>
                </div>
              </div>
            </div>

            {/* Quick Destinations Carousel */}
            <div className="quick-dest-list">
              <span className="quick-dest-title">Gợi ý lộ trình GSM:</span>
              <div className="quick-dest-scroll">
                {popularRoutes.map((r) => {
                  const isSelected = selectedRoute.destination.name === r.destination.name;
                  return (
                    <button
                      key={r.destination.name}
                      className={`dest-chip ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedRoute(r)}
                    >
                      <MapPin size={13} />
                      <span>{r.destination.name}</span>
                      <small>~{r.duration}p</small>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Selection Cards */}
            <div className="service-tier-selection">
              <span className="tier-header-label">Chọn phương tiện thuần điện GSM:</span>
              <div className="vehicle-tier-list">
                {vehicles.map((vItem) => {
                  const isChosen = selectedVehicleId === vItem.id;
                  const itemFare = vItem.id === "bike" ? 72000 : vItem.id === "vf5" ? 128000 : 185000;
                  return (
                    <div
                      key={vItem.id}
                      className={`vehicle-tier-card ${isChosen ? "active" : ""}`}
                      onClick={() => setSelectedVehicleId(vItem.id)}
                    >
                      <div className="tier-img-box">
                        <img src={vItem.image} alt={vItem.name} className="tier-vehicle-img" />
                      </div>
                      <div className="tier-main-info">
                        <div className="tier-name-row">
                          <strong>{vItem.name}</strong>
                          <span className="tier-eta">~{vItem.eta} phút</span>
                        </div>
                        <p>{vItem.label} · {vItem.capacity} chỗ</p>
                        <div className="tier-tech-specs">
                          <span className="tier-co2">{vItem.co2Saving}</span>
                          <span className="tier-battery">{vItem.battery.split(" ")[1]}</span>
                        </div>
                      </div>
                      <div className="tier-price-box">
                        <strong className="tier-price">{money(itemFare)}</strong>
                        {promoApplied && <small className="tier-discount">-25.000đ</small>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* In-Cabin Comfort Customizer */}
            <div className="in-cabin-preferences">
              <div className="pref-row">
                <span className="pref-label">
                  <Thermometer size={15} /> Nhiệt độ cabin:
                </span>
                <div className="temp-stepper">
                  <button onClick={() => setCabinTemp((t) => Math.max(18, t - 1))}>-</button>
                  <strong>{cabinTemp}°C</strong>
                  <button onClick={() => setCabinTemp((t) => Math.min(26, t + 1))}>+</button>
                </div>
              </div>
              <div className="pref-row">
                <span className="pref-label">
                  <VolumeX size={15} /> Chuyến đi yên tĩnh (Không trò chuyện):
                </span>
                <input
                  type="checkbox"
                  className="pref-toggle"
                  checked={quietTrip}
                  onChange={(e) => setQuietTrip(e.target.checked)}
                />
              </div>
            </div>

            {/* Promo & Payment Row */}
            <div className="booking-meta-bar">
              <div
                className="promo-pill"
                onClick={() => {
                  setPromoApplied(!promoApplied);
                  notify(promoApplied ? "Đã gỡ mã ưu đãi." : "Đã áp dụng mã GSMAI25 (-25.000đ)");
                }}
              >
                <Tag size={14} />
                <span>GSMAI25 {promoApplied ? "(Đã áp dụng)" : "(Chạm để dùng)"}</span>
              </div>
              <div className="payment-pill">
                <Wallet size={14} />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="payment-select"
                >
                  <option value="Ví Xanh SM">Ví Xanh SM</option>
                  <option value="Thẻ Visa/Mastercard">Thẻ Visa/Mastercard</option>
                  <option value="Tiền mặt">Tiền mặt</option>
                </select>
              </div>
            </div>

            {/* Total Fare & Booking CTAs */}
            <div className="booking-cta-section">
              <div className="fare-breakdown-row">
                <span>Cước phí ước tính ({selectedRoute.distance} km)</span>
                <div className="fare-numbers">
                  {promoApplied && <span className="old-fare">{money(currentFare)}</span>}
                  <strong className="final-fare">{money(finalFare)}</strong>
                </div>
              </div>
              <div className="cta-button-group">
                <button className="button primary cta-book-now" onClick={handleBookNow}>
                  <Zap size={18} />
                  <span>Xác nhận đặt {v.name}</span>
                </button>
                <button
                  className="button secondary cta-demo-trip"
                  onClick={() => {
                    handleBookNow();
                    notify("Bắt đầu mô phỏng quy trình đón xe GSM!");
                  }}
                >
                  <Sparkles size={16} />
                  <span>Chạy mô phỏng toàn bộ (Demo)</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ===================================================================
            STATE 2: ACTIVE TRIP & TELEMETRY (Driver assigned / on the way)
            =================================================================== */}
        {active ? (
          <div className="active-trip-panel">
            {/* GSM 5-Stage Stepper */}
            <div className="trip-stepper">
              {[
                { key: "SEARCHING_DRIVER", label: "Tìm xe" },
                { key: "DRIVER_ASSIGNED", label: "Nhận chuyến" },
                { key: "DRIVER_ARRIVING", label: "Đang đón" },
                { key: "TRIP_STARTED", label: "Đang đi" },
                { key: "TRIP_COMPLETED", label: "Đến nơi" },
              ].map((step, idx) => {
                const keys = ["SEARCHING_DRIVER", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "TRIP_STARTED", "TRIP_COMPLETED"];
                const currentIdx = keys.indexOf(ride.status === "DRIVER_ARRIVED" ? "DRIVER_ARRIVING" : ride.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;
                return (
                  <div key={step.key} className={`stepper-step ${isPassed ? "active" : ""} ${isCurrent ? "current" : ""}`}>
                    <div className="step-dot">{isPassed && <Check size={11} strokeWidth={3} />}</div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Status Heading */}
            <div className="trip-status-header">
              <span className="eyebrow">{searching ? "Đang kết nối vệ tinh GSM" : started ? "Hành trình xanh đang diễn ra" : "Tài xế đã sẵn sàng"}</span>
              <h2>{tripStepTitles[ride.status as keyof typeof tripStepTitles] || "Đang xử lý"}</h2>
              <p>
                {searching
                  ? "Thuật toán GSM AI đang ưu tiên tài xế 5 sao gần nhất..."
                  : started
                    ? `Khoảng ${Math.max(1, Math.round(18 - progress * 17))} phút · Còn ${(7.2 - progress * 6.8).toFixed(1)} km`
                    : ride.status === "DRIVER_ARRIVED"
                      ? "Bác tài đang đợi tại sảnh chính điểm đón."
                      : "Khoảng 3 phút · Cách điểm đón 650m"}
              </p>
            </div>

            {/* Real-time Journey Progress Bar */}
            {started && (
              <div className="route-progress-bar">
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.round(20 + progress * 80)}%` }} />
                </div>
                <div className="progress-meta">
                  <span>Tiến độ: {Math.round(20 + progress * 80)}%</span>
                  <span>Điểm đến: {ride.route.destination.name}</span>
                </div>
              </div>
            )}

            {/* Driver Card or Searching Radar */}
            {searching ? (
              <div className="searching-radar-cockpit">
                <div className="searching-radar-vehicle">
                  <img src={v.image} alt={v.name} className="searching-vehicle-photo" />
                  <div className="searching-ping-ring" />
                  <div className="searching-ping-ring delay" />
                </div>
                <div className="searching-text-wrap">
                  <strong>Đang tìm xe {v.name} quanh bạn</strong>
                  <small>Điều phối tự động qua mạng lưới GSM Cloud 2026</small>
                </div>
              </div>
            ) : (
              <div className="driver-card">
                <div className="driver-top">
                  <div className="driver-avatar-real">
                    <img src="/images/driver-avatar.png" alt={driver.name} className="driver-photo-round" />
                    <span className="driver-verified-badge" title="Tài xế GSM 5 sao đã xác minh">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  </div>
                  <div className="driver-info-meta">
                    <h3>{driver.name}</h3>
                    <p>
                      <Star size={14} fill="#eab308" stroke="#eab308" />
                      <strong>{driver.rating}</strong> · {driver.trips} chuyến
                    </p>
                    <span className="driver-tag">Tài xế VinFast Ưu Tú</span>
                  </div>
                  <div className="plate">
                    <small>Biển số xe</small>
                    <strong>{driver.plate}</strong>
                    <span>{v.name}</span>
                  </div>
                </div>

                {/* Live Cockpit Telemetry */}
                <div className="cockpit-telemetry-grid">
                  <div className="telemetry-box">
                    <Gauge size={15} />
                    <div>
                      <small>Tốc độ hiện tại</small>
                      <strong>{started ? "42 km/h" : "0 km/h"}</strong>
                    </div>
                  </div>
                  <div className="telemetry-box">
                    <BatteryCharging size={15} />
                    <div>
                      <small>Pin xe điện</small>
                      <strong>78% (Ternary)</strong>
                    </div>
                  </div>
                  <div className="telemetry-box">
                    <Leaf size={15} />
                    <div>
                      <small>Giảm phát thải</small>
                      <strong className="eco-green">-1.82 kg CO₂</strong>
                    </div>
                  </div>
                  <div className="telemetry-box">
                    <Thermometer size={15} />
                    <div>
                      <small>Nhiệt độ khoang</small>
                      <strong>{cabinTemp}°C (Lọc Ion)</strong>
                    </div>
                  </div>
                </div>

                {/* Driver Communication Actions */}
                <div className="actions contact-driver-actions">
                  <button className="button secondary" onClick={() => setContact("call")}>
                    <Phone size={16} />
                    Gọi tài xế
                  </button>
                  <button className="button secondary" onClick={() => setContact("message")}>
                    <MessageSquare size={16} />
                    Nhắn tin
                  </button>
                </div>
              </div>
            )}

            {/* Route Details */}
            <RouteDetails route={ride.route} />

            {/* Payment & Next Stage Controls */}
            <div className="trip-payment">
              <span>
                <Wallet size={17} />
                {ride.payment || paymentMethod}
              </span>
              <strong>{money(v.fare)}</strong>
            </div>

            {/* Live Accelerator Button */}
            <div className="simulation-stepper-control">
              <button className="button primary wide next-stage-btn" onClick={handleNextStage}>
                <span>
                  {ride.status === "SEARCHING_DRIVER"
                    ? "Mô phỏng: Tài xế nhận chuyến"
                    : ride.status === "DRIVER_ASSIGNED"
                      ? "Mô phỏng: Bác tài đang đến"
                      : ride.status === "DRIVER_ARRIVING"
                        ? "Mô phỏng: Bác tài đã tới sảnh"
                        : ride.status === "DRIVER_ARRIVED"
                          ? "Bắt đầu hành trình di chuyển"
                          : "Hoàn tất chuyến đi"}
                </span>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Cancel & Support Options */}
            <div className="actions trip-secondary">
              <button className="button ghost" onClick={() => setContact("support")}>
                <Headphones size={16} />
                Hỗ trợ GSM 24/7
              </button>
              {!started && (
                <button className="button ghost danger" onClick={() => setCancel(true)}>
                  Hủy chuyến
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* ===================================================================
            STATE 3: COMPLETED TRIP & DIGITAL RECEIPT & RATING
            =================================================================== */}
        {complete ? (
          <div className="completed-trip-panel">
            <div className="complete-banner">
              <div className="complete-check-icon">
                <Check size={28} strokeWidth={3} />
              </div>
              <h2>Đã đến nơi an toàn!</h2>
              <p>Cảm ơn bạn đã lựa chọn phương thức di chuyển thuần điện cùng GSM.</p>
            </div>

            {/* Digital Receipt */}
            <dl className="summary-list">
              <div>
                <dt>Điểm đón</dt>
                <dd>{ride.route.pickup.name}</dd>
              </div>
              <div>
                <dt>Điểm đến</dt>
                <dd>{ride.route.destination.name}</dd>
              </div>
              <div>
                <dt>Thời gian di chuyển</dt>
                <dd>{ride.route.duration} phút</dd>
              </div>
              <div>
                <dt>Quãng đường thực tế</dt>
                <dd>{String(ride.route.distance).replace(".", ",")} km</dd>
              </div>
              <div>
                <dt>CO₂ đã cắt giảm</dt>
                <dd className="eco-green">-2.76 kg CO₂</dd>
              </div>
              <div>
                <dt>Tổng cước phí</dt>
                <dd className="fare-dd">{money(v.fare)}</dd>
              </div>
            </dl>

            {/* Star Rating & Feedback */}
            <div className="rating">
              <h3>Đánh giá dịch vụ chuyến đi</h3>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    aria-label={`Đánh giá ${n} sao`}
                    className={stars >= n ? "star-active" : ""}
                    onClick={() => setStars(n)}
                  >
                    <Star
                      size={32}
                      fill={stars >= n ? "#f59e0b" : "transparent"}
                      stroke={stars >= n ? "#f59e0b" : "#64748b"}
                    />
                  </button>
                ))}
              </div>
              <p className="stars-label">{stars === 5 ? "Dịch vụ xuất sắc 5 sao!" : `Bạn chọn ${stars} sao`}</p>

              {/* Feedback Quick Tags */}
              <div className="feedback-tags">
                {["Lái xe êm ái", "Xe sạch không mùi", "Bác tài lịch sự", "Đúng giờ", "Nhiệt độ dễ chịu"].map(
                  (tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        className={`feedback-tag ${isSelected ? "selected" : ""}`}
                        onClick={() =>
                          setSelectedTags((prev) =>
                            isSelected ? prev.filter((t) => t !== tag) : [...prev, tag],
                          )
                        }
                      >
                        {tag}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <button
              className="button primary wide"
              disabled={rated}
              onClick={() => {
                setRated(true);
                notify(`Đã lưu đánh giá ${stars} sao. Cảm ơn phản hồi quý giá của bạn!`);
              }}
            >
              {rated ? "Đã gửi đánh giá thành công" : "Gửi đánh giá dịch vụ"}
              <Check size={18} />
            </button>

            <div className="actions completed-actions">
              <button
                className="button secondary"
                onClick={() => {
                  dispatch({ type: "RESET" });
                  notify("Sẵn sàng cho chuyến xe mới cùng GSM.");
                }}
              >
                <RotateCcw size={16} />
                Đặt chuyến xe mới
              </button>
              <button
                className="button ghost"
                onClick={() => {
                  dispatch({ type: "RESET" });
                  nav("/");
                }}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        ) : null}

        <small className="simulation-note">
          <Clock size={12} />
          Hệ thống điều phối xe thuần điện GSM 2026 · Xanh & Thông minh
        </small>
      </section>

      {/* =====================================================================
          MODALS: CANCELLATION & DRIVER CONTACT (CALL / MESSAGE / SUPPORT)
          ===================================================================== */}
      {cancel && (
        <Modal title="Xác nhận hủy chuyến xe?" onClose={() => setCancel(false)}>
          <p>
            Bạn có chắc chắn muốn hủy chuyến <strong>{v.name}</strong> này không? Bác tài đang trên đường đến đón bạn.
          </p>
          <div className="modal-cta-col">
            <button className="button primary wide" onClick={() => setCancel(false)}>
              Tiếp tục chuyến đi
            </button>
            <button
              className="button ghost danger wide"
              onClick={() => {
                dispatch({ type: "RESET" });
                setCancel(false);
                notify("Đã hủy chuyến xe.");
              }}
            >
              Xác nhận hủy chuyến
            </button>
          </div>
        </Modal>
      )}

      {contact && (
        <Modal
          title={
            contact === "call"
              ? "Cuộc gọi thoại bảo mật GSM"
              : contact === "message"
                ? "Nhắn tin với tài xế"
                : "Trung tâm Hỗ trợ GSM 24/7"
          }
          onClose={() => {
            setContact(null);
            setCallActive(false);
          }}
        >
          {contact === "call" ? (
            <div className="mock-call-dialog">
              <div className="call-avatar-wrap">
                <img src="/images/driver-avatar.png" alt={driver.name} className="call-avatar" />
                <span className="call-pulse-ring" />
              </div>
              <h3>{driver.name}</h3>
              <p className="call-subtitle">Tài xế VinFast Ưu Tú · Biển số {driver.plate}</p>
              <div className="call-status-indicator">
                {callActive ? (
                  <span className="calling-timer">Đang trong cuộc gọi: 00:18</span>
                ) : (
                  <span>Đang kết nối qua tổng đài mã hóa GSM...</span>
                )}
              </div>
              <div className="call-controls-row">
                <button
                  className="call-ctrl-btn"
                  onClick={() => notify("Đã bật/tắt mic")}
                  title="Tắt/Bật mic"
                >
                  <Mic size={20} />
                </button>
                <button
                  className="call-ctrl-btn"
                  onClick={() => notify("Đã bật loa ngoài")}
                  title="Loa ngoài"
                >
                  <Volume2 size={20} />
                </button>
                {!callActive ? (
                  <button
                    className="call-action-btn answer"
                    onClick={() => {
                      setCallActive(true);
                      notify("Đã kết nối với bác tài.");
                    }}
                    title="Bắt đầu nói chuyện"
                  >
                    <PhoneCall size={22} />
                  </button>
                ) : (
                  <button
                    className="call-action-btn end"
                    onClick={() => {
                      setContact(null);
                      setCallActive(false);
                      notify("Đã kết thúc cuộc gọi.");
                    }}
                    title="Kết thúc cuộc gọi"
                  >
                    <PhoneOff size={22} />
                  </button>
                )}
              </div>
            </div>
          ) : contact === "message" ? (
            <form
              className="mock-message-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (driverMessage.trim()) {
                  notify(`Đã gửi: "${driverMessage}"`);
                  setDriverMessage("");
                  setContact(null);
                }
              }}
            >
              <div className="quick-messages-chips">
                {[
                  "Tôi đang đứng ở sảnh chính",
                  "Bác tài đến cứ bấm còi nhé",
                  "Tôi đang xuống thang máy",
                ].map((txt) => (
                  <button
                    type="button"
                    key={txt}
                    className="quick-msg-chip"
                    onClick={() => setDriverMessage(txt)}
                  >
                    {txt}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Nội dung tin nhắn:</span>
                <input
                  value={driverMessage}
                  onChange={(e) => setDriverMessage(e.target.value)}
                  placeholder="Nhập tin nhắn gửi bác tài..."
                  required
                />
              </label>
              <button className="button primary wide">Gửi cho tài xế</button>
            </form>
          ) : (
            <div className="support-dialog-content">
              <p>
                Đội ngũ Hỗ trợ GSM luôn trực 24/7 để đảm bảo trải nghiệm an tâm tuyệt đối của bạn trên mọi hành trình.
              </p>
              <div className="support-hotline-card">
                <small>Tổng đài Chăm sóc Khách hàng</small>
                <strong>1900 2088</strong>
                <span>(Miễn phí cước gọi nội địa)</span>
              </div>
              <button
                className="button primary wide"
                onClick={() => {
                  setContact(null);
                  setChatOpen(true);
                }}
              >
                Trò chuyện với Trợ lý AI GSM
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
