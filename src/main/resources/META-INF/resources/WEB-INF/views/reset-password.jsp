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
                    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
            </div>
            <h1 class="auth-title">Đặt lại mật khẩu</h1>
            <p class="auth-subtitle">Tạo mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <!-- Form -->
        <form id="reset-password-form" class="auth-form">
            <input type="hidden" id="token" name="token" value="">

            <!-- New Password -->
            <div class="auth-field">
                <label for="newPassword" class="auth-label">
                    Mật khẩu mới <span class="required">*</span>
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="password" 
                        id="newPassword" 
                        name="newPassword"
                        class="auth-input has-icon"
                        placeholder="Ít nhất 8 ký tự"
                        autocomplete="new-password"
                        minlength="8"
                        required
                    />
                    <button type="button" id="togglePassword" class="auth-input-icon">
                        <svg fill="currentColor" viewBox="0 0 24 24" id="eyeIcon1">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                </div>
                <span class="auth-hint">Gồm chữ hoa, chữ thường, số và ký tự đặc biệt</span>
            </div>

            <!-- Confirm Password -->
            <div class="auth-field">
                <label for="confirmPassword" class="auth-label">
                    Xác nhận mật khẩu <span class="required">*</span>
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="password" 
                        id="confirmPassword" 
                        name="confirmPassword"
                        class="auth-input has-icon"
                        placeholder="Nhập lại mật khẩu mới"
                        autocomplete="new-password"
                        required
                    />
                    <button type="button" id="toggleConfirmPassword" class="auth-input-icon">
                        <svg fill="currentColor" viewBox="0 0 24 24" id="eyeIcon2">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="submit-btn" class="auth-btn auth-btn-primary" style="width: 100%;">
                Đặt lại mật khẩu
            </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
            <p class="auth-footer-text">
                <a href="${pageContext.request.contextPath}/login" class="auth-footer-link">
                    ← Quay lại đăng nhập
                </a>
            </p>
        </div>
    </div>
</div>

<script>
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showAlert('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 'danger');
        setTimeout(() => {
            window.location.href = '${pageContext.request.contextPath}/forgot-password';
        }, 3000);
    } else {
        document.getElementById('token').value = token;
    }

    // Toggle password visibility
    function setupTogglePassword(btnId, inputId, iconId) {
        document.getElementById(btnId).addEventListener('click', function() {
            const input = document.getElementById(inputId);
            const icon = document.getElementById(iconId);
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
            } else {
                input.type = 'password';
                icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
            }
        });
    }

    setupTogglePassword('togglePassword', 'newPassword', 'eyeIcon1');
    setupTogglePassword('toggleConfirmPassword', 'confirmPassword', 'eyeIcon2');

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

    // Handle reset password form submission
    document.getElementById('reset-password-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            showAlert('Mật khẩu xác nhận không khớp!', 'danger');
            return;
        }
        
        const btn = document.getElementById('submit-btn');
        setButtonLoading(btn, true, 'Đang xử lý...');
        
        try {
            const response = await fetch('${pageContext.request.contextPath}/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: document.getElementById('token').value,
                    newPassword: newPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAlert('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...', 'success');
                setTimeout(() => {
                    window.location.href = '${pageContext.request.contextPath}/login';
                }, 2000);
            } else {
                showAlert(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'danger');
                setButtonLoading(btn, false);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showAlert('Có lỗi xảy ra. Vui lòng thử lại sau.', 'danger');
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
