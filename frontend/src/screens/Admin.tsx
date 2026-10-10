import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  CarFront,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  LogOut,
  MapPin,
  Moon,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Tag,
  Trash2,
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
  type AdminVoucherItem,
} from "../services/adminService";
import { useAuth } from "../state/AuthProvider";
import { useRide } from "../state/RideProvider";
import { useTheme } from "../state/ThemeContext";

type AdminTab = "overview" | "users" | "trips" | "fleet" | "vouchers";

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
  const [vouchers, setVouchers] = useState<AdminVoucherItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & detail state
  const [userSearch, setUserSearch] = useState("");
  const [tripStatusFilter, setTripStatusFilter] = useState<
    "all" | "active" | "completed" | "cancelled"
  >("all");
  const [tripUserFilter, setTripUserFilter] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<AdminUserItem | null>(null);

  // Voucher Creation Modal state
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherTitle, setVoucherTitle] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState("30000");
  const [voucherType, setVoucherType] = useState<"fixed" | "percent">("fixed");
  const [voucherMinOrder, setVoucherMinOrder] = useState("50000");
  const [voucherMaxUsage, setVoucherMaxUsage] = useState("500");
  const [voucherTargetTier, setVoucherTargetTier] = useState<"all" | "gold" | "platinum">("all");

  const fetchAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, tripsRes, fleetRes, vouchersRes] =
        await Promise.all([
          adminService.getStats(),
          adminService.getUsers(userSearch),
          adminService.getTrips({
            status: tripStatusFilter,
            userId: tripUserFilter || undefined,
            search: tripSearch || undefined,
          }),
          adminService.getFleet(),
          adminService.getVouchers().catch(() => ({ total: 0, vouchers: [] })),
        ]);
      setStats(statsRes);
      setUsers(usersRes.users);
      setTrips(tripsRes.trips);
      setVehicles(fleetRes.vehicles);
      setDrivers(fleetRes.drivers);
      setVouchers(vouchersRes.vouchers);
    } catch {
      // Giữ nguyên state hiện tại nếu mất kết nối tạm thời
    } finally {
      setLoading(false);
    }
  }, [userSearch, tripStatusFilter, tripUserFilter, tripSearch]);

  // Export Revenue & CO2 report to UTF-8 BOM CSV for Excel
  const handleExportCsv = () => {
    if (!trips.length) {
      notify("Chưa có chuyến đi nào để xuất báo cáo.");
      return;
    }

    const headers = [
      "Mã chuyến đi",
      "Ngày đặt",
      "Hẹn giờ đón",
      "Khách hàng",
      "SĐT khách",
      "Tài xế",
      "Biển số",
      "Dòng xe",
      "Điểm đón",
      "Điểm dừng dọc đường",
      "Điểm đến",
      "Cự ly (km)",
      "Thời gian (phút)",
      "Cước niêm yết (VNĐ)",
      "Giảm giá (VNĐ)",
      "Doanh thu thực tế (VNĐ)",
      "Cắt giảm CO2 (kg)",
      "Thanh toán",
      "Trạng thái",
      "Đánh giá",
      "Lý do hủy",
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = trips.map((t) => {
      const stopsStr = (t.stops || []).map((s) => s.name).join(" -> ") || "Không";
      const co2Kg = (t.distance_km * 0.24).toFixed(2);
      const statusVi =
        t.status === "COMPLETED"
          ? "Hoàn thành"
          : t.status === "CANCELLED"
            ? "Đã hủy"
            : t.status === "IN_TRANSIT"
              ? "Đang di chuyển"
              : "Đang đón khách";

      return [
        escapeCsv(t.trip_code),
        escapeCsv(new Date(t.created_at).toLocaleString("vi-VN")),
        escapeCsv(t.scheduled_at ? new Date(t.scheduled_at).toLocaleString("vi-VN") : "Đi ngay"),
        escapeCsv(t.user_name),
        escapeCsv(t.user_phone),
        escapeCsv(t.driver_name),
        escapeCsv(t.vehicle_plate),
        escapeCsv(t.service_name || t.vehicle_model),
        escapeCsv(t.pickup_address),
        escapeCsv(stopsStr),
        escapeCsv(t.dest_address),
        escapeCsv(t.distance_km),
        escapeCsv(t.duration_mins),
        escapeCsv(t.fare_amount),
        escapeCsv(t.discount_amount),
        escapeCsv(t.final_amount),
        escapeCsv(co2Kg),
        escapeCsv(t.payment_method),
        escapeCsv(statusVi),
        escapeCsv(t.rating_stars ? `${t.rating_stars} sao` : "Chưa đánh giá"),
        escapeCsv(t.cancel_reason || ""),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Bao_cao_Doanh_thu_QSM_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify("Đã tải xuống file báo cáo doanh thu & CO₂ (CSV / Excel) thành công!");
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim() || !voucherTitle.trim()) {
      notify("Vui lòng nhập đầy đủ mã và tiêu đề.");
      return;
    }
    try {
      const res = await adminService.createVoucher({
        code: voucherCode.trim().toUpperCase(),
        title: voucherTitle.trim(),
        discount_amount: Number(voucherDiscount) || 25000,
        discount_type: voucherType,
        min_order_val: Number(voucherMinOrder) || 0,
        target_tier: voucherTargetTier,
        expires_at: "2026-12-31T23:59:59.000Z",
        max_usage: Number(voucherMaxUsage) || 500,
      });
      notify(res.message);
      setVouchers((prev) => [res.voucher, ...prev]);
      setShowVoucherModal(false);
      setVoucherCode("");
      setVoucherTitle("");
      setVoucherTargetTier("all");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không thể tạo mã ưu đãi.");
    }
  };

  const handleToggleVoucher = async (v: AdminVoucherItem) => {
    try {
      const res = await adminService.toggleVoucher(v.code);
      notify(res.message);
      setVouchers((prev) =>
        prev.map((item) => (item.code === v.code ? res.voucher : item)),
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lỗi khi đổi trạng thái mã.");
    }
  };

  const handleDeleteVoucher = async (code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã ưu đãi "${code}" không?`)) return;
    try {
      const res = await adminService.deleteVoucher(code);
      notify(res.message);
      setVouchers((prev) => prev.filter((item) => item.code !== code));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lỗi khi xóa mã ưu đãi.");
    }
  };

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
            className="button secondary export-csv-btn"
            onClick={handleExportCsv}
            title="Xuất báo cáo Doanh thu & Cắt giảm CO2 (CSV / Excel)"
          >
            <Download size={15} />
            <span>Xuất Báo cáo CSV</span>
          </button>
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
          {
            id: "vouchers" as const,
            label: `Mã ưu đãi (${vouchers.length})`,
            icon: Tag,
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "8px 0 12px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "12.5px", color: "var(--text-sub)" }}>
              Tìm thấy <strong>{trips.length}</strong> chuyến xe trên hệ thống
            </span>
            <button
              type="button"
              className="button secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "12px",
              }}
              onClick={handleExportCsv}
            >
              <Download size={14} />
              <span>Xuất Excel / CSV ({trips.length} chuyến)</span>
            </button>
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
                      {t.scheduled_at && (
                        <span
                          className="status-badge-modern"
                          style={{
                            background: "rgba(234, 179, 8, 0.16)",
                            color: "#eab308",
                            borderColor: "rgba(234, 179, 8, 0.4)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Clock size={11} />
                          Hẹn đón: {new Date(t.scheduled_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
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
                    {t.stops && t.stops.length > 0 && (
                      <div className="admin-route-stops" style={{ paddingLeft: "18px", borderLeft: "2px dashed var(--brand-border)", margin: "4px 0" }}>
                        {t.stops.map((s, idx) => (
                          <p key={idx} style={{ fontSize: "12px", color: "var(--brand)" }}>
                            <strong>Điểm dừng {idx + 1}:</strong> {s.name} ({s.address})
                          </p>
                        ))}
                      </div>
                    )}
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

      {/* ===================================================================
          TAB 5: PROMO VOUCHERS MANAGEMENT
          =================================================================== */}
      {tab === "vouchers" && (
        <div className="admin-section">
          <div
            className="admin-subhead-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", margin: "0 0 4px" }}>
                Quản lý Mã Khuyến Mãi QSM
              </h2>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-sub)" }}>
                Tạo và kích hoạt các mã ưu đãi giảm cước chuyến xe cho hành khách.
              </p>
            </div>
            <button
              type="button"
              className="button primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => setShowVoucherModal(true)}
            >
              <Plus size={16} />
              <span>Tạo mã ưu đãi mới</span>
            </button>
          </div>

          <div className="admin-cards-list">
            {vouchers.map((v) => (
              <div key={v.code} className="admin-item-card">
                <div className="admin-item-top">
                  <div className="admin-title-row">
                    <span className="admin-role-badge admin">
                      <Tag size={12} /> {v.code}
                    </span>
                    <span className={`admin-tier-chip tier-${v.target_tier || "all"}`}>
                      {v.target_tier === "platinum"
                        ? "👑 VIP Kim Cương"
                        : v.target_tier === "gold"
                          ? "🥇 Hạng Vàng+"
                          : "🌐 Mọi khách hàng"}
                    </span>
                    <strong>{v.title}</strong>
                    <span
                      className={`status-badge-modern ${v.is_active ? "active-status" : ""}`}
                    >
                      {v.is_active ? "Đang áp dụng" : "Đã tạm dừng"}
                    </span>
                  </div>
                  <strong className="admin-trip-price">
                    -
                    {v.discount_type === "percent"
                      ? `${v.discount_amount}%`
                      : money(v.discount_amount)}
                  </strong>
                </div>

                <div className="admin-metrics-row">
                  <span>
                    Đối tượng:{" "}
                    <strong>
                      {v.target_tier === "platinum"
                        ? "Hội viên Kim Cương (VIP)"
                        : v.target_tier === "gold"
                          ? "Hạng Vàng & Kim Cương"
                          : "Mọi hội viên"}
                    </strong>
                  </span>
                  <span>
                    Đơn tối thiểu:{" "}
                    <strong>{v.min_order_val ? money(v.min_order_val) : "0đ"}</strong>
                  </span>
                  <span>
                    Đã dùng:{" "}
                    <strong>
                      {v.usage_count || 0} / {v.max_usage || 500} lượt
                    </strong>
                  </span>
                  <span>
                    Hết hạn:{" "}
                    <strong>{new Date(v.expires_at).toLocaleDateString("vi-VN")}</strong>
                  </span>
                </div>

                <div className="admin-item-actions">
                  <button
                    type="button"
                    className="button secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => void handleToggleVoucher(v)}
                  >
                    {v.is_active ? "Tạm dừng mã" : "Kích hoạt mã"}
                  </button>
                  <button
                    type="button"
                    className="button ghost danger"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => void handleDeleteVoucher(v.code)}
                  >
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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

      {/* Create Voucher Modal */}
      {showVoucherModal && (
        <Modal
          title="Tạo mã ưu đãi QSM mới"
          onClose={() => setShowVoucherModal(false)}
        >
          <form onSubmit={handleCreateVoucher} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label className="field">
              <span>Mã khuyến mãi (viết liền, không dấu)</span>
              <input
                placeholder="VD: QSMHANOI, DIENGREEN..."
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                required
              />
            </label>
            <label className="field">
              <span>Tên chương trình / Tiêu đề ưu đãi</span>
              <input
                placeholder="VD: Khai xuân di chuyển xanh 2026"
                value={voucherTitle}
                onChange={(e) => setVoucherTitle(e.target.value)}
                required
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <label className="field">
                <span>Hình thức giảm</span>
                <select
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value as "fixed" | "percent")}
                >
                  <option value="fixed">Số tiền cố định (VNĐ)</option>
                  <option value="percent">Phần trăm (%)</option>
                </select>
              </label>
              <label className="field">
                <span>Mức giảm ({voucherType === "percent" ? "%" : "VNĐ"})</span>
                <input
                  type="number"
                  value={voucherDiscount}
                  onChange={(e) => setVoucherDiscount(e.target.value)}
                  required
                />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <label className="field">
                <span>Đơn tối thiểu (VNĐ)</span>
                <input
                  type="number"
                  value={voucherMinOrder}
                  onChange={(e) => setVoucherMinOrder(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Số lượt tối đa</span>
                <input
                  type="number"
                  value={voucherMaxUsage}
                  onChange={(e) => setVoucherMaxUsage(e.target.value)}
                />
              </label>
            </div>
            <label className="field">
              <span>Phân quyền thứ hạng hội viên (Áp dụng cho ai)</span>
              <select
                value={voucherTargetTier}
                onChange={(e) => setVoucherTargetTier(e.target.value as "all" | "gold" | "platinum")}
              >
                <option value="all">🌐 Mọi khách hàng (Tiêu chuẩn, Vàng, Kim Cương)</option>
                <option value="gold">🥇 Hội viên Hạng Vàng & Kim Cương trở lên</option>
                <option value="platinum">👑 Đặc quyền Hội viên Kim Cương (VIP) duy nhất</option>
              </select>
            </label>
            <button type="submit" className="button primary wide" style={{ marginTop: "8px" }}>
              <Plus size={16} />
              <span>Xác nhận phát hành mã ưu đãi</span>
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

