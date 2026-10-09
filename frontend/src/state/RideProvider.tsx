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
import { historySeed } from "../data/catalog";
import type { HistoryTrip, Route, VehicleId } from "../data/catalog";
import { tripService } from "../services/trip";

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

export function RideProvider({ children }: { children: ReactNode }) {
  const [ride, dispatch] = useReducer(rideReducer, initialRide);
  const [history, setHistory] = useState<HistoryTrip[]>(historySeed);
  const [toast, setToast] = useState("");

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
    setHistory((prev) =>
      prev.some((h) => h.id === ride.bookingId)
        ? prev
        : [
            {
              id: ride.bookingId!,
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
            },
            ...prev,
          ],
    );
  }, [ride]);

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
    setHistory((prev) => [
      {
        id,
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
      },
      ...prev,
    ]);
  };

  const rateCompletedTrip = (
    bookingId: string,
    stars: number,
    feedbackNote: string,
  ) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === bookingId
          ? { ...item, ratingStars: stars, feedbackNote }
          : item,
      ),
    );
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
