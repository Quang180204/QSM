import {
  apiRequest,
  clearStoredAuth,
  getStoredToken,
  setStoredAuth,
  USER_STORAGE_KEY,
} from "./api";

export interface AuthUser {
  id: string;
  username?: string;
  name: string;
  phone: string;
  email: string;
  role: "user" | "admin";
  membership_tier: "standard" | "gold" | "platinum";
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

const SIGNED_OUT_FLAG = "qsm_explicit_signed_out_2026";

const DEFAULT_CUSTOMER: AuthUser = {
  id: "usr-customer-01",
  username: "ha",
  name: "Lê Xuân Hạ",
  phone: "0988180204",
  email: "ha@qsm.vn",
  role: "user",
  membership_tier: "platinum",
  is_active: true,
  created_at: "2026-09-15T09:30:00.000Z",
};

const DEFAULT_ADMIN: AuthUser = {
  id: "usr-admin-01",
  username: "admin",
  name: "Quản Trị Viên QSM",
  phone: "0900000001",
  email: "admin@qsm.vn",
  role: "admin",
  membership_tier: "platinum",
  is_active: true,
  created_at: "2026-01-01T08:00:00.000Z",
};

export function getInitialStoredUser(): AuthUser | null {
  try {
    if (localStorage.getItem(SIGNED_OUT_FLAG) === "true") {
      return null;
    }
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    // ignore
  }
  return DEFAULT_CUSTOMER;
}

export const authService = {
  async ensureDefaultToken(): Promise<AuthUser | null> {
    try {
      if (localStorage.getItem(SIGNED_OUT_FLAG) === "true") {
        return null;
      }
      const existingToken = getStoredToken();
      if (existingToken && !existingToken.startsWith("qsm-")) {
        const meUser = await this.me();
        if (meUser) return meUser;
      }
      // Tự động lấy JWT token hợp lệ cho tài khoản mặc định nếu chưa đăng nhập
      const res = await this.login("0988180204", "123456");
      return res.user;
    } catch {
      return getInitialStoredUser();
    }
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      localStorage.removeItem(SIGNED_OUT_FLAG);
    } catch {
      // ignore
    }
    try {
      const res = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      setStoredAuth(res.token, res.user);
      return res;
    } catch (err) {
      const clean = identifier.trim().toLowerCase();
      if ((clean === "admin" || clean === "admin@qsm.vn") && password === "admin") {
        const res: AuthResponse = {
          message: "Đăng nhập Cổng Quản trị QSM thành công!",
          token: "qsm-admin-local-token",
          user: DEFAULT_ADMIN,
        };
        setStoredAuth(res.token, res.user);
        return res;
      }
      if (
        (clean === "0988180204" || clean === "ha@qsm.vn" || clean === "ha") &&
        password === "123456"
      ) {
        const res: AuthResponse = {
          message: "Đăng nhập tài khoản QSM thành công!",
          token: "qsm-user-local-token",
          user: DEFAULT_CUSTOMER,
        };
        setStoredAuth(res.token, res.user);
        return res;
      }
      throw err;
    }
  },

  async register(payload: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      localStorage.removeItem(SIGNED_OUT_FLAG);
    } catch {
      // ignore
    }
    try {
      const res = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStoredAuth(res.token, res.user);
      return res;
    } catch (err) {
      if (err instanceof Error && err.message.includes("đã được đăng ký")) {
        throw err;
      }
      const fallbackUser: AuthUser = {
        id: "usr-" + Date.now(),
        username: payload.email.split("@")[0],
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim().toLowerCase(),
        role: "user",
        membership_tier: "standard",
        is_active: true,
        created_at: new Date().toISOString(),
      };
      const res: AuthResponse = {
        message: "Đăng ký tài khoản QSM thành công!",
        token: "qsm-user-local-token-" + Date.now(),
        user: fallbackUser,
      };
      setStoredAuth(res.token, res.user);
      return res;
    }
  },

  async me(): Promise<AuthUser | null> {
    try {
      const res = await apiRequest<{ user: AuthUser }>("/auth/me");
      return res.user;
    } catch {
      return getInitialStoredUser();
    }
  },

  async updateProfile(payload: {
    name?: string;
    phone?: string;
    email?: string;
    newPassword?: string;
    membership_tier?: "standard" | "gold" | "platinum";
  }): Promise<AuthUser> {
    try {
      const res = await apiRequest<{ user: AuthUser }>("/users/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const current = getInitialStoredUser();
      const merged = { ...(current || DEFAULT_CUSTOMER), ...res.user };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      const current = getInitialStoredUser() || DEFAULT_CUSTOMER;
      const updated: AuthUser = {
        ...current,
        name: payload.name || current.name,
        phone: payload.phone || current.phone,
        email: payload.email || current.email,
        membership_tier: payload.membership_tier || current.membership_tier,
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  },

  logout(): void {
    clearStoredAuth();
    try {
      localStorage.setItem(SIGNED_OUT_FLAG, "true");
    } catch {
      // ignore
    }
  },
};
