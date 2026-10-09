import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { db } from "../../database/db.js";

let ioInstance: SocketIOServer | null = null;

export function initSocketGateway(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    socket.on(
      "driver:location_update",
      (payload: { driverId: string; lat: number; lng: number; tripId?: string }) => {
        const drv = db.data.drivers.find((d) => d.id === payload.driverId);
        if (drv) {
          drv.current_lat = payload.lat;
          drv.current_lng = payload.lng;
          db.save();
        }
        io.emit("driver:location_update", payload);
      },
    );

    socket.on(
      "trip:status_change",
      (payload: { tripId: string; status: string }) => {
        io.emit("trip:status_change", payload);
      },
    );
  });

  ioInstance = io;
  return io;
}

export function emitTripStatusUpdate(trip: unknown): void {
  if (ioInstance) {
    ioInstance.emit("trip:status_change", trip);
  }
}

