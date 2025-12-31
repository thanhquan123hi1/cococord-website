<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<head>
    <title>CoCoCord</title>
</head>
<div class="cococord-home" id="cococordHome">
    <!-- Primary Sidebar (persistent within /app) -->
    <aside class="primary-sidebar" aria-label="Primary Sidebar">
        <div class="sidebar-search">
            <div class="search-wrap">
                <i class="bi bi-search"></i>
                <input id="globalSearch" class="search-input" type="text" placeholder="Tìm hoặc bắt đầu cuộc trò chuyện" autocomplete="off" />
            </div>
        </div>

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
                </div>
                <button class="btn-primary" type="button" id="addFriendBtn">Thêm Bạn</button>
            </div>
            <div class="top-right">
                <button class="icon-btn" type="button" title="Hộp thư"><i class="bi bi-inbox"></i></button>
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
</div>

