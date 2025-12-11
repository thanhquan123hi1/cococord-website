<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Đăng nhập - CoCoCord</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <!-- Alert Container -->
    <div class="container mt-3">
        <div id="alert-container"></div>
    </div>
    
    <div class="container">
        <div class="row justify-content-center align-items-center" style="min-height: 80vh;">
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
                                    <button class="btn btn-outline-secondary" type="button" 
                                            onclick="togglePasswordVisibility('password')">
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

                            <div class="d-grid mb-3">
                                <button type="submit" class="btn btn-primary btn-lg" id="login-btn">
                                    <i class="bi bi-box-arrow-in-right"></i> Đăng nhập
                                </button>
                            </div>

                            <div class="text-center">
                                <a href="/forgot-password" class="text-decoration-none small">
                                    Quên mật khẩu?
                                </a>
                            </div>
                        </form>

                        <hr class="my-4">

                        <div class="text-center">
                            <p class="mb-0">
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

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS -->
    <script src="/js/auth.js"></script>
    
    <script>
            // Toggle password visibility
            function togglePasswordVisibility(fieldId) {
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

            // Handle login form submission
            document.getElementById('login-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const btn = document.getElementById('login-btn');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang đăng nhập...';

                const formData = {
                    usernameOrEmail: document.getElementById('usernameOrEmail').value.trim(),
                    password: document.getElementById('password').value,
                    deviceInfo: navigator.userAgent
                };

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    const data = await response.json();

                    if (response.ok && data.accessToken) {
                        // Save authentication data
                        localStorage.setItem('accessToken', data.accessToken);
                        localStorage.setItem('refreshToken', data.refreshToken);
                        localStorage.setItem('userId', data.userId);
                        localStorage.setItem('username', data.username);
                        localStorage.setItem('email', data.email);
                        localStorage.setItem('displayName', data.displayName || data.username);
                        if (data.avatarUrl) {
                            localStorage.setItem('avatarUrl', data.avatarUrl);
                        }

                        showAlert('success', 'Đăng nhập thành công! Đang chuyển hướng...');
                        
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 800);
                    } else {
                        showAlert('danger', data.message || 'Đăng nhập thất bại! Vui lòng kiểm tra lại thông tin.');
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showAlert('danger', 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại!');
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
    </script>
</body>
</html>
