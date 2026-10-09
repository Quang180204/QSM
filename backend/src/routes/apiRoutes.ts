import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { authController } from "../controllers/authController.js";
import { tripController } from "../controllers/tripController.js";
import { requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";

export const apiRouter = Router();

// ============================================================================
// A. Phân hệ Xác thực & Người dùng (/api/auth, /api/users)
// ============================================================================
apiRouter.post("/auth/register", (req, res) => {
  void authController.register(req, res);
});
apiRouter.post("/auth/login", (req, res) => {
  void authController.login(req, res);
});
apiRouter.get("/auth/me", requireAuth, (req, res) => {
  authController.me(req, res);
});
apiRouter.put("/users/profile", requireAuth, (req, res) => {
  void authController.updateProfile(req, res);
});

// ============================================================================
// B. Phân hệ Đặt xe & Chuyến đi (/api/trips)
// ============================================================================
apiRouter.post("/trips/estimate", (req, res) => {
  tripController.estimate(req, res);
});
apiRouter.post("/trips/book", requireAuth, (req, res) => {
  tripController.book(req, res);
});
apiRouter.get("/trips/active", requireAuth, (req, res) => {
  tripController.getActive(req, res);
});
apiRouter.get("/trips/history", requireAuth, (req, res) => {
  tripController.getHistory(req, res);
});
apiRouter.put("/trips/:id/status", requireAuth, (req, res) => {
  tripController.updateStatus(req, res);
});
apiRouter.put("/trips/:id/cancel", requireAuth, (req, res) => {
  tripController.cancel(req, res);
});
apiRouter.post("/trips/:id/rate", requireAuth, (req, res) => {
  tripController.rate(req, res);
});
apiRouter.get("/trips/:id/messages", requireAuth, (req, res) => {
  tripController.getMessages(req, res);
});
apiRouter.post("/trips/:id/messages", requireAuth, (req, res) => {
  tripController.sendMessage(req, res);
});

// ============================================================================
// C. Phân hệ Quản trị viên (/api/admin) — Bảo vệ bằng requireAdmin
// ============================================================================
apiRouter.get("/admin/stats", requireAdmin, (req, res) => {
  adminController.getStats(req, res);
});
apiRouter.get("/admin/users", requireAdmin, (req, res) => {
  adminController.getUsers(req, res);
});
apiRouter.put("/admin/users/:id/status", requireAdmin, (req, res) => {
  adminController.updateUserStatus(req, res);
});
apiRouter.get("/admin/trips", requireAdmin, (req, res) => {
  adminController.getTrips(req, res);
});
apiRouter.get("/admin/fleet", requireAdmin, (req, res) => {
  adminController.getFleet(req, res);
});

