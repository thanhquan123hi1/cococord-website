<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<head>
    <title>Đổi mật khẩu - CoCoCord</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/app.css">
    <style>
        .password-container {
            max-width: 720px;
            margin: 0 auto;
            padding: 32px;
        }
        .password-header {
            margin-bottom: 24px;
        }
        .password-header h1 {
            font-size: 24px;
            font-weight: 700;
            color: #23272a;
            margin: 0 0 8px 0;
        }
        .password-header p {
            color: #4f545c;
            margin: 0;
        }
        .password-section {
            background: white;
            border-radius: 8px;
            padding: 24px;
            border: 1px solid #e3e5e8;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-weight: 500;
            margin-bottom: 8px;
            color: #4f545c;
        }
        .form-control {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #dcddde;
            border-radius: 4px;
            font-size: 14px;
        }
        .form-control:focus {
            outline: none;
            border-color: #5865f2;
        }
        .btn-save {
            background: #5865f2;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
        }
        .btn-save:hover {
            background: #4752c4;
        }
        .btn-save:disabled {
            background: #7289da;
            opacity: 0.5;
            cursor: not-allowed;
        }
        .alert {
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<div class="discord-shell">
    <!-- Left Sidebar -->
    <aside class="discord-sidebar">
        <div class="sidebar-search">
            <input class="discord-input" type="text" placeholder="Tìm kiếm" autocomplete="off" />
        </div>

        <nav class="sidebar-menu" aria-label="Menu">
            <a class="sidebar-item" href="${pageContext.request.contextPath}/friends"><i class="bi bi-people-fill"></i> Bạn bè</a>
            <a class="sidebar-item" href="${pageContext.request.contextPath}/sessions"><i class="bi bi-shield-check"></i> Phiên đăng nhập</a>
            <a class="sidebar-item active" href="${pageContext.request.contextPath}/change-password"><i class="bi bi-key"></i> Đổi mật khẩu</a>
        </nav>
    </aside>

    <!-- Main Column -->
    <main class="discord-main" style="background: #f2f3f5;">
        <div class="password-container">
            <div class="password-header">
                <h1>Đổi mật khẩu</h1>
                <p>Cập nhật mật khẩu của bạn để bảo mật tài khoản</p>
            </div>

            <div class="password-section">
                <div id="alertContainer"></div>
                
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label for="currentPassword">Mật khẩu hiện tại</label>
                        <input type="password" class="form-control" id="currentPassword" required>
                    </div>

                    <div class="form-group">
                        <label for="newPassword">Mật khẩu mới</label>
                        <input type="password" class="form-control" id="newPassword" required minlength="8">
                        <small style="color: #72767d;">Tối thiểu 8 ký tự</small>
                    </div>

                    <div class="form-group">
                        <label for="confirmPassword">Xác nhận mật khẩu mới</label>
                        <input type="password" class="form-control" id="confirmPassword" required>
                    </div>

                    <button type="submit" class="btn-save">Đổi mật khẩu</button>
                </form>
            </div>
        </div>
    </main>
</div>
<script>
    function showAlert(message, type) {
        const container = document.getElementById('alertContainer');
        container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => { container.innerHTML = ''; }, 5000);
    }

    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showAlert('Mật khẩu mới và xác nhận không khớp!', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showAlert('Mật khẩu mới phải có ít nhất 8 ký tự!', 'error');
            return;
        }

        try {
            const response = await fetchWithAuth('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (response && response.ok) {
                showAlert('Đổi mật khẩu thành công!', 'success');
                document.getElementById('changePasswordForm').reset();
            } else {
                const error = await response.text();
                showAlert(error || 'Đổi mật khẩu thất bại!', 'error');
            }
        } catch (error) {
            console.error('Change password failed:', error);
            showAlert('Có lỗi xảy ra!', 'error');
        }
    });
</script>
