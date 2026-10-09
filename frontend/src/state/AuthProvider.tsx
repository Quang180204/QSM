import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  authService,
  getInitialStoredUser,
  type AuthUser,
} from "../services/authService";
import { getStoredToken } from "../services/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (payload: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<AuthUser>;
  updateProfile: (payload: {
    name: string;
    phone?: string;
    email?: string;
    newPassword?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getInitialStoredUser());

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    void authService.me().then((profile) => {
      if (profile) setUser(profile);
    });
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await authService.login(identifier, password);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => {
    const res = await authService.register(payload);
    setUser(res.user);
    return res.user;
  };

  const updateProfile = async (payload: {
    name: string;
    phone?: string;
    email?: string;
    newPassword?: string;
  }) => {
    const updated = await authService.updateProfile(payload);
    setUser(updated);
    return updated;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "admin",
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}

