import { create } from "zustand";

export interface AuthUser {
  id: number | null;
  username: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: string | null;
}

export interface AuthState {
  accessToken: string | null;
  currentUser: AuthUser | null;
  setSession: (accessToken: string, currentUser: AuthUser) => void;
  clearSession: () => void;
}

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const rawUser = window.localStorage.getItem("user");
    if (!rawUser) return null;
    const parsed: unknown = JSON.parse(rawUser);
    if (!parsed || typeof parsed !== "object") return null;

    const user = parsed as Partial<AuthUser>;
    return {
      id: typeof user.id === "number" ? user.id : null,
      username: typeof user.username === "string" ? user.username : null,
      email: typeof user.email === "string" ? user.email : null,
      displayName:
        typeof user.displayName === "string" ? user.displayName : null,
      avatarUrl: typeof user.avatarUrl === "string" ? user.avatarUrl : null,
      role: typeof user.role === "string" ? user.role : null,
    };
  } catch {
    return null;
  }
}

function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("accessToken");
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: readStoredAccessToken(),
  currentUser: readStoredUser(),
  setSession: (accessToken, currentUser) => set({ accessToken, currentUser }),
  clearSession: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem("user");
      document.cookie =
        "accessToken=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    set({ accessToken: null, currentUser: null });
  },
}));
