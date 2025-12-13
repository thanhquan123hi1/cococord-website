<%@ page contentType="text/html;charset=UTF-8" language="java" %>
    <div class="container">
        <div class="row justify-content-center" style="min-height: 80vh; align-items: center;">
            <div class="col-md-5 col-lg-4">
                <div class="card shadow-lg border-0">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <i class="bi bi-shield-lock-fill text-primary" style="font-size: 3.5rem;"></i>
                            <h2 class="mt-3 fw-bold">Đặt lại mật khẩu</h2>
                            <p class="text-muted">Nhập mật khẩu mới của bạn</p>
                        </div>

                        <form id="reset-password-form">
                            <input type="hidden" id="token" name="token" value="">
                            
                            <div class="mb-3">
                                <label for="newPassword" class="form-label">
                                    <i class="bi bi-lock"></i> Mật khẩu mới
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control form-control-lg" id="newPassword" 
                                           name="newPassword" required 
                                           minlength="8"
                                           placeholder="Ít nhất 8 ký tự"
                                           autocomplete="new-password">
                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="confirmPassword" class="form-label">
                                    <i class="bi bi-lock-fill"></i> Xác nhận mật khẩu
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control form-control-lg" id="confirmPassword" 
                                           name="confirmPassword" required 
                                           placeholder="Nhập lại mật khẩu mới"
                                           autocomplete="new-password">
                                    <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary btn-lg w-100 mb-3" id="submit-btn">
                                <i class="bi bi-check-circle"></i> Đặt lại mật khẩu
                            </button>

                            <div class="text-center">
                                <a href="${pageContext.request.contextPath}/login" class="text-decoration-none">
                                    <i class="bi bi-arrow-left"></i> Quay lại đăng nhập
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (!token) {
                showAlert('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 'danger');
                setTimeout(() => {
                    window.location.href = '${pageContext.request.contextPath}/forgot-password';
                }, 3000);
            } else {
                document.getElementById('token').value = token;
            }

            // Toggle password visibility
            document.getElementById('togglePassword').addEventListener('click', function() {
                const passwordInput = document.getElementById('newPassword');
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

            document.getElementById('reset-password-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (newPassword !== confirmPassword) {
                    showAlert('Mật khẩu xác nhận không khớp!', 'danger');
                    return;
                }
                
                const btn = document.getElementById('submit-btn');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';
                
                try {
                    const response = await fetch('${pageContext.request.contextPath}/api/auth/reset-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            token: document.getElementById('token').value,
                            newPassword: newPassword
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showAlert('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...', 'success');
                        setTimeout(() => {
                            window.location.href = '${pageContext.request.contextPath}/login';
                        }, 2000);
                    } else {
                        showAlert(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'danger');
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                } catch (error) {
                    console.error('Reset password error:', error);
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
