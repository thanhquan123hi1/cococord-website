import { useMutation } from "@tanstack/react-query";

import { type AuthUser, useAuthStore } from "../../../store/useAuthStore";

export interface LoginVariables {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: number | null;
  username?: string | null;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  loginAt?: string | null;
}

interface LoginErrorBody {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
}

class LoginError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LoginError";
    this.status = status;
  }
}

function errorMessage(body: LoginErrorBody | null): string {
  if (
    typeof body?.message === "string" &&
    body.message.trim() &&
    body.message !== "false"
  ) {
    return body.message.trim();
  }
  if (
    typeof body?.error === "string" &&
    body.error.trim() &&
    body.error !== "false"
  ) {
    return body.error.trim();
  }
  if (body?.errors && typeof body.errors === "object") {
    const values = Object.values(body.errors as Record<string, unknown>)
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim() !== "" && value !== "false",
      )
      .map((value) => value.trim());
    if (values.length > 0) return values.join("; ");
  }
  return "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
}

function toAuthUser(data: AuthResponse): AuthUser {
  return {
    id: data.userId ?? null,
    username: data.username ?? null,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    avatarUrl: data.avatarUrl ?? null,
    role: data.role ?? null,
  };
}

async function loginRequest({
  usernameOrEmail,
  password,
}: LoginVariables): Promise<AuthResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let data: AuthResponse | LoginErrorBody | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as AuthResponse | LoginErrorBody;
      } catch {
        data = null;
      }
    }

    if (
      !response.ok ||
      !data ||
      typeof (data as AuthResponse).accessToken !== "string"
    ) {
      throw new LoginError(
        errorMessage(data as LoginErrorBody | null),
        response.status,
      );
    }

    return data as AuthResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LoginError("Yêu cầu hết thời gian chờ. Vui lòng thử lại.", 408);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function persistSession(data: AuthResponse, rememberMe: boolean): void {
  const user = toAuthUser(data);
  window.localStorage.setItem("accessToken", data.accessToken);
  window.localStorage.setItem("refreshToken", data.refreshToken);
  try {
    window.localStorage.setItem("user", JSON.stringify(user));
  } catch {
    window.localStorage.setItem("user", JSON.stringify({}));
  }

  const cookieBase = `accessToken=${encodeURIComponent(data.accessToken)}; path=/; SameSite=Lax`;
  if (rememberMe) {
    const expires = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toUTCString();
    document.cookie = `${cookieBase}; expires=${expires}`;
  } else {
    document.cookie = cookieBase;
  }

  useAuthStore.getState().setSession(data.accessToken, user);
}

export function useLogin() {
  return useMutation<AuthResponse, Error, LoginVariables>({
    mutationFn: loginRequest,
    onSuccess: (data, variables) =>
      persistSession(data, Boolean(variables.rememberMe)),
  });
}
