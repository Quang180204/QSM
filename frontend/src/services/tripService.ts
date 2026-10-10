import { apiRequest } from "./api";

export interface DriverMessageItem {
  id: string;
  trip_id: string;
  sender_role: "user" | "driver" | "system";
  sender_name: string;
  content: string;
  created_at: string;
}

export interface BackendTripRecord {
  id: string;
  trip_code: string;
  user_id: string;
  driver_id: string | null;
  vehicle_type: "bike" | "car" | "luxury";
  pickup_address: string;
  pickup_coords: [number, number];
  dest_address: string;
  dest_coords: [number, number];
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
  rating_stars?: number;
  feedback_note?: string;
  created_at: string;
  completed_at?: string;
}

export const tripApiService = {
  async estimate(payload: {
    distance_km: number;
    pickup_coords?: [number, number];
    dest_coords?: [number, number];
    vehicle_type: string;
    voucher_code?: string;
  }) {
    return apiRequest<{
      selected: {
        vehicle_type: string;
        distance_km: number;
        duration_mins: number;
        fare_amount: number;
        discount_amount: number;
        final_amount: number;
      };
    }>("/trips/estimate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async book(payload: {
    trip_code?: string;
    vehicle_type: string;
    pickup_address: string;
    pickup_coords: [number, number];
    dest_address: string;
    dest_coords: [number, number];
    stops?: Array<{ name: string; address: string; coords: [number, number] }>;
    scheduled_at?: string | null;
    distance_km: number;
    duration_mins: number;
    voucher_code?: string;
    payment_method: string;
  }) {
    return apiRequest<{ message: string; trip: BackendTripRecord }>("/trips/book", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getVouchers() {
    return apiRequest<{
      total: number;
      vouchers: Array<{
        code: string;
        title: string;
        discount_amount: number;
        discount_type: "fixed" | "percent";
        min_order_val?: number;
        expires_at: string;
        is_active: boolean;
      }>;
    }>("/vouchers");
  },

  async applyVoucher(code: string, fare_amount: number) {
    return apiRequest<{
      valid: boolean;
      code: string;
      title: string;
      discount_amount: number;
      min_order_val: number;
      message: string;
    }>("/vouchers/apply", {
      method: "POST",
      body: JSON.stringify({ code, fare_amount }),
    });
  },

  async getActive() {
    return apiRequest<{ trip: BackendTripRecord | null }>("/trips/active");
  },

  async getHistory(page = 1, limit = 50) {
    return apiRequest<{
      total: number;
      page: number;
      limit: number;
      trips: BackendTripRecord[];
    }>(`/trips/history?page=${page}&limit=${limit}`);
  },

  async updateStatus(
    tripIdOrCode: string,
    status: "PICKING_UP" | "IN_TRANSIT" | "COMPLETED",
  ) {
    return apiRequest<{ message: string; trip: BackendTripRecord }>(
      `/trips/${tripIdOrCode}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
    );
  },

  async cancel(tripIdOrCode: string, reason: string) {
    return apiRequest<{ message: string; trip: BackendTripRecord }>(
      `/trips/${tripIdOrCode}/cancel`,
      {
        method: "PUT",
        body: JSON.stringify({ reason }),
      },
    );
  },

  async rate(tripIdOrCode: string, rating_stars: number, feedback_note: string) {
    return apiRequest<{ message: string; trip: BackendTripRecord }>(
      `/trips/${tripIdOrCode}/rate`,
      {
        method: "POST",
        body: JSON.stringify({ rating_stars, feedback_note }),
      },
    );
  },

  async getMessages(tripIdOrCode: string) {
    return apiRequest<{ messages: DriverMessageItem[] }>(
      `/trips/${tripIdOrCode}/messages`,
    );
  },

  async sendMessage(tripIdOrCode: string, content: string) {
    return apiRequest<{
      message: string;
      sent: DriverMessageItem;
      reply: DriverMessageItem;
      messages: DriverMessageItem[];
    }>(`/trips/${tripIdOrCode}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
};
