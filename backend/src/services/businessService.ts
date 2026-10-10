import bcrypt from "bcryptjs";
import { db } from "../../database/db.js";
import type { DriverEntity, MembershipTier, VehicleType } from "../models/entities.js";

/**
 * Bảng đơn giá cước tiêu chuẩn QSM 2026 (VNĐ / km)
 * Theo đặc tả mục 5.3.B:
 * - bike: 12.000đ/km
 * - car: 21.000đ/km
 * - luxury: 35.000đ/km
 */
export const FARE_PER_KM: Record<VehicleType, number> = {
  bike: 12000,
  car: 21000,
  luxury: 35000,
};

export const BASE_MIN_FARE: Record<VehicleType, number> = {
  bike: 25000,
  car: 45000,
  luxury: 85000,
};

export const VOUCHER_DISCOUNTS: Record<string, number> = {
  QSM2026: 25000,
  QSMFIRST: 35000,
  QSMVIP: 50000,
};

export const TIER_RANK: Record<string, number> = {
  all: 0,
  standard: 1,
  gold: 2,
  platinum: 3,
};

export const TIER_NAMES: Record<string, string> = {
  all: "Tất cả khách hàng",
  standard: "Hội viên Tiêu chuẩn",
  gold: "Hội viên Hạng Vàng",
  platinum: "Hội viên Kim Cương (VIP)",
};

export function isTierEligible(
  userTier?: string,
  requiredTier?: string,
): boolean {
  if (!requiredTier || requiredTier === "all") return true;
  const userRank = TIER_RANK[userTier || "standard"] ?? 1;
  const targetRank = TIER_RANK[requiredTier] ?? 0;
  return userRank >= targetRank;
}

export function calculateFare(
  distanceKm: number,
  vehicleType: VehicleType,
  voucherCode?: string,
  userTier?: MembershipTier,
) {
  const safeDistance = Math.max(1, Number(distanceKm) || 5);
  const rawFare = Math.round((safeDistance * FARE_PER_KM[vehicleType]) / 1000) * 1000;
  const fareAmount = Math.max(BASE_MIN_FARE[vehicleType], rawFare);
  const code = voucherCode?.trim().toUpperCase() || "";

  let discountVal = 0;
  if (db?.data?.vouchers) {
    const vMatch = db.data.vouchers.find((v) => v.code === code && v.is_active);
    if (vMatch) {
      const eligibleTier = isTierEligible(userTier, vMatch.target_tier);
      if (eligibleTier && (!vMatch.min_order_val || fareAmount >= vMatch.min_order_val)) {
        discountVal =
          vMatch.discount_type === "percent"
            ? Math.round((fareAmount * vMatch.discount_amount) / 100)
            : vMatch.discount_amount;
      }
    }
  }

  const discountAmount = discountVal
    ? Math.min(discountVal, fareAmount - 15000)
    : 0;
  const finalAmount = Math.max(15000, fareAmount - discountAmount);

  return {
    distance_km: Number(safeDistance.toFixed(1)),
    duration_mins: Math.max(5, Math.round(safeDistance * 2.1)),
    fare_amount: fareAmount,
    discount_amount: discountAmount,
    final_amount: finalAmount,
    voucher_applied: discountAmount > 0 ? code : null,
  };
}

export function haversineDistanceKm(
  coords1: [number, number],
  coords2: [number, number],
): number {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c * 1.28).toFixed(1)); // Nhân hệ số đường đô thị 1.28
}

export function findNearestAvailableDriver(
  drivers: DriverEntity[],
  pickupCoords: [number, number],
): DriverEntity | null {
  const available = drivers.filter((d) => d.status === "available");
  if (!available.length) return drivers[0] || null;

  let best = available[0];
  let bestDist = Infinity;
  for (const d of available) {
    const dist = haversineDistanceKm(pickupCoords, [d.current_lng, d.current_lat]);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

export function generateTripCode(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `QSM-${randomDigits}`;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

