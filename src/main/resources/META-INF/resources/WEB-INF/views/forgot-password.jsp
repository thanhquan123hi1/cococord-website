<%@ page contentType="text/html;charset=UTF-8" language="java" %>
    <div class="container">
        <div class="row justify-content-center" style="min-height: 80vh; align-items: center;">
            <div class="col-md-5 col-lg-4">
                <div class="card shadow-lg border-0">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <i class="bi bi-key-fill text-primary" style="font-size: 3.5rem;"></i>
                            <h2 class="mt-3 fw-bold">Quên mật khẩu</h2>
                            <p class="text-muted">Nhập email để đặt lại mật khẩu</p>
                        </div>

                        <form id="forgot-password-form">
                            <div class="mb-3">
                                <label for="email" class="form-label">
                                    <i class="bi bi-envelope"></i> Email
                                </label>
                                <input type="email" class="form-control form-control-lg" id="email" 
                                       name="email" required 
                                       placeholder="Nhập email đã đăng ký"
                                       autocomplete="email">
                            </div>

                            <button type="submit" class="btn btn-primary btn-lg w-100 mb-3" id="submit-btn">
                                <i class="bi bi-send"></i> Gửi yêu cầu
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
            document.getElementById('forgot-password-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const btn = document.getElementById('submit-btn');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';
                
                const email = document.getElementById('email').value.trim();
                
                try {
                    const response = await fetch('${pageContext.request.contextPath}/api/auth/forgot-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showAlert('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.', 'success');
                        document.getElementById('forgot-password-form').reset();
                    } else {
                        showAlert(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'danger');
                    }
                    
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                } catch (error) {
                    console.error('Forgot password error:', error);
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
