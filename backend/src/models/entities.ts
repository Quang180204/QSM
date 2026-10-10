export type UserRole = "user" | "admin";
export type MembershipTier = "standard" | "gold" | "platinum";
export type VehicleType = "bike" | "car" | "luxury";
export type VehicleStatus = "ready" | "on_trip" | "charging" | "maintenance";
export type DriverStatus = "available" | "busy" | "offline";
export type PaymentMethod = "cash" | "vnpay" | "momo" | "card" | "qsm_wallet";
export type TripStatus =
  | "PENDING"
  | "PICKING_UP"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED";

export interface UserEntity {
  id: string;
  username?: string;
  name: string;
  phone: string;
  email: string;
  password_hash: string;
  role: UserRole;
  membership_tier: MembershipTier;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface VehicleEntity {
  id: string;
  model_name: string;
  service_name: string;
  license_plate: string;
  type: VehicleType;
  battery_percentage: number;
  status: VehicleStatus;
}

export interface DriverEntity {
  id: string;
  vehicle_id: string;
  full_name: string;
  phone: string;
  rating: number;
  total_trips: number;
  current_lat: number;
  current_lng: number;
  status: DriverStatus;
}

export interface TripStopEntity {
  name: string;
  address: string;
  coords: [number, number]; // [lng, lat]
}

export interface TripEntity {
  id: string;
  trip_code: string;
  user_id: string;
  driver_id: string | null;
  vehicle_type: VehicleType;
  pickup_address: string;
  pickup_coords: [number, number]; // [lng, lat]
  dest_address: string;
  dest_coords: [number, number]; // [lng, lat]
  stops?: TripStopEntity[];
  scheduled_at?: string | null;
  distance_km: number;
  duration_mins: number;
  fare_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  status: TripStatus;
  cancel_reason?: string;
  cancelled_by?: "user" | "driver" | "admin";
  rating_stars?: number;
  feedback_note?: string;
  created_at: string;
  completed_at?: string;
}

export interface TripMessageEntity {
  id: string;
  trip_id: string;
  sender_role: "user" | "driver" | "system";
  sender_name: string;
  content: string;
  created_at: string;
}

export interface VoucherEntity {
  code: string;
  title: string;
  discount_amount: number;
  discount_type: "fixed" | "percent";
  min_order_val?: number;
  expires_at: string;
  is_active: boolean;
  usage_count: number;
  max_usage?: number;
}

export interface DatabaseStore {
  users: UserEntity[];
  vehicles: VehicleEntity[];
  drivers: DriverEntity[];
  trips: TripEntity[];
  messages: TripMessageEntity[];
  vouchers: VoucherEntity[];
}

