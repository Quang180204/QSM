import { useState } from "react";
import {
  ChevronRight,
  ReceiptText,
  Search,
  Sparkles,
  Leaf,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useRide } from "../state/RideProvider";
import { money, vehicleById, driver } from "../data/catalog";
import type { HistoryTrip } from "../data/catalog";
import Modal from "../components/Modal";
import RouteMap from "../components/RouteMap";
import { RouteDetails } from "../components/chat/SmartCards";

export default function History() {
  const { history, dispatch, setChatOpen } = useRide();
  const [filter, setFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HistoryTrip | null>(null);

  const filtered = history.filter(
    (t) =>
      (filter === "Tất cả" ||
        (filter === "Hoàn thành"
          ? t.status === "completed"
          : t.status === "cancelled")) &&
      `${t.route.pickup.name} ${t.route.destination.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const completedCount = history.filter((t) => t.status === "completed").length;
  const cancelledCount = history.filter((t) => t.status === "cancelled").length;

  return (
    <div className="standard-screen history-screen-pro">
      {/* Top Header */}
      <header className="page-heading">
        <div className="history-header-badge">
          <Sparkles size={13} />
          <span>NHẬT KÝ HÀNH TRÌNH GSM</span>
        </div>
        <h1>Lịch sử chuyến đi</h1>
        <p>Theo dõi các chuyến xe thuần điện và lượng phát thải CO₂ đã cắt giảm.</p>
      </header>

      {/* GSM Eco Carbon Impact Banner */}
      <div className="history-eco-summary-card">
        <div className="eco-summary-item">
          <span className="eco-stat-val">{completedCount}</span>
          <span className="eco-stat-label">Chuyến xe xanh</span>
        </div>
        <div className="eco-summary-divider" />
        <div className="eco-summary-item">
          <span className="eco-stat-val eco-green">-6.82 <small>kg</small></span>
          <span className="eco-stat-label">Giảm phát thải CO₂</span>
        </div>
        <div className="eco-summary-divider" />
        <div className="eco-summary-item">
          <span className="eco-stat-val">42.6 <small>km</small></span>
          <span className="eco-stat-label">Khoảng cách êm ái</span>
        </div>
      </div>

      {/* Search Input Box */}
      <label className="history-search">
        <Search size={18} className="search-icon" />
        <input
          aria-label="Tìm chuyến đi"
          placeholder="Tìm theo điểm đón hoặc điểm đến..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="clear-search-btn" onClick={() => setSearch("")}>
            ×
          </button>
        )}
      </label>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {[
          { label: "Tất cả", count: history.length },
          { label: "Hoàn thành", count: completedCount },
          { label: "Đã hủy", count: cancelledCount },
        ].map((f) => (
          <button
            key={f.label}
            className={`filter-pill ${filter === f.label ? "selected" : ""}`}
            aria-pressed={filter === f.label}
            onClick={() => setFilter(f.label)}
          >
            <span>{f.label}</span>
            <small className="pill-count">{f.count}</small>
          </button>
        ))}
      </div>

      {/* Trip Groups by Date */}
      {["Hôm nay", "Hôm qua", "Ngày trước đó"].map((group) => {
        const trips = filtered.filter((t) => t.group === group);
        return trips.length ? (
          <section className="history-group" key={group}>
            <div className="history-group-header">
              <Calendar size={14} />
              <h2>{group}</h2>
              <span className="group-count">({trips.length} chuyến)</span>
            </div>

            <div className="history-cards-stack">
              {trips.map((t) => {
                const veh = vehicleById(t.vehicle);
                const isCompleted = t.status === "completed";
                return (
                  <div
                    key={t.id}
                    className="history-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(t)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelected(t);
                    }}
                  >
                    {/* Vehicle Thumb Box */}
                    <div className="history-vehicle-thumb-box">
                      <img
                        src={veh.image}
                        alt={veh.name}
                        className="history-vehicle-real-thumb"
                        draggable={false}
                      />
                    </div>

                    {/* Main Trip Meta */}
                    <div className="history-main">
                      <div className="history-top-meta">
                        <span className="history-time-badge">
                          <Clock size={11} /> {t.time}
                        </span>
                        <span className="history-veh-name">{veh.name}</span>
                      </div>

                      {/* Route Path Flow */}
                      <div className="history-route-flow">
                        <div className="route-flow-item pickup">
                          <span className="dot pickup" />
                          <strong className="point-name">{t.route.pickup.name}</strong>
                        </div>
                        <div className="route-flow-connector" />
                        <div className="route-flow-item destination">
                          <span className="dot dest" />
                          <strong className="point-name">{t.route.destination.name}</strong>
                        </div>
                      </div>

                      {/* Bottom Status & Perks Badges */}
                      <div className="history-bottom-badges">
                        <span className={`status-badge-modern ${t.status}`}>
                          {isCompleted ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>Hoàn thành</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              <span>Đã hủy</span>
                            </>
                          )}
                        </span>
                        {isCompleted && (
                          <span className="eco-saving-chip">
                            <Leaf size={11} />
                            <span>-2.76 kg CO₂</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and Action Icon */}
                    <div className="history-price-col">
                      <strong className={`history-fare-num ${!isCompleted ? "cancelled-fare" : ""}`}>
                        {isCompleted ? money(t.fare) : "0đ"}
                      </strong>
                      <span className="chevron-link">
                        <ChevronRight size={18} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null;
      })}

      {/* Empty State */}
      {!filtered.length && (
        <div className="empty-history-state">
          <div className="empty-history-icon">
            <ReceiptText size={38} />
          </div>
          <h3>Không tìm thấy chuyến đi</h3>
          <p>Không có hành trình nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          <button className="button secondary" onClick={() => { setSearch(""); setFilter("Tất cả"); }}>
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Modal Details */}
      {selected && (
        <Modal title="Chi tiết hành trình" onClose={() => setSelected(null)}>
          <div className="history-modal-vehicle-banner">
            <img
              src={vehicleById(selected.vehicle).image}
              alt={vehicleById(selected.vehicle).name}
              className="history-modal-vehicle-img"
              draggable={false}
            />
            <div className="history-modal-vehicle-text">
              <strong>{vehicleById(selected.vehicle).name}</strong>
              <small>{vehicleById(selected.vehicle).realModelName}</small>
              <span className="eco-tag">100% Thuần điện GSM</span>
            </div>
          </div>

          <RouteMap route={selected.route} />
          <RouteDetails route={selected.route} />

          <dl className="summary-list history-summary-list">
            <div>
              <dt>Tài xế tiếp nhận</dt>
              <dd className="driver-dd">
                <img
                  src="/images/driver-avatar.png"
                  alt=""
                  className="driver-micro-avatar"
                />
                {driver.name} (4.9★)
              </dd>
            </div>
            <div>
              <dt>Dòng phương tiện</dt>
              <dd>{vehicleById(selected.vehicle).name}</dd>
            </div>
            <div>
              <dt>Thời gian di chuyển</dt>
              <dd>{selected.route.duration} phút</dd>
            </div>
            <div>
              <dt>Quãng đường</dt>
              <dd>{selected.route.distance} km</dd>
            </div>
            <div>
              <dt>Mã chuyến GSM</dt>
              <dd className="booking-code">{selected.id}</dd>
            </div>
            <div>
              <dt>Tổng cước thanh toán</dt>
              <dd className="fare-highlight">{money(selected.fare)}</dd>
            </div>
          </dl>

          <button
            className="button primary wide"
            onClick={() => {
              dispatch({ type: "RESET" });
              dispatch({ type: "TRANSITION", status: "COLLECTING_INFO" });
              dispatch({ type: "TRANSITION", status: "RESOLVING_LOCATION" });
              dispatch({ type: "SET_ROUTE", route: selected.route });
              dispatch({ type: "SELECT_VEHICLE", vehicle: selected.vehicle });
              setSelected(null);
              setChatOpen(true);
            }}
          >
            <RotateCcw size={16} />
            <span>Đặt lại chuyến này với AI</span>
          </button>
        </Modal>
      )}
    </div>
  );
}
