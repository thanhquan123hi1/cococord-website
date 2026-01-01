<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap");

  * {
    font-family: "Outfit", sans-serif;
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out;
  }

  .gradient-bg {
    background: linear-gradient(
      135deg,
      hsl(228, 58%, 12%) 0%,
      hsl(228, 58%, 20%) 100%
    );
    position: relative;
    overflow: hidden;
  }

  .blob {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
    filter: blur(40px);
  }

  .blob-1 {
    width: 400px;
    height: 400px;
    background: hsl(235, 86%, 65%);
    top: -100px;
    left: -100px;
  }

  .blob-2 {
    width: 300px;
    height: 300px;
    background: hsl(280, 85%, 60%);
    bottom: -50px;
    right: -50px;
  }

  /* ========== Alert Toast Styles - Góc phải trên cùng ========== */
  .cococord-alert-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 420px;
    width: calc(100vw - 2rem);
    pointer-events: none;
  }

  .cococord-alert {
    pointer-events: auto;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05);
    backdrop-filter: blur(10px);
    background: rgba(30, 33, 36, 0.98);
    color: #f8fafc;
    animation: slideIn 0.3s ease-out;
    position: relative;
    overflow: hidden;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .cococord-alert.removing {
    animation: slideOut 0.3s ease-in forwards;
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  .cococord-alert__row {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
  }

  .cococord-alert__icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    margin-top: 2px;
  }

  .cococord-alert__icon svg {
    width: 100%;
    height: 100%;
  }

  .cococord-alert__content {
    flex: 1;
    min-width: 0;
  }

  .cococord-alert__title {
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 2px;
  }

  .cococord-alert__message {
    font-size: 0.875rem;
    line-height: 1.4;
    color: rgba(248, 250, 252, 0.85);
    word-break: break-word;
  }

  .cococord-alert__close {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    padding: 4px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    cursor: pointer;
    color: rgba(248, 250, 252, 0.7);
    transition: all 0.2s;
  }

  .cococord-alert__close:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  .cococord-alert__close svg {
    width: 100%;
    height: 100%;
  }

  .cococord-alert__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    width: 100%;
  }

  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }

  /* Alert Types */
  .cococord-alert--success {
    border-left: 4px solid #22c55e;
  }
  .cococord-alert--success .cococord-alert__icon { color: #22c55e; }
  .cococord-alert--success .cococord-alert__progress { background: #22c55e; }

  .cococord-alert--danger {
    border-left: 4px solid #ef4444;
  }
  .cococord-alert--danger .cococord-alert__icon { color: #ef4444; }
  .cococord-alert--danger .cococord-alert__progress { background: #ef4444; }

  .cococord-alert--warning {
    border-left: 4px solid #f59e0b;
  }
  .cococord-alert--warning .cococord-alert__icon { color: #f59e0b; }
  .cococord-alert--warning .cococord-alert__progress { background: #f59e0b; }

  .cococord-alert--info {
    border-left: 4px solid #3b82f6;
  }
  .cococord-alert--info .cococord-alert__icon { color: #3b82f6; }
  .cococord-alert--info .cococord-alert__progress { background: #3b82f6; }
</style>

<!-- Alert Container - Góc phải trên cùng (v2) -->
<div id="alert-container" class="cococord-alert-container" data-version="2"></div>

<div
  class="gradient-bg min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 relative"
>
  <!-- Background blobs -->
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>

  <!-- Content -->
  <div class="w-full max-w-md animate-fade-in-up relative z-10">
    <!-- Card -->
    <div
      class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10"
    >
      <!-- Header -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(235,86%,65%)] to-[hsl(280,85%,60%)] mb-4"
        >
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Đăng nhập
        </h1>
        <p class="text-gray-600 text-sm sm:text-base">
          Chào mừng trở lại với CoCoCord!
        </p>
      </div>

      <!-- Form -->
      <form id="login-form" class="space-y-5">
        <!-- Username/Email Field -->
        <div>
          <label
            for="usernameOrEmail"
            class="block text-sm font-semibold text-gray-800 mb-2"
          >
            Tên đăng nhập hoặc Email
          </label>
          <input
            type="text"
            id="usernameOrEmail"
            name="usernameOrEmail"
            required
            placeholder="Nhập username hoặc email"
            autocomplete="username"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(235,86%,65%)] focus:border-transparent transition-all"
          />
        </div>

        <!-- Password Field -->
        <div>
          <label
            for="password"
            class="block text-sm font-semibold text-gray-800 mb-2"
          >
            Mật khẩu
          </label>
          <div class="relative">
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Nhập mật khẩu"
              autocomplete="current-password"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(235,86%,65%)] focus:border-transparent transition-all pr-12"
            />
            <button
              type="button"
              id="togglePassword"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="flex items-center justify-between text-sm">
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              class="w-4 h-4 rounded border-gray-300 text-[hsl(235,86%,65%)] focus:ring-2 focus:ring-[hsl(235,86%,65%)]"
            />
            <span class="ml-2 text-gray-700">Ghi nhớ đăng nhập</span>
          </label>
          <a
            href="${pageContext.request.contextPath}/forgot-password"
            class="text-[hsl(235,86%,65%)] hover:text-[hsl(235,86%,55%)] font-medium transition-colors"
          >
            Quên mật khẩu?
          </a>
        </div>

        <!-- Login Button -->
        <button
          type="submit"
          id="login-btn"
          class="w-full bg-gradient-to-r from-[hsl(235,86%,65%)] to-[hsl(280,85%,60%)] text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[hsl(235,86%,65%)]/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(235,86%,65%)]"
        >
          Đăng nhập
        </button>

        <!-- Sign Up Link -->
        <div class="text-center pt-2">
          <p class="text-gray-600 text-sm">
            Chưa có tài khoản?
            <a
              href="${pageContext.request.contextPath}/register"
              class="text-[hsl(235,86%,65%)] hover:text-[hsl(235,86%,55%)] font-bold transition-colors"
            >
              Đăng ký ngay
            </a>
          </p>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
  // Toggle password visibility
  document
    .getElementById("togglePassword")
    .addEventListener("click", function () {
      const passwordInput = document.getElementById("password");
      const icon = this.querySelector("svg");

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        // Change to eye-slash icon
        icon.innerHTML =
          '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 2.99-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-.78l1.15 1.15.02-.16c0-1.66-1.34-3-3-3-.05 0-.11 0-.16.02l1.15 1.15c.31.26.53.62.53 1.02 0 .89-.72 1.62-1.62 1.62-.4 0-.76-.22-1.02-.53l-1.15-1.15c-.26.31-.48.67-.48 1.07 0 1.66 1.34 3 3 3 .4 0 .76-.22 1.02-.53z"/>';
      } else {
        passwordInput.type = "password";
        // Change to eye icon
        icon.innerHTML =
          '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
      }
    });

  function setButtonLoading(btn, isLoading, loadingText, originalHtml) {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML =
        '<span class="inline-block mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>' +
        loadingText;
    } else {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }

  async function fetchJsonWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const text = await response.text();

      let json = null;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
      }

      return { response, json };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Flag to prevent double submission
  let isSubmitting = false;

  // Handle login form submission - ONLY ONCE
  const loginForm = document.getElementById("login-form");
  if (loginForm && !loginForm.dataset.listenerAttached) {
    loginForm.dataset.listenerAttached = "true";
    
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      isSubmitting = true;

      const btn = document.getElementById("login-btn");
      const originalText = btn.innerHTML;
      setButtonLoading(btn, true, "Đang đăng nhập...", originalText);

      const formData = {
        usernameOrEmail: document
          .getElementById("usernameOrEmail")
          .value.trim(),
        password: document.getElementById("password").value,
      };

      const rememberMe = !!document.getElementById("rememberMe")?.checked;

      try {
        const { response, json: data } = await fetchJsonWithTimeout(
          "${pageContext.request.contextPath}/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          },
          15000
        );

        if (response.ok && data && data.accessToken) {
          // Lưu JWT tokens vào localStorage
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          localStorage.setItem("user", JSON.stringify(data.user || {}));

          // Lưu accessToken vào Cookie (cho server-side rendering với JSP)
          const cookieBase =
            "accessToken=" +
            encodeURIComponent(data.accessToken) +
            "; path=/; SameSite=Lax";
          if (rememberMe) {
            const expires = new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toUTCString();
            document.cookie = cookieBase + "; expires=" + expires;
          } else {
            document.cookie = cookieBase;
          }
          showAlert("Đăng nhập thành công", "success");

          setTimeout(() => {
            window.location.href = "${pageContext.request.contextPath}/app";
          }, 1000);
        } else {
          // Lấy message lỗi từ server response với validation chặt chẽ
          let errorMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
          
          if (data && typeof data === 'object') {
            // Ưu tiên lấy data.message
            if (data.message && typeof data.message === 'string' && data.message.trim()) {
              errorMessage = data.message.trim();
            }
            // Fallback: Nếu có errors object (validation errors)
            else if (data.errors && typeof data.errors === 'object') {
              const errorValues = Object.values(data.errors)
                .filter(v => typeof v === 'string' && v.trim())
                .map(v => v.trim());
              if (errorValues.length > 0) {
                errorMessage = errorValues.join('; ');
              }
            }
          }
          
          // Validation cuối cùng: đảm bảo không phải boolean/empty
          if (typeof errorMessage !== 'string' || !errorMessage.trim() || errorMessage === 'false' || errorMessage === 'true') {
            errorMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
          }
          
          showAlert(errorMessage, "danger");
          setButtonLoading(btn, false, "", originalText);
          isSubmitting = false;
        }
      } catch (error) {
        console.error("Login error:", error);
        let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại sau.";
        if (error.name === 'AbortError') {
          errorMessage = "Yêu cầu hết thời gian chờ. Vui lòng thử lại.";
        }
        showAlert(errorMessage, "danger");
        setButtonLoading(btn, false, "", originalText);
        isSubmitting = false;
      }
    });
  } else {
    console.log("⚠️ Form already has listener or not found!");
  }

  function showAlert(message, type) {
    
    message = String(message || "Có lỗi xảy ra");
    type = String(type || "danger");
    
    // Icon SVGs for different alert types
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    
    const titles = {
      success: 'Thành công',
      danger: 'Lỗi',
      warning: 'Cảnh báo',
      info: 'Thông báo'
    };

    // Sử dụng container có sẵn trong HTML
    const alertContainer = document.getElementById("alert-container");
    if (!alertContainer) {
      console.error('Alert container not found!');
      return;
    }

    const variantClass = `cococord-alert--${type}`;
    const alertEl = document.createElement("div");

    alertEl.className = `cococord-alert ${variantClass}`;
    alertEl.setAttribute("role", "alert");
    
    const titleText = titles[type] || 'Thông báo';
    const messageText = message;
    
    alertEl.innerHTML = `
      <div class="cococord-alert__row">
        <div class="cococord-alert__content">
          <div class="cococord-alert__title">` + titleText + `</div>
          <div class="cococord-alert__message">` + messageText + `</div>
        </div>
        <button type="button" class="cococord-alert__close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="cococord-alert__progress"></div>
    `;

    const closeBtn = alertEl.querySelector(".cococord-alert__close");
    closeBtn.addEventListener("click", () => removeAlert(alertEl));
    alertContainer.appendChild(alertEl);
    
    setTimeout(() => removeAlert(alertEl), 5000);
  }

  function removeAlert(alert) {
    if (!alert || !alert.parentNode) return;
    alert.classList.add('removing');
    setTimeout(() => alert.remove(), 300);
  }
</script>