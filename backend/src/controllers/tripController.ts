import crypto from "node:crypto";
import type { Request, Response } from "express";
import { db } from "../../database/db.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import type {
  PaymentMethod,
  TripEntity,
  TripMessageEntity,
  TripStatus,
  VehicleType,
} from "../models/entities.js";
import {
  calculateFare,
  findNearestAvailableDriver,
  generateTripCode,
  haversineDistanceKm,
} from "../services/businessService.js";
import { emitTripStatusUpdate } from "../websocket/socketGateway.js";

function normalizeVehicleType(v?: string): VehicleType {
  if (v === "bike") return "bike";
  if (v === "limo" || v === "luxury") return "luxury";
  return "car";
}

function generateUniqueTripCode(preferredCode?: string): string {
  if (
    preferredCode &&
    /^QSM-\d+/.test(preferredCode) &&
    !db.data.trips.some((t) => t.trip_code === preferredCode)
  ) {
    return preferredCode;
  }
  let code = generateTripCode();
  while (db.data.trips.some((t) => t.trip_code === code)) {
    code = generateTripCode();
  }
  return code;
}

function enrichTrip(trip: TripEntity) {
  const user = db.data.users.find((u) => u.id === trip.user_id);
  const driver = trip.driver_id
    ? db.data.drivers.find((d) => d.id === trip.driver_id)
    : null;
  const vehicle = driver
    ? db.data.vehicles.find((v) => v.id === driver.vehicle_id)
    : null;
  const messages = db.data.messages.filter((m) => m.trip_id === trip.id);

  return {
    ...trip,
    user_name: user?.name || "Khách hàng QSM",
    user_phone: user?.phone || "",
    driver: driver
      ? {
          id: driver.id,
          name: driver.full_name,
          phone: driver.phone,
          rating: driver.rating,
          total_trips: driver.total_trips,
          coords: [driver.current_lng, driver.current_lat] as [number, number],
          plate: vehicle?.license_plate || "29A-886.92",
          vehicle_model: vehicle?.model_name || "VinFast VF 5 Plus",
          service_name: vehicle?.service_name || "QSM Taxi",
          battery_percentage: vehicle?.battery_percentage ?? 85,
        }
      : null,
    messages,
  };
}

