import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { db } from "../database/db.js";
import { apiRouter } from "./routes/apiRoutes.js";
import { initSocketGateway } from "./websocket/socketGateway.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    service: "QSM (Quick Smart Mobility) Backend API",
    version: "2026.1.0",
    status: "OK",
    users_count: db.data.users.length,
    vehicles_count: db.data.vehicles.length,
    trips_count: db.data.trips.length,
  });
});

// REST API routes
app.use("/api", apiRouter);

const httpServer = http.createServer(app);
initSocketGateway(httpServer);

httpServer.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 [QSM Backend Server] Đang chạy tại http://127.0.0.1:${PORT}`);
  console.log(`   - Health check: http://127.0.0.1:${PORT}/api/health`);
  console.log(`   - Admin mặc định: admin / admin`);
});

