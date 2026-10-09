import type { RideState } from "../state/rideMachine";
import { wait } from "./maps";
export const rideService = {
  async book(ride: RideState, explicitConfirmation: boolean) {
    if (!explicitConfirmation || ride.status !== "AWAITING_CONFIRMATION")
      throw new Error("Cần xác nhận đặt xe trước khi tìm tài xế.");
    await wait(800);
    return { id: "GSM-" + Date.now() };
  },
  async cancel() {
    await wait(300);
  },
};
