import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Headphones,
  LocateFixed,
  MapPin,
  MessageSquare,
  Moon,
  Plus,
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  RotateCcw,
  Crown,
  Lock,
  Send,
  ShieldCheck,
  Star,
  Sun,
  TicketPercent,
  Thermometer,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
  ArrowUpDown,
  BatteryCharging,
  Gauge,
  Leaf,
  Mic,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRide } from "../state/RideProvider";
import { useAuth } from "../state/AuthProvider";
import { useTheme } from "../state/ThemeContext";
import { isActiveTrip } from "../state/rideMachine";
import {
  calculateVehicleFare,
  computeMultiStopRoute,
  computeRouteFromPlaces,
  defaultVouchers,
  driver,
  isTierEligible,
  locationDirectory,
  money,
  popularRoutes,
  TIER_NAMES,
  vehicleById,
  vehicles,
  type Place,
  type Route,
  type VehicleId,
  type Voucher,
} from "../data/catalog";
import RouteMap from "../components/RouteMap";
import { RouteDetails } from "../components/RouteDetails";
import Modal from "../components/Modal";
import LocationPickerModal from "../components/LocationPickerModal";
import { reverseGeocodeCoords } from "../services/geocodeService";
import { tripApiService, type DriverMessageItem } from "../services/tripService";

const tripStepTitles = {
  SEARCHING_DRIVER: "Đang kết nối tài xế QSM gần bạn…",
  DRIVER_ASSIGNED: "Tài xế đã tiếp nhận chuyến xe",
  DRIVER_ARRIVING: "Tài xế đang đến điểm đón",
  DRIVER_ARRIVED: "Tài xế đã đến điểm đón",
  TRIP_STARTED: "Hành trình đang diễn ra",
  TRIP_COMPLETED: "Chuyến đi hoàn tất",
};

const CANCEL_REASONS = [
  "Thay đổi lịch trình đột xuất",
  "Đặt nhầm điểm đón hoặc điểm đến",
  "Muốn đổi sang dòng xe khác",
  "Thời gian chờ tài xế lâu hơn dự kiến",
];

