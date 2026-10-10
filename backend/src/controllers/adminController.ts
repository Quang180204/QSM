import type { Response } from "express";
import { db } from "../../database/db.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";

export const adminController = {
  getStats(_req: AuthenticatedRequest, res: Response): void {
    const trips = db.data.trips;
    const users = db.data.users;
    const vehicles = db.data.vehicles;
    const drivers = db.data.drivers;

    const completedTrips = trips.filter((t) => t.status === "COMPLETED");
    const activeTrips = trips.filter((t) =>
      ["PENDING", "PICKING_UP", "IN_TRANSIT"].includes(t.status),
    );
    const cancelledTrips = trips.filter((t) => t.status === "CANCELLED");

    const totalRevenue = completedTrips.reduce((sum, t) => sum + t.final_amount, 0);
    const activeRevenue = activeTrips.reduce((sum, t) => sum + t.final_amount, 0);

    // Thống kê doanh thu thực tế theo ngày trong tuần từ dữ liệu chuyến đi thật
    const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const orderedDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const bucket: Record<string, { revenue: number; trips: number }> = {
      T2: { revenue: 0, trips: 0 },
      T3: { revenue: 0, trips: 0 },
      T4: { revenue: 0, trips: 0 },
      T5: { revenue: 0, trips: 0 },
      T6: { revenue: 0, trips: 0 },
      T7: { revenue: 0, trips: 0 },
      CN: { revenue: 0, trips: 0 },
    };

    for (const t of completedTrips) {
      const dt = new Date(t.completed_at || t.created_at);
      const label = dayLabels[dt.getDay()] || "CN";
      bucket[label].revenue += t.final_amount;
      bucket[label].trips += 1;
    }

    const revenueByDay = orderedDays.map((day) => ({
      day,
      revenue: bucket[day].revenue,
      trips: bucket[day].trips,
    }));

    res.json({
      total_revenue: totalRevenue,
      projected_active_revenue: activeRevenue,
      total_trips: trips.length,
      trips_breakdown: {
        active: activeTrips.length,
        completed: completedTrips.length,
        cancelled: cancelledTrips.length,
      },
      total_users: users.filter((u) => u.role === "user").length,
      total_accounts: users.length,
      fleet_summary: {
        total_vehicles: vehicles.length,
        ready_vehicles: vehicles.filter((v) => v.status === "ready").length,
        on_trip_vehicles: vehicles.filter((v) => v.status === "on_trip").length,
        charging_vehicles: vehicles.filter((v) => v.status === "charging").length,
        total_drivers: drivers.length,
        available_drivers: drivers.filter((d) => d.status === "available").length,
      },
      revenue_chart: revenueByDay,
    });
  },

  getUsers(req: AuthenticatedRequest, res: Response): void {
    const search = String(req.query.search || "").trim().toLowerCase();
    const roleFilter = String(req.query.role || "").trim();

    const list = db.data.users
      .filter((u) => {
        if (roleFilter && u.role !== roleFilter) return false;
        if (!search) return true;
        return (
          u.name.toLowerCase().includes(search) ||
          u.phone.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.username && u.username.toLowerCase().includes(search))
        );
      })
      .map((u) => {
        const userTrips = db.data.trips.filter((t) => t.user_id === u.id);
        const completedCount = userTrips.filter((t) => t.status === "COMPLETED").length;
        const totalSpent = userTrips
          .filter((t) => t.status === "COMPLETED")
          .reduce((s, t) => s + t.final_amount, 0);
        const { password_hash: _pw, ...safeUser } = u;
        return {
          ...safeUser,
          total_trips: userTrips.length,
          completed_trips: completedCount,
          total_spent: totalSpent,
        };
      });

    res.json({ total: list.length, users: list });
  },

  updateUserStatus(req: AuthenticatedRequest, res: Response): void {
    const { id } = req.params;
    const { is_active } = req.body as { is_active?: boolean };

    const target = db.data.users.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ message: "Không tìm thấy tài khoản người dùng." });
      return;
    }

    if (target.role === "admin" && target.username === "admin") {
      res.status(400).json({ message: "Không thể khóa tài khoản Quản trị viên gốc." });
      return;
    }

    target.is_active = typeof is_active === "boolean" ? is_active : !target.is_active;
    db.save();

    const { password_hash: _pw, ...safeUser } = target;
    res.json({
      message: target.is_active
        ? `Đã kích hoạt lại tài khoản ${target.name}.`
        : `Đã khóa tài khoản ${target.name}.`,
      user: safeUser,
    });
  },

  getTrips(req: AuthenticatedRequest, res: Response): void {
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const userIdFilter = String(req.query.userId || "").trim();
    const search = String(req.query.search || "").trim().toLowerCase();

    const list = db.data.trips
      .filter((t) => {
        if (userIdFilter && t.user_id !== userIdFilter) return false;
        if (statusFilter === "active") {
          if (!["PENDING", "PICKING_UP", "IN_TRANSIT"].includes(t.status)) return false;
        } else if (statusFilter === "completed") {
          if (t.status !== "COMPLETED") return false;
        } else if (statusFilter === "cancelled") {
          if (t.status !== "CANCELLED") return false;
        }
        if (search) {
          const user = db.data.users.find((u) => u.id === t.user_id);
          const driver = db.data.drivers.find((d) => d.id === t.driver_id);
          const hay = `${t.trip_code} ${t.pickup_address} ${t.dest_address} ${user?.name || ""} ${driver?.full_name || ""}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .map((t) => {
        const user = db.data.users.find((u) => u.id === t.user_id);
        const driver = db.data.drivers.find((d) => d.id === t.driver_id);
        const vehicle = driver
          ? db.data.vehicles.find((v) => v.id === driver.vehicle_id)
          : null;
        return {
          ...t,
          user_name: user?.name || "Khách hàng",
          user_phone: user?.phone || "N/A",
          driver_name: driver?.full_name || "Chưa phân bổ",
          driver_phone: driver?.phone || "N/A",
          vehicle_plate: vehicle?.license_plate || "N/A",
          vehicle_model: vehicle?.model_name || t.vehicle_type,
          service_name: vehicle?.service_name || "QSM",
        };
      });

    res.json({ total: list.length, trips: list });
  },

  getFleet(_req: AuthenticatedRequest, res: Response): void {
    const vehicles = db.data.vehicles.map((v) => {
      const assignedDriver = db.data.drivers.find((d) => d.vehicle_id === v.id);
      return {
        ...v,
        driver: assignedDriver || null,
      };
    });

    const drivers = db.data.drivers.map((d) => {
      const assignedVehicle = db.data.vehicles.find((v) => v.id === d.vehicle_id);
      return {
        ...d,
        vehicle: assignedVehicle || null,
      };
    });

    res.json({
      vehicles,
      drivers,
    });
  },

  getVouchers(_req: AuthenticatedRequest, res: Response): void {
    const list = db.data.vouchers || [];
    res.json({ total: list.length, vouchers: list });
  },

  createVoucher(req: AuthenticatedRequest, res: Response): void {
    const {
      code,
      title,
      discount_amount,
      discount_type,
      min_order_val,
      expires_at,
      max_usage,
    } = req.body as {
      code?: string;
      title?: string;
      discount_amount?: number;
      discount_type?: "fixed" | "percent";
      min_order_val?: number;
      expires_at?: string;
      max_usage?: number;
    };

    if (!code?.trim() || !title?.trim() || !discount_amount) {
      res.status(400).json({ message: "Vui lòng nhập đầy đủ mã, tiêu đề và mức giảm giá." });
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    if (!db.data.vouchers) db.data.vouchers = [];

    const existing = db.data.vouchers.find((v) => v.code === cleanCode);
    if (existing) {
      res.status(400).json({ message: `Mã ưu đãi "${cleanCode}" đã tồn tại.` });
      return;
    }

    const newVoucher = {
      code: cleanCode,
      title: title.trim(),
      discount_amount: Number(discount_amount),
      discount_type: discount_type === "percent" ? "percent" as const : "fixed" as const,
      min_order_val: min_order_val ? Number(min_order_val) : 0,
      expires_at: expires_at || "2026-12-31T23:59:59.000Z",
      is_active: true,
      usage_count: 0,
      max_usage: max_usage ? Number(max_usage) : 500,
    };

    db.data.vouchers.unshift(newVoucher);
    db.save();

    res.status(201).json({
      message: `Đã tạo thành công mã ưu đãi "${cleanCode}".`,
      voucher: newVoucher,
    });
  },

  toggleVoucher(req: AuthenticatedRequest, res: Response): void {
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ message: "Thiếu mã ưu đãi." });
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    const vMatch = (db.data.vouchers || []).find((v) => v.code === cleanCode);
    if (!vMatch) {
      res.status(404).json({ message: `Không tìm thấy mã ưu đãi "${cleanCode}".` });
      return;
    }
    vMatch.is_active = !vMatch.is_active;
    db.save();

    res.json({
      message: `Đã ${vMatch.is_active ? "kích hoạt" : "tạm dừng"} mã ưu đãi "${cleanCode}".`,
      voucher: vMatch,
    });
  },

  deleteVoucher(req: AuthenticatedRequest, res: Response): void {
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ message: "Thiếu mã ưu đãi." });
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    const idx = (db.data.vouchers || []).findIndex((v) => v.code === cleanCode);
    if (idx === -1) {
      res.status(404).json({ message: `Không tìm thấy mã ưu đãi "${cleanCode}".` });
      return;
    }
    db.data.vouchers.splice(idx, 1);
    db.save();

    res.json({ message: `Đã xóa mã ưu đãi "${cleanCode}".` });
  },
};
