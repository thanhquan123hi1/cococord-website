<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <title>Đăng ký - CoCoCord</title>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center mt-5">
            <div class="col-md-6">
                <div class="card shadow">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <i class="bi bi-person-plus-fill text-primary" style="font-size: 3rem;"></i>
                            <h2 class="mt-3">Đăng ký tài khoản</h2>
                            <p class="text-muted">Tạo tài khoản CoCoCord miễn phí</p>
                        </div>

                        <form id="register-form">
                            <div class="mb-3">
                                <label for="username" class="form-label">
                                    <i class="bi bi-person"></i> Tên đăng nhập <span class="text-danger">*</span>
                                </label>
                                <input type="text" class="form-control" id="username" 
                                       name="username" required 
                                       pattern="[a-zA-Z0-9._]{3,50}"
                                       placeholder="3-50 ký tự, chỉ chữ, số, . và _">
                                <div class="form-text">Tên đăng nhập của bạn là duy nhất</div>
                            </div>

                            <div class="mb-3">
                                <label for="email" class="form-label">
                                    <i class="bi bi-envelope"></i> Email <span class="text-danger">*</span>
                                </label>
                                <input type="email" class="form-control" id="email" 
                                       name="email" required 
                                       placeholder="your-email@example.com">
                            </div>

                            <div class="mb-3">
                                <label for="displayName" class="form-label">
                                    <i class="bi bi-tag"></i> Tên hiển thị <span class="text-danger">*</span>
                                </label>
                                <input type="text" class="form-control" id="displayName" 
                                       name="displayName" required 
                                       maxlength="100"
                                       placeholder="Tên của bạn sẽ hiển thị với mọi người">
                            </div>

                            <div class="mb-3">
                                <label for="register-password" class="form-label">
                                    <i class="bi bi-lock"></i> Mật khẩu <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="register-password" 
                                           name="password" required 
                                           minlength="8"
                                           placeholder="Ít nhất 8 ký tự">
                                    <button class="btn btn-outline-secondary" type="button" 
                                            onclick="togglePasswordField('register-password')">
                                        <i class="bi bi-eye" id="register-password-icon"></i>
                                    </button>
                                </div>
                                <div class="form-text">
                                    Mật khẩu phải có ít nhất 8 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="confirm-password" class="form-label">
                                    <i class="bi bi-lock-fill"></i> Xác nhận mật khẩu <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="confirm-password" 
                                           name="confirmPassword" required 
                                           placeholder="Nhập lại mật khẩu">
                                    <button class="btn btn-outline-secondary" type="button" 
                                            onclick="togglePasswordField('confirm-password')">
                                        <i class="bi bi-eye" id="confirm-password-icon"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="agreeTerms" required>
                                <label class="form-check-label" for="agreeTerms">
                                    Tôi đồng ý với <a href="/terms" target="_blank">Điều khoản dịch vụ</a> 
                                    và <a href="/privacy" target="_blank">Chính sách bảo mật</a>
                                </label>
                            </div>

                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary btn-lg" id="register-btn">
                                    <i class="bi bi-person-plus"></i> Đăng ký
                                </button>
                            </div>
                        </form>

                        <hr class="my-4">

                        <div class="text-center">
                            <p>
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

    <content tag="script">
        <script>
            // Check if already logged in
            if (isLoggedIn()) {
                window.location.href = '/dashboard';
            }

            document.getElementById('register-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const password = document.getElementById('register-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                // Validate password match
                if (password !== confirmPassword) {
                    showAlert('danger', 'Mật khẩu xác nhận không khớp!');
                    return;
                }

                // Validate password strength
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(password)) {
                    showAlert('danger', 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!');
                    return;
                }

                const btn = document.getElementById('register-btn');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang đăng ký...';

                const formData = {
                    username: document.getElementById('username').value,
                    email: document.getElementById('email').value,
                    displayName: document.getElementById('displayName').value,
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
                        
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    } else {
                        showAlert('danger', data.message || 'Đăng ký thất bại!');
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                } catch (error) {
                    showAlert('danger', 'Có lỗi xảy ra: ' + error.message);
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });

            function togglePasswordField(fieldId) {
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