export default function Trip() {
  const {
    ride,
    dispatch,
    recordCancelledTrip,
    rateCompletedTrip,
    notify,
  } = useRide();
  const { user } = useAuth();
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Booking & Route state
  const [selectedRoute, setSelectedRoute] = useState<Route>(
    ride.route || popularRoutes[0],
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<VehicleId>(
    ride.vehicle || "vf5",
  );
  const [paymentMethod, setPaymentMethod] = useState("Ví QSM Pay");
  const [pickerMode, setPickerMode] = useState<
    "pickup" | "destination" | "stop" | null
  >(null);

  // Voucher / Promotion state
  const [vouchersList, setVouchersList] = useState<Voucher[]>(defaultVouchers);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(
    defaultVouchers[0],
  );
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [manualVoucherCode, setManualVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Scheduled Ride state
  const [rideBookingType, setRideBookingType] = useState<"instant" | "scheduled">(
    "instant",
  );
  const [scheduledDate, setScheduledDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [scheduledTime, setScheduledTime] = useState(() => {
    const d = new Date(Date.now() + 35 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  // In-cabin comfort preferences
  const [cabinTemp, setCabinTemp] = useState(23);
  const [quietTrip, setQuietTrip] = useState(true);

  // Modals & interaction state
  const [cancel, setCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [contact, setContact] = useState<"call" | "message" | "support" | null>(
    null,
  );
  const [driverMessage, setDriverMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<DriverMessageItem[]>([
    {
      id: "msg-init-1",
      trip_id: "current",
      sender_role: "driver",
      sender_name: driver.name,
      content: `Chào bạn, mình là tài xế QSM (${driver.name} · ${driver.plate}). Mình đang di chuyển đúng lộ trình tới điểm đón nhé!`,
      created_at: new Date().toISOString(),
    },
  ]);
  const [callActive, setCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [stars, setStars] = useState(5);
  const [rated, setRated] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Lái xe êm ái",
    "Xe sạch không mùi",
  ]);
  const [progress, setProgress] = useState(0);

  const sheet = useRef<HTMLElement>(null);
  const v = vehicleById(ride.vehicle || selectedVehicleId);
  const searching = ride.status === "SEARCHING_DRIVER";
  const started = ride.status === "TRIP_STARTED";
  const complete = ride.status === "TRIP_COMPLETED";
  const active = isActiveTrip(ride.status);

  // Đồng bộ lộ trình đã chọn từ trang chủ
  useEffect(() => {
    if (ride.route) setSelectedRoute(ride.route);
    if (ride.vehicle) setSelectedVehicleId(ride.vehicle);
  }, [ride.route, ride.vehicle]);

  // Đồng bộ danh sách voucher hoạt động từ Backend
  useEffect(() => {
    tripApiService
      .getVouchers()
      .then((res) => {
        if (res.vouchers && res.vouchers.length > 0) {
          setVouchersList(res.vouchers);
          const currentTier = user?.membership_tier || "standard";
          const activeFirst =
            res.vouchers.find(
              (v) =>
                v.code === "QSM2026" &&
                v.is_active &&
                isTierEligible(currentTier, v.target_tier),
            ) ||
            res.vouchers.find(
              (v) => v.is_active && isTierEligible(currentTier, v.target_tier),
            );
          if (activeFirst) {
            setSelectedVoucher(activeFirst);
          } else {
            setSelectedVoucher(null);
          }
        }
      })
      .catch(() => {});
  }, [user?.membership_tier]);

  useEffect(() => {
    if (started || complete) {
      sheet.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [started, complete]);

  // Tiến độ di chuyển thực tế trên bản đồ
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

  // Đồng hồ đếm thời gian cuộc gọi
  useEffect(() => {
    if (!callActive) {
      setCallSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callActive]);

  const formatCallTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Đặt xe trực tiếp & đồng bộ Backend API theo đúng tài khoản đang đăng nhập
  const handleBookNow = () => {
    if (!user) {
      notify("Vui lòng đăng nhập tài khoản để đặt xe và lưu lịch sử chuyến đi.");
      nav("/dang-nhap");
      return;
    }
    const localCode = "QSM-" + Math.floor(100000 + Math.random() * 900000);
    dispatch({ type: "SELECT_VEHICLE", vehicle: selectedVehicleId });
    dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
    dispatch({ type: "SET_ROUTE", route: selectedRoute });
    dispatch({ type: "PAYMENT", payment: paymentMethod });
    dispatch({ type: "TRANSITION", status: "RESOLVING_LOCATION" });
    dispatch({ type: "TRANSITION", status: "LOCATION_CONFIRMED" });
    dispatch({ type: "TRANSITION", status: "QUOTED" });
    dispatch({ type: "TRANSITION", status: "AWAITING_CONFIRMATION" });
    dispatch({ type: "BOOKED", id: localCode });
    setRated(false);
    notify(`Đã gửi yêu cầu đặt ${v.name} (Mã: ${localCode})!`);

    // Ghi nhận cuốc xe lên Backend gắn với đúng user.id và trip_code
    const scheduledAtISO =
      rideBookingType === "scheduled" && scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
        : undefined;

    void tripApiService
      .book({
        trip_code: localCode,
        vehicle_type:
          selectedVehicleId === "bike"
            ? "bike"
            : selectedVehicleId === "limo"
              ? "luxury"
              : "car",
        pickup_address: `${selectedRoute.pickup.name}, ${selectedRoute.pickup.address}`,
        pickup_coords: selectedRoute.pickup.coords,
        dest_address: `${selectedRoute.destination.name}, ${selectedRoute.destination.address}`,
        dest_coords: selectedRoute.destination.coords,
        stops: selectedRoute.stops?.map((st) => ({
          name: st.name,
          address: st.address,
          coords: st.coords,
        })),
        scheduled_at: scheduledAtISO,
        distance_km: selectedRoute.distance,
        duration_mins: selectedRoute.duration,
        voucher_code: selectedVoucher?.code,
        payment_method:
          paymentMethod === "Tiền mặt"
            ? "cash"
            : paymentMethod === "Thẻ Visa/Mastercard"
              ? "card"
              : paymentMethod === "VNPay QR"
                ? "vnpay"
                : "qsm_wallet",
      })
      .catch(() => {
        // Fallback giữ nguyên trạng thái đặt xe trên client của user hiện tại
      });
  };

  // Chuyển bước trạng thái vận hành chuyến đi
  const handleNextStage = () => {
    const bId = ride.bookingId || "QSM-071026";
    if (ride.status === "SEARCHING_DRIVER") {
      dispatch({ type: "TRANSITION", status: "DRIVER_ASSIGNED" });
      notify(`Tài xế ${driver.name} (${driver.plate}) đã tiếp nhận chuyến!`);
    } else if (ride.status === "DRIVER_ASSIGNED") {
      dispatch({ type: "TRANSITION", status: "DRIVER_ARRIVING" });
      notify("Tài xế đang đến điểm đón (khoảng 3 phút).");
    } else if (ride.status === "DRIVER_ARRIVING") {
      dispatch({ type: "TRANSITION", status: "DRIVER_ARRIVED" });
      notify("Tài xế đã đến điểm đón. Vui lòng kiểm tra biển số xe.");
    } else if (ride.status === "DRIVER_ARRIVED") {
      dispatch({ type: "TRANSITION", status: "TRIP_STARTED" });
      void tripApiService.updateStatus(bId, "IN_TRANSIT").catch(() => {});
      notify("Hành trình đang diễn ra.");
    } else if (ride.status === "TRIP_STARTED") {
      dispatch({ type: "TRANSITION", status: "TRIP_COMPLETED" });
      void tripApiService.updateStatus(bId, "COMPLETED").catch(() => {});
      notify(`Chuyến đi hoàn tất! Đã thanh toán thành công qua ${ride.payment || paymentMethod}.`);
    }
  };

  const handleSendDriverMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = driverMessage.trim();
    if (!text) return;

    const userMsg: DriverMessageItem = {
      id: "msg-u-" + Date.now(),
      trip_id: ride.bookingId || "current",
      sender_role: "user",
      sender_name: "Bạn",
      content: text,
      created_at: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setDriverMessage("");

    const bId = ride.bookingId || "trp-06";
    void tripApiService
      .sendMessage(bId, text)
      .then((res) => {
        if (res.reply) {
          setChatHistory((prev) => [...prev, res.reply]);
        }
      })
      .catch(() => {
        setTimeout(() => {
          setChatHistory((prev) => [
            ...prev,
            {
              id: "msg-d-" + Date.now(),
              trip_id: bId,
              sender_role: "driver",
              sender_name: driver.name,
              content:
                "Vâng bác tài đã nhận được tin nhắn nhé! Mình sẽ lưu ý đúng yêu cầu của bạn.",
              created_at: new Date().toISOString(),
            },
          ]);
        }, 600);
      });
  };

  const handleUpdateRoute = (nextRoute: Route) => {
    setSelectedRoute(nextRoute);
    dispatch({ type: "SET_ROUTE", route: nextRoute });
  };

  const handleAddStop = (place: Place) => {
    const currentStops = selectedRoute.stops || [];
    if (currentStops.length >= 2) {
      notify("Tối đa 2 điểm dừng trung gian cho một chuyến đi.");
      return;
    }
    const nextStops = [...currentStops, place];
    const nextRoute = computeMultiStopRoute(
      selectedRoute.pickup,
      nextStops,
      selectedRoute.destination,
    );
    handleUpdateRoute(nextRoute);
    notify(`Đã thêm điểm dừng: ${place.name}`);
  };

  const handleRemoveStop = (stopIndex: number) => {
    const currentStops = selectedRoute.stops || [];
    const nextStops = currentStops.filter((_, idx) => idx !== stopIndex);
    const nextRoute = computeMultiStopRoute(
      selectedRoute.pickup,
      nextStops,
      selectedRoute.destination,
    );
    handleUpdateRoute(nextRoute);
    notify("Đã xóa điểm dừng khỏi hành trình.");
  };

  const handleApplyVoucherCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualVoucherCode.trim().toUpperCase();
    if (!code) return;
    setVoucherLoading(true);
    setVoucherError("");

    const currentTier = user?.membership_tier || "standard";

    try {
      const res = await tripApiService.applyVoucher(code, currentFare, currentTier);
      if (res.valid) {
        const found = vouchersList.find((v) => v.code === code) || {
          code,
          title: res.title,
          discount_amount: res.discount_amount,
          discount_type: "fixed" as const,
          min_order_val: res.min_order_val,
          target_tier: res.target_tier || "all",
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          is_active: true,
        };
        setSelectedVoucher(found);
        setShowVoucherModal(false);
        setManualVoucherCode("");
        notify(`Áp dụng mã ${code} thành công (-${money(res.discount_amount)})!`);
      } else {
        setVoucherError(res.message || "Mã không hợp lệ hoặc không đủ điều kiện.");
      }
    } catch (err: unknown) {
      // Local fallback check
      const matched = vouchersList.find(
        (v) => v.code.toUpperCase() === code && v.is_active,
      );
      if (matched) {
        if (!isTierEligible(currentTier, matched.target_tier)) {
          const reqName = TIER_NAMES[matched.target_tier || "all"] || matched.target_tier;
          const curName = TIER_NAMES[currentTier] || currentTier;
          setVoucherError(
            `Mã "${matched.code}" là đặc quyền dành riêng cho ${reqName}. Thứ hạng của bạn là "${curName}". Hãy nâng hạng hội viên để tận hưởng đặc quyền!`,
          );
        } else if (matched.min_order_val && currentFare < matched.min_order_val) {
          setVoucherError(
            `Đơn hàng cần tối thiểu ${money(matched.min_order_val)} để áp dụng mã này.`,
          );
        } else {
          setSelectedVoucher(matched);
          setShowVoucherModal(false);
          setManualVoucherCode("");
          notify(`Áp dụng thành công mã ${matched.code}!`);
        }
      } else {
        setVoucherError(
          err instanceof Error
            ? err.message
            : "Mã khuyến mãi không tồn tại hoặc đã hết hạn.",
        );
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleQuickGpsLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      notify("Thiết bị chưa hỗ trợ định vị GPS tự động.");
      return;
    }
    notify("Đang định vị GPS điểm đón của bạn...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLng = Number(pos.coords.longitude.toFixed(5));
        const userLat = Number(pos.coords.latitude.toFixed(5));

        const gpsPlace = await reverseGeocodeCoords(
          userLng,
          userLat,
          "Vị trí GPS hiện tại của bạn",
        );

        const nextRoute = computeMultiStopRoute(
          gpsPlace,
          selectedRoute.stops,
          selectedRoute.destination,
        );
        handleUpdateRoute(nextRoute);
        notify(`Đã cập nhật điểm đón: ${gpsPlace.name}`);
      },
      () => {
        setPickerMode("pickup");
        notify("Vui lòng chọn điểm đón từ danh sách hoặc chạm lên bản đồ.");
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const activeRouteForFare =
    active || complete ? ride.route : selectedRoute;
  const currentFare = calculateVehicleFare(
    selectedVehicleId,
    activeRouteForFare.distance,
  );
  const userTier = user?.membership_tier || "standard";
  const isTierQualified =
    selectedVoucher && isTierEligible(userTier, selectedVoucher.target_tier);
  const voucherDiscount =
    selectedVoucher && isTierQualified
      ? selectedVoucher.min_order_val && currentFare < selectedVoucher.min_order_val
        ? 0
        : selectedVoucher.discount_type === "percent"
          ? Math.round((currentFare * selectedVoucher.discount_amount) / 100)
          : selectedVoucher.discount_amount
      : 0;
  const finalFare = Math.max(15000, currentFare - voucherDiscount);

  return (
    <div className="trip-screen gsm-trip-cockpit">
      {/* Cockpit Header */}
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
            <h1>
              {active
                ? "Theo dõi hành trình"
                : complete
                  ? "Hóa đơn & Đánh giá"
                  : "Đặt xe QSM"}
            </h1>
          </div>
          <div className="radar-status-badge">
            <Radio size={12} className="spin-slow" />
            <span>
              {active
                ? "Định vị GPS trực tiếp"
                : "Chạm bản đồ hoặc ô địa chỉ để đổi Điểm đón / Điểm đến"}
            </span>
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
            aria-label="Hỗ trợ QSM"
            onClick={() => setContact("support")}
          >
            <Headphones size={20} />
          </button>
        </div>
      </header>

      {/* Interactive Real Map View */}
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
          interactivePick={!active && !complete}
          onGpsLocate={async (coords) => {
            if (!active && !complete) {
              const gpsPlace = await reverseGeocodeCoords(
                coords[0],
                coords[1],
                "Vị trí GPS của bạn",
              );
              handleUpdateRoute(
                computeRouteFromPlaces(gpsPlace, selectedRoute.destination),
              );
              notify(`Đã cập nhật điểm đón: ${gpsPlace.name}`);
            }
          }}
          onMapSelectPlace={(target, place) => {
            if (active || complete) return;
            const nextRoute =
              target === "pickup"
                ? computeRouteFromPlaces(place, selectedRoute.destination)
                : computeRouteFromPlaces(selectedRoute.pickup, place);
            handleUpdateRoute(nextRoute);
            notify(
              target === "pickup"
                ? `Đã ghim điểm đón mới: ${place.name}`
                : `Đã ghim điểm đến mới: ${place.name}`,
            );
          }}
        />

        <div className="trip-map-badge">
          <ShieldCheck size={14} />
          {complete
            ? "Chuyến đi hoàn tất an toàn"
            : "Được bảo chứng bởi QSM SafeTrip"}
        </div>
      </div>

      {/* Bottom Sheet Cockpit */}
      <section className="trip-sheet" ref={sheet}>
        <div className="sheet-handle" />

        {/* ===================================================================
            STATE 1: PRE-BOOKING & VEHICLE SELECTOR
            =================================================================== */}
        {!active && !complete ? (
          <div className="prebooking-panel">
            {/* Interactive Route Selector (Pickup, Stops & Destination) */}
            <div className="route-select-box interactive">
              <div
                className="route-point pickup-point clickable-point"
                role="button"
                tabIndex={0}
                onClick={() => setPickerMode("pickup")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setPickerMode("pickup");
                }}
              >
                <span className="point-dot pickup" />
                <div className="point-info">
                  <small>Điểm đón · Chạm để đổi hoặc ghim trên bản đồ</small>
                  <strong>{selectedRoute.pickup.name}</strong>
                  <span>{selectedRoute.pickup.address}</span>
                </div>
                <div className="point-actions">
                  <button
                    type="button"
                    className="point-mini-btn gps"
                    onClick={handleQuickGpsLocate}
                    title="Lấy vị trí GPS hiện tại làm điểm đón"
                  >
                    <LocateFixed size={14} />
                    <span>GPS</span>
                  </button>
                  <span className="point-edit-pill">
                    <Edit3 size={12} />
                    Đổi
                  </span>
                </div>
              </div>

              {/* Intermediate Stops */}
              {selectedRoute.stops &&
                selectedRoute.stops.map((stopItem, idx) => (
                  <div
                    key={`stop-item-${idx}-${stopItem.name}`}
                    className="route-point stop-point clickable-point"
                  >
                    <span className="point-dot stop-dot">{idx + 1}</span>
                    <div className="point-info">
                      <small>Điểm dừng {idx + 1} (dọc đường)</small>
                      <strong>{stopItem.name}</strong>
                      <span>{stopItem.address}</span>
                    </div>
                    <div className="point-actions">
                      <button
                        type="button"
                        className="point-remove-stop-btn"
                        title="Xóa điểm dừng này"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStop(idx);
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}

              {/* Add Stop Button */}
              {(selectedRoute.stops?.length || 0) < 2 && (
                <div className="add-stop-row">
                  <button
                    type="button"
                    className="add-stop-inline-btn"
                    onClick={() => setPickerMode("stop")}
                  >
                    <Plus size={14} />
                    <span>
                      + Thêm điểm dừng đón/trả ({selectedRoute.stops?.length || 0}/2)
                    </span>
                  </button>
                </div>
              )}

              <div className="route-divider-with-swap">
                <div className="route-divider" />
                <button
                  type="button"
                  className="route-swap-circle-btn"
                  title="Đảo chiều điểm đón và điểm đến"
                  onClick={() => {
                    const revStops = selectedRoute.stops
                      ? [...selectedRoute.stops].reverse()
                      : undefined;
                    const swapped = computeMultiStopRoute(
                      selectedRoute.destination,
                      revStops,
                      selectedRoute.pickup,
                    );
                    handleUpdateRoute(swapped);
                    notify("Đã đảo chiều Điểm đón ⇄ Điểm đến.");
                  }}
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>

              <div
                className="route-point destination-point clickable-point"
                role="button"
                tabIndex={0}
                onClick={() => setPickerMode("destination")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setPickerMode("destination");
                }}
              >
                <span className="point-dot dest" />
                <div className="point-info">
                  <small>Điểm đến · Chạm để tìm địa chỉ khác</small>
                  <strong>{selectedRoute.destination.name}</strong>
                  <span>{selectedRoute.destination.address}</span>
                </div>
                <div className="point-actions">
                  <span className="point-edit-pill">
                    <Edit3 size={12} />
                    Đổi
                  </span>
                </div>
              </div>
            </div>

            {/* Scheduled Ride Selector */}
            <div className="schedule-ride-card">
              <div className="schedule-type-toggle">
                <button
                  type="button"
                  className={`schedule-toggle-btn ${rideBookingType === "instant" ? "active" : ""}`}
                  onClick={() => setRideBookingType("instant")}
                >
                  <Zap size={14} />
                  <span>Đi ngay lập tức</span>
                </button>
                <button
                  type="button"
                  className={`schedule-toggle-btn ${rideBookingType === "scheduled" ? "active" : ""}`}
                  onClick={() => setRideBookingType("scheduled")}
                >
                  <Calendar size={14} />
                  <span>Hẹn giờ đón xe</span>
                </button>
              </div>

              {rideBookingType === "scheduled" && (
                <div className="schedule-pickers-box">
                  <div className="schedule-inputs-row">
                    <label className="schedule-field">
                      <span>Ngày đón:</span>
                      <input
                        type="date"
                        value={scheduledDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </label>
                    <label className="schedule-field">
                      <span>Giờ hẹn:</span>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="schedule-shortcuts">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 30 * 60 * 1000);
                        setScheduledDate(d.toISOString().split("T")[0]);
                        setScheduledTime(
                          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
                        );
                      }}
                    >
                      +30 phút
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 60 * 60 * 1000);
                        setScheduledDate(d.toISOString().split("T")[0]);
                        setScheduledTime(
                          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
                        );
                      }}
                    >
                      +1 giờ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
                        setScheduledDate(d.toISOString().split("T")[0]);
                        setScheduledTime(
                          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
                        );
                      }}
                    >
                      +2 giờ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date(
                          Date.now() + 24 * 60 * 60 * 1000,
                        );
                        setScheduledDate(tomorrow.toISOString().split("T")[0]);
                        setScheduledTime("08:00");
                      }}
                    >
                      Sáng mai (08:00)
                    </button>
                  </div>
                  <p className="schedule-note">
                    <Clock size={12} /> Tài xế QSM sẽ liên hệ trước giờ đón 10 phút. Hủy chuyến miễn phí trước 20 phút.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Pickup Locations Carousel */}
            <div className="quick-dest-list">
              <div className="quick-dest-header-row">
                <span className="quick-dest-title">Chọn nhanh Điểm đón:</span>
                <button
                  type="button"
                  className="quick-open-picker-link"
                  onClick={() => setPickerMode("pickup")}
                >
                  Tìm kiếm tất cả ({locationDirectory.length} điểm) ➔
                </button>
              </div>
              <div className="quick-dest-scroll">
                {locationDirectory.slice(0, 8).map((place) => {
                  const isSelected =
                    selectedRoute.pickup.name === place.name;
                  return (
                    <button
                      key={`pickup-${place.name}`}
                      type="button"
                      className={`dest-chip pickup-chip ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        const next = computeRouteFromPlaces(
                          place,
                          selectedRoute.destination,
                        );
                        handleUpdateRoute(next);
                      }}
                    >
                      <LocateFixed size={12} />
                      <span>{place.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Destinations Carousel */}
            <div className="quick-dest-list">
              <div className="quick-dest-header-row">
                <span className="quick-dest-title">Chọn nhanh Điểm đến:</span>
                <button
                  type="button"
                  className="quick-open-picker-link"
                  onClick={() => setPickerMode("destination")}
                >
                  Nhập địa chỉ khác ➔
                </button>
              </div>
              <div className="quick-dest-scroll">
                {popularRoutes.map((r) => {
                  const isSelected =
                    selectedRoute.destination.name === r.destination.name;
                  return (
                    <button
                      key={r.destination.name}
                      type="button"
                      className={`dest-chip ${isSelected ? "selected" : ""}`}
                      onClick={() =>
                        handleUpdateRoute(
                          computeRouteFromPlaces(
                            selectedRoute.pickup,
                            r.destination,
                          ),
                        )
                      }
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
              <span className="tier-header-label">
                Chọn dịch vụ xe thuần điện QSM ({selectedRoute.distance} km · ~
                {selectedRoute.duration} phút):
              </span>
              <div className="vehicle-tier-list">
                {vehicles.map((vItem) => {
                  const isChosen = selectedVehicleId === vItem.id;
                  const itemFare = calculateVehicleFare(
                    vItem.id,
                    selectedRoute.distance,
                  );
                  return (
                    <div
                      key={vItem.id}
                      className={`vehicle-tier-card ${isChosen ? "active" : ""}`}
                      onClick={() => setSelectedVehicleId(vItem.id)}
                    >
                      <div className="tier-img-box">
                        <img
                          src={vItem.image}
                          alt={vItem.name}
                          className="tier-vehicle-img"
                        />
                      </div>
                      <div className="tier-main-info">
                        <div className="tier-name-row">
                          <strong>{vItem.name}</strong>
                          <span className="tier-eta">~{vItem.eta} phút</span>
                        </div>
                        <p>
                          {vItem.realModelName} · {vItem.capacity} chỗ
                        </p>
                        <div className="tier-tech-specs">
                          <span className="tier-co2">{vItem.co2Saving}</span>
                          <span className="tier-battery">
                            {vItem.battery.split(" ")[1]}
                          </span>
                        </div>
                      </div>
                      <div className="tier-price-box">
                        <strong className="tier-price">{money(itemFare)}</strong>
                        {selectedVoucher && voucherDiscount > 0 && (
                          <small className="tier-discount">-{money(voucherDiscount)}</small>
                        )}
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
                  <Thermometer size={15} /> Nhiệt độ cabin yêu cầu:
                </span>
                <div className="temp-stepper">
                  <button
                    type="button"
                    onClick={() => setCabinTemp((t) => Math.max(18, t - 1))}
                  >
                    -
                  </button>
                  <strong>{cabinTemp}°C</strong>
                  <button
                    type="button"
                    onClick={() => setCabinTemp((t) => Math.min(26, t + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="pref-row">
                <span className="pref-label">
                  <VolumeX size={15} /> Không gian yên tĩnh (Hạn chế trò chuyện):
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
                className={`promo-pill ${selectedVoucher ? "active" : ""}`}
                onClick={() => setShowVoucherModal(true)}
                title="Chạm để mở ví mã ưu đãi QSM"
              >
                <TicketPercent size={15} />
                <span>
                  {selectedVoucher
                    ? `${selectedVoucher.code} (-${money(voucherDiscount)})`
                    : "Chọn mã ưu đãi QSM"}
                </span>
                <ChevronRight size={13} style={{ opacity: 0.6, marginLeft: "2px" }} />
              </div>
              <div className="payment-pill">
                <Wallet size={14} />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="payment-select"
                >
                  <option value="Ví QSM Pay">Ví QSM Pay</option>
                  <option value="VNPay QR">VNPay QR</option>
                  <option value="Thẻ Visa/Mastercard">Thẻ Visa/Mastercard</option>
                  <option value="Tiền mặt">Tiền mặt</option>
                </select>
              </div>
            </div>

            {/* Total Fare & Booking CTA */}
            <div className="booking-cta-section">
              <div className="fare-breakdown-row">
                <span>Cước phí niêm yết ({selectedRoute.distance} km)</span>
                <div className="fare-numbers">
                  {selectedVoucher && voucherDiscount > 0 && (
                    <span className="old-fare">{money(currentFare)}</span>
                  )}
                  <strong className="final-fare">{money(finalFare)}</strong>
                </div>
              </div>
              <div className="cta-button-group">
                <button
                  type="button"
                  className="button primary cta-book-now"
                  onClick={handleBookNow}
                >
                  {rideBookingType === "scheduled" ? (
                    <>
                      <Calendar size={18} />
                      <span>
                        Đặt trước {v.name} ({scheduledTime} ·{" "}
                        {scheduledDate.split("-").reverse().join("/")})
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      <span>Xác nhận đặt {v.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ===================================================================
            STATE 2: ACTIVE TRIP & TELEMETRY
            =================================================================== */}
        {active ? (
          <div className="active-trip-panel">
            {/* QSM 5-Stage Stepper */}
            <div className="trip-stepper">
              {[
                { key: "SEARCHING_DRIVER", label: "Kết nối" },
                { key: "DRIVER_ASSIGNED", label: "Nhận chuyến" },
                { key: "DRIVER_ARRIVING", label: "Đang đón" },
                { key: "TRIP_STARTED", label: "Đang đi" },
                { key: "TRIP_COMPLETED", label: "Hoàn tất" },
              ].map((step, idx) => {
                const keys = [
                  "SEARCHING_DRIVER",
                  "DRIVER_ASSIGNED",
                  "DRIVER_ARRIVING",
                  "TRIP_STARTED",
                  "TRIP_COMPLETED",
                ];
                const currentIdx = keys.indexOf(
                  ride.status === "DRIVER_ARRIVED"
                    ? "DRIVER_ARRIVING"
                    : ride.status,
                );
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;
                return (
                  <div
                    key={step.key}
                    className={`stepper-step ${isPassed ? "active" : ""} ${isCurrent ? "current" : ""}`}
                  >
                    <div className="step-dot">
                      {isPassed && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Status Heading */}
            <div className="trip-status-header">
              <span className="eyebrow">
                {searching
                  ? "Hệ thống điều phối QSM"
                  : started
                    ? "Hành trình đang diễn ra"
                    : "Tài xế đang đến điểm đón"}
              </span>
              <h2>
                {tripStepTitles[ride.status as keyof typeof tripStepTitles] ||
                  "Đang xử lý"}
              </h2>
              <p>
                {searching
                  ? "Hệ thống đang phân bổ tài xế 5 sao gần vị trí của bạn nhất..."
                  : started
                    ? `Khoảng ${Math.max(1, Math.round(ride.route.duration * (1 - progress)))} phút · Còn ${(ride.route.distance * (1 - progress)).toFixed(1)} km`
                    : ride.status === "DRIVER_ARRIVED"
                      ? "Tài xế đã có mặt tại điểm đón. Vui lòng đối chiếu biển số xe."
                      : "Dự kiến 3 phút · Cách điểm đón khoảng 650m"}
              </p>
            </div>

            {/* Real-time Journey Progress Bar */}
            {started && (
              <div className="route-progress-bar">
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${Math.round(20 + progress * 80)}%` }}
                  />
                </div>
                <div className="progress-meta">
                  <span>Tiến độ hành trình: {Math.round(20 + progress * 80)}%</span>
                  <span>Điểm đến: {ride.route.destination.name}</span>
                </div>
              </div>
            )}

            {/* Driver Card or Searching Radar */}
            {searching ? (
              <div className="searching-radar-cockpit">
                <div className="searching-radar-vehicle">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="searching-vehicle-photo"
                  />
                  <div className="searching-ping-ring" />
                  <div className="searching-ping-ring delay" />
                </div>
                <div className="searching-text-wrap">
                  <strong>Đang kết nối xe {v.name} gần bạn</strong>
                  <small>Mã đặt chuyến: {ride.bookingId}</small>
                </div>
              </div>
            ) : (
              <div className="driver-card">
                <div className="driver-top">
                  <div className="driver-avatar-real">
                    <img
                      src="/images/driver-avatar.png"
                      alt={driver.name}
                      className="driver-photo-round"
                    />
                    <span
                      className="driver-verified-badge"
                      title="Tài xế QSM 5 sao đã xác minh"
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  </div>
                  <div className="driver-info-meta">
                    <h3>{driver.name}</h3>
                    <p>
                      <Star size={14} fill="#eab308" stroke="#eab308" />
                      <strong>{driver.rating}</strong> · {driver.trips} chuyến
                    </p>
                    <span className="driver-tag">Tài xế QSM Ưu Tú</span>
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
                      <small>Vận tốc</small>
                      <strong>{started ? "45 km/h" : "28 km/h"}</strong>
                    </div>
                  </div>
                  <div className="telemetry-box">
                    <BatteryCharging size={15} />
                    <div>
                      <small>Dung lượng Pin</small>
                      <strong>86% (Chuẩn LFP)</strong>
                    </div>
                  </div>
                  <div className="telemetry-box">
                    <Leaf size={15} />
                    <div>
                      <small>Giảm phát thải</small>
                      <strong className="eco-green">-2.76 kg CO₂</strong>
                    </div>
                  </div>
                  <div className="telemetry-box">
                    <Thermometer size={15} />
                    <div>
                      <small>Nhiệt độ cabin</small>
                      <strong>{cabinTemp}°C (Lọc khí Ion)</strong>
                    </div>
                  </div>
                </div>

                {/* Driver Communication Actions */}
                <div className="actions contact-driver-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setContact("call")}
                  >
                    <Phone size={16} />
                    Gọi tài xế ({driver.phone})
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setContact("message")}
                  >
                    <MessageSquare size={16} />
                    Nhắn tin ({chatHistory.length})
                  </button>
                </div>
              </div>
            )}

            {/* Route Details */}
            <RouteDetails route={ride.route} />

            {/* Payment Row */}
            <div className="trip-payment">
              <span>
                <Wallet size={17} />
                Thanh toán qua {ride.payment || paymentMethod}
              </span>
              <strong>{money(finalFare)}</strong>
            </div>

            {/* Operational Status Progression Button */}
            <div className="simulation-stepper-control">
              <button
                type="button"
                className="button primary wide next-stage-btn"
                onClick={handleNextStage}
              >
                <span>
                  {ride.status === "SEARCHING_DRIVER"
                    ? "Kết nối ngay tài xế gần nhất"
                    : ride.status === "DRIVER_ASSIGNED"
                      ? "Cập nhật: Tài xế đang đến điểm đón"
                      : ride.status === "DRIVER_ARRIVING"
                        ? "Xác nhận: Tài xế đã đến điểm đón"
                        : ride.status === "DRIVER_ARRIVED"
                          ? "Khách đã lên xe · Bắt đầu hành trình"
                          : "Xác nhận đến nơi · Hoàn tất chuyến đi"}
                </span>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Cancel & Support Options */}
            <div className="actions trip-secondary">
              <button
                type="button"
                className="button ghost"
                onClick={() => setContact("support")}
              >
                <Headphones size={16} />
                Tổng đài QSM 24/7
              </button>
              {!started && (
                <button
                  type="button"
                  className="button ghost danger"
                  onClick={() => setCancel(true)}
                >
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
              <h2>Chuyến đi hoàn tất!</h2>
              <p>
                Đã thanh toán thành công qua{" "}
                <strong>{ride.payment || paymentMethod}</strong>.
              </p>
            </div>

            {/* Digital Receipt */}
            <dl className="summary-list">
              <div>
                <dt>Mã chuyến đi</dt>
                <dd>{ride.bookingId || "QSM-071026"}</dd>
              </div>
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
                <dt>Trạng thái thanh toán</dt>
                <dd className="eco-green">
                  Đã thanh toán qua {ride.payment || paymentMethod}
                </dd>
              </div>
              <div>
                <dt>Tổng thanh toán</dt>
                <dd className="fare-dd">{money(finalFare)}</dd>
              </div>
            </dl>

            {/* Star Rating & Feedback */}
            <div className="rating">
              <h3>Đánh giá tài xế {driver.name}</h3>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
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
              <p className="stars-label">
                {stars === 5
                  ? "Dịch vụ xuất sắc 5 sao!"
                  : `Bạn đánh giá ${stars} sao`}
              </p>

              {/* Feedback Quick Tags */}
              <div className="feedback-tags">
                {[
                  "Lái xe êm ái",
                  "Xe sạch không mùi",
                  "Bác tài lịch sự",
                  "Đúng giờ",
                  "Nhiệt độ dễ chịu",
                ].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`feedback-tag ${isSelected ? "selected" : ""}`}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          isSelected
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag],
                        )
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <label className="field" style={{ marginTop: "12px", textAlign: "left" }}>
                <span>Nhận xét thêm cho tài xế:</span>
                <input
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="Nhập cảm nhận của bạn về chuyến xe..."
                />
              </label>
            </div>

            <button
              type="button"
              className="button primary wide"
              disabled={rated}
              onClick={() => {
                const combinedNote = [
                  ...selectedTags,
                  feedbackNote.trim(),
                ]
                  .filter(Boolean)
                  .join(" · ");
                const bId = ride.bookingId || "QSM-071026";
                setRated(true);
                rateCompletedTrip(bId, stars, combinedNote);
                void tripApiService.rate(bId, stars, combinedNote).catch(() => {});
                notify(
                  `Đã ghi nhận đánh giá ${stars} sao. QSM xin chân thành cảm ơn quý khách!`,
                );
              }}
            >
              {rated ? "Đã gửi đánh giá thành công" : "Gửi đánh giá dịch vụ"}
              <Check size={18} />
            </button>

            <div className="actions completed-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  dispatch({ type: "RESET" });
                  notify("Sẵn sàng đặt chuyến xe mới cùng QSM.");
                }}
              >
                <RotateCcw size={16} />
                Đặt chuyến xe mới
              </button>
              <button
                type="button"
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
          Hệ thống điều hành xe thuần điện QSM 2026 · An toàn & Bảo mật
        </small>
      </section>

      {/* =====================================================================
          MODALS: CANCELLATION & DRIVER CONTACT (CALL / MESSAGE / SUPPORT)
          ===================================================================== */}
      {cancel && (
        <Modal title="Xác nhận hủy chuyến xe" onClose={() => setCancel(false)}>
          <p>
            Quý khách vui lòng chọn lý do hủy chuyến <strong>{v.name}</strong> (Mã:{" "}
            <strong>{ride.bookingId || "QSM"}</strong>):
          </p>
          <div className="quick-messages-chips" style={{ marginBottom: "14px" }}>
            {CANCEL_REASONS.map((r) => (
              <button
                type="button"
                key={r}
                className={`quick-msg-chip ${cancelReason === r ? "selected" : ""}`}
                style={{
                  borderColor:
                    cancelReason === r ? "var(--brand)" : "var(--line-color)",
                }}
                onClick={() => setCancelReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: "12.5px", marginBottom: "14px" }}>
            Quy định hủy chuyến QSM: Miễn phí hủy khi tài xế chưa đến điểm đón.
            {ride.status === "DRIVER_ARRIVED"
              ? " Do tài xế đã có mặt tại điểm đón, phí hỗ trợ di chuyển là 15.000đ."
              : ""}
          </p>
          <div className="modal-cta-col">
            <button
              type="button"
              className="button primary wide"
              onClick={() => setCancel(false)}
            >
              Tiếp tục giữ chuyến xe
            </button>
            <button
              type="button"
              className="button ghost danger wide"
              onClick={() => {
                const bId =
                  ride.bookingId ||
                  "QSM-" + Math.floor(100000 + Math.random() * 900000);
                recordCancelledTrip({
                  id: bId,
                  route: ride.route,
                  vehicle: ride.vehicle,
                  reason: cancelReason,
                });
                void tripApiService.cancel(bId, cancelReason).catch(() => {});
                dispatch({ type: "RESET" });
                setCancel(false);
                notify(`Đã hủy chuyến ${bId} (${cancelReason}).`);
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
              ? "Liên hệ tài xế QSM"
              : contact === "message"
                ? `Trò chuyện với tài xế ${driver.name}`
                : "Trung tâm Hỗ trợ QSM 24/7"
          }
          onClose={() => {
            setContact(null);
            setCallActive(false);
          }}
        >
          {contact === "call" ? (
            <div className="mock-call-dialog">
              <div className="call-avatar-wrap">
                <img
                  src="/images/driver-avatar.png"
                  alt={driver.name}
                  className="call-avatar"
                />
                <span className="call-pulse-ring" />
              </div>
              <h3>{driver.name}</h3>
              <p className="call-subtitle">
                {v.name} · Biển số {driver.plate} · SĐT: {driver.phone}
              </p>
              <div className="call-status-indicator">
                {callActive ? (
                  <span className="calling-timer">
                    Đang đàm thoại VoIP QSM: {formatCallTime(callSeconds)}
                  </span>
                ) : (
                  <span>Kết nối qua tổng đài VoIP bảo mật hoặc gọi di động</span>
                )}
              </div>
              <div className="call-controls-row">
                <button
                  type="button"
                  className="call-ctrl-btn"
                  onClick={() => notify("Đã chuyển trạng thái Mic")}
                  title="Tắt/Bật mic"
                >
                  <Mic size={20} />
                </button>
                <button
                  type="button"
                  className="call-ctrl-btn"
                  onClick={() => notify("Đã chuyển trạng thái Loa ngoài")}
                  title="Loa ngoài"
                >
                  <Volume2 size={20} />
                </button>
                {!callActive ? (
                  <button
                    type="button"
                    className="call-action-btn answer"
                    onClick={() => {
                      setCallActive(true);
                      notify("Đã kết nối thoại VoIP với tài xế.");
                    }}
                    title="Gọi trực tuyến VoIP"
                  >
                    <PhoneCall size={22} />
                  </button>
                ) : (
                  <button
                    type="button"
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
              <a
                href={`tel:${driver.phone}`}
                className="button secondary wide"
                style={{
                  marginTop: "14px",
                  textDecoration: "none",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Phone size={16} />
                <span>Gọi qua mạng di động ({driver.phone})</span>
              </a>
            </div>
          ) : contact === "message" ? (
            <div className="driver-chat-modal">
              <div
                className="driver-chat-messages"
                style={{
                  maxHeight: "220px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "14px",
                  padding: "8px",
                  borderRadius: "12px",
                  background: "var(--bg-elevated)",
                }}
              >
                {chatHistory.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf:
                        m.sender_role === "user" ? "flex-end" : "flex-start",
                      background:
                        m.sender_role === "user"
                          ? "var(--brand)"
                          : "var(--bg-card)",
                      color:
                        m.sender_role === "user"
                          ? "var(--brand-on)"
                          : "var(--text-main)",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      maxWidth: "85%",
                      fontSize: "13.5px",
                      border: "1px solid var(--line-color)",
                    }}
                  >
                    <strong style={{ display: "block", fontSize: "11px", opacity: 0.8 }}>
                      {m.sender_name}
                    </strong>
                    <span>{m.content}</span>
                  </div>
                ))}
              </div>

              <form className="mock-message-form" onSubmit={handleSendDriverMessage}>
                <div className="quick-messages-chips">
                  {[
                    "Tôi đang đứng ở sảnh chính",
                    "Bác tài đến cứ gọi điện nhé",
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
                  <span>Tin nhắn gửi tài xế:</span>
                  <input
                    value={driverMessage}
                    onChange={(e) => setDriverMessage(e.target.value)}
                    placeholder="Nhập tin nhắn cho bác tài..."
                    required
                  />
                </label>
                <button type="submit" className="button primary wide">
                  <Send size={16} />
                  <span>Gửi tin nhắn</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="support-dialog-content">
              <p>
                Trung tâm Điều hành & Chăm sóc Khách hàng QSM trực 24/7 nhằm bảo
                đảm an toàn tuyệt đối cho mọi hành trình của quý khách.
              </p>
              <div className="support-hotline-card">
                <small>Tổng đài Chăm sóc Khách hàng QSM</small>
                <strong>1900 2088</strong>
                <span>(Hỗ trợ khẩn cấp & giải đáp cước phí 24/7)</span>
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
                <span>Gọi ngay Tổng đài 1900 2088</span>
              </a>
            </div>
          )}
        </Modal>
      )}

      {showVoucherModal && (
        <Modal
          title="Mã Khuyến Mãi & Ưu Đãi QSM"
          onClose={() => {
            setShowVoucherModal(false);
            setVoucherError("");
          }}
        >
          <div className="voucher-picker-modal">
            {/* Manual Code Input Form */}
            <form onSubmit={handleApplyVoucherCode} className="voucher-input-bar">
              <input
                type="text"
                placeholder="Nhập mã ưu đãi (VD: QSM2026, DIENGREEN)..."
                value={manualVoucherCode}
                onChange={(e) => setManualVoucherCode(e.target.value.toUpperCase())}
                autoFocus
              />
              <button
                type="submit"
                className="button primary"
                disabled={voucherLoading || !manualVoucherCode.trim()}
              >
                {voucherLoading ? "Kiểm tra..." : "Áp dụng"}
              </button>
            </form>

            {voucherError && (
              <div className="voucher-error-hint">{voucherError}</div>
            )}

            {/* User Membership Tier Status Bar */}
            <div className="voucher-user-tier-bar">
              <div className="voucher-tier-info">
                <span>Thứ hạng hội viên của bạn:</span>
                <strong>
                  {user ? (
                    user.membership_tier === "platinum" ? (
                      <span className="user-tier-pill platinum">
                        <Crown size={13} /> Kim Cương (VIP)
                      </span>
                    ) : user.membership_tier === "gold" ? (
                      <span className="user-tier-pill gold">
                        <Star size={13} fill="#eab308" stroke="#eab308" /> Hạng Vàng
                      </span>
                    ) : (
                      <span className="user-tier-pill standard">
                        Hội viên Tiêu chuẩn
                      </span>
                    )
                  ) : (
                    <span className="user-tier-pill guest">
                      Khách vãng lai (Chưa đăng nhập)
                    </span>
                  )}
                </strong>
              </div>
              {!user && (
                <button
                  type="button"
                  className="voucher-login-link"
                  onClick={() => {
                    setShowVoucherModal(false);
                    nav("/dang-nhap");
                  }}
                >
                  Đăng nhập để nhận mã VIP ➔
                </button>
              )}
            </div>

            {/* List of Available Vouchers */}
            <div className="vouchers-list-scroll">
              <h4 className="vouchers-section-title">
                Ưu đãi dành riêng cho bạn ({vouchersList.length}):
              </h4>
              <div className="voucher-cards-grid">
                {vouchersList.map((voc) => {
                  const isApplied = selectedVoucher?.code === voc.code;
                  const currentTier = user?.membership_tier || "standard";
                  const hasTierAccess = isTierEligible(currentTier, voc.target_tier);
                  const meetsMinOrder =
                    !voc.min_order_val || currentFare >= voc.min_order_val;
                  const discountDisplay =
                    voc.discount_type === "percent"
                      ? `${voc.discount_amount}%`
                      : money(voc.discount_amount);

                  return (
                    <div
                      key={voc.code}
                      className={`voucher-card-item ${isApplied ? "applied" : ""} ${
                        !hasTierAccess
                          ? "tier-locked"
                          : !meetsMinOrder
                            ? "disabled"
                            : ""
                      }`}
                    >
                      <div className="voucher-card-left">
                        <div className="voucher-badge">
                          <TicketPercent size={18} />
                          <strong>Giảm {discountDisplay}</strong>
                        </div>
                        <div className="voucher-details">
                          <h5 className="voucher-code-title">
                            <code>{voc.code}</code>
                            {voc.target_tier && voc.target_tier !== "all" && (
                              <span className={`voucher-tier-badge tier-${voc.target_tier}`}>
                                {voc.target_tier === "platinum"
                                  ? "👑 VIP Kim Cương"
                                  : "🥇 Hạng Vàng+"}
                              </span>
                            )}
                            <span> · {voc.title}</span>
                          </h5>
                          <span className="voucher-condition">
                            {voc.min_order_val
                              ? `Đơn tối thiểu ${money(voc.min_order_val)}`
                              : "Không giới hạn giá trị tối thiểu"}
                          </span>
                          <span className="voucher-expiry">
                            HSD: {new Date(voc.expires_at).toLocaleDateString("vi-VN")}
                          </span>
                          {!hasTierAccess && (
                            <small className="voucher-tier-lock-note">
                              <Lock size={12} /> Yêu cầu {TIER_NAMES[voc.target_tier || "all"]} (Bạn đang ở: {TIER_NAMES[currentTier]})
                            </small>
                          )}
                          {hasTierAccess && !meetsMinOrder && voc.min_order_val && (
                            <small className="voucher-ineligible-note">
                              Cần thêm {money(voc.min_order_val - currentFare)} để sử dụng
                            </small>
                          )}
                        </div>
                      </div>

                      <div className="voucher-card-right">
                        {isApplied ? (
                          <button
                            type="button"
                            className="voucher-action-btn applied"
                            onClick={() => {
                              setSelectedVoucher(null);
                              notify("Đã hủy áp dụng mã ưu đãi.");
                            }}
                          >
                            <Check size={14} />
                            <span>Đang dùng</span>
                          </button>
                        ) : !hasTierAccess ? (
                          <button
                            type="button"
                            className="voucher-action-btn locked"
                            disabled
                            title={`Cần thứ hạng ${TIER_NAMES[voc.target_tier || "all"]} để mở khóa mã này`}
                          >
                            <Lock size={13} />
                            <span>Khóa VIP</span>
                          </button>
                        ) : !meetsMinOrder ? (
                          <button
                            type="button"
                            className="voucher-action-btn select"
                            disabled
                            title={`Cần tối thiểu ${money(voc.min_order_val || 0)}`}
                          >
                            Chưa đủ đơn
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="voucher-action-btn select"
                            onClick={() => {
                              setSelectedVoucher(voc);
                              setShowVoucherModal(false);
                              notify(`Đã áp dụng mã ${voc.code}!`);
                            }}
                          >
                            Sử dụng
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedVoucher && (
                <button
                  type="button"
                  className="button secondary wide remove-voucher-btn"
                  onClick={() => {
                    setSelectedVoucher(null);
                    setShowVoucherModal(false);
                    notify("Đã gỡ bỏ mã khuyến mãi.");
                  }}
                >
                  Không áp dụng mã khuyến mãi cho chuyến này
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {pickerMode && (
        <LocationPickerModal
          initialMode={pickerMode}
          currentRoute={selectedRoute}
          onSelectRoute={(nextRoute) => handleUpdateRoute(nextRoute)}
          onSelectStop={(place) => handleAddStop(place)}
          onClose={() => setPickerMode(null)}
          onNotify={notify}
        />
      )}
    </div>
  );
}
