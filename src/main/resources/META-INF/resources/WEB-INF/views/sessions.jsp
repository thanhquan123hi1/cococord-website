<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<head>
    <title>Phiên đăng nhập - CoCoCord</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/friends.css">
    <style>
        .sessions-container {
            max-width: 960px;
            margin: 0 auto;
            padding: 32px;
        }
        .sessions-header {
            margin-bottom: 24px;
        }
        .sessions-header h1 {
            font-size: 24px;
            font-weight: 700;
            color: #23272a;
            margin: 0 0 8px 0;
        }
        .sessions-header p {
            color: #4f545c;
            margin: 0;
        }
        .session-card {
            background: white;
            border: 1px solid #e3e5e8;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .session-card.current {
            border-color: #5865f2;
            background: #f7f8ff;
        }
        .session-info {
            flex: 1;
        }
        .session-device {
            font-size: 16px;
            font-weight: 600;
            color: #23272a;
            margin-bottom: 4px;
        }
        .session-meta {
            font-size: 14px;
            color: #4f545c;
        }
        .session-badge {
            display: inline-block;
            background: #5865f2;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 8px;
        }
        .btn-revoke {
            background: #ed4245;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        }
        .btn-revoke:hover {
            background: #c03537;
        }
        .btn-revoke-all {
            background: #ed4245;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            margin-top: 16px;
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
            <a class="sidebar-item active" href="${pageContext.request.contextPath}/sessions"><i class="bi bi-shield-check"></i> Phiên đăng nhập</a>
            <a class="sidebar-item" href="${pageContext.request.contextPath}/change-password"><i class="bi bi-key"></i> Đổi mật khẩu</a>
        </nav>
    </aside>

    <!-- Main Column -->
    <main class="discord-main" style="background: #f2f3f5;">
        <div class="sessions-container">
            <div class="sessions-header">
                <h1>Phiên đăng nhập</h1>
                <p>Quản lý các thiết bị đang đăng nhập vào tài khoản của bạn</p>
            </div>

            <div id="sessionsList"></div>

            <button class="btn-revoke-all" onclick="revokeAllSessions()">Thu hồi tất cả phiên</button>
        </div>
    </main>
</div>
<script>
    async function loadSessions() {
        try {
            const response = await fetchWithAuth('/api/users/sessions');
            if (response && response.ok) {
                const sessions = await response.json();
                displaySessions(sessions);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }

    function displaySessions(sessions) {
        const container = document.getElementById('sessionsList');
        if (!sessions || sessions.length === 0) {
            container.innerHTML = '<div class="session-card"><p>Không có phiên đăng nhập nào</p></div>';
            return;
        }

        container.innerHTML = sessions.map((session, index) => {
            const isCurrent = index === 0;
            const device = session.deviceInfo || 'Unknown Device';
            const ip = session.ipAddress || 'Unknown IP';
            const lastActive = session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString('vi-VN') : 'Unknown';
            
            // Build HTML parts separately to avoid nested template literal issues
            let html = '<div class="session-card' + (isCurrent ? ' current' : '') + '">';
            html += '<div class="session-info">';
            html += '<div class="session-device">';
            html += '<i class="bi bi-' + getDeviceIcon(device) + '"></i> ' + device;
            
            if (isCurrent) {
                html += '<span class="session-badge">Phiên hiện tại</span>';
            }
            
            html += '</div>';
            html += '<div class="session-meta">';
            html += ip + ' • Hoạt động lần cuối: ' + lastActive;
            html += '</div>';
            html += '</div>';
            
            if (!isCurrent) {
                html += '<button class="btn-revoke" onclick="revokeSession(\'' + session.id + '\')">Thu hồi</button>';
            }
            
            html += '</div>';
            
            return html;
        }).join('');
    }

    function getDeviceIcon(device) {
        if (device.includes('Windows') || device.includes('Mac') || device.includes('Linux')) return 'laptop';
        if (device.includes('Android') || device.includes('iOS')) return 'phone';
        return 'display';
    }

    async function revokeSession(sessionId) {
        if (!confirm('Bạn có chắc muốn thu hồi phiên này?')) return;

        try {
            const response = await fetchWithAuth(`/api/users/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            if (response && response.ok) {
                alert('Thu hồi thành công!');
                loadSessions();
            }
        } catch (error) {
            console.error('Failed to revoke session:', error);
            alert('Thu hồi thất bại!');
        }
    }

    async function revokeAllSessions() {
        if (!confirm('Bạn có chắc muốn thu hồi tất cả phiên (trừ phiên hiện tại)?')) return;

        try {
            const response = await fetchWithAuth('/api/users/sessions/revoke-all', {
                method: 'POST'
            });

            if (response && response.ok) {
                alert('Thu hồi tất cả phiên thành công!');
                loadSessions();
            }
        } catch (error) {
            console.error('Failed to revoke all sessions:', error);
            alert('Thu hồi thất bại!');
        }
    }

    loadSessions();
</script>
