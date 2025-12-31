<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<!-- Tailwind CSS CDN and custom animations -->
<script src="https://cdn.tailwindcss.com"></script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
    
    * {
        font-family: 'Outfit', sans-serif;
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
        background: linear-gradient(135deg, hsl(228, 58%, 12%) 0%, hsl(228, 58%, 20%) 100%);
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
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Đăng ký tài khoản</h1>
                <p class="text-gray-600 text-sm sm:text-base">Tạo tài khoản CoCoCord miễn phí</p>
            </div>

            <!-- Form -->
            <form id="register-form" class="space-y-5">
                <!-- Username Field -->
                <div>
                    <label for="username" class="block text-sm font-semibold text-gray-800 mb-2">
                        Tên đăng nhập <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        required 
                        minlength="3" 
                        maxlength="50"
                        pattern="[a-zA-Z0-9_]+"
                        placeholder="3-50 ký tự, chỉ chữ, số và _"
                        autocomplete="username"
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(235,86%,65%)] focus:border-transparent transition-all"
                    />
                    <p class="text-xs text-gray-500 mt-1">Tên đăng nhập của bạn là duy nhất</p>
                </div>

                <!-- Email Field -->
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
                        placeholder="your-email@example.com"
                        autocomplete="email"
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(235,86%,65%)] focus:border-transparent transition-all"
                    />
                </div>

                <!-- Display Name Field -->
                <div>
                    <label for="displayName" class="block text-sm font-semibold text-gray-800 mb-2">
                        Tên hiển thị <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="displayName" 
                        name="displayName" 
                        required 
                        minlength="1" 
                        maxlength="50"
                        placeholder="Tên của bạn sẽ hiển thị với mọi người"
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(235,86%,65%)] focus:border-transparent transition-all"
                    />
                </div>

                <!-- Password Field -->
                <div>
                    <label for="password" class="block text-sm font-semibold text-gray-800 mb-2">
                        Mật khẩu <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            required 
                            minlength="8"
                            placeholder="Ít nhất 8 ký tự"
                            autocomplete="new-password"
                            class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(235,86%,65%)] focus:border-transparent transition-all pr-12"
                        />
                        <button 
                            type="button" 
                            id="togglePassword"
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt</p>
                </div>

                <!-- Confirm Password Field -->
                <div>
                    <label for="confirmPassword" class="block text-sm font-semibold text-gray-800 mb-2">
                        Xác nhận mật khẩu <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="confirmPassword" 
                            name="confirmPassword" 
                            required 
                            placeholder="Nhập lại mật khẩu"
                            autocomplete="new-password"
                            class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(235,86%,65%)] focus:border-transparent transition-all pr-12"
                        />
                        <button 
                            type="button" 
                            id="toggleConfirmPassword"
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Terms Agreement -->
                <label class="flex items-start cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="agreeTerms" 
                        required
                        class="w-4 h-4 mt-1 rounded border-gray-300 text-[hsl(235,86%,65%)] focus:ring-2 focus:ring-[hsl(235,86%,65%)]"
                    />
                    <span class="ml-2 text-sm text-gray-700">
                        Tôi đồng ý với 
                        <a href="#" class="text-[hsl(235,86%,65%)] hover:text-[hsl(235,86%,55%)] font-medium transition-colors">Điều khoản sử dụng</a> 
                        và 
                        <a href="#" class="text-[hsl(235,86%,65%)] hover:text-[hsl(235,86%,55%)] font-medium transition-colors">Chính sách bảo mật</a>
                    </span>
                </label>

                <!-- Register Button -->
                <button 
                    type="submit" 
                    id="register-btn"
                    class="w-full bg-gradient-to-r from-[hsl(235,86%,65%)] to-[hsl(280,85%,60%)] text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[hsl(235,86%,65%)]/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(235,86%,65%)]"
                >
                    Đăng ký
                </button>

                <!-- Login Link -->
                <div class="text-center pt-2">
                    <p class="text-gray-600 text-sm">
                        Đã có tài khoản? 
                        <a href="${pageContext.request.contextPath}/login" class="text-[hsl(235,86%,65%)] hover:text-[hsl(235,86%,55%)] font-bold transition-colors">
                            Đăng nhập ngay
                        </a>
                    </p>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    // Toggle password visibility
    document.getElementById('togglePassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('svg');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 2.99-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-.78l1.15 1.15.02-.16c0-1.66-1.34-3-3-3-.05 0-.11 0-.16.02l1.15 1.15c.31.26.53.62.53 1.02 0 .89-.72 1.62-1.62 1.62-.4 0-.76-.22-1.02-.53l-1.15-1.15c-.26.31-.48.67-.48 1.07 0 1.66 1.34 3 3 3 .4 0 .76-.22 1.02-.53z"/>';
        } else {
            passwordInput.type = 'password';
            icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
        }
    });

    document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('confirmPassword');
        const icon = this.querySelector('svg');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 2.99-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-.78l1.15 1.15.02-.16c0-1.66-1.34-3-3-3-.05 0-.11 0-.16.02l1.15 1.15c.31.26.53.62.53 1.02 0 .89-.72 1.62-1.62 1.62-.4 0-.76-.22-1.02-.53l-1.15-1.15c-.26.31-.48.67-.48 1.07 0 1.66 1.34 3 3 3 .4 0 .76-.22 1.02-.53z"/>';
        } else {
            passwordInput.type = 'password';
            icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
        }
    });

    function setButtonLoading(btn, isLoading, loadingText, originalHtml) {
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<span class="inline-block mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>' + loadingText;
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
        const originalText = btn.innerHTML;
        setButtonLoading(btn, true, 'Đang đăng ký...', originalText);
        
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
                    headers: {
                        'Content-Type': 'application/json'
                    },
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
                let errorMessage = data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
                if (data?.errors) {
                    const errorList = Object.values(data.errors).join('<br>');
                    errorMessage = errorList || errorMessage;
                }
                showAlert(errorMessage, 'danger');
                setButtonLoading(btn, false, '', originalText);
            }
        } catch (error) {
            console.error('Register error:', error);
            if (error?.name === 'AbortError') {
                showAlert('Yêu cầu đăng ký quá lâu. Vui lòng thử lại.', 'danger');
            } else {
                showAlert('Có lỗi xảy ra. Vui lòng thử lại sau.', 'danger');
            }
            setButtonLoading(btn, false, '', originalText);
        }
    });

    function showAlert(message, type) {
        // Create alert container if not exists
        let alertContainer = document.getElementById('alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alert-container';
            document.body.appendChild(alertContainer);
        }

        // Ensure correct styling even if an existing #alert-container is present
        alertContainer.classList.add('cococord-alert-container');
        
        const variantClass = type === 'success' ? 'cococord-alert--success' : 'cococord-alert--danger';
        const alert = document.createElement('div');
        alert.className = `cococord-alert ${variantClass} animate-fade-in-up`;
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <div class="cococord-alert__row">
                <div class="cococord-alert__content">${message}</div>
                <button type="button" class="cococord-alert__close" aria-label="Đóng">&times;</button>
            </div>
        `;

        alert.querySelector('.cococord-alert__close')?.addEventListener('click', () => {
            alert.remove();
        });
        alertContainer.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => alert.remove(), 5000);
    }
</script>
