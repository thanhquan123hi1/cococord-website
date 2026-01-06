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
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 7.5h16v9H4z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 7.5l8 6 8-6" />
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

            const backendSuccess = data && typeof data === 'object' ? data.success : undefined;

            if (response.ok && backendSuccess !== false) {
                document.getElementById('forgot-password-form').reset();
                showSuccessNotification('Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.');
                btn.innerHTML = '✓ Đã gửi email!';
                btn.classList.add('success');
            } else {
                console.log('Forgot password failed response:', { response, data });
                let errorMessage = 'Gửi email đặt lại mật khẩu thất bại. Vui lòng thử lại.';

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
                if (response.status === 404) {
                    errorMessage = 'Email không tồn tại trong hệ thống.';
                } else if (response.status >= 500) {
                    errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
                }
                showErrorNotification(errorMessage);
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showErrorNotification('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.');
        } finally {
            setButtonLoading(btn, false);
        }
    });
    
    // Success notification function
    function showSuccessNotification(message) {
        showNotification(message, 'success');
    }
    
    // Error notification function  
    function showErrorNotification(message) {
        showNotification(message, 'error');
    }
    
    // Generic notification function
    function showNotification(message, type) {
        // Remove existing notification
        const existing = document.querySelector('.auth-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'auth-notification auth-notification-' + type;
        notification.innerHTML = '<span>' + message + '</span><button onclick="this.parentElement.remove()">&times;</button>';
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('auth-notification-fadeout');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
</script>

<!-- Notification styles now in auth-glass.css -->
