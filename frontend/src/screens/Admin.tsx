import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  CarFront,
  CheckCircle2,
  Lock,
  LogOut,
  MapPin,
  Moon,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Sun,
  TrendingUp,
  Unlock,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import QsmLogo from "../components/QsmLogo";
import Modal from "../components/Modal";
import { money } from "../data/catalog";
import {
  adminService,
  type AdminDriverItem,
  type AdminStats,
  type AdminTripItem,
  type AdminUserItem,
  type AdminVehicleItem,
} from "../services/adminService";
import { useAuth } from "../state/AuthProvider";
import { useRide } from "../state/RideProvider";
import { useTheme } from "../state/ThemeContext";

type AdminTab = "overview" | "users" | "trips" | "fleet";

const FALLBACK_STATS: AdminStats = {
  total_revenue: 0,
  projected_active_revenue: 0,
  total_trips: 0,
  trips_breakdown: {
    active: 0,
    completed: 0,
    cancelled: 0,
  },
  total_users: 4,
  total_accounts: 5,
  fleet_summary: {
    total_vehicles: 6,
    ready_vehicles: 6,
    on_trip_vehicles: 0,
    charging_vehicles: 0,
    total_drivers: 6,
    available_drivers: 6,
  },
  revenue_chart: [
    { day: "T2", revenue: 0, trips: 0 },
    { day: "T3", revenue: 0, trips: 0 },
    { day: "T4", revenue: 0, trips: 0 },
    { day: "T5", revenue: 0, trips: 0 },
    { day: "T6", revenue: 0, trips: 0 },
    { day: "T7", revenue: 0, trips: 0 },
    { day: "CN", revenue: 0, trips: 0 },
  ],
};

