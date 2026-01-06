<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<head>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">

<!-- Auth Glass CSS -->
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/auth-glass.css">
</head>

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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <circle cx="7.5" cy="12" r="3"></circle>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 12H21" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 12v3" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 15v3" />
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
                        placeholder="Ít nhất 6 ký tự"
                        autocomplete="new-password"
                        minlength="6"
                        required
                    />
                    <button type="button" id="togglePassword" class="auth-input-icon">
                        <svg fill="currentColor" viewBox="0 0 24 24" id="eyeIcon1">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                </div>
                <span class="auth-hint">Gồm chữ hoa, chữ thường và số</span>
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
        alert('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        window.location.href = '${pageContext.request.contextPath}/forgot-password';
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

    // Handle reset password form submission
    document.getElementById('reset-password-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        
        const btn = document.getElementById('submit-btn');
        setButtonLoading(btn, true, 'Đang xử lý...');

        const actionName = 'Đặt lại mật khẩu';
        
        try {
            const { response, json: data } = await fetchJsonWithTimeout(
                '${pageContext.request.contextPath}/api/auth/reset-password',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: document.getElementById('token').value,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    })
                },
                15000
            );

            const backendSuccess = data && typeof data === 'object' ? data.success : undefined;

            if (response.ok && backendSuccess !== false) {

                setTimeout(() => {
                    window.location.href = '${pageContext.request.contextPath}/login';
                }, 2000);
            } else {
                console.log('Reset password failed response:', { response, data });
                let errorMessage = 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';

                if (data) {
                    // Check for message field
                    if (data.message && typeof data.message === 'string' && data.message.trim()) {
                        errorMessage = data.message.trim();
                    }
                    // Check for error field
                    else if (data.error && typeof data.error === 'string' && data.error.trim()) {
                        errorMessage = data.error.trim();
                    }
                    // Check for errors object
                    else if (data.errors && typeof data.errors === 'object') {
                        const errorValues = Object.values(data.errors)
                            .filter(v => v && typeof v === 'string' && v.trim())
                            .map(v => v.trim());
                        if (errorValues.length > 0) {
                            errorMessage = errorValues.join('<br>');
                        }
                    }
                }
                
                // Handle specific status codes
                if (response.status === 400) {
                    errorMessage = 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';
                } else if (response.status === 404) {
                    errorMessage = 'Token không hợp lệ.';
                } else if (response.status >= 500) {
                    errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
                }

                setButtonLoading(btn, false);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            setButtonLoading(btn, false);
        }
    });
</script>
