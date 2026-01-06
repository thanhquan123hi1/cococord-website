<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">

<!-- Auth Glass CSS -->
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/auth-glass.css">

<!-- Alert Container -->
<div id="alert-container" class="auth-alert-container"></div>

<div class="auth-glass-page">
    <!-- Animated Background Orbs -->
    <div class="auth-orb auth-orb-1"></div>
    <div class="auth-orb auth-orb-2"></div>
    <div class="auth-orb auth-orb-3"></div>
    
    <!-- Back to Home -->
    <a href="${pageContext.request.contextPath}/" class="auth-back-home">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        <span>Trang chủ</span>
    </a>
    
    <!-- Glass Card -->
    <div class="auth-glass-card">
        <!-- Header -->
        <div class="auth-header">
            <div class="auth-logo">
                <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
            </div>
            <h1 class="auth-title">Quên mật khẩu?</h1>
            <p class="auth-subtitle">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <!-- Form -->
        <form id="forgot-password-form" class="auth-form">
            <!-- Email -->
            <div class="auth-field">
                <label for="email" class="auth-label">
                    Email <span class="required">*</span>
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="email" 
                        id="email" 
                        name="email"
                        class="auth-input"
                        placeholder="Nhập email đã đăng ký"
                        autocomplete="email"
                        maxlength="150"
                        required
                    />
                </div>
                <span class="auth-hint">Chúng tôi sẽ gửi link đặt lại mật khẩu qua email này.</span>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="submit-btn" class="auth-btn auth-btn-primary" style="width: 100%;">
                Gửi yêu cầu
            </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
            <p class="auth-footer-text">
                Nhớ mật khẩu rồi? 
                <a href="${pageContext.request.contextPath}/login" class="auth-footer-link">
                    Quay lại đăng nhập
                </a>
            </p>
        </div>
    </div>
</div>

<script>
    // Form utilities
    function setButtonLoading(btn, isLoading, loadingText) {
        if (!btn) return;
        if (!btn.dataset.originalHtml) {
            btn.dataset.originalHtml = btn.innerHTML;
        }
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span>' + loadingText;
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalHtml;
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
                try { json = JSON.parse(text); } catch { json = null; }
            }
            return { response, json };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // Handle forgot password form submission
    document.getElementById('forgot-password-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const btn = document.getElementById('submit-btn');
        setButtonLoading(btn, true, 'Đang gửi...');

        const email = document.getElementById('email').value.trim();

        try {
            const { response, json: data } = await fetchJsonWithTimeout(
                '${pageContext.request.contextPath}/api/auth/forgot-password',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                },
                15000
            );

            if (response.ok) {
                showAlert('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.', 'success');
                document.getElementById('forgot-password-form').reset();
            } else {
                let errorMessage = data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
                if (data?.errors) {
                    const errorList = Object.values(data.errors).join('<br>');
                    errorMessage = errorList || errorMessage;
                }
                showAlert(errorMessage, 'danger');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            if (error?.name === 'AbortError') {
                showAlert('Yêu cầu gửi email quá lâu. Vui lòng thử lại.', 'danger');
            } else {
                showAlert('Có lỗi xảy ra. Vui lòng thử lại sau.', 'danger');
            }
        } finally {
            setButtonLoading(btn, false);
        }
    });

    // Alert System
    function showAlert(message, type = 'info') {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        const titles = { success: 'Thành công', danger: 'Lỗi', warning: 'Cảnh báo', info: 'Thông báo' };

        const container = document.getElementById('alert-container');
        if (!container) return;

        const alertEl = document.createElement('div');
        alertEl.className = `auth-alert auth-alert--${type}`;
        alertEl.setAttribute('role', 'alert');
        alertEl.innerHTML = `
            <div class="auth-alert-row">
                <div class="auth-alert-icon">${icons[type] || icons.info}</div>
                <div class="auth-alert-content">
                    <div class="auth-alert-title">${titles[type] || 'Thông báo'}</div>
                    <div class="auth-alert-message">${message}</div>
                </div>
                <button type="button" class="auth-alert-close" aria-label="Đóng">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="auth-alert-progress"></div>
        `;

        alertEl.querySelector('.auth-alert-close').addEventListener('click', () => removeAlert(alertEl));
        container.appendChild(alertEl);
        setTimeout(() => removeAlert(alertEl), 5000);
    }

    function removeAlert(alert) {
        if (!alert || !alert.parentNode) return;
        alert.classList.add('removing');
        setTimeout(() => alert.remove(), 300);
    }
</script>
