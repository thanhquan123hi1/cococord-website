<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<head>
    <title>Hồ sơ - CoCoCord</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/friends.css">
    <style>
        .profile-container {
            max-width: 960px;
            margin: 0 auto;
            padding: 32px;
        }
        .profile-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 48px 32px 24px;
            position: relative;
            margin-bottom: 32px;
        }
        .profile-avatar-wrapper {
            display: flex;
            align-items: center;
            gap: 24px;
        }
        .profile-avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid white;
            background: #36393f;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: 700;
            color: white;
        }
        .profile-info h1 {
            margin: 0 0 8px 0;
            color: white;
            font-size: 28px;
            font-weight: 700;
        }
        .profile-username {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            margin-bottom: 8px;
        }
        .profile-status {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
        }
        .profile-section {
            background: white;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 16px;
            border: 1px solid #e3e5e8;
        }
        .profile-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: #23272a;
        }
        .form-group {
            margin-bottom: 16px;
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
    </style>
</head>
<div class="discord-shell" id="profileShell">
    <!-- Left Sidebar -->
    <aside class="discord-sidebar">
        <div class="sidebar-search">
            <input class="discord-input" type="text" placeholder="Tìm kiếm" autocomplete="off" />
        </div>

        <nav class="sidebar-menu" aria-label="Menu">
            <a class="sidebar-item" href="${pageContext.request.contextPath}/app><i class="bi bi-people-fill"></i> Bạn bè</a>
            <a class="sidebar-item active" href="${pageContext.request.contextPath}/profile"><i class="bi bi-person-circle"></i> Hồ sơ</a>
            <a class="sidebar-item" href="${pageContext.request.contextPath}/sessions"><i class="bi bi-shield-check"></i> Phiên đăng nhập</a>
            <a class="sidebar-item" href="${pageContext.request.contextPath}/change-password"><i class="bi bi-key"></i> Đổi mật khẩu</a>
        </nav>
    </aside>

    <!-- Main Column -->
    <main class="discord-main" style="background: #f2f3f5;">
        <div class="profile-container">
            <div class="profile-header">
                <div class="profile-avatar-wrapper">
                    <div class="profile-avatar" id="profileAvatar">U</div>
                    <div class="profile-info">
                        <h1 id="profileDisplayName">Loading...</h1>
                        <div class="profile-username" id="profileUsername">username#0000</div>
                        <div class="profile-status" id="profileBio">Bio</div>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h2>Thông tin cá nhân</h2>
                <form id="profileForm">
                    <div class="form-group">
                        <label>Tên hiển thị</label>
                        <input type="text" class="form-control" id="inputDisplayName" placeholder="Tên hiển thị của bạn">
                    </div>
                    <div class="form-group">
                        <label>Bio</label>
                        <textarea class="form-control" id="inputBio" rows="3" placeholder="Giới thiệu bản thân..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Trạng thái tùy chỉnh</label>
                        <input type="text" class="form-control" id="inputCustomStatus" placeholder="Đang làm gì đó...">
                    </div>
                    <button type="submit" class="btn-save">Lưu thay đổi</button>
                </form>
            </div>
        </div>
    </main>
</div>
<script>
    let currentUser = null;

    async function loadProfile() {
        try {
            const response = await fetchWithAuth('/api/auth/me');
            if (response && response.ok) {
                currentUser = await response.json();
                displayProfile();
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    function displayProfile() {
        if (!currentUser) return;

        const displayName = currentUser.displayName || currentUser.username;
        const discriminator = String(currentUser.id % 10000).padStart(4, '0');
        
        document.getElementById('profileDisplayName').textContent = displayName;
        document.getElementById('profileUsername').textContent = `${currentUser.username}#${discriminator}`;
        document.getElementById('profileBio').textContent = currentUser.bio || 'Chưa có bio';
        
        const avatarEl = document.getElementById('profileAvatar');
        if (currentUser.avatarUrl) {
            avatarEl.innerHTML = `<img src="${currentUser.avatarUrl}" alt="${displayName}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            avatarEl.textContent = displayName.charAt(0).toUpperCase();
        }

        document.getElementById('inputDisplayName').value = currentUser.displayName || '';
        document.getElementById('inputBio').value = currentUser.bio || '';
        document.getElementById('inputCustomStatus').value = currentUser.customStatus || '';

        // Let the global app shell own the User Control Panel
        window.CoCoCordApp?.updateGlobalUserPanel?.(currentUser);
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            displayName: document.getElementById('inputDisplayName').value,
            bio: document.getElementById('inputBio').value,
            customStatus: document.getElementById('inputCustomStatus').value
        };

        try {
            const response = await fetchWithAuth('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response && response.ok) {
                alert('Cập nhật thông tin thành công!');
                await loadProfile();
            } else {
                alert('Cập nhật thất bại!');
            }
        } catch (error) {
            console.error('Update failed:', error);
            alert('Có lỗi xảy ra!');
        }
    });

    loadProfile();
</script>
