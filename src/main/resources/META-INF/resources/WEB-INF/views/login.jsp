<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <title>Đăng nhập - CoCoCord</title>
    <style>
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .login-container {
            animation: fadeIn 0.5s ease-out;
        }
        
        .login-card {
            animation: slideInUp 0.6s ease-out;
        }
        
        .logo-icon {
            animation: slideInUp 0.6s ease-out 0.2s both;
        }
    </style>
</head>
<body>
    <div class="container login-container">
        <div class="row justify-content-center align-items-center" style="min-height: 100vh; padding: 40px 0;">
            <div class="col-md-5 col-lg-4">
                <div class="card shadow login-card">
                    <div class="card-body p-5">
                        <div class="text-center mb-4 logo-icon">
                            <div class="mb-3" style="position: relative; display: inline-block;">
                                <div style="position: absolute; inset: -10px; background: linear-gradient(135deg, #5865F2, #7289DA); border-radius: 50%; opacity: 0.2; filter: blur(20px);"></div>
                                <i class="bi bi-chat-dots-fill text-primary" style="font-size: 4rem; position: relative;"></i>
                            </div>
                            <h2 class="mt-3 fw-bold" style="color: #333;">Đăng nhập</h2>
                            <p class="text-muted">Chào mừng trở lại với CoCoCord</p>
                        </div>

                        <form id="login-form">
                            <div class="mb-3">
                                <label for="usernameOrEmail" class="form-label">
                                    <i class="bi bi-person"></i> Tên đăng nhập hoặc Email
                                </label>
                                <input type="text" class="form-control" id="usernameOrEmail" 
                                       name="usernameOrEmail" required 
                                       placeholder="Nhập username hoặc email">
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label">
                                    <i class="bi bi-lock"></i> Mật khẩu
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="password" 
                                           name="password" required 
                                           placeholder="Nhập mật khẩu">
                                    <button class="btn btn-outline-secondary" type="button" 
                                            onclick="togglePassword('password')">
                                        <i class="bi bi-eye" id="password-icon"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="rememberMe">
                                <label class="form-check-label" for="rememberMe">
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>

                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary btn-lg" id="login-btn">
                                    <i class="bi bi-box-arrow-in-right"></i> Đăng nhập
                                </button>
                            </div>
                        </form>

                        <hr class="my-4">

                        <div class="text-center">
                            <p class="mb-2">
                                <a href="/forgot-password" class="text-decoration-none">
                                    Quên mật khẩu?
                                </a>
                            </p>
                            <p>
                                Chưa có tài khoản? 
                                <a href="/register" class="text-decoration-none fw-bold">
                                    Đăng ký ngay
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <content tag="script">
        <script>
            // Check if already logged in
            if (isLoggedIn()) {
                window.location.href = '/dashboard';
            }

            document.getElementById('login-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const btn = document.getElementById('login-btn');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang đăng nhập...';

                const usernameOrEmail = document.getElementById('usernameOrEmail').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ usernameOrEmail, password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Save tokens
                        localStorage.setItem('accessToken', data.accessToken);
                        localStorage.setItem('refreshToken', data.refreshToken);
                        localStorage.setItem('userId', data.userId);
                        localStorage.setItem('username', data.username);
                        localStorage.setItem('email', data.email);
                        localStorage.setItem('displayName', data.displayName);
                        localStorage.setItem('avatarUrl', data.avatarUrl || '');

                        showAlert('success', 'Đăng nhập thành công! Đang chuyển hướng...');
                        
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1000);
                    } else {
                        showAlert('danger', data.message || 'Đăng nhập thất bại!');
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                } catch (error) {
                    showAlert('danger', 'Có lỗi xảy ra: ' + error.message);
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });

            function togglePassword(fieldId) {
                const field = document.getElementById(fieldId);
                const icon = document.getElementById(fieldId + '-icon');
                
                if (field.type === 'password') {
                    field.type = 'text';
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                } else {
                    field.type = 'password';
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                }
            }
        </script>
    </content>
</body>
</html>