export default function Admin() {
  const { user, isAdmin, logout } = useAuth();
  const { notify } = useRide();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<AdminStats>(FALLBACK_STATS);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [trips, setTrips] = useState<AdminTripItem[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicleItem[]>([]);
  const [drivers, setDrivers] = useState<AdminDriverItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [tripStatusFilter, setTripStatusFilter] = useState<
    "all" | "active" | "completed" | "cancelled"
  >("all");
  const [tripUserFilter, setTripUserFilter] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<AdminUserItem | null>(null);

  const fetchAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, tripsRes, fleetRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(userSearch),
        adminService.getTrips({
          status: tripStatusFilter,
          userId: tripUserFilter || undefined,
          search: tripSearch || undefined,
        }),
        adminService.getFleet(),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users);
      setTrips(tripsRes.trips);
      setVehicles(fleetRes.vehicles);
      setDrivers(fleetRes.drivers);
    } catch {
      // Giữ nguyên state hiện tại nếu mất kết nối tạm thời
    } finally {
      setLoading(false);
    }
  }, [userSearch, tripStatusFilter, tripUserFilter, tripSearch]);

  useEffect(() => {
    if (!isAdmin) {
      nav("/dang-nhap");
      return;
    }
    void fetchAllAdminData();
  }, [isAdmin, nav, fetchAllAdminData]);

  const handleToggleUserStatus = async (targetUser: AdminUserItem) => {
    try {
      const res = await adminService.toggleUserStatus(
        targetUser.id,
        !targetUser.is_active,
      );
      notify(res.message);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u,
        ),
      );
      if (selectedUserDetail?.id === targetUser.id) {
        setSelectedUserDetail({
          ...selectedUserDetail,
          is_active: !targetUser.is_active,
        });
      }
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Không thể thay đổi trạng thái tài khoản.",
      );
    }
  };

  const maxChartRevenue = Math.max(
    ...stats.revenue_chart.map((c) => c.revenue),
    1,
  );

  return (
    <div className="standard-screen admin-portal-screen">
      {/* Top Admin Header */}
      <header className="app-header" style={{ margin: "-16px -20px 8px" }}>
        <div className="brand">
          <QsmLogo size={38} />
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => void fetchAllAdminData()}
            title="Làm mới dữ liệu thời gian thực"
          >
            <RefreshCw size={19} className={loading ? "spin-slow" : ""} />
          </button>
          <button
            type="button"
            className="icon-button theme-toggle-btn"
            onClick={toggleTheme}
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === "dark" ? (
              <Sun size={20} className="theme-icon sun animate-glow" />
            ) : (
              <Moon size={20} className="theme-icon moon" />
            )}
          </button>
          <button
            type="button"
            className="icon-button"
            title="Đăng xuất khỏi Admin"
            onClick={() => {
              logout();
              notify("Đã đăng xuất khỏi Cổng Quản trị viên QSM.");
              nav("/dang-nhap");
            }}
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>

      {/* Admin Portal Title Banner */}
      <section className="admin-hero-banner">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={13} /> QSM COMMAND CENTER · ADMIN PORTAL
          </span>
          <h1>Cổng Quản trị Vận hành QSM</h1>
          <p>
            Xin chào <strong>{user?.name || "Quản trị viên"}</strong> · Giám sát
            doanh thu, người dùng, đơn hàng và đội xe thuần điện thời gian thực.
          </p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="admin-nav-tabs" role="tablist">
        {[
          { id: "overview" as const, label: "Tổng quan", icon: BarChart3 },
          {
            id: "users" as const,
            label: `Tài khoản (${users.length || stats.total_accounts})`,
            icon: Users,
          },
          {
            id: "trips" as const,
            label: `Chuyến xe (${trips.length || stats.total_trips})`,
            icon: Activity,
          },
          {
            id: "fleet" as const,
            label: `Đội xe (${vehicles.length || stats.fleet_summary.total_vehicles})`,
            icon: CarFront,
          },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`admin-tab-btn ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ===================================================================
          TAB 1: DASHBOARD OVERVIEW
          =================================================================== */}
      {tab === "overview" && (
        <div className="admin-section">
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card highlight">
              <div className="kpi-top">
                <span>Tổng doanh thu hoàn tất</span>
                <Wallet size={18} />
              </div>
              <strong>{money(stats.total_revenue)}</strong>
              <small>
                +{money(stats.projected_active_revenue)} từ đơn đang chạy
              </small>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top">
                <span>Chuyến hoàn thành</span>
                <CheckCircle2 size={18} />
              </div>
              <strong>{stats.trips_breakdown.completed} chuyến</strong>
              <small>Trên tổng số {stats.total_trips} đơn hệ thống</small>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top">
                <span>Chuyến đang chạy</span>
                <Activity size={18} />
              </div>
              <strong>{stats.trips_breakdown.active} chuyến</strong>
              <small>Giám sát GPS trực tuyến 100%</small>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top">
                <span>Tài khoản đăng ký</span>
                <Users size={18} />
              </div>
              <strong>{stats.total_accounts} tài khoản</strong>
              <small>{stats.total_users} khách hàng · 1 quản trị viên</small>
            </div>
          </div>

          {/* Weekly Revenue Bar Chart */}
          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <div>
                <span className="eyebrow">BIỂU ĐỒ TĂNG TRƯỞNG</span>
                <h3>Doanh số vận hành 7 ngày trong tuần</h3>
              </div>
              <TrendingUp size={20} className="brand-icon-color" />
            </div>

            <div className="admin-bar-chart">
              {stats.revenue_chart.map((item) => {
                const heightPct = Math.max(
                  18,
                  Math.round((item.revenue / maxChartRevenue) * 100),
                );
                return (
                  <div key={item.day} className="chart-col">
                    <span className="chart-val">
                      {(item.revenue / 1000000).toFixed(1)}M
                    </span>
                    <div className="chart-bar-wrap">
                      <div
                        className="chart-bar-fill"
                        style={{ height: `${heightPct}%` }}
                        title={`${item.day}: ${money(item.revenue)} (${item.trips} chuyến)`}
                      />
                    </div>
                    <strong className="chart-day">{item.day}</strong>
                    <small>{item.trips} cuốc</small>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick Fleet Status Summary */}
          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <div>
                <span className="eyebrow">TRẠNG THÁI ĐỘI XE QSM</span>
                <h3>Tình trạng hoạt động phương tiện & tài xế</h3>
              </div>
            </div>
            <div className="admin-fleet-mini-stats">
              <div>
                <strong>{stats.fleet_summary.ready_vehicles}</strong>
                <span>Xe sẵn sàng đón</span>
              </div>
              <div>
                <strong>{stats.fleet_summary.on_trip_vehicles}</strong>
                <span>Xe đang chở khách</span>
              </div>
              <div>
                <strong>{stats.fleet_summary.charging_vehicles}</strong>
                <span>Xe đang sạc pin</span>
              </div>
              <div>
                <strong>{stats.fleet_summary.available_drivers}</strong>
                <span>Tài xế trực tuyến</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================
          TAB 2: USER MANAGEMENT
          =================================================================== */}
      {tab === "users" && (
        <div className="admin-section">
          <label className="history-search">
            <Search size={18} className="search-icon" />
            <input
              placeholder="Tìm kiếm tài khoản theo họ tên, SĐT hoặc email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </label>

          <div className="admin-cards-list">
            {users.map((u) => (
              <div key={u.id} className="admin-item-card">
                <div className="admin-item-top">
                  <div>
                    <div className="admin-title-row">
                      <strong>{u.name}</strong>
                      <span
                        className={`admin-role-badge ${u.role === "admin" ? "admin" : "user"}`}
                      >
                        {u.role === "admin" ? "Quản trị viên" : u.membership_tier.toUpperCase()}
                      </span>
                      <span
                        className={`status-badge-modern ${u.is_active ? "completed" : "cancelled"}`}
                      >
                        {u.is_active ? "Đang hoạt động" : "Đã khóa"}
                      </span>
                    </div>
                    <p className="admin-sub-meta">
                      SĐT: {u.phone} · Email: {u.email}
                    </p>
                  </div>
                </div>

                <div className="admin-metrics-row">
                  <span>
                    Tổng chuyến: <strong>{u.total_trips}</strong> (Hoàn thành:{" "}
                    {u.completed_trips})
                  </span>
                  <span>
                    Chi tiêu: <strong>{money(u.total_spent)}</strong>
                  </span>
                </div>

                <div className="admin-item-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setSelectedUserDetail(u)}
                  >
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setTripUserFilter(u.id);
                      setTab("trips");
                    }}
                  >
                    Lọc chuyến đi ({u.total_trips})
                  </button>
                  {u.username !== "admin" && (
                    <button
                      type="button"
                      className={`button ghost ${u.is_active ? "danger" : ""}`}
                      onClick={() => void handleToggleUserStatus(u)}
                    >
                      {u.is_active ? (
                        <>
                          <Lock size={15} /> Khóa TK
                        </>
                      ) : (
                        <>
                          <Unlock size={15} /> Kích hoạt
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 3: TRIP / ORDER MANAGEMENT
          =================================================================== */}
      {tab === "trips" && (
        <div className="admin-section">
          <label className="history-search">
            <Search size={18} className="search-icon" />
            <input
              placeholder="Tìm mã chuyến (QSM-...), tên khách hàng, tài xế, địa chỉ..."
              value={tripSearch}
              onChange={(e) => setTripSearch(e.target.value)}
            />
          </label>

          {/* Filter by Status */}
          <div className="filter-tabs">
            {[
              { key: "all" as const, label: "Tất cả" },
              { key: "active" as const, label: "Đang tiến hành" },
              { key: "completed" as const, label: "Đã hoàn thành" },
              { key: "cancelled" as const, label: "Đã hủy" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={`filter-pill ${tripStatusFilter === f.key ? "selected" : ""}`}
                onClick={() => setTripStatusFilter(f.key)}
              >
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Filter by User Account */}
          {tripUserFilter && (
            <div className="admin-active-filter-bar">
              <span>
                Đang lọc chuyến đi theo tài khoản ID:{" "}
                <strong>{tripUserFilter}</strong>
              </span>
              <button
                type="button"
                className="button ghost"
                onClick={() => setTripUserFilter("")}
              >
                Xóa bộ lọc tài khoản
              </button>
            </div>
          )}

          <div className="admin-cards-list">
            {trips.map((t) => {
              const isActive = ["PENDING", "PICKING_UP", "IN_TRANSIT"].includes(
                t.status,
              );
              const isCompleted = t.status === "COMPLETED";
              return (
                <div key={t.id} className="admin-item-card">
                  <div className="admin-item-top">
                    <div className="admin-title-row">
                      <strong className="booking-code">{t.trip_code}</strong>
                      <span className="badge model-badge">{t.service_name}</span>
                      <span
                        className={`status-badge-modern ${
                          isCompleted
                            ? "completed"
                            : isActive
                              ? "active-status"
                              : "cancelled"
                        }`}
                      >
                        {t.status === "PICKING_UP"
                          ? "Tài xế đang đón"
                          : t.status === "IN_TRANSIT"
                            ? "Đang di chuyển"
                            : isCompleted
                              ? "Hoàn thành"
                              : "Đã hủy"}
                      </span>
                    </div>
                    <strong className="admin-trip-price">
                      {t.status === "CANCELLED" ? "0đ" : money(t.final_amount)}
                    </strong>
                  </div>

                  <div className="admin-trip-route">
                    <p>
                      <MapPin size={13} /> <strong>Đón:</strong>{" "}
                      {t.pickup_address}
                    </p>
                    <p>
                      <MapPin size={13} /> <strong>Đến:</strong> {t.dest_address}
                    </p>
                  </div>

                  <div className="admin-metrics-row">
                    <span>
                      Khách: <strong>{t.user_name}</strong> ({t.user_phone})
                    </span>
                    <span>
                      Tài xế: <strong>{t.driver_name}</strong> ({t.vehicle_plate})
                    </span>
                    <span>
                      Quãng đường: <strong>{t.distance_km} km</strong> (~
                      {t.duration_mins}p)
                    </span>
                  </div>

                  {t.rating_stars && (
                    <p className="admin-trip-note">
                      <Star size={13} fill="#eab308" stroke="#eab308" /> Đánh giá:{" "}
                      <strong>{t.rating_stars}/5 sao</strong> —{" "}
                      {t.feedback_note || "Hài lòng"}
                    </p>
                  )}

                  {t.status === "CANCELLED" && (
                    <p className="admin-trip-note danger-text">
                      <XCircle size={13} /> Lý do hủy:{" "}
                      <strong>{t.cancel_reason || "Khách hủy chuyến"}</strong>{" "}
                      (Người hủy: {t.cancelled_by || "user"})
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 4: FLEET & DRIVERS MANAGEMENT
          =================================================================== */}
      {tab === "fleet" && (
        <div className="admin-section">
          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <div>
                <span className="eyebrow">DANH SÁCH PHƯƠNG TIỆN QSM</span>
                <h3>Đội xe thuần điện VinFast ({vehicles.length} xe)</h3>
              </div>
            </div>

            <div className="admin-cards-list">
              {vehicles.map((v) => (
                <div key={v.id} className="admin-item-card">
                  <div className="admin-item-top">
                    <div className="admin-title-row">
                      <strong>{v.service_name}</strong>
                      <span className="badge model-badge">{v.model_name}</span>
                      <span className="booking-code">{v.license_plate}</span>
                    </div>
                    <span
                      className={`status-badge-modern ${
                        v.status === "ready"
                          ? "completed"
                          : v.status === "on_trip"
                            ? "active-status"
                            : "cancelled"
                      }`}
                    >
                      {v.status === "ready"
                        ? "Sẵn sàng"
                        : v.status === "on_trip"
                          ? "Đang chở khách"
                          : "Đang sạc pin"}
                    </span>
                  </div>

                  <div className="admin-battery-row">
                    <span>
                      <BatteryCharging size={14} /> Mức Pin:{" "}
                      <strong>{v.battery_percentage}%</strong>
                    </span>
                    <div className="admin-battery-bar">
                      <div
                        className="admin-battery-fill"
                        style={{ width: `${v.battery_percentage}%` }}
                      />
                    </div>
                  </div>

                  {v.driver && (
                    <p className="admin-sub-meta">
                      Tài xế vận hành: <strong>{v.driver.full_name}</strong> · SĐT:{" "}
                      {v.driver.phone} · {v.driver.rating}★ ({v.driver.total_trips}{" "}
                      chuyến)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <div>
                <span className="eyebrow">ĐỘI NGŨ BÁC TÀI 5 SAO</span>
                <h3>Danh sách tài xế QSM ({drivers.length} tài xế)</h3>
              </div>
            </div>

            <div className="admin-cards-list">
              {drivers.map((d) => (
                <div key={d.id} className="admin-item-card">
                  <div className="admin-item-top">
                    <div className="admin-title-row">
                      <strong>{d.full_name}</strong>
                      <span className="eco-saving-chip">
                        <Star size={12} fill="#eab308" stroke="#eab308" />
                        <span>{d.rating}★</span>
                      </span>
                    </div>
                    <span
                      className={`status-badge-modern ${
                        d.status === "available"
                          ? "completed"
                          : d.status === "busy"
                            ? "active-status"
                            : "cancelled"
                      }`}
                    >
                      {d.status === "available"
                        ? "Trực tuyến"
                        : d.status === "busy"
                          ? "Đang trong cuốc"
                          : "Ngoại tuyến"}
                    </span>
                  </div>

                  <div className="admin-metrics-row">
                    <span>
                      <Phone size={13} /> {d.phone}
                    </span>
                    <span>
                      Số cuốc đã nhận: <strong>{d.total_trips} chuyến</strong>
                    </span>
                    <span>
                      Xe:{" "}
                      <strong>
                        {d.vehicle?.service_name} ({d.vehicle?.license_plate})
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserDetail && (
        <Modal
          title="Chi tiết tài khoản người dùng"
          onClose={() => setSelectedUserDetail(null)}
        >
          <dl className="summary-list">
            <div>
              <dt>Mã định danh</dt>
              <dd>{selectedUserDetail.id}</dd>
            </div>
            <div>
              <dt>Họ và tên</dt>
              <dd>{selectedUserDetail.name}</dd>
            </div>
            <div>
              <dt>Số điện thoại</dt>
              <dd>{selectedUserDetail.phone}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{selectedUserDetail.email}</dd>
            </div>
            <div>
              <dt>Phân quyền</dt>
              <dd>
                {selectedUserDetail.role === "admin"
                  ? "Quản trị viên (Admin)"
                  : "Khách hàng (User)"}
              </dd>
            </div>
            <div>
              <dt>Hạng hội viên</dt>
              <dd>{selectedUserDetail.membership_tier.toUpperCase()}</dd>
            </div>
            <div>
              <dt>Tổng số chuyến đi</dt>
              <dd>
                {selectedUserDetail.total_trips} chuyến (
                {selectedUserDetail.completed_trips} hoàn thành)
              </dd>
            </div>
            <div>
              <dt>Tổng chi tiêu</dt>
              <dd className="fare-highlight">
                {money(selectedUserDetail.total_spent)}
              </dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>
                {selectedUserDetail.is_active
                  ? "Đang hoạt động"
                  : "Đã bị khóa"}
              </dd>
            </div>
          </dl>
          {selectedUserDetail.username !== "admin" && (
            <button
              type="button"
              className="button primary wide"
              onClick={() => void handleToggleUserStatus(selectedUserDetail)}
            >
              {selectedUserDetail.is_active
                ? "Khóa tài khoản này"
                : "Kích hoạt lại tài khoản"}
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}

