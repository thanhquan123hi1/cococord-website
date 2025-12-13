<%@ page contentType="text/html;charset=UTF-8" language="java" %>
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
                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                                <div class="form-text">
                                    Mật khẩu phải có ít nhất 8 ký tự
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
                                    <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="agreeTerms" required>
                                <label class="form-check-label" for="agreeTerms">
                                    Tôi đồng ý với <a href="#" class="text-decoration-none">Điều khoản sử dụng</a> 
                                    và <a href="#" class="text-decoration-none">Chính sách bảo mật</a>
                                </label>
                            </div>

                            <button type="submit" class="btn btn-primary btn-lg w-100 mb-3" id="register-btn">
                                <i class="bi bi-person-plus"></i> Đăng ký
                            </button>

                            <div class="text-center">
                                <p class="text-muted mb-0">
                                    Đã có tài khoản? 
                                    <a href="${pageContext.request.contextPath}/login" class="text-decoration-none fw-bold">Đăng nhập ngay</a>
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

            document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
                const passwordInput = document.getElementById('confirmPassword');
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
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang đăng ký...';
                
                const formData = {
                    username: document.getElementById('username').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    displayName: document.getElementById('displayName').value.trim(),
                    password: password
                };
                
                try {
                    const response = await fetch('${pageContext.request.contextPath}/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showAlert('Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
                        
                        setTimeout(() => {
                            window.location.href = '${pageContext.request.contextPath}/login';
                        }, 1500);
                    } else {
                        showAlert(data.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'danger');
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                } catch (error) {
                    console.error('Register error:', error);
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
