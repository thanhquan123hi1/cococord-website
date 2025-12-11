<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Đăng ký - CoCoCord</title>
    
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
        <div class="row justify-content-center" style="padding: 40px 0;">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow-lg border-0">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <i class="bi bi-person-plus-fill text-primary" style="font-size: 3.5rem;"></i>
                            <h2 class="mt-3 fw-bold">Đăng ký tài khoản</h2>
                            <p class="text-muted">Tạo tài khoản CoCoCord miễn phí</p>
                        </div>

                        <form id="register-form">
                            <div class="mb-3">
                                <label for="username" class="form-label">
                                    <i class="bi bi-person"></i> Tên đăng nhập <span class="text-danger">*</span>
                                </label>
                                <input type="text" class="form-control" id="username" 
                                       name="username" required 
                                       minlength="3" maxlength="50"
                                       pattern="[a-zA-Z0-9_]+"
                                       placeholder="3-50 ký tự, chỉ chữ, số và _"
                                       autocomplete="username">
                                <div class="form-text">Tên đăng nhập của bạn là duy nhất</div>
                            </div>

                            <div class="mb-3">
                                <label for="email" class="form-label">
                                    <i class="bi bi-envelope"></i> Email <span class="text-danger">*</span>
                                </label>
                                <input type="email" class="form-control" id="email" 
                                       name="email" required 
                                       maxlength="150"
                                       placeholder="your-email@example.com"
                                       autocomplete="email">
                            </div>

                            <div class="mb-3">
                                <label for="displayName" class="form-label">
                                    <i class="bi bi-tag"></i> Tên hiển thị <span class="text-danger">*</span>
                                </label>
                                <input type="text" class="form-control" id="displayName" 
                                       name="displayName" required 
                                       minlength="1" maxlength="50"
                                       placeholder="Tên của bạn sẽ hiển thị với mọi người">
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label">
                                    <i class="bi bi-lock"></i> Mật khẩu <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="password" 
                                           name="password" required 
                                           minlength="8"
                                           placeholder="Ít nhất 8 ký tự"
                                           autocomplete="new-password">
                                    <button class="btn btn-outline-secondary" type="button" 
                                            onclick="togglePasswordVisibility('password')">
                                        <i class="bi bi-eye" id="password-icon"></i>
                                    </button>
                                </div>
                                <div class="form-text">
                                    Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="confirmPassword" class="form-label">
                                    <i class="bi bi-lock-fill"></i> Xác nhận mật khẩu <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="confirmPassword" 
                                           name="confirmPassword" required 
                                           placeholder="Nhập lại mật khẩu"
                                           autocomplete="new-password">
                                    <button class="btn btn-outline-secondary" type="button" 
                                            onclick="togglePasswordVisibility('confirmPassword')">
                                        <i class="bi bi-eye" id="confirmPassword-icon"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="mb-4 form-check">
                                <input type="checkbox" class="form-check-input" id="agreeTerms" required>
                                <label class="form-check-label" for="agreeTerms">
                                    Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật
                                </label>
                            </div>

                            <div class="d-grid mb-3">
                                <button type="submit" class="btn btn-primary btn-lg" id="register-btn">
                                    <i class="bi bi-person-plus"></i> Đăng ký
                                </button>
                            </div>
                        </form>

                        <hr class="my-4">

                        <div class="text-center">
                            <p class="mb-0">
                                Đã có tài khoản? 
                                <a href="/login" class="text-decoration-none fw-bold">
                                    Đăng nhập ngay
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

            // Handle register form submission
            document.getElementById('register-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                // Validate password match
                if (password !== confirmPassword) {
                    showAlert('danger', 'Mật khẩu xác nhận không khớp!');
                    return;
                }

                // Validate password strength - must contain uppercase, lowercase, number, and special character
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(password)) {
                    showAlert('danger', 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)!');
                    return;
                }

                const btn = document.getElementById('register-btn');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang đăng ký...';

                const formData = {
                    username: document.getElementById('username').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    displayName: document.getElementById('displayName').value.trim(),
                    password: password
                };

                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    const data = await response.json();

                    if (response.ok) {
                        showAlert('success', 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
                        
                        // Clear form
                        document.getElementById('register-form').reset();
                        
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 1500);
                    } else {
                        showAlert('danger', data.message || 'Đăng ký thất bại! Vui lòng kiểm tra lại thông tin.');
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                } catch (error) {
                    console.error('Register error:', error);
                    showAlert('danger', 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!');
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
    </script>
</body>
</html>
