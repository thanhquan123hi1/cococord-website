<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<!-- Tailwind CSS CDN and custom animations -->
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap");

  * {
    font-family: "Outfit", sans-serif;
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out;
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
</style>

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

  // Handle login form submission
  document
    .getElementById("login-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const btn = document.getElementById("login-btn");
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML =
        '<span class="inline-block mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Đang đăng nhập...';

      const formData = {
        usernameOrEmail: document
          .getElementById("usernameOrEmail")
          .value.trim(),
        password: document.getElementById("password").value,
      };

      try {
        const response = await fetch(
          "${pageContext.request.contextPath}/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        const data = await response.json();

        if (response.ok && data.accessToken) {
          // Lưu JWT tokens vào localStorage
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          localStorage.setItem("user", JSON.stringify(data.user || {}));

          // Lưu accessToken vào Cookie (cho server-side rendering với JSP)
          const expires = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toUTCString();
          document.cookie =
            "accessToken=" +
            encodeURIComponent(data.accessToken) +
            "; expires=" +
            expires +
            "; path=/; SameSite=Lax";
          showAlert("Đăng nhập thành công! Đang chuyển hướng...", "success");

          setTimeout(() => {
            window.location.href = "${pageContext.request.contextPath}/app";
          }, 1000);
        } else {
          // Handle validation errors (returns { success: false, message: "Validation failed", errors: {...} })
          let errorMessage =
            data.message ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
          if (data.errors) {
            // Build error message from field errors
            const errorList = Object.values(data.errors).join("<br>");
            errorMessage = errorList || errorMessage;
          }
          showAlert(errorMessage, "danger");
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (error) {
        console.error("Login error:", error);
        showAlert("Có lỗi xảy ra. Vui lòng thử lại sau.", "danger");
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });

  function showAlert(message, type) {
    // Create alert container if not exists
    let alertContainer = document.getElementById("alert-container");
    if (!alertContainer) {
      alertContainer = document.createElement("div");
      alertContainer.id = "alert-container";
      alertContainer.className = "fixed top-4 right-4 z-50 space-y-2";
      document.body.appendChild(alertContainer);
    }

    const bgColor =
      type === "success"
        ? "bg-green-100 border-green-400 text-green-700"
        : "bg-red-100 border-red-400 text-red-700";
    const alert = document.createElement("div");
    alert.className = `${bgColor} border px-4 py-3 rounded-lg shadow-lg max-w-sm animate-fade-in-up`;
    alert.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg font-bold cursor-pointer">&times;</button>
            </div>
        `;
    alertContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => alert.remove(), 5000);
  }
</script>

<script>
  // Toggle password visibility
  document
    .getElementById("togglePassword")
    .addEventListener("click", function () {
      const passwordInput = document.getElementById("password");
      const icon = this.querySelector("i");

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("bi-eye");
        icon.classList.add("bi-eye-slash");
      } else {
        passwordInput.type = "password";
        icon.classList.remove("bi-eye-slash");
        icon.classList.add("bi-eye");
      }
    });

  // Handle login form submission
  document
    .getElementById("login-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const btn = document.getElementById("login-btn");
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Đang đăng nhập...';

      const formData = {
        usernameOrEmail: document
          .getElementById("usernameOrEmail")
          .value.trim(),
        password: document.getElementById("password").value,
      };

      try {
        const response = await fetch(
          "${pageContext.request.contextPath}/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        const data = await response.json();

        if (response.ok && data.accessToken) {
          // Lưu JWT tokens vào localStorage
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          localStorage.setItem("user", JSON.stringify(data.user || {}));

          // Lưu accessToken vào Cookie (cho server-side rendering với JSP)
          const expires = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toUTCString();
          document.cookie =
            "accessToken=" +
            encodeURIComponent(data.accessToken) +
            "; expires=" +
            expires +
            "; path=/; SameSite=Lax";
          showAlert("Đăng nhập thành công! Đang chuyển hướng...", "success");

          setTimeout(() => {
            window.location.href = "${pageContext.request.contextPath}/app";
          }, 1000);
        } else {
          // Handle validation errors (returns { success: false, message: "Validation failed", errors: {...} })
          let errorMessage =
            data.message ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
          if (data.errors) {
            // Build error message from field errors
            const errorList = Object.values(data.errors).join("<br>");
            errorMessage = errorList || errorMessage;
          }
          showAlert(errorMessage, "danger");
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (error) {
        console.error("Login error:", error);
        showAlert("Có lỗi xảy ra. Vui lòng thử lại sau.", "danger");
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });

  function showAlert(message, type) {
    const alertContainer = document.getElementById("alert-container");
    if (!alertContainer) return;

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    alertContainer.appendChild(alert);

    setTimeout(() => {
      alert.remove();
    }, 5000);
  }
</script>
