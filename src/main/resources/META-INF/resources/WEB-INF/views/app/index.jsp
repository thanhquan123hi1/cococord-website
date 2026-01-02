<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<head>
    <title>CoCoCord</title>
</head>
<div class="cococord-home" id="cococordHome">
    <!-- Primary Sidebar (persistent within /app) -->
    <aside class="primary-sidebar" aria-label="Primary Sidebar">
        <nav class="sidebar-nav" aria-label="Menu">
            <a class="nav-item active" href="#" data-view="friends">
                <i class="bi bi-people-fill"></i>
                <span>Bạn bè</span>
            </a>
            <a class="nav-item" href="#" data-view="nitro">
                <i class="bi bi-lightning-charge-fill"></i>
                <span>Nitro</span>
            </a>
            <a class="nav-item" href="#" data-view="shop">
                <i class="bi bi-bag-fill"></i>
                <span>Cửa hàng</span>
            </a>
            <a class="nav-item" href="#" data-view="quests">
                <i class="bi bi-compass-fill"></i>
                <span>Nhiệm vụ</span>
            </a>
        </nav>

        <div class="sidebar-section">
            <div class="section-left">TIN NHẮN TRỰC TIẾP</div>
            <button class="section-action" type="button" title="Tạo DM" aria-label="Tạo DM">
                <i class="bi bi-plus"></i>
            </button>
        </div>

        <div class="dm-list" id="dmList" role="list" aria-label="Direct Messages"></div>
    </aside>

    <!-- Main Content Area (dynamic) -->
    <main class="main-area" aria-label="Main Content">
        <!-- Top Bar / Header (persistent component; content updated by JS if needed) -->
        <header class="top-bar">
            <div class="top-left">
                <i class="bi bi-people-fill"></i>
                <span class="top-title">Bạn bè</span>
                <div class="top-divider"></div>
                <div class="top-tabs" role="tablist" aria-label="Friends Tabs">
                    <button class="tab active" type="button" data-tab="online">Trực tuyến</button>
                    <button class="tab" type="button" data-tab="all">Tất cả</button>
                    <button class="tab" type="button" data-tab="pending">Đang chờ xử lý</button>
                    <button class="tab" type="button" data-tab="blocked">Bị chặn</button>
                </div>
                <button class="btn-primary" type="button" id="addFriendBtn">Thêm Bạn</button>
            </div>
            <div class="top-right">
                <button class="icon-btn inbox-btn" type="button" title="Hộp thư"><i class="bi bi-inbox"></i></button>
                <button class="icon-btn" type="button" title="Trợ giúp"><i class="bi bi-question-circle"></i></button>
            </div>
        </header>

        <div class="toolbar">
            <div class="search-wrap">
                <i class="bi bi-search"></i>
                <input id="friendsSearch" class="search-input" type="text" placeholder="Tìm kiếm" autocomplete="off" />
            </div>
        </div>

        <section class="content" id="friendsList"></section>

        <section class="add-friend" id="addFriendView" style="display:none;">
            <div class="add-friend-header">
                <h3>THÊM BẠN</h3>
                <p>Bạn có thể thêm bạn bè bằng tên người dùng CoCoCord của họ.</p>
            </div>
            <div class="add-friend-form">
                <input id="addFriendInput" class="add-friend-input" type="text" placeholder="Nhập username hoặc email" autocomplete="off" />
                <button class="btn-primary" type="button" id="sendFriendRequestBtn">Gửi Yêu Cầu Kết Bạn</button>
            </div>
            <div class="add-friend-hint" id="addFriendHint"></div>
        </section>
    </main>

    <!-- DM Chat View (hidden by default, shown when clicking a DM) -->
    <main class="dm-chat-area" id="dmChatArea" style="display:none;">
        <header class="dm-chat-header">
            <div class="header-left">
                <button class="icon-btn" type="button" id="closeDmChatBtn" title="Quay lại"><i class="bi bi-arrow-left"></i></button>
                <i class="bi bi-at" style="font-size: 20px; color: var(--text-muted); margin-right: 8px;"></i>
                <span class="header-title" id="dmChatTitle">User</span>
            </div>
            <div class="header-right">
                <button class="icon-btn" type="button" id="dmVoiceCallBtn" title="Gọi thoại"><i class="bi bi-telephone"></i></button>
                <button class="icon-btn" type="button" id="dmVideoCallBtn" title="Gọi video"><i class="bi bi-camera-video"></i></button>
                <button class="icon-btn" type="button" title="Ghim"><i class="bi bi-pin"></i></button>
                <button class="icon-btn" type="button" title="Thêm bạn vào DM"><i class="bi bi-person-plus"></i></button>
                <div class="search-wrap" style="width: 140px;">
                    <input type="text" class="search-input" placeholder="Tìm kiếm" style="padding: 4px 8px; font-size: 13px;" />
                    <i class="bi bi-search" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 12px;"></i>
                </div>
                <button class="icon-btn inbox-btn" type="button" title="Hộp thư"><i class="bi bi-inbox"></i></button>
                <button class="icon-btn" type="button" title="Trợ giúp"><i class="bi bi-question-circle"></i></button>
            </div>
        </header>

        <section class="dm-messages-area" id="dmMessagesArea">
            <div class="dm-start" id="dmStartHeader">
                <div class="dm-start-avatar" id="dmStartAvatar"></div>
                <h2 class="dm-start-name" id="dmStartName"></h2>
                <p class="dm-start-info" id="dmStartInfo"></p>
            </div>
            <div class="dm-messages-list" id="dmMessagesList"></div>
        </section>

        <form class="dm-composer" id="dmComposer" autocomplete="off">
            <div class="composer-inner">
                <button class="composer-btn" type="button" title="Đính kèm"><i class="bi bi-plus-circle"></i></button>
                <input id="dmMessageInput" class="composer-input" type="text" placeholder="Nhắn tin tới @User" />
                <div class="composer-actions">
                    <button class="composer-btn" type="button" title="GIF"><i class="bi bi-filetype-gif"></i></button>
                    <button class="composer-btn" type="button" title="Sticker"><i class="bi bi-sticky"></i></button>
                    <button class="composer-btn" type="button" title="Emoji"><i class="bi bi-emoji-smile"></i></button>
                </div>
            </div>
        </form>
    </main>

    <!-- DM Call Overlay (Voice/Video) -->
    <div class="dm-call-overlay" id="dmCallOverlay" style="display:none;" aria-hidden="true">
        <div class="dm-call-surface">
            <div class="dm-call-header">
                <div class="dm-call-title" id="dmCallTitle">Call</div>
                <div class="dm-call-header-actions">
                    <button class="btn-primary" type="button" id="dmCallAcceptBtn" style="display:none;">Chấp nhận</button>
                    <button class="btn-secondary" type="button" id="dmCallDeclineBtn" style="display:none;">Từ chối</button>
                    <button class="icon-btn" type="button" id="dmCallHangupBtn" title="Kết thúc cuộc gọi">
                        <i class="bi bi-telephone-x"></i>
                    </button>
                </div>
            </div>

            <div class="dm-call-body">
                <div class="dm-call-prompt" id="dmCallPrompt" style="display:none;">
                    <div class="dm-call-prompt-text" id="dmCallPromptText"></div>
                </div>
                <video class="dm-call-remote" id="dmCallRemoteVideo" autoplay playsinline></video>
                <video class="dm-call-local" id="dmCallLocalVideo" autoplay playsinline muted></video>
                <audio id="dmCallRemoteAudio" autoplay></audio>
            </div>
        </div>
    </div>
</div>

