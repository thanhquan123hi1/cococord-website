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
    <div class="auth-glass-card" style="max-width: 480px;">
        <!-- Header -->
        <div class="auth-header">
            <div class="auth-logo">
                <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            </div>
            <h1 class="auth-title">Tạo tài khoản</h1>
            <p class="auth-subtitle">Tham gia cộng đồng CoCoCord</p>
        </div>

        <!-- Form -->
        <form id="register-form" class="auth-form">
            <!-- Username -->
            <div class="auth-field">
                <label for="username" class="auth-label">
                    Tên đăng nhập <span class="required">*</span>
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="text" 
                        id="username" 
                        name="username"
                        class="auth-input"
                        placeholder="3-50 ký tự, chỉ chữ, số và _"
                        autocomplete="username"
                        minlength="3"
                        maxlength="50"
                        pattern="[a-zA-Z0-9_]+"
                        required
                    />
                </div>
                <span class="auth-hint">Tên đăng nhập là duy nhất và không thể thay đổi</span>
            </div>

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
                        placeholder="your-email@example.com"
                        autocomplete="email"
                        maxlength="150"
                        required
                    />
                </div>
            </div>

            <!-- Display Name -->
            <div class="auth-field">
                <label for="displayName" class="auth-label">
                    Tên hiển thị <span class="required">*</span>
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="text" 
                        id="displayName" 
                        name="displayName"
                        class="auth-input"
                        placeholder="Tên hiển thị với mọi người"
                        minlength="1"
                        maxlength="50"
                        required
                    />
                </div>
            </div>

            <!-- Password -->
            <div class="auth-field">
                <label for="password" class="auth-label">
                    Mật khẩu <span class="required">*</span>
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="password" 
                        id="password" 
                        name="password"
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
                        placeholder="Nhập lại mật khẩu"
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

            <!-- Terms -->
            <label class="auth-checkbox-wrapper">
                <input type="checkbox" id="agreeTerms" class="auth-checkbox" required/>
                <span class="auth-terms">
                    Tôi đồng ý với 
                    <a href="#">Điều khoản sử dụng</a> và 
                    <a href="#">Chính sách bảo mật</a>
                </span>
            </label>

            <!-- Submit Button -->
            <button type="submit" id="register-btn" class="auth-btn auth-btn-primary" style="width: 100%;">
                Đăng ký
            </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
            <p class="auth-footer-text">
                Đã có tài khoản? 
                <a href="${pageContext.request.contextPath}/login" class="auth-footer-link">
                    Đăng nhập ngay
                </a>
            </p>
        </div>
    </div>
</div>

<script>
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

    setupTogglePassword('togglePassword', 'password', 'eyeIcon1');
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

    // Handle register form submission
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showAlert('Mật khẩu xác nhận không khớp!', 'danger');
            return;
        }
        
        const btn = document.getElementById('register-btn');
        setButtonLoading(btn, true, 'Đang đăng ký...');
        
        const formData = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            displayName: document.getElementById('displayName').value.trim(),
            password: password
        };
        
        try {
            const { response, json: data } = await fetchJsonWithTimeout(
                '${pageContext.request.contextPath}/api/auth/register',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                },
                15000
            );
            
            if (response.ok) {
                showAlert('Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
                setTimeout(() => {
                    window.location.href = '${pageContext.request.contextPath}/login';
                }, 1500);
            } else {
                let alertType = 'danger';
                let errorMessage = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
                
                if (data && typeof data === 'object') {
                    if (data.message && typeof data.message === 'string' && data.message.trim()) {
                        errorMessage = data.message.trim();
                    } else if (response.status === 400 && data.errors && typeof data.errors === 'object') {
                        const errorValues = Object.values(data.errors)
                            .filter(v => typeof v === 'string' && v.trim())
                            .map(v => v.trim());
                        if (errorValues.length > 0) {
                            errorMessage = errorValues.join('<br>');
                        }
                    }
                }
                
                if (errorMessage.includes('tồn tại') || errorMessage.includes('exists') || errorMessage.includes('đã được đăng ký')) {
                    alertType = 'warning';
                }
                
                showAlert(errorMessage, alertType);
                setButtonLoading(btn, false);
            }
        } catch (error) {
            console.error('Register error:', error);
            if (error?.name === 'AbortError') {
                showAlert('Yêu cầu đăng ký quá lâu. Vui lòng thử lại.', 'danger');
            } else {
                showAlert('Có lỗi xảy ra. Vui lòng thử lại sau.', 'danger');
            }
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
