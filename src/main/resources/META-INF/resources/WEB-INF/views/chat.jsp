<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Trò chuyện - CoCoCord</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/chat.css">
</head>
<body>
<div class="app-container" id="chatApp">

    <!-- Server Sidebar -->
    <aside class="server-sidebar" aria-label="Servers">
        <div class="server-list" id="serverList"></div>
        <div class="server-divider"></div>
        <div class="server-list">
            <div class="server-item" role="button" tabindex="0" title="Add Server">
                <i class="bi bi-plus-lg"></i>
            </div>
        </div>
    </aside>

    <!-- Channel Sidebar -->
    <aside class="channel-sidebar" aria-label="Channels">
        <div class="channel-header" id="serverHeader">
            <h5 id="serverName">Chọn một server</h5>
            <i class="bi bi-chevron-down"></i>
        </div>

        <div class="channel-list" id="channelList"></div>

        <div class="user-panel" id="userPanel">
            <div class="user-info">
                <div class="user-avatar" id="ucpAvatar">U</div>
                <div class="user-details">
                    <div class="user-name" id="ucpName">User</div>
                    <div class="user-status" id="ucpStatus">Online</div>
                </div>
            </div>
            <div class="user-controls" aria-label="Controls">
                <i class="bi bi-mic" title="Mic"></i>
                <i class="bi bi-headphones" title="Headphones"></i>
                <i class="bi bi-gear" title="Settings"></i>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" aria-label="Chat">
        <header class="content-header">
            <div class="channel-info">
                <i class="bi bi-hash"></i>
                <span id="channelName">Chọn kênh</span>
            </div>
            <div class="header-controls" aria-label="Header controls">
                <i class="bi bi-bell" title="Notifications"></i>
                <i class="bi bi-pin-angle" title="Pins"></i>
                <i class="bi bi-people" title="Members"></i>
                <i class="bi bi-search" title="Search"></i>
            </div>
        </header>

        <div class="content-body" id="messageList" aria-label="Messages">
            <div class="welcome-message" id="chatEmpty">
                <h2>Chọn server và kênh để bắt đầu</h2>
                <p class="text-muted">Tin nhắn lịch sử sẽ hiện ở đây, và tin nhắn mới sẽ realtime.</p>
            </div>
        </div>

        <form class="chat-composer" id="chatComposer" autocomplete="off" style="display:none;">
            <div class="composer-box">
                <input class="composer-input" id="chatInput" type="text" placeholder="Nhắn tin" />
                <button class="composer-send" type="submit">Gửi</button>
            </div>
        </form>
    </main>

    <!-- Members Sidebar (placeholder) -->
    <aside class="members-sidebar" aria-label="Members">
        <div class="members-header">THÀNH VIÊN</div>
        <div class="members-list">
            <div class="members-empty">Chưa có danh sách thành viên.</div>
        </div>
    </aside>
</div>

<script defer src="${pageContext.request.contextPath}/js/chat.js"></script>
</body>
</html>
