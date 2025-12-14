<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Tin nhắn trực tiếp - CoCoCord</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/friends.css">
</head>
<body>
<div class="discord-shell" id="dmShell">
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
            <a class="sidebar-item" href="${pageContext.request.contextPath}/friends"><i class="bi bi-people-fill"></i> Friends</a>
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
            <div class="dm-header" id="dmHeader">
                <i class="bi bi-chat-left-text"></i>
                <span id="dmTitle">Direct Messages</span>
            </div>
            <div></div>
        </header>

        <section class="dm-messages" id="dmMessages" aria-label="Messages">
            <div class="empty-state" id="dmEmpty" style="max-width: 680px;">
                <div style="font-weight: 900; margin-bottom: 6px;">Chọn một cuộc trò chuyện</div>
                <div>Click một bạn bè ở cột trái để mở DM.</div>
            </div>
        </section>

        <form class="dm-composer" id="dmComposer" style="display:none;" autocomplete="off">
            <input id="dmInput" class="discord-input" type="text" placeholder="Nhắn tin" />
            <button class="dm-send" type="submit">Gửi</button>
        </form>
    </main>

    <!-- Activity Column -->
    <aside class="discord-activity">
        <div class="activity-header">Đang Hoạt Động</div>
        <div class="activity-body">
            <div class="empty-state">
                <div style="font-weight: 900; margin-bottom: 6px;">Hiện tại không có cập nhật mới nào cả…</div>
                <div>Chuẩn bị mở rộng hiển thị game/voice.</div>
            </div>
        </div>
    </aside>
</div>

<script defer src="${pageContext.request.contextPath}/js/messages.js"></script>
</body>
</html>
