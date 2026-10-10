import { useState } from "react";
import {
  ArrowLeftRight,
  Building,
  GraduationCap,
  LocateFixed,
  MapPin,
  Navigation,
  Plane,
  Search,
  ShoppingBag,
} from "lucide-react";
import {
  locationDirectory,
  type Place,
  type PlaceCategory,
  type Route,
  computeRouteFromPlaces,
} from "../data/catalog";
import Modal from "./Modal";

interface LocationPickerModalProps {
  initialMode: "pickup" | "destination";
  currentRoute: Route;
  onSelectRoute: (updatedRoute: Route) => void;
  onClose: () => void;
  onNotify?: (msg: string) => void;
}

const CATEGORIES: Array<"Tất cả" | PlaceCategory> = [
  "Tất cả",
  "Khu đô thị",
  "TT Thương mại",
  "Sân bay & Bến xe",
  "Trường & Bệnh viện",
  "Điểm trung tâm",
];

export default function LocationPickerModal({
  initialMode,
  currentRoute,
  onSelectRoute,
  onClose,
  onNotify,
}: LocationPickerModalProps) {
  const [activeMode, setActiveMode] = useState<"pickup" | "destination">(
    initialMode,
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"Tất cả" | PlaceCategory>("Tất cả");
  const [locatingGps, setLocatingGps] = useState(false);

  const filteredPlaces = locationDirectory.filter((p) => {
    if (category !== "Tất cả" && p.category !== category) return false;
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.address.toLowerCase().includes(query)
    );
  });

  const handleChoosePlace = (place: Place) => {
    let nextRoute: Route;
    if (activeMode === "pickup") {
      nextRoute = computeRouteFromPlaces(place, currentRoute.destination);
      onNotify?.(`Đã chọn điểm đón: "${place.name}"`);
    } else {
      nextRoute = computeRouteFromPlaces(currentRoute.pickup, place);
      onNotify?.(`Đã chọn điểm đến: "${place.name}"`);
    }
    onSelectRoute(nextRoute);
    onClose();
  };

  const handleCustomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) return;

    // Tìm xem có địa điểm nào khớp không, nếu không tạo một Place tùy chỉnh
    const matched = locationDirectory.find(
      (p) => p.name.toLowerCase() === query.toLowerCase(),
    );

    const customPlace: Place = matched || {
      name: query,
      address: `${query}, Hà Nội`,
      coords: [
        105.82 + (Math.random() * 0.08 - 0.04),
        21.02 + (Math.random() * 0.08 - 0.04),
      ],
      category: "Điểm trung tâm",
    };

    handleChoosePlace(customPlace);
  };

  const handleSwapRoute = () => {
    const swapped = computeRouteFromPlaces(
      currentRoute.destination,
      currentRoute.pickup,
    );
    onSelectRoute(swapped);
    onNotify?.("Đã đảo chiều lộ trình đón và đến.");
  };

  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      onNotify?.("Thiết bị hoặc trình duyệt chưa hỗ trợ định vị GPS.");
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGps(false);
        const userCoords: [number, number] = [
          Number(pos.coords.longitude.toFixed(5)),
          Number(pos.coords.latitude.toFixed(5)),
        ];
        const gpsPlace: Place = {
          name: "Vị trí GPS của bạn",
          address: `Tọa độ: ${userCoords[1]}, ${userCoords[0]}`,
          coords: userCoords,
          category: "Điểm trung tâm",
        };
        handleChoosePlace(gpsPlace);
      },
      () => {
        setLocatingGps(false);
        onNotify?.("Không thể lấy GPS tự động, vui lòng chọn từ danh sách.");
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const getCategoryIcon = (cat?: PlaceCategory) => {
    switch (cat) {
      case "TT Thương mại":
        return <ShoppingBag size={16} />;
      case "Sân bay & Bến xe":
        return <Plane size={16} />;
      case "Trường & Bệnh viện":
        return <GraduationCap size={16} />;
      case "Khu đô thị":
        return <Building size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  return (
    <Modal
      title={
        activeMode === "pickup"
          ? "Chọn Điểm Đón của bạn"
          : "Chọn Điểm Đến mong muốn"
      }
      onClose={onClose}
    >
      <div className="location-picker-dialog">
        {/* Mode Switcher + Swap Button */}
        <div className="location-mode-bar">
          <div className="mode-toggle-group">
            <button
              type="button"
              className={`mode-toggle-btn ${activeMode === "pickup" ? "active" : ""}`}
              onClick={() => setActiveMode("pickup")}
            >
              <Navigation size={14} />
              <span>Điểm đón</span>
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${activeMode === "destination" ? "active" : ""}`}
              onClick={() => setActiveMode("destination")}
            >
              <MapPin size={14} />
              <span>Điểm đến</span>
            </button>
          </div>

          <button
            type="button"
            className="swap-route-btn"
            onClick={handleSwapRoute}
            title="Đảo chiều điểm đón và điểm đến"
          >
            <ArrowLeftRight size={15} />
            <span>Đảo chiều</span>
          </button>
        </div>

        {/* Current Route Preview in Modal */}
        <div className="modal-current-route-preview">
          <div
            className={`route-preview-pill ${activeMode === "pickup" ? "focused" : ""}`}
            onClick={() => setActiveMode("pickup")}
          >
            <small>Đón:</small>
            <strong>{currentRoute.pickup.name}</strong>
          </div>
          <span className="arrow-sep">➔</span>
          <div
            className={`route-preview-pill ${activeMode === "destination" ? "focused" : ""}`}
            onClick={() => setActiveMode("destination")}
          >
            <small>Đến:</small>
            <strong>{currentRoute.destination.name}</strong>
          </div>
        </div>

        {/* GPS Quick Action Button */}
        <button
          type="button"
          className="button secondary wide gps-quick-btn"
          disabled={locatingGps}
          onClick={handleGetCurrentGps}
        >
          <LocateFixed size={17} className={locatingGps ? "spin-slow" : ""} />
          <span>
            {locatingGps
              ? "Đang xác định GPS thiết bị..."
              : `Chọn vị trí GPS hiện tại làm ${activeMode === "pickup" ? "Điểm đón" : "Điểm đến"}`}
          </span>
        </button>

        {/* Search Bar */}
        <form onSubmit={handleCustomInputSubmit} className="picker-search-form">
          <Search size={18} className="search-icon" />
          <input
            placeholder={`Tìm hoặc nhập địa chỉ ${activeMode === "pickup" ? "đón" : "đến"} (nhấn Enter để chọn)...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="submit"
              className="picker-apply-btn"
              title="Áp dụng địa chỉ này"
            >
              Chọn
            </button>
          )}
        </form>

        {/* Category Filter Chips */}
        <div className="picker-category-scroll">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`picker-cat-chip ${category === cat ? "selected" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Places List */}
        <div className="picker-places-list">
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place) => {
              const isSelected =
                activeMode === "pickup"
                  ? currentRoute.pickup.name === place.name
                  : currentRoute.destination.name === place.name;
              return (
                <div
                  key={place.name}
                  className={`picker-place-item ${isSelected ? "selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleChoosePlace(place)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleChoosePlace(place);
                  }}
                >
                  <span className="place-item-icon">
                    {getCategoryIcon(place.category)}
                  </span>
                  <div className="place-item-text">
                    <strong>{place.name}</strong>
                    <small>{place.address}</small>
                  </div>
                  {isSelected && (
                    <span className="place-item-badge">Đang chọn</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="picker-empty-hint">
              <p>
                Không có địa điểm mẫu trùng khớp với từ khóa "{search}".
              </p>
              <button
                type="button"
                className="button primary wide"
                onClick={handleCustomInputSubmit}
              >
                Sử dụng "{search}" làm {activeMode === "pickup" ? "điểm đón" : "điểm đến"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
