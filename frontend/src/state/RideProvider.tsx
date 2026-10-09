import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import type { Dispatch, ReactNode } from "react";
import { initialRide, rideReducer } from "./rideMachine";
import type { RideAction, RideState } from "./rideMachine";
import type { HistoryTrip, Route, VehicleId } from "../data/catalog";
import { tripService } from "../services/trip";
import { tripApiService, type BackendTripRecord } from "../services/tripService";
import { useAuth } from "./AuthProvider";

interface Context {
  ride: RideState;
  dispatch: Dispatch<RideAction>;
  history: HistoryTrip[];
  recordCancelledTrip: (params: {
    id: string;
    route: Route;
    vehicle: VehicleId;
    reason: string;
  }) => void;
  rateCompletedTrip: (
    bookingId: string,
    stars: number,
    feedbackNote: string,
  ) => void;
  notify: (text: string) => void;
}

const RideContext = createContext<Context | null>(null);

function getUserHistoryStorageKey(userId: string) {
  return `qsm_user_history_2026_${userId}`;
}

function loadStoredUserHistory(userId?: string): HistoryTrip[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getUserHistoryStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryTrip[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => !item.userId || item.userId === userId)
      : [];
  } catch {
    return [];
  }
}

function saveStoredUserHistory(userId: string | undefined, items: HistoryTrip[]) {
  if (!userId) return;
  try {
    localStorage.setItem(getUserHistoryStorageKey(userId), JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function mapBackendTripToHistory(record: BackendTripRecord): HistoryTrip | null {
  if (record.status !== "COMPLETED" && record.status !== "CANCELLED") {
    return null;
  }
  const [pickupName, ...pickupRest] = record.pickup_address.split(",");
  const [destName, ...destRest] = record.dest_address.split(",");
  const vehicleId: VehicleId =
    record.vehicle_type === "bike"
      ? "bike"
      : record.vehicle_type === "luxury"
        ? "limo"
        : "vf5";

  const createdDate = new Date(record.completed_at || record.created_at);
  const timeStr = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(createdDate);

  return {
    id: record.trip_code,
    userId: record.user_id,
    group: "Hôm nay",
    time: timeStr,
    route: {
      pickup: {
        name: pickupName.trim() || record.pickup_address,
        address: pickupRest.join(",").trim() || record.pickup_address,
        coords: record.pickup_coords || [105.9445, 20.9905],
      },
      destination: {
        name: destName.trim() || record.dest_address,
        address: destRest.join(",").trim() || record.dest_address,
        coords: record.dest_coords || [105.8685, 20.9962],
      },
      distance: record.distance_km,
      duration: record.duration_mins,
    },
    vehicle: vehicleId,
    fare: record.final_amount,
    status: record.status === "COMPLETED" ? "completed" : "cancelled",
    paymentMethod:
      record.payment_method === "cash"
        ? "Tiền mặt"
        : record.payment_method === "card"
          ? "Thẻ Visa/Mastercard"
          : record.payment_method === "vnpay"
            ? "VNPay QR"
            : "Ví QSM Pay",
    ratingStars: record.rating_stars,
    feedbackNote: record.feedback_note,
    cancelReason: record.cancel_reason,
  };
}

function deduplicateTrips(items: HistoryTrip[]): HistoryTrip[] {
  const seen = new Set<string>();
  const result: HistoryTrip[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export function RideProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [ride, dispatch] = useReducer(rideReducer, initialRide);
  const [history, setHistory] = useState<HistoryTrip[]>(() =>
    loadStoredUserHistory(currentUserId),
  );
  const [toast, setToast] = useState("");

  // Khi đổi tài khoản đăng nhập (hoặc đăng xuất), reset chuyến xe đang chạy và nạp đúng lịch sử riêng của tài khoản đó
  useEffect(() => {
    dispatch({ type: "RESET" });
    const localItems = loadStoredUserHistory(currentUserId);
    setHistory(localItems);

    if (!currentUserId) return;

    let cancelled = false;
    void tripApiService
      .getHistory(1, 50)
      .then((res) => {
        if (cancelled) return;
        const fromBackend = res.trips
          .filter((t) => t.user_id === currentUserId)
          .map(mapBackendTripToHistory)
          .filter((t): t is HistoryTrip => t !== null);

        setHistory((prev) => {
          const merged = deduplicateTrips([...fromBackend, ...prev]);
          saveStoredUserHistory(currentUserId, merged);
          return merged;
        });
      })
      .catch(() => {
        // Giữ nguyên dữ liệu local của đúng tài khoản hiện tại nếu offline
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    const next = tripService.nextStatus(ride.status);
    if (!next) return;
    const timer = setTimeout(
      () => dispatch({ type: "TRANSITION", status: next }),
      tripService.delay(ride.status),
    );
    return () => clearTimeout(timer);
  }, [ride.status]);

  useEffect(() => {
    if (ride.status !== "TRIP_COMPLETED" || !ride.bookingId) return;
    setHistory((prev) => {
      if (prev.some((h) => h.id === ride.bookingId)) return prev;
      const newTrip: HistoryTrip = {
        id: ride.bookingId!,
        userId: currentUserId,
        group: "Hôm nay",
        time: new Intl.DateTimeFormat("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date()),
        route: ride.route,
        vehicle: ride.vehicle,
        fare:
          ride.vehicle === "vf5"
            ? 128000
            : ride.vehicle === "bike"
              ? 72000
              : 185000,
        status: "completed",
        paymentMethod: ride.payment,
      };
      const updated = deduplicateTrips([newTrip, ...prev]);
      saveStoredUserHistory(currentUserId, updated);
      return updated;
    });
  }, [ride, currentUserId]);

  const recordCancelledTrip = ({
    id,
    route,
    vehicle,
    reason,
  }: {
    id: string;
    route: Route;
    vehicle: VehicleId;
    reason: string;
  }) => {
    setHistory((prev) => {
      if (prev.some((h) => h.id === id)) return prev;
      const cancelledItem: HistoryTrip = {
        id,
        userId: currentUserId,
        group: "Hôm nay",
        time: new Intl.DateTimeFormat("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date()),
        route,
        vehicle,
        fare: 0,
        status: "cancelled",
        cancelReason: reason,
      };
      const updated = deduplicateTrips([cancelledItem, ...prev]);
      saveStoredUserHistory(currentUserId, updated);
      return updated;
    });
  };

  const rateCompletedTrip = (
    bookingId: string,
    stars: number,
    feedbackNote: string,
  ) => {
    setHistory((prev) => {
      const updated = prev.map((item) =>
        item.id === bookingId
          ? { ...item, ratingStars: stars, feedbackNote }
          : item,
      );
      saveStoredUserHistory(currentUserId, updated);
      return updated;
    });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <RideContext.Provider
      value={{
        ride,
        dispatch,
        history,
        recordCancelledTrip,
        rateCompletedTrip,
        notify: setToast,
      }}
    >
      {children}
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </RideContext.Provider>
  );
}

export function useRide() {
  const c = useContext(RideContext);
  if (!c) throw new Error("RideProvider missing");
  return c;
}
