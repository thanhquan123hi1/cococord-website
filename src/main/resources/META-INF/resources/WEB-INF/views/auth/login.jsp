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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 11a4 4 0 1 0-8 0" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 20c1.2-3.7 5-6 8-6s6.8 2.3 8 6" />
                </svg>
            </div>
            <h1 class="auth-title">Chào mừng trở lại</h1>
            <p class="auth-subtitle">Đăng nhập vào CoCoCord</p>
        </div>

        <!-- Form -->
        <form id="login-form" class="auth-form">
            <!-- Username/Email -->
            <div class="auth-field">
                <label for="usernameOrEmail" class="auth-label">
                    Tên đăng nhập hoặc Email
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="text" 
                        id="usernameOrEmail" 
                        name="usernameOrEmail"
                        class="auth-input"
                        placeholder="Nhập username hoặc email"
                        autocomplete="username"
                        required
                    />
                </div>
            </div>

            <!-- Password -->
            <div class="auth-field">
                <label for="password" class="auth-label">Mật khẩu</label>
                <div class="auth-input-wrapper">
                    <input 
                        type="password" 
                        id="password" 
                        name="password"
                        class="auth-input has-icon"
                        placeholder="Nhập mật khẩu"
                        autocomplete="current-password"
                        required
                    />
                    <button type="button" id="togglePassword" class="auth-input-icon">
                        <svg fill="currentColor" viewBox="0 0 24 24" id="eyeIcon">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="auth-row">
                <label class="auth-checkbox-wrapper">
                    <input type="checkbox" id="rememberMe" name="rememberMe" class="auth-checkbox"/>
                    <span class="auth-checkbox-label">Ghi nhớ đăng nhập</span>
                </label>
                <a href="${pageContext.request.contextPath}/forgot-password" class="auth-link">
                    Quên mật khẩu?
                </a>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="login-btn" class="auth-btn auth-btn-primary" style="width: 100%;">
                Đăng nhập
            </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
            <p class="auth-footer-text">
                Chưa có tài khoản? 
                <a href="${pageContext.request.contextPath}/register" class="auth-footer-link">
                    Đăng ký ngay
                </a>
            </p>
        </div>
    </div>
</div>

<script>
    // Toggle password visibility
    document.getElementById('togglePassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = document.getElementById('eyeIcon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
        } else {
            passwordInput.type = 'password';
            icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
        }
    });

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

    // Handle login form submission
    let isSubmitting = false;
    const loginForm = document.getElementById('login-form');
    
    if (loginForm && !loginForm.dataset.listenerAttached) {
        loginForm.dataset.listenerAttached = 'true';
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (isSubmitting) return;
            isSubmitting = true;

            const btn = document.getElementById('login-btn');
            setButtonLoading(btn, true, 'Đang đăng nhập...');

            const formData = {
                usernameOrEmail: document.getElementById('usernameOrEmail').value.trim(),
                password: document.getElementById('password').value,
            };

            const rememberMe = document.getElementById('rememberMe')?.checked || false;

            try {
                const { response, json: data } = await fetchJsonWithTimeout(
                    '${pageContext.request.contextPath}/api/auth/login',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                    },
                    15000
                );

                if (response.ok && data && data.accessToken) {
                    // Save tokens
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    
                    try {
                        const userForCache = {
                            id: data.userId ?? null,
                            username: data.username ?? null,
                            email: data.email ?? null,
                            displayName: data.displayName ?? null,
                            avatarUrl: data.avatarUrl ?? null,
                            role: data.role ?? null,
                        };
                        localStorage.setItem('user', JSON.stringify(userForCache));
                    } catch (_) {
                        localStorage.setItem('user', JSON.stringify({}));
                    }

                    // Save cookie
                    const cookieBase = 'accessToken=' + encodeURIComponent(data.accessToken) + '; path=/; SameSite=Lax';
                    if (rememberMe) {
                        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
                        document.cookie = cookieBase + '; expires=' + expires;
                    } else {
                        document.cookie = cookieBase;
                    }
                    
                    showAlert('Đăng nhập thành công!', 'success');

                    setTimeout(() => {
                        let next = null;
                        try {
                            const params = new URLSearchParams(window.location.search);
                            const raw = params.get('next');
                            if (raw && typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
                                next = raw;
                            }
                        } catch (_) { next = null; }
                        
                        const role = String(data.role || '').toUpperCase();
                        const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
                        const defaultTarget = isAdmin
                            ? '${pageContext.request.contextPath}/admin/dashboard'
                            : '${pageContext.request.contextPath}/app';
                        const finalTarget = isAdmin
                            ? (next && next.startsWith('/admin') ? next : defaultTarget)
                            : (next || defaultTarget);
                        
                        window.location.href = finalTarget;
                    }, 1000);
                } else {
                    let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
                    if (data && typeof data === 'object') {
                        if (data.message && typeof data.message === 'string' && data.message.trim()) {
                            errorMessage = data.message.trim();
                        } else if (data.errors && typeof data.errors === 'object') {
                            const errorValues = Object.values(data.errors).filter(v => typeof v === 'string' && v.trim()).map(v => v.trim());
                            if (errorValues.length > 0) {
                                errorMessage = errorValues.join('; ');
                            }
                        }
                    }
                    showAlert(errorMessage, 'danger');
                    setButtonLoading(btn, false);
                    isSubmitting = false;
                }
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
                if (error.name === 'AbortError') {
                    errorMessage = 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.';
                }
                showAlert(errorMessage, 'danger');
                setButtonLoading(btn, false);
                isSubmitting = false;
            }
        });
    }

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
