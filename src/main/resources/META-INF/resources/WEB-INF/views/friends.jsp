<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Bạn bè - CoCoCord</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/friends.css">
</head>
<body>
<div class="discord-shell" id="friendsShell">
    <!-- Server Bar (far left) -->
    <aside class="server-bar" aria-label="Servers">
        <a class="server-btn home" href="${pageContext.request.contextPath}/friends" title="Home">
            <i class="bi bi-discord"></i>
        </a>
        <div class="server-divider"></div>
        <div class="server-list" id="serverList">
            <!-- Placeholder server icons -->
            <button class="server-btn server" type="button" title="Server"><span>C</span></button>
            <button class="server-btn server" type="button" title="Server"><span>O</span></button>
        </div>
        <div class="server-footer">
            <button class="server-btn add" type="button" title="Add Server"><i class="bi bi-plus-lg"></i></button>
            <button class="server-btn discover" type="button" title="Discover"><i class="bi bi-compass"></i></button>
        </div>
    </aside>

    <!-- Left Sidebar -->
    <aside class="discord-sidebar">
        <div class="sidebar-search">
            <input id="globalSearch" class="discord-input" type="text" placeholder="Tìm hoặc bắt đầu cuộc trò chuyện" autocomplete="off" />
        </div>

        <nav class="sidebar-menu" aria-label="Menu">
            <a class="sidebar-item active" href="#" data-menu="friends"><i class="bi bi-people-fill"></i> Friends</a>
            <a class="sidebar-item" href="#" data-menu="nitro"><i class="bi bi-stars"></i> Nitro</a>
            <a class="sidebar-item" href="#" data-menu="store"><i class="bi bi-shop"></i> Store</a>
            <a class="sidebar-item" href="#" data-menu="missions"><i class="bi bi-flag"></i> Missions</a>
        </nav>

        <div class="sidebar-section">Tin nhắn trực tiếp</div>
        <div class="dm-list" id="dmList" role="list"></div>

        <!-- User Control Panel (bottom) -->
        <div class="user-panel" id="userPanel">
            <div class="user-left">
                <div class="avatar" id="ucpAvatar"><span class="status-dot online" id="ucpStatusDot"></span></div>
                <div class="user-meta">
                    <div class="user-name" id="ucpName">User</div>
                    <div class="user-status" id="ucpStatus">Online</div>
                </div>
            </div>
            <div class="user-actions">
                <button class="icon-btn ucp-btn" type="button" title="Mic"><i class="bi bi-mic"></i></button>
                <button class="icon-btn ucp-btn" type="button" title="Headphones"><i class="bi bi-headphones"></i></button>
                <button class="icon-btn ucp-btn" type="button" title="Settings"><i class="bi bi-gear"></i></button>
            </div>
        </div>
    </aside>

    <!-- Main Column -->
    <main class="discord-main">
        <header class="main-header">
            <div class="tabs" role="tablist" aria-label="Tabs">
                <button class="tab-btn active" type="button" data-tab="friends">Bạn bè</button>
                <button class="tab-btn" type="button" data-tab="online">Trực tuyến</button>
                <button class="tab-btn" type="button" data-tab="all">Tất cả</button>
                <button class="tab-btn" type="button" data-tab="pending">Đang chờ xử lý</button>
            </div>
            <button class="primary-btn" type="button" id="addFriendBtn">Thêm bạn</button>
        </header>

        <div class="main-toolbar">
            <input id="friendsSearch" class="discord-input" type="text" placeholder="Tìm kiếm" autocomplete="off" />
        </div>

        <!-- Friends list view -->
        <section class="main-content" id="friendsList" aria-label="Friends list"></section>

        <!-- Add Friend view (Discord-like) -->
        <section class="main-content" id="addFriendView" style="display:none; padding: 16px;">
            <div class="add-friend-grid">
                <div>
                    <div class="add-friend-title">Thêm Bạn</div>
                    <div class="add-friend-desc">Bạn có thể thêm bạn bè bằng tên người dùng Discord của họ.</div>
                    <div class="add-friend-box">
                        <input id="addFriendInput" class="discord-input" type="text" placeholder="Bạn có thể thêm bạn bè bằng tên người dùng Discord của họ." autocomplete="off" />
                        <button class="primary-btn" type="button" id="sendFriendRequestBtn">Gửi Yêu Cầu Kết Bạn</button>
                    </div>
                    <div class="add-friend-hint" id="addFriendHint"></div>
                </div>
                <div class="add-friend-illustration" aria-hidden="true">
                    <i class="bi bi-robot" style="font-size: 90px;"></i>
                </div>
            </div>
        </section>
    </main>

    <!-- Activity Column -->
    <aside class="discord-activity">
        <div class="activity-header">Đang Hoạt Động</div>
        <div class="activity-body">
            <div class="empty-state" id="activityEmpty">
                <div style="font-weight: 900; margin-bottom: 6px;">Hiện tại không có cập nhật mới nào cả…</div>
                <div>Nếu bạn bè của bạn chơi game hoặc trò chuyện thoại, chúng tôi sẽ hiển thị hoạt động ở đây.</div>
            </div>
        </div>
    </aside>
</div>

<script defer src="${pageContext.request.contextPath}/js/friends.js"></script>
</body>
</html>
