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
    <div class="auth-glass-card" style="max-width: 480px;">
        <!-- Header -->
        <div class="auth-header">
            <div class="auth-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 11a4 4 0 1 0-8 0" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 20c1.2-3.7 5-6 8-6s6.8 2.3 8 6" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 8v4" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 10h4" />
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
                <!-- Password strength indicator -->
                <div id="password-strength" class="password-strength" style="display: none;">
                    <div class="strength-bar"><div class="strength-fill" id="strength-fill"></div></div>
                    <ul class="strength-rules">
                        <li id="rule-length"><span class="rule-icon">○</span> Ít nhất 8 ký tự</li>
                        <li id="rule-upper"><span class="rule-icon">○</span> Có chữ in hoa (A-Z)</li>
                        <li id="rule-lower"><span class="rule-icon">○</span> Có chữ thường (a-z)</li>
                        <li id="rule-number"><span class="rule-icon">○</span> Có số (0-9)</li>
                        <li id="rule-special"><span class="rule-icon">○</span> Có ký tự đặc biệt (@$!%*?&)</li>
                    </ul>
                </div>
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
            showErrorNotification('Mật khẩu xác nhận không khớp!');
            return;
        }
        
        // Validate password strength before submitting
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            showErrorNotification('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)');
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
            
            const backendSuccess = data && typeof data === 'object' ? data.success : undefined;

            if (response.ok && backendSuccess !== false) {
                // Show success notification
                showSuccessNotification('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
                setButtonLoading(btn, false);
                btn.innerHTML = '✓ Đăng ký thành công!';
                btn.classList.add('success');
                setTimeout(() => {
                    window.location.href = '${pageContext.request.contextPath}/login?registered=true';
                }, 2000);
            } else {
                console.log('Register failed response:', { response, data });
                let alertType = 'danger';
                let errorMessage = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
                
                if (data) {
                    // Check for message field
                    if (data.message && typeof data.message === 'string' && data.message.trim()) {
                        errorMessage = data.message.trim();
                    }
                    // Check for error field
                    else if (data.error && typeof data.error === 'string' && data.error.trim()) {
                        errorMessage = data.error.trim();
                    }
                    // Check for errors object (validation errors)
                    else if (data.errors && typeof data.errors === 'object') {
                        const errorValues = Object.values(data.errors)
                            .filter(v => v && typeof v === 'string' && v.trim())
                            .map(v => v.trim());
                        if (errorValues.length > 0) {
                            errorMessage = errorValues.join('<br>');
                        }
                    }
                }
                
                // Handle specific HTTP status codes
                if (response.status === 409) {
                    errorMessage = 'Tên đăng nhập hoặc email đã được sử dụng.';
                    alertType = 'warning';
                } else if (response.status === 400) {
                    // Keep the parsed error message for validation errors
                } else if (response.status >= 500) {
                    errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
                }
                
                // Check if message indicates duplicate
                if (errorMessage.includes('tồn tại') || errorMessage.includes('exists') || errorMessage.includes('đã được') || errorMessage.includes('already')) {
                    alertType = 'warning';
                }
                
                setButtonLoading(btn, false);
                showErrorNotification(errorMessage);
            }
        } catch (error) {
            console.error('Register error:', error);
            setButtonLoading(btn, false);
            showErrorNotification('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.');
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

<style>
    /* Password strength indicator styles */
    .password-strength {
        margin-top: 8px;
        padding: 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
    }
    .strength-bar {
        height: 4px;
        background: rgba(255,255,255,0.1);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 10px;
    }
    .strength-fill {
        height: 100%;
        width: 0%;
        border-radius: 2px;
        transition: all 0.3s ease;
    }
    .strength-fill.weak { width: 20%; background: #ef4444; }
    .strength-fill.fair { width: 40%; background: #f97316; }
    .strength-fill.good { width: 60%; background: #eab308; }
    .strength-fill.strong { width: 80%; background: #22c55e; }
    .strength-fill.excellent { width: 100%; background: #10b981; }
    
    .strength-rules {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        font-size: 12px;
    }
    .strength-rules li {
        color: rgba(255,255,255,0.5);
        display: flex;
        align-items: center;
        gap: 6px;
        transition: color 0.2s ease;
    }
    .strength-rules li.passed {
        color: #22c55e;
    }
    .strength-rules li.passed .rule-icon {
        color: #22c55e;
    }
    .rule-icon {
        font-size: 10px;
    }
</style>

<script>
    // Password strength validation
    const passwordInput = document.getElementById('password');
    const strengthContainer = document.getElementById('password-strength');
    const strengthFill = document.getElementById('strength-fill');
    
    passwordInput.addEventListener('focus', function() {
        strengthContainer.style.display = 'block';
    });
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        validatePasswordStrength(password);
    });
    
    function validatePasswordStrength(password) {
        const rules = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[@$!%*?&]/.test(password)
        };
        
        // Update rule indicators
        Object.keys(rules).forEach(rule => {
            const el = document.getElementById('rule-' + rule);
            if (el) {
                if (rules[rule]) {
                    el.classList.add('passed');
                    el.querySelector('.rule-icon').textContent = '✓';
                } else {
                    el.classList.remove('passed');
                    el.querySelector('.rule-icon').textContent = '○';
                }
            }
        });
        
        // Calculate strength
        const passedCount = Object.values(rules).filter(Boolean).length;
        strengthFill.className = 'strength-fill';
        if (passedCount === 0) strengthFill.className = 'strength-fill';
        else if (passedCount === 1) strengthFill.classList.add('weak');
        else if (passedCount === 2) strengthFill.classList.add('fair');
        else if (passedCount === 3) strengthFill.classList.add('good');
        else if (passedCount === 4) strengthFill.classList.add('strong');
        else if (passedCount === 5) strengthFill.classList.add('excellent');
        
        return passedCount === 5;
    }
</script>
