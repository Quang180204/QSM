import { apiRequest } from "./api";

export interface AdminStats {
  total_revenue: number;
  projected_active_revenue: number;
  total_trips: number;
  trips_breakdown: {
    active: number;
    completed: number;
    cancelled: number;
  };
  total_users: number;
  total_accounts: number;
  fleet_summary: {
    total_vehicles: number;
    ready_vehicles: number;
    on_trip_vehicles: number;
    charging_vehicles: number;
    total_drivers: number;
    available_drivers: number;
  };
  revenue_chart: Array<{ day: string; revenue: number; trips: number }>;
}

export interface AdminUserItem {
  id: string;
  username?: string;
  name: string;
  phone: string;
  email: string;
  role: "user" | "admin";
  membership_tier: "standard" | "gold" | "platinum";
  is_active: boolean;
  created_at: string;
  total_trips: number;
  completed_trips: number;
  total_spent: number;
}

export interface AdminTripItem {
  id: string;
  trip_code: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  driver_id: string | null;
  driver_name: string;
  driver_phone: string;
  vehicle_plate: string;
  vehicle_model: string;
  service_name: string;
  vehicle_type: "bike" | "car" | "luxury";
  pickup_address: string;
  dest_address: string;
  stops?: Array<{ name: string; address: string; coords: [number, number] }>;
  scheduled_at?: string | null;
  distance_km: number;
  duration_mins: number;
  fare_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  status: "PENDING" | "PICKING_UP" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  cancel_reason?: string;
  cancelled_by?: string;
  rating_stars?: number;
  feedback_note?: string;
  created_at: string;
  completed_at?: string;
}

export interface AdminVoucherItem {
  code: string;
  title: string;
  discount_amount: number;
  discount_type: "fixed" | "percent";
  min_order_val?: number;
  target_tier?: "all" | "gold" | "platinum";
  expires_at: string;
  is_active: boolean;
  usage_count: number;
  max_usage?: number;
}

export interface AdminVehicleItem {
  id: string;
  model_name: string;
  service_name: string;
  license_plate: string;
  type: "bike" | "car" | "luxury";
  battery_percentage: number;
  status: "ready" | "on_trip" | "charging" | "maintenance";
  driver: {
    id: string;
    full_name: string;
    phone: string;
    rating: number;
    total_trips: number;
  } | null;
}

export interface AdminDriverItem {
  id: string;
  vehicle_id: string;
  full_name: string;
  phone: string;
  rating: number;
  total_trips: number;
  current_lat: number;
  current_lng: number;
  status: "available" | "busy" | "offline";
  vehicle: {
    id: string;
    model_name: string;
    service_name: string;
    license_plate: string;
    battery_percentage: number;
  } | null;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    return apiRequest<AdminStats>("/admin/stats");
  },

  async getUsers(search = ""): Promise<{ total: number; users: AdminUserItem[] }> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<{ total: number; users: AdminUserItem[] }>(`/admin/users${query}`);
  },

  async toggleUserStatus(
    userId: string,
    is_active: boolean,
  ): Promise<{ message: string; user: AdminUserItem }> {
    return apiRequest<{ message: string; user: AdminUserItem }>(
      `/admin/users/${userId}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ is_active }),
      },
    );
  },

  async getTrips(params?: {
    status?: string;
    userId?: string;
    search?: string;
  }): Promise<{ total: number; trips: AdminTripItem[] }> {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.userId) qs.set("userId", params.userId);
    if (params?.search) qs.set("search", params.search);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiRequest<{ total: number; trips: AdminTripItem[] }>(`/admin/trips${suffix}`);
  },

  async getFleet(): Promise<{
    vehicles: AdminVehicleItem[];
    drivers: AdminDriverItem[];
  }> {
    return apiRequest<{
      vehicles: AdminVehicleItem[];
      drivers: AdminDriverItem[];
    }>("/admin/fleet");
  },

  async getVouchers(): Promise<{ total: number; vouchers: AdminVoucherItem[] }> {
    return apiRequest<{ total: number; vouchers: AdminVoucherItem[] }>("/admin/vouchers");
  },

  async createVoucher(
    voucher: Omit<AdminVoucherItem, "usage_count" | "is_active">,
  ): Promise<{ message: string; voucher: AdminVoucherItem }> {
    return apiRequest<{ message: string; voucher: AdminVoucherItem }>("/admin/vouchers", {
      method: "POST",
      body: JSON.stringify(voucher),
    });
  },

  async toggleVoucher(
    code: string,
  ): Promise<{ message: string; voucher: AdminVoucherItem }> {
    return apiRequest<{ message: string; voucher: AdminVoucherItem }>(
      `/admin/vouchers/${encodeURIComponent(code)}/toggle`,
      { method: "PATCH" },
    );
  },

  async deleteVoucher(code: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(
      `/admin/vouchers/${encodeURIComponent(code)}`,
      { method: "DELETE" },
    );
  },
};