export const tripController = {
  estimate(req: Request, res: Response): void {
    const {
      distance_km,
      pickup_coords,
      dest_coords,
      vehicle_type,
      voucher_code,
    } = req.body as {
      distance_km?: number;
      pickup_coords?: [number, number];
      dest_coords?: [number, number];
      vehicle_type?: string;
      voucher_code?: string;
    };

    const computedDistance =
      distance_km && distance_km > 0
        ? distance_km
        : pickup_coords && dest_coords
          ? haversineDistanceKm(pickup_coords, dest_coords)
          : 11.5;

    const vType = normalizeVehicleType(vehicle_type);
    const quote = calculateFare(computedDistance, vType, voucher_code);

    const allTiers = (["bike", "car", "luxury"] as VehicleType[]).map((tier) => ({
      vehicle_type: tier,
      ...calculateFare(computedDistance, tier, voucher_code),
    }));

    res.json({
      selected: { vehicle_type: vType, ...quote },
      tiers: allTiers,
    });
  },

  book(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Vui lòng đăng nhập để đặt chuyến xe." });
      return;
    }

    const {
      trip_code,
      vehicle_type,
      pickup_address,
      pickup_coords,
      dest_address,
      dest_coords,
      distance_km,
      duration_mins,
      voucher_code,
      payment_method,
    } = req.body as {
      trip_code?: string;
      vehicle_type?: string;
      pickup_address?: string;
      pickup_coords?: [number, number];
      dest_address?: string;
      dest_coords?: [number, number];
      distance_km?: number;
      duration_mins?: number;
      voucher_code?: string;
      payment_method?: PaymentMethod;
    };

    if (!pickup_address || !dest_address) {
      res.status(400).json({ message: "Vui lòng chọn điểm đón và điểm đến hợp lệ." });
      return;
    }

    // Nếu tài khoản này đã có chuyến đi với cùng trip_code thì không tạo trùng lặp
    if (trip_code) {
      const existing = db.data.trips.find(
        (t) => t.trip_code === trip_code && t.user_id === userId,
      );
      if (existing) {
        res.status(200).json({
          message: "Chuyến đi đã được ghi nhận.",
          trip: enrichTrip(existing),
        });
        return;
      }
    }

    const safePickupCoords: [number, number] = pickup_coords || [105.9445, 20.9905];
    const safeDestCoords: [number, number] = dest_coords || [105.8685, 20.9962];
    const vType = normalizeVehicleType(vehicle_type);
    const dist =
      distance_km && distance_km > 0
        ? distance_km
        : haversineDistanceKm(safePickupCoords, safeDestCoords);

    const fareCalc = calculateFare(dist, vType, voucher_code);
    const assignedDriver = findNearestAvailableDriver(db.data.drivers, safePickupCoords);

    if (assignedDriver) {
      assignedDriver.status = "busy";
      const veh = db.data.vehicles.find((v) => v.id === assignedDriver.vehicle_id);
      if (veh) veh.status = "on_trip";
    }

    const uniqueCode = generateUniqueTripCode(trip_code);
    const newTrip: TripEntity = {
      id: `trp-${crypto.randomUUID().slice(0, 8)}`,
      trip_code: uniqueCode,
      user_id: userId,
      driver_id: assignedDriver?.id || "drv-01",
      vehicle_type: vType,
      pickup_address,
      pickup_coords: safePickupCoords,
      dest_address,
      dest_coords: safeDestCoords,
      distance_km: fareCalc.distance_km,
      duration_mins: duration_mins || fareCalc.duration_mins,
      fare_amount: fareCalc.fare_amount,
      discount_amount: fareCalc.discount_amount,
      final_amount: fareCalc.final_amount,
      payment_method: payment_method || "qsm_wallet",
      status: "PICKING_UP",
      created_at: new Date().toISOString(),
    };

    db.data.trips.unshift(newTrip);

    const welcomeMsg: TripMessageEntity = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      trip_id: newTrip.id,
      sender_role: "driver",
      sender_name: assignedDriver?.full_name || "Nguyễn Minh Nam",
      content: `Chào bạn, mình là tài xế QSM (${assignedDriver?.full_name || "Nguyễn Minh Nam"}). Mình đã nhận chuyến ${newTrip.trip_code} và đang di chuyển tới điểm đón nhé!`,
      created_at: new Date().toISOString(),
    };
    db.data.messages.push(welcomeMsg);
    db.save();

    const enriched = enrichTrip(newTrip);
    emitTripStatusUpdate(enriched);

    res.status(201).json({
      message: "Đặt xe thành công! Tài xế QSM đang di chuyển tới điểm đón.",
      trip: enriched,
    });
  },

  getActive(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ trip: null });
      return;
    }
    const active = db.data.trips.find(
      (t) =>
        t.user_id === userId &&
        ["PENDING", "PICKING_UP", "IN_TRANSIT"].includes(t.status),
    );
    res.json({ trip: active ? enrichTrip(active) : null });
  },

  getHistory(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ total: 0, page: 1, limit: 20, trips: [] });
      return;
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const userTrips = db.data.trips
      .filter((t) => t.user_id === userId)
      .map(enrichTrip);

    const start = (page - 1) * limit;
    res.json({
      total: userTrips.length,
      page,
      limit,
      trips: userTrips.slice(start, start + limit),
    });
  },

  updateStatus(req: AuthenticatedRequest, res: Response): void {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const { status } = req.body as { status?: TripStatus };
    const trip = db.data.trips.find(
      (t) =>
        (t.id === id || t.trip_code === id) &&
        (isAdmin || t.user_id === userId),
    );

    if (!trip) {
      res.status(404).json({ message: "Không tìm thấy chuyến đi của tài khoản này." });
      return;
    }

    if (status && trip.status !== status) {
      trip.status = status;
      if (status === "COMPLETED") {
        trip.completed_at = new Date().toISOString();
        if (trip.driver_id) {
          const drv = db.data.drivers.find((d) => d.id === trip.driver_id);
          if (drv) {
            drv.status = "available";
            drv.total_trips += 1;
            const veh = db.data.vehicles.find((v) => v.id === drv.vehicle_id);
            if (veh) veh.status = "ready";
          }
        }
      }
      db.save();
    }

    const enriched = enrichTrip(trip);
    emitTripStatusUpdate(enriched);
    res.json({ message: "Đã cập nhật trạng thái chuyến xe.", trip: enriched });
  },

  cancel(req: AuthenticatedRequest, res: Response): void {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const { reason } = req.body as { reason?: string };
    const trip = db.data.trips.find(
      (t) =>
        (t.id === id || t.trip_code === id) &&
        (isAdmin || t.user_id === userId),
    );

    if (!trip) {
      res.status(404).json({ message: "Không tìm thấy chuyến đi cần hủy." });
      return;
    }

    if (trip.status === "IN_TRANSIT" || trip.status === "COMPLETED") {
      res.status(400).json({
        message: "Không thể hủy chuyến khi xe đã bắt đầu di chuyển hoặc đã hoàn tất.",
      });
      return;
    }

    trip.status = "CANCELLED";
    trip.cancel_reason = reason?.trim() || "Khách hàng thay đổi lịch trình";
    trip.cancelled_by = isAdmin ? "admin" : "user";
    trip.final_amount = 0;

    if (trip.driver_id) {
      const drv = db.data.drivers.find((d) => d.id === trip.driver_id);
      if (drv) {
        drv.status = "available";
        const veh = db.data.vehicles.find((v) => v.id === drv.vehicle_id);
        if (veh) veh.status = "ready";
      }
    }

    db.save();
    const enriched = enrichTrip(trip);
    emitTripStatusUpdate(enriched);

    res.json({
      message: "Đã hủy chuyến đi thành công.",
      trip: enriched,
    });
  },

  rate(req: AuthenticatedRequest, res: Response): void {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const { rating_stars, feedback_note } = req.body as {
      rating_stars?: number;
      feedback_note?: string;
    };

    const trip = db.data.trips.find(
      (t) =>
        (t.id === id || t.trip_code === id) &&
        (isAdmin || t.user_id === userId),
    );
    if (!trip) {
      res.status(404).json({ message: "Không tìm thấy chuyến đi để đánh giá." });
      return;
    }

    trip.rating_stars = Math.min(5, Math.max(1, Number(rating_stars) || 5));
    trip.feedback_note = feedback_note?.trim() || "Dịch vụ tuyệt vời";
    db.save();

    res.json({
      message: "Cảm ơn bạn đã gửi đánh giá dịch vụ QSM!",
      trip: enrichTrip(trip),
    });
  },

  getMessages(req: AuthenticatedRequest, res: Response): void {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const trip = db.data.trips.find(
      (t) =>
        (t.id === id || t.trip_code === id) &&
        (isAdmin || t.user_id === userId),
    );
    if (!trip) {
      res.json({ messages: [] });
      return;
    }
    const messages = db.data.messages.filter((m) => m.trip_id === trip.id);
    res.json({ messages });
  },

  sendMessage(req: AuthenticatedRequest, res: Response): void {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const { content } = req.body as { content?: string };
    if (!content?.trim()) {
      res.status(400).json({ message: "Nội dung tin nhắn không được để trống." });
      return;
    }

    const trip = db.data.trips.find(
      (t) =>
        (t.id === id || t.trip_code === id) &&
        (isAdmin || t.user_id === userId),
    );
    const tripId = trip ? trip.id : `${userId || "usr"}-${id}`;

    const userMsg: TripMessageEntity = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      trip_id: tripId,
      sender_role: "user",
      sender_name: req.user?.name || "Khách hàng",
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    db.data.messages.push(userMsg);

    const driver = trip?.driver_id
      ? db.data.drivers.find((d) => d.id === trip.driver_id)
      : db.data.drivers[0];

    const autoReply: TripMessageEntity = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      trip_id: tripId,
      sender_role: "driver",
      sender_name: driver?.full_name || "Nguyễn Minh Nam",
      content:
        "Vâng bác tài đã nhận được tin nhắn nhé! Mình đang giữ đúng lộ trình, bạn yên tâm ạ.",
      created_at: new Date(Date.now() + 500).toISOString(),
    };
    db.data.messages.push(autoReply);
    db.save();

    res.status(201).json({
      message: "Đã gửi tin nhắn cho tài xế.",
      sent: userMsg,
      reply: autoReply,
      messages: db.data.messages.filter((m) => m.trip_id === tripId),
    });
  },
};
