import { describe, expect, it } from "vitest";
import { initialRide, rideReducer } from "../src/state/rideMachine";
import { rideService } from "../src/services/ride";
describe("ride state transaction guard", () => {
  it("does not book when a vehicle is only selected", () => {
    const state = rideReducer(initialRide, {
      type: "SELECT_VEHICLE",
      vehicle: "limo",
    });
    expect(state.status).toBe("IDLE");
    expect(rideReducer(state, { type: "BOOKED", id: "unsafe" })).toEqual(state);
  });
  it("rejects skipping location and transaction confirmation", () => {
    expect(
      rideReducer(initialRide, {
        type: "TRANSITION",
        status: "SEARCHING_DRIVER",
      }),
    ).toEqual(initialRide);
  });
  it("covers the whole confirmed ride lifecycle", () => {
    let state = initialRide;
    for (const status of [
      "COLLECTING_INFO",
      "RESOLVING_LOCATION",
      "LOCATION_CONFIRMED",
      "QUOTED",
      "AWAITING_CONFIRMATION",
    ] as const)
      state = rideReducer(state, { type: "TRANSITION", status });
    state = rideReducer(state, { type: "BOOKED", id: "GSM-TEST" });
    for (const status of [
      "DRIVER_ASSIGNED",
      "DRIVER_ARRIVING",
      "DRIVER_ARRIVED",
      "TRIP_STARTED",
      "TRIP_COMPLETED",
    ] as const)
      state = rideReducer(state, { type: "TRANSITION", status });
    expect(state.status).toBe("TRIP_COMPLETED");
    expect(state.bookingId).toBe("GSM-TEST");
  });
  it("prevents changing the vehicle after booking", () => {
    const state = { ...initialRide, status: "SEARCHING_DRIVER" as const };
    expect(
      rideReducer(state, { type: "SELECT_VEHICLE", vehicle: "bike" }),
    ).toEqual(state);
  });
  it("service requires explicit human confirmation", async () => {
    await expect(
      rideService.book(
        { ...initialRide, status: "AWAITING_CONFIRMATION" },
        false,
      ),
    ).rejects.toThrow("Cần xác nhận");
    await expect(rideService.book(initialRide, true)).rejects.toThrow(
      "Cần xác nhận",
    );
  });
});
