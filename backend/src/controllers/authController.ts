import crypto from "node:crypto";
import type { Request, Response } from "express";
import { db } from "../../database/db.js";
import {
  type AuthenticatedRequest,
  signJwtToken,
} from "../middlewares/authMiddleware.js";
import type { UserEntity } from "../models/entities.js";
import { hashPassword, verifyPassword } from "../services/businessService.js";

function sanitizeUser(user: UserEntity) {
  const { password_hash: _pw, ...rest } = user;
  return rest;
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { name, phone, email, password } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
    };

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !password) {
      res.status(400).json({
        message: "Vui lòng nhập đầy đủ Họ tên, Số điện thoại, Email và Mật khẩu.",
      });
      return;
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    const exists = db.data.users.find(
      (u) =>
        u.phone === cleanPhone ||
        u.email.toLowerCase() === cleanEmail ||
        (u.username && u.username.toLowerCase() === cleanEmail),
    );

    if (exists) {
      res.status(409).json({
        message: "Số điện thoại hoặc Email này đã được đăng ký trong hệ thống QSM.",
      });
      return;
    }

    const password_hash = await hashPassword(password);
    const newUser: UserEntity = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      username: cleanEmail.split("@")[0],
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password_hash,
      role: "user",
      membership_tier: "standard",
      is_active: true,
      created_at: new Date().toISOString(),
    };

    db.data.users.push(newUser);
    db.save();

    const token = signJwtToken(newUser);
    res.status(201).json({
      message: "Đăng ký tài khoản QSM thành công!",
      token,
      user: sanitizeUser(newUser),
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { identifier, emailOrPhone, username, password } = req.body as {
      identifier?: string;
      emailOrPhone?: string;
      username?: string;
      password?: string;
    };

    const loginKey = (identifier || emailOrPhone || username || "").trim();
    if (!loginKey || !password) {
      res.status(400).json({
        message: "Vui lòng nhập Tên đăng nhập / SĐT / Email và Mật khẩu.",
      });
      return;
    }

    // Hỗ trợ tài khoản mặc định admin / admin theo đúng đặc tả
    const keyLower = loginKey.toLowerCase();
    const user = db.data.users.find(
      (u) =>
        u.username?.toLowerCase() === keyLower ||
        u.email.toLowerCase() === keyLower ||
        u.phone === loginKey,
    );

    if (!user) {
      res.status(401).json({
        message: "Thông tin đăng nhập hoặc mật khẩu không chính xác.",
      });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({
        message: "Tài khoản này đã bị tạm khóa. Vui lòng liên hệ tổng đài QSM 1900 2088.",
      });
      return;
    }

    const valid =
      (user.role === "admin" && user.username === "admin" && password === "admin") ||
      (await verifyPassword(password, user.password_hash));

    if (!valid) {
      res.status(401).json({
        message: "Thông tin đăng nhập hoặc mật khẩu không chính xác.",
      });
      return;
    }

    const token = signJwtToken(user);
    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: sanitizeUser(user),
    });
  },

  me(req: AuthenticatedRequest, res: Response): void {
    res.json({ user: req.user });
  },

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const found = db.data.users.find((u) => u.id === userId);
    if (!found) {
      res.status(404).json({ message: "Không tìm thấy người dùng." });
      return;
    }

    const { name, phone, email, newPassword, membership_tier } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      newPassword?: string;
      membership_tier?: "standard" | "gold" | "platinum";
    };

    if (name?.trim()) found.name = name.trim();
    if (phone?.trim()) found.phone = phone.trim();
    if (email?.trim()) found.email = email.trim().toLowerCase();
    if (membership_tier && ["standard", "gold", "platinum"].includes(membership_tier)) {
      found.membership_tier = membership_tier;
    }
    if (newPassword && newPassword.trim().length >= 4) {
      found.password_hash = await hashPassword(newPassword.trim());
    }

    db.save();
    res.json({
      message: "Đã cập nhật hồ sơ cá nhân thành công!",
      user: sanitizeUser(found),
    });
  },
};

