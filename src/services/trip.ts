import type { RideFlowState } from "../state/rideMachine";
export const tripService = {
  nextStatus(status: RideFlowState): RideFlowState | undefined {
    return (
      {
        SEARCHING_DRIVER: "DRIVER_ASSIGNED",
        DRIVER_ASSIGNED: "DRIVER_ARRIVING",
        DRIVER_ARRIVING: "DRIVER_ARRIVED",
      } as Partial<Record<RideFlowState, RideFlowState>>
    )[status];
  },
  delay(status: RideFlowState) {
    return status === "SEARCHING_DRIVER"
      ? 7000
      : status === "DRIVER_ASSIGNED"
        ? 3500
        : 14000;
  },
};
