import type { Route, VehicleId } from "../data/catalog";
import { defaultRoute } from "../data/catalog";
export type RideFlowState =
  | "IDLE"
  | "COLLECTING_INFO"
  | "RESOLVING_LOCATION"
  | "LOCATION_CONFIRMED"
  | "QUOTED"
  | "AWAITING_CONFIRMATION"
  | "SEARCHING_DRIVER"
  | "DRIVER_ASSIGNED"
  | "DRIVER_ARRIVING"
  | "DRIVER_ARRIVED"
  | "TRIP_STARTED"
  | "TRIP_COMPLETED"
  | "ERROR";
export interface RideState {
  status: RideFlowState;
  route: Route;
  vehicle: VehicleId;
  payment: string;
  bookingId?: string;
  error?: string;
}
export const initialRide: RideState = {
  status: "IDLE",
  route: defaultRoute,
  vehicle: "vf5",
  payment: "Tiền mặt",
};
export type RideAction =
  | { type: "SET_ROUTE"; route: Route }
  | { type: "SELECT_VEHICLE"; vehicle: VehicleId }
  | { type: "PAYMENT"; payment: string }
  | { type: "TRANSITION"; status: RideFlowState }
  | { type: "BOOKED"; id: string }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };
const edges: Record<RideFlowState, RideFlowState[]> = {
  IDLE: ["COLLECTING_INFO"],
  COLLECTING_INFO: ["RESOLVING_LOCATION", "ERROR"],
  RESOLVING_LOCATION: ["LOCATION_CONFIRMED", "COLLECTING_INFO", "ERROR"],
  LOCATION_CONFIRMED: ["QUOTED", "COLLECTING_INFO"],
  QUOTED: ["AWAITING_CONFIRMATION", "COLLECTING_INFO"],
  AWAITING_CONFIRMATION: [
    "SEARCHING_DRIVER",
    "QUOTED",
    "COLLECTING_INFO",
    "ERROR",
  ],
  SEARCHING_DRIVER: ["DRIVER_ASSIGNED", "ERROR"],
  DRIVER_ASSIGNED: ["DRIVER_ARRIVING"],
  DRIVER_ARRIVING: ["DRIVER_ARRIVED"],
  DRIVER_ARRIVED: ["TRIP_STARTED"],
  TRIP_STARTED: ["TRIP_COMPLETED"],
  TRIP_COMPLETED: [],
  ERROR: ["COLLECTING_INFO", "AWAITING_CONFIRMATION"],
};
export function rideReducer(state: RideState, action: RideAction): RideState {
  switch (action.type) {
    case "RESET":
      return initialRide;
    case "SET_ROUTE":
      return ["COLLECTING_INFO", "RESOLVING_LOCATION"].includes(state.status)
        ? { ...state, route: action.route }
        : state;
    case "SELECT_VEHICLE":
      return [
        "IDLE",
        "COLLECTING_INFO",
        "RESOLVING_LOCATION",
        "LOCATION_CONFIRMED",
        "QUOTED",
        "AWAITING_CONFIRMATION",
      ].includes(state.status)
        ? {
            ...state,
            vehicle: action.vehicle,
            status:
              state.status === "QUOTED"
                ? "AWAITING_CONFIRMATION"
                : state.status,
          }
        : state;
    case "PAYMENT":
      return { ...state, payment: action.payment };
    case "BOOKED":
      return state.status === "AWAITING_CONFIRMATION"
        ? { ...state, status: "SEARCHING_DRIVER", bookingId: action.id }
        : state;
    case "ERROR":
      return { ...state, status: "ERROR", error: action.message };
    case "TRANSITION":
      return edges[state.status].includes(action.status)
        ? { ...state, status: action.status, error: undefined }
        : state;
  }
}
export const isActiveTrip = (status: RideFlowState) =>
  [
    "SEARCHING_DRIVER",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
    "TRIP_STARTED",
  ].includes(status);
