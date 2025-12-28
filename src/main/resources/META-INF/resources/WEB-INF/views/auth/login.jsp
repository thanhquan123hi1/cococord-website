<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<div class="container">
    <div class="row justify-content-center" style="min-height: 80vh; align-items: center;">
        <div class="col-md-5 col-lg-4">
            <div class="card shadow-lg border-0">
                <div class="card-body p-5">
                    <div class="text-center mb-4">
                        <i class="bi bi-chat-dots-fill text-primary" style="font-size: 3.5rem;"></i>
                        <h2 class="mt-3 fw-bold">Đăng nhập</h2>
                        <p class="text-muted">Chào mừng trở lại với CoCoCord!</p>
                    </div>

                    <form id="login-form">
                        <div class="mb-3">
                            <label for="usernameOrEmail" class="form-label">
                                <i class="bi bi-person"></i> Tên đăng nhập hoặc Email
                            </label>
                            <input type="text" class="form-control form-control-lg" id="usernameOrEmail" 
                                   name="usernameOrEmail" required 
                                   placeholder="Nhập username hoặc email"
                                   autocomplete="username">
                        </div>

                        <div class="mb-3">
                            <label for="password" class="form-label">
                                <i class="bi bi-lock"></i> Mật khẩu
                            </label>
                            <div class="input-group">
                                <input type="password" class="form-control form-control-lg" id="password" 
                                       name="password" required 
                                       placeholder="Nhập mật khẩu"
                                       autocomplete="current-password">
                                <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div class="mb-3 d-flex justify-content-between align-items-center">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="rememberMe" name="rememberMe">
                                <label class="form-check-label" for="rememberMe">
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>
                            <a href="${pageContext.request.contextPath}/forgot-password" class="text-decoration-none small">Quên mật khẩu?</a>
                        </div>

                        <button type="submit" class="btn btn-primary btn-lg w-100 mb-3" id="login-btn">
                            <i class="bi bi-box-arrow-in-right"></i> Đăng nhập
                        </button>

                        <div class="text-center">
                            <p class="text-muted mb-0">
                                Chưa có tài khoản? 
                                <a href="${pageContext.request.contextPath}/register" class="text-decoration-none fw-bold">Đăng ký ngay</a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // Toggle password visibility
    document.getElementById('togglePassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        }
    });

    // Handle login form submission
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const btn = document.getElementById('login-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang đăng nhập...';
        
        const formData = {
            usernameOrEmail: document.getElementById('usernameOrEmail').value.trim(),
            password: document.getElementById('password').value
        };
        
        try {
            const response = await fetch('${pageContext.request.contextPath}/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.accessToken) {
                // Lưu JWT tokens vào localStorage
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user || {}));
                
                // Lưu accessToken vào Cookie (cho server-side rendering với JSP)
                const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
                document.cookie = "accessToken=" + encodeURIComponent(data.accessToken) + "; expires=" + expires + "; path=/; SameSite=Lax";
                showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
                
                setTimeout(() => {
                    window.location.href = '${pageContext.request.contextPath}/friends';
                }, 1000);
            } else {
                // Handle validation errors (returns { success: false, message: "Validation failed", errors: {...} })
                let errorMessage = data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
                if (data.errors) {
                    // Build error message from field errors
                    const errorList = Object.values(data.errors).join('<br>');
                    errorMessage = errorList || errorMessage;
                }
                showAlert(errorMessage, 'danger');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Có lỗi xảy ra. Vui lòng thử lại sau.', 'danger');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    function showAlert(message, type) {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
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

