import { type FormEvent, useEffect, useRef, useState } from "react";

import { useLogin } from "../hooks/useLogin";

export function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const login = useLogin();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setNotification({
        message: "Đăng ký thành công! Hãy đăng nhập để tiếp tục.",
        type: "success",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("reset") === "true") {
      setNotification({
        message: "Đổi mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.",
        type: "success",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(
    () => () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    },
    [],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (login.isPending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const data = await login.mutateAsync({
        usernameOrEmail: String(formData.get("usernameOrEmail") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
        rememberMe,
      });
      setLoginSucceeded(true);
      setNotification({
        message: "Đăng nhập thành công! Đang chuyển hướng...",
        type: "success",
      });

      redirectTimerRef.current = window.setTimeout(() => {
        let next: string | null = null;
        try {
          const raw = new URLSearchParams(window.location.search).get("next");
          if (raw && raw.startsWith("/") && !raw.startsWith("//")) next = raw;
        } catch {
          next = null;
        }

        const role = String(data.role ?? "").toUpperCase();
        const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";
        const defaultTarget = isAdmin ? "/admin/dashboard" : "/app";
        window.location.href = isAdmin
          ? next?.startsWith("/admin")
            ? next
            : defaultTarget
          : next || defaultTarget;
      }, 1_000);
    } catch (error) {
      setLoginSucceeded(false);
      setNotification({
        message:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        type: "error",
      });
    }
  };

  return (
    <div className="auth-glass-page">
      <div className="auth-orb auth-orb-1"></div>
      <div className="auth-orb auth-orb-2"></div>
      <div className="auth-orb auth-orb-3"></div>

      <a href="/" className="auth-back-home">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </a>

      <div className="auth-glass-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11a4 4 0 1 0-8 0"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 20c1.2-3.7 5-6 8-6s6.8 2.3 8 6"
              />
            </svg>
          </div>
          <h1 className="auth-title">Chào mừng trở lại</h1>
          <p className="auth-subtitle">Đăng nhập vào CoCoCord</p>
        </div>

        <form id="login-form" className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="usernameOrEmail" className="auth-label">
              Tên đăng nhập hoặc Email
            </label>
            <div className="auth-input-wrapper">
              <input
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                className="auth-input"
                placeholder="Nhập username hoặc email"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Mật khẩu
            </label>
            <div className="auth-input-wrapper">
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                name="password"
                className="auth-input has-icon"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                id="togglePassword"
                className="auth-input-icon"
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                <svg fill="currentColor" viewBox="0 0 24 24" id="eyeIcon">
                  <path
                    d={
                      passwordVisible
                        ? "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                        : "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="auth-row">
            <label className="auth-checkbox-wrapper">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                className="auth-checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span className="auth-checkbox-label">Ghi nhớ đăng nhập</span>
            </label>
            <a href="/forgot-password" className="auth-link">
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            id="login-btn"
            className={`auth-btn auth-btn-primary${loginSucceeded ? " success" : ""}`}
            style={{ width: "100%" }}
            disabled={login.isPending}
          >
            {login.isPending && <span className="spinner"></span>}
            {login.isPending
              ? "Đang đăng nhập..."
              : loginSucceeded
                ? "Đăng nhập thành công!"
                : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Chưa có tài khoản?{" "}
            <a href="/register" className="auth-footer-link">
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>
      {notification && (
        <div
          className={`auth-notification auth-notification-${notification.type}`}
          role="alert"
        >
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)}>
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
