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

    /* Auth alerts: use static CSS (Tailwind CDN won't generate dynamic classes created in JS) */
    .cococord-alert-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: calc(100vw - 2rem);
    }

    .cococord-alert {
        width: 100%;
        max-width: 420px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 0.75rem;
        padding: 0.75rem 0.875rem;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(6px);
        background: rgba(15, 23, 42, 0.95);
        color: #f8fafc;
    }

    .cococord-alert__row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .cococord-alert__content {
        color: inherit;
        font-size: 0.95rem;
        line-height: 1.35;
        word-break: break-word;
    }

    .cococord-alert__close {
        flex: 0 0 auto;
        appearance: none;
        background: transparent;
        border: 1px solid currentColor;
        border-radius: 0.5rem;
        width: 2.25rem;
        height: 2.25rem;
        line-height: 2.1rem;
        text-align: center;
        font-size: 1.25rem;
        font-weight: 700;
        cursor: pointer;
        opacity: 0.95;
    }

    .cococord-alert__close:hover {
        opacity: 1;
    }

    .cococord-alert--success {
        border-left: 4px solid rgba(34, 197, 94, 0.95);
    }

    .cococord-alert--danger {
        border-left: 4px solid rgba(239, 68, 68, 0.95);
    }
</style>

<div class="gradient-bg min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 relative">
    <!-- Background blobs -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <!-- Content -->
    <div class="w-full max-w-md animate-fade-in-up relative z-10">
        <!-- Card -->
        <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(235,86%,65%)] to-[hsl(280,85%,60%)] mb-4">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a5 5 0 00-5 5v2H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 7V7a3 3 0 016 0v2H9zm3 4a2 2 0 00-1 3.732V18a1 1 0 002 0v-1.268A2 2 0 0012 13z"/>
                    </svg>
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Quên mật khẩu</h1>
                <p class="text-gray-600 text-sm sm:text-base">Nhập email để đặt lại mật khẩu</p>
            </div>

            <!-- Form -->
            <form id="forgot-password-form" class="space-y-5">
                <div>
                    <label for="email" class="block text-sm font-semibold text-gray-800 mb-2">
                        Email <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        maxlength="150"
                        placeholder="Nhập email đã đăng ký"
                        autocomplete="email"
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(235,86%,65%)] focus:border-transparent transition-all"
                    />
                    <p class="text-xs text-gray-500 mt-1">Chúng tôi sẽ gửi link đặt lại mật khẩu qua email.</p>
                </div>

                <button
                    type="submit"
                    id="submit-btn"
                    class="w-full bg-gradient-to-r from-[hsl(235,86%,65%)] to-[hsl(280,85%,60%)] text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[hsl(235,86%,65%)]/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(235,86%,65%)]"
                >
                    Gửi yêu cầu
                </button>

                <div class="text-center pt-2">
                    <a href="${pageContext.request.contextPath}/login" class="text-[hsl(235,86%,65%)] hover:text-[hsl(235,86%,55%)] font-bold transition-colors">
                        Quay lại đăng nhập
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
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

    function showAlert(message, type) {
        let alertContainer = document.getElementById("alert-container");
        if (!alertContainer) {
            alertContainer = document.createElement("div");
            alertContainer.id = "alert-container";
            document.body.appendChild(alertContainer);
        }

        alertContainer.classList.add("cococord-alert-container");

        const variantClass =
            type === "success" ? "cococord-alert--success" : "cococord-alert--danger";
        const alert = document.createElement("div");
        alert.className = `cococord-alert ${variantClass} animate-fade-in-up`;
        alert.setAttribute("role", "alert");
        alert.innerHTML = `
            <div class="cococord-alert__row">
                <div class="cococord-alert__content">${message}</div>
                <button type="button" class="cococord-alert__close" aria-label="Đóng">&times;</button>
            </div>
        `;

        alert.querySelector(".cococord-alert__close")?.addEventListener("click", () => {
            alert.remove();
        });
        alertContainer.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    document
        .getElementById("forgot-password-form")
        .addEventListener("submit", async function (e) {
            e.preventDefault();

            const btn = document.getElementById("submit-btn");
            const originalText = btn.innerHTML;
            setButtonLoading(btn, true, "Đang gửi...", originalText);

            const email = document.getElementById("email").value.trim();

            try {
                const { response, json: data } = await fetchJsonWithTimeout(
                    "${pageContext.request.contextPath}/api/auth/forgot-password",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email }),
                    },
                    15000
                );

                if (response.ok) {
                    showAlert(
                        "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.",
                        "success"
                    );
                    document.getElementById("forgot-password-form").reset();
                } else {
                    let errorMessage =
                        data?.message || "Có lỗi xảy ra. Vui lòng thử lại.";
                    if (data?.errors) {
                        const errorList = Object.values(data.errors).join("<br>");
                        errorMessage = errorList || errorMessage;
                    }
                    showAlert(errorMessage, "danger");
                }
            } catch (error) {
                console.error("Forgot password error:", error);
                if (error?.name === "AbortError") {
                    showAlert("Yêu cầu gửi email quá lâu. Vui lòng thử lại.", "danger");
                } else {
                    showAlert("Có lỗi xảy ra. Vui lòng thử lại sau.", "danger");
                }
            } finally {
                setButtonLoading(btn, false, "", originalText);
            }
        });
</script>
