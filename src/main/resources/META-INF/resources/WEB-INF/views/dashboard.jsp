<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <title>Trang chủ - CoCoCord</title>
</head>
<body>
    <div class="container" style="padding: 40px 0;">
        <!-- Welcome Section -->
        <div class="row">
            <div class="col-lg-8 mx-auto">
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-4">
                            <div class="me-3">
                                <img id="user-avatar" src="" alt="Avatar" class="rounded-circle" 
                                     style="width: 80px; height: 80px; object-fit: cover; display: none;">
                                <div id="user-avatar-placeholder" class="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                                     style="width: 80px; height: 80px;">
                                    <i class="bi bi-person-fill text-white" style="font-size: 2.5rem;"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <h3 class="mb-1">Xin chào, <span id="display-name" class="text-primary"></span>! 👋</h3>
                                <p class="text-muted mb-0">
                                    <i class="bi bi-person-badge"></i> <span id="username"></span>
                                    <br>
                                    <i class="bi bi-envelope"></i> <span id="email"></span>
                                </p>
                            </div>
                        </div>

                        <div class="row g-3 text-center">
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded">
                                    <i class="bi bi-calendar-check text-primary" style="font-size: 2rem;"></i>
                                    <h6 class="mt-2 mb-1">Tham gia</h6>
                                    <p class="text-muted small mb-0" id="created-at">-</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded">
                                    <i class="bi bi-clock-history text-success" style="font-size: 2rem;"></i>
                                    <h6 class="mt-2 mb-1">Đăng nhập gần nhất</h6>
                                    <p class="text-muted small mb-0" id="last-login">-</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="p-3 bg-light rounded">
                                    <i class="bi bi-shield-check text-info" style="font-size: 2rem;"></i>
                                    <h6 class="mt-2 mb-1">Trạng thái</h6>
                                    <p class="text-muted small mb-0">
                                        <span class="badge bg-success" id="user-status">Online</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <h5 class="mb-3"><i class="bi bi-lightning-fill text-warning"></i> Thao tác nhanh</h5>
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <a href="/profile" class="text-decoration-none">
                            <div class="card h-100 border-0 shadow-sm hover-card">
                                <div class="card-body text-center p-4">
                                    <i class="bi bi-person-fill-gear text-primary" style="font-size: 2.5rem;"></i>
                                    <h6 class="mt-3 mb-2">Chỉnh sửa hồ sơ</h6>
                                    <p class="text-muted small mb-0">Cập nhật thông tin cá nhân</p>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="/sessions" class="text-decoration-none">
                            <div class="card h-100 border-0 shadow-sm hover-card">
                                <div class="card-body text-center p-4">
                                    <i class="bi bi-shield-lock text-success" style="font-size: 2.5rem;"></i>
                                    <h6 class="mt-3 mb-2">Quản lý phiên</h6>
                                    <p class="text-muted small mb-0">Xem và quản lý thiết bị</p>
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="/change-password" class="text-decoration-none">
                            <div class="card h-100 border-0 shadow-sm hover-card">
                                <div class="card-body text-center p-4">
                                    <i class="bi bi-key-fill text-warning" style="font-size: 2.5rem;"></i>
                                    <h6 class="mt-3 mb-2">Đổi mật khẩu</h6>
                                    <p class="text-muted small mb-0">Bảo mật tài khoản</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>

                <!-- Active Sessions -->
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-white border-0 py-3">
                        <h5 class="mb-0">
                            <i class="bi bi-laptop"></i> Phiên đăng nhập đang hoạt động
                            <span class="badge bg-primary ms-2" id="session-count">0</span>
                        </h5>
                    </div>
                    <div class="card-body p-0">
                        <div id="sessions-list">
                            <div class="text-center p-4">
                                <div class="spinner-border text-primary" role="status">
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

            // Load user information
            async function loadUserInfo() {
                try {
                    const response = await fetchWithAuth('/api/auth/me');
                    
                    if (!response.ok) {
                        throw new Error('Failed to load user info');
                    }

                    const user = await response.json();

                    // Display user info
                    document.getElementById('display-name').textContent = user.displayName || user.username;
                    document.getElementById('username').textContent = '@' + user.username;
                    document.getElementById('email').textContent = user.email;
                    document.getElementById('created-at').textContent = formatDate(user.createdAt);
                    document.getElementById('last-login').textContent = user.lastLogin ? formatDate(user.lastLogin) : 'Lần đầu đăng nhập';

                    // Display status
                    const statusBadge = document.getElementById('user-status');
                    if (user.status) {
                        const statusMap = {
                            'ONLINE': { text: 'Online', class: 'bg-success' },
                            'OFFLINE': { text: 'Offline', class: 'bg-secondary' },
                            'IDLE': { text: 'Idle', class: 'bg-warning' },
                            'DO_NOT_DISTURB': { text: 'Đừng làm phiền', class: 'bg-danger' },
                            'INVISIBLE': { text: 'Ẩn', class: 'bg-dark' }
                        };
                        const status = statusMap[user.status] || { text: 'Unknown', class: 'bg-secondary' };
                        statusBadge.textContent = status.text;
                        statusBadge.className = 'badge ' + status.class;
                    }

                    // Display avatar
                    if (user.avatarUrl) {
                        document.getElementById('user-avatar').src = user.avatarUrl;
                        document.getElementById('user-avatar').style.display = 'block';
                        document.getElementById('user-avatar-placeholder').style.display = 'none';
                    }
                } catch (error) {
                    console.error('Error loading user info:', error);
                    showAlert('danger', 'Không thể tải thông tin người dùng');
                }
            }

            // Load active sessions
            async function loadSessions() {
                try {
                    const response = await fetchWithAuth('/api/auth/sessions');
                    
                    if (!response.ok) {
                        throw new Error('Failed to load sessions');
                    }

                    const sessions = await response.json();
                    const sessionsList = document.getElementById('sessions-list');
                    const sessionCount = document.getElementById('session-count');

                    sessionCount.textContent = sessions.length;

                    if (sessions.length === 0) {
                        sessionsList.innerHTML = '<p class="text-muted text-center p-4">Không có phiên nào đang hoạt động</p>';
                        return;
                    }

                    sessionsList.innerHTML = sessions.map(session => `
                        <div class="d-flex align-items-center justify-content-between p-3 border-bottom">
                            <div class="d-flex align-items-center flex-grow-1">
                                <i class="bi bi-${getDeviceIcon(session.deviceInfo)} text-primary me-3" style="font-size: 1.8rem;"></i>
                                <div>
                                    <h6 class="mb-1">
                                        ${session.deviceInfo || 'Unknown Device'}
                                        ${session.isCurrent ? '<span class="badge bg-success ms-2">Hiện tại</span>' : ''}
                                    </h6>
                                    <small class="text-muted">
                                        <i class="bi bi-geo-alt"></i> ${session.ipAddress} • 
                                        <i class="bi bi-clock"></i> ${formatDate(session.createdAt)}
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
                } catch (error) {
                    console.error('Error loading sessions:', error);
                    document.getElementById('sessions-list').innerHTML = 
                        '<p class="text-danger text-center p-4">Không thể tải danh sách phiên đăng nhập</p>';
                }
            }

            // Get device icon based on device info
            function getDeviceIcon(deviceInfo) {
                if (!deviceInfo) return 'laptop';
                const info = deviceInfo.toLowerCase();
                if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
                    return 'phone';
                } else if (info.includes('tablet') || info.includes('ipad')) {
                    return 'tablet';
                } else {
                    return 'laptop';
                }
            }

            // Revoke session
            async function revokeSession(sessionId) {
                if (!confirm('Bạn có chắc muốn thu hồi phiên này? Thiết bị sẽ bị đăng xuất.')) {
                    return;
                }

                try {
                    const response = await fetchWithAuth(`/api/auth/sessions/${sessionId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        showAlert('success', 'Thu hồi phiên thành công!');
                        loadSessions(); // Reload sessions list
                    } else {
                        showAlert('danger', 'Không thể thu hồi phiên!');
                    }
                } catch (error) {
                    console.error('Error revoking session:', error);
                    showAlert('danger', 'Có lỗi xảy ra khi thu hồi phiên');
                }
            }

            // Load all data on page load
            loadUserInfo();
            loadSessions();
        </script>
    </content>
</body>
</html>
