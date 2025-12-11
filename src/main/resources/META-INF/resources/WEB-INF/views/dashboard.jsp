<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <title>Trang chủ - CoCoCord</title>
</head>
<body>
    <div class="container mt-5">
        <!-- Welcome Card -->
        <div class="row">
            <div class="col-md-8 mx-auto">
                <div class="card shadow-sm">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-4">
                            <div class="avatar-lg me-3">
                                <img id="user-avatar" src="" alt="Avatar" class="rounded-circle" 
                                     style="width: 80px; height: 80px; object-fit: cover; display: none;">
                                <div id="user-avatar-placeholder" class="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                                     style="width: 80px; height: 80px;">
                                    <i class="bi bi-person-fill text-white" style="font-size: 2.5rem;"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <h3 class="mb-1">Xin chào, <span id="display-name"></span>! 👋</h3>
                                <p class="text-muted mb-0">
                                    <i class="bi bi-person"></i> <span id="username"></span>
                                    <br>
                                    <i class="bi bi-envelope"></i> <span id="email"></span>
                                </p>
                            </div>
                        </div>

                        <div class="row text-center">
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded">
                                    <i class="bi bi-calendar-check text-primary" style="font-size: 2rem;"></i>
                                    <h6 class="mt-2">Tham gia</h6>
                                    <p class="text-muted small mb-0" id="created-at"></p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded">
                                    <i class="bi bi-clock-history text-success" style="font-size: 2rem;"></i>
                                    <h6 class="mt-2">Đăng nhập lần cuối</h6>
                                    <p class="text-muted small mb-0" id="last-login"></p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded">
                                    <i class="bi bi-shield-lock text-warning" style="font-size: 2rem;"></i>
                                    <h6 class="mt-2">Phiên đăng nhập</h6>
                                    <p class="text-muted small mb-0"><span id="session-count">0</span> phiên</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="row mt-4">
            <div class="col-md-8 mx-auto">
                <h5 class="mb-3"><i class="bi bi-lightning-fill text-warning"></i> Thao tác nhanh</h5>
                <div class="row g-3">
                    <div class="col-md-4">
                        <a href="/profile" class="text-decoration-none">
                            <div class="card h-100 hover-shadow">
                                <div class="card-body text-center">
                                    <i class="bi bi-person-fill-gear text-primary" style="font-size: 2.5rem;"></i>
                                    <h6 class="mt-3">Chỉnh sửa hồ sơ</h6>
                                    <p class="text-muted small">Cập nhật thông tin cá nhân</p>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="/sessions" class="text-decoration-none">
                            <div class="card h-100 hover-shadow">
                                <div class="card-body text-center">
                                    <i class="bi bi-shield-check text-success" style="font-size: 2.5rem;"></i>
                                    <h6 class="mt-3">Quản lý phiên</h6>
                                    <p class="text-muted small">Xem và quản lý thiết bị</p>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="/change-password" class="text-decoration-none">
                            <div class="card h-100 hover-shadow">
                                <div class="card-body text-center">
                                    <i class="bi bi-key-fill text-warning" style="font-size: 2.5rem;"></i>
                                    <h6 class="mt-3">Đổi mật khẩu</h6>
                                    <p class="text-muted small">Bảo mật tài khoản</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Sessions -->
        <div class="row mt-4">
            <div class="col-md-8 mx-auto">
                <div class="card shadow-sm">
                    <div class="card-header bg-white">
                        <h5 class="mb-0">
                            <i class="bi bi-laptop"></i> Phiên đăng nhập đang hoạt động
                        </h5>
                    </div>
                    <div class="card-body">
                        <div id="sessions-list">
                            <div class="text-center text-muted">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Đang tải...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <content tag="script">
        <script>
            // Redirect if not logged in
            if (!isLoggedIn()) {
                window.location.href = '/login';
            }

            // Load user info
            async function loadUserInfo() {
                try {
                    const response = await fetchWithAuth('/api/auth/me');
                    const data = await response.json();

                    if (response.ok) {
                        document.getElementById('display-name').textContent = data.displayName || data.username;
                        document.getElementById('username').textContent = '@' + data.username;
                        document.getElementById('email').textContent = data.email;
                        document.getElementById('created-at').textContent = formatDate(data.createdAt);
                        
                        if (data.lastLoginAt) {
                            document.getElementById('last-login').textContent = formatDate(data.lastLoginAt);
                        } else {
                            document.getElementById('last-login').textContent = 'Lần đầu đăng nhập';
                        }

                        // Set avatar
                        if (data.avatarUrl) {
                            document.getElementById('user-avatar').src = data.avatarUrl;
                            document.getElementById('user-avatar').style.display = 'block';
                            document.getElementById('user-avatar-placeholder').style.display = 'none';
                        }
                    }
                } catch (error) {
                    console.error('Error loading user info:', error);
                }
            }

            // Load sessions
            async function loadSessions() {
                try {
                    const response = await fetchWithAuth('/api/auth/sessions');
                    const sessions = await response.json();

                    if (response.ok) {
                        document.getElementById('session-count').textContent = sessions.length;
                        
                        const sessionsList = document.getElementById('sessions-list');
                        if (sessions.length === 0) {
                            sessionsList.innerHTML = '<p class="text-muted text-center">Không có phiên nào đang hoạt động</p>';
                        } else {
                            sessionsList.innerHTML = sessions.map(session => `
                                <div class="d-flex align-items-center justify-content-between p-3 border-bottom">
                                    <div class="d-flex align-items-center">
                                        <i class="bi bi-${session.isCurrent ? 'laptop' : 'phone'} text-primary me-3" style="font-size: 1.5rem;"></i>
                                        <div>
                                            <h6 class="mb-0">
                                                ${session.deviceInfo}
                                                ${session.isCurrent ? '<span class="badge bg-success ms-2">Hiện tại</span>' : ''}
                                            </h6>
                                            <small class="text-muted">
                                                <i class="bi bi-geo-alt"></i> ${session.ipAddress} • 
                                                ${formatDate(session.createdAt)}
                                            </small>
                                        </div>
                                    </div>
                                    ${!session.isCurrent ? `
                                        <button class="btn btn-sm btn-outline-danger" onclick="revokeSession(${session.id})">
                                            <i class="bi bi-x-circle"></i> Thu hồi
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('');
                        }
                    }
                } catch (error) {
                    console.error('Error loading sessions:', error);
                    document.getElementById('sessions-list').innerHTML = 
                        '<p class="text-danger text-center">Không thể tải danh sách phiên</p>';
                }
            }

            // Revoke session
            async function revokeSession(sessionId) {
                if (!confirm('Bạn có chắc muốn thu hồi phiên này?')) {
                    return;
                }

                try {
                    const response = await fetchWithAuth(`/api/auth/sessions/${sessionId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        showAlert('success', 'Thu hồi phiên thành công!');
                        loadSessions();
                    } else {
                        showAlert('danger', 'Không thể thu hồi phiên!');
                    }
                } catch (error) {
                    showAlert('danger', 'Có lỗi xảy ra: ' + error.message);
                }
            }

            function formatDate(dateString) {
                const date = new Date(dateString);
                const now = new Date();
                const diff = now - date;
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                if (days > 7) {
                    return date.toLocaleDateString('vi-VN');
                } else if (days > 0) {
                    return days + ' ngày trước';
                } else if (hours > 0) {
                    return hours + ' giờ trước';
                } else if (minutes > 0) {
                    return minutes + ' phút trước';
                } else {
                    return 'Vừa xong';
                }
            }

            // Load data on page load
            loadUserInfo();
            loadSessions();
        </script>
    </content>
</body>
</html>
