<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Trò chuyện - CoCoCord</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/server-sidebar.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/channel-panel.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/chat.css">
</head>
<body>
<div class="app-container" id="chatApp">
    <!-- Server Sidebar (72px) -->
    <aside class="server-sidebar" id="serverSidebar">
        <div class="server-list-wrapper">
            <div class="server-list" id="serverList">
                <!-- Home Button (Discord logo) -->
                <a class="server-item home-btn" href="${pageContext.request.contextPath}/friends" title="Tin nhắn trực tiếp" data-tooltip="Tin nhắn trực tiếp">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
                        <path d="M23.022 5.802c-1.594-.732-3.3-1.269-5.088-1.578a.107.107 0 0 0-.114.054c-.22.39-.463.9-.634 1.3a19.473 19.473 0 0 0-5.812 0 13.38 13.38 0 0 0-.643-1.3.11.11 0 0 0-.113-.054 21.023 21.023 0 0 0-5.09 1.578.1.1 0 0 0-.046.04C2.016 10.867.977 15.788 1.48 20.644a.12.12 0 0 0 .044.082 21.204 21.204 0 0 0 6.38 3.227.112.112 0 0 0 .121-.04 15.19 15.19 0 0 0 1.31-2.132.109.109 0 0 0-.06-.152 13.966 13.966 0 0 1-1.994-.95.11.11 0 0 1-.011-.183c.134-.1.268-.205.396-.31a.107.107 0 0 1 .112-.016c4.183 1.91 8.712 1.91 12.847 0a.107.107 0 0 1 .113.014c.128.106.262.21.397.312a.11.11 0 0 1-.01.183c-.637.373-1.3.686-1.996.949a.11.11 0 0 0-.058.153c.384.746.831 1.456 1.31 2.13a.11.11 0 0 0 .121.042 21.152 21.152 0 0 0 6.39-3.227.111.111 0 0 0 .045-.08c.6-5.698-.996-10.578-4.208-14.804a.087.087 0 0 0-.045-.041zM9.68 17.642c-1.293 0-2.358-1.186-2.358-2.643s1.045-2.644 2.358-2.644c1.323 0 2.378 1.197 2.358 2.644 0 1.457-1.045 2.643-2.358 2.643zm8.714 0c-1.293 0-2.358-1.186-2.358-2.643s1.045-2.644 2.358-2.644c1.323 0 2.378 1.197 2.358 2.644 0 1.457-1.035 2.643-2.358 2.643z"/>
                    </svg>
                </a>
                
                <div class="server-divider"></div>
                
                <!-- Server list will be populated by JavaScript -->
            </div>
        </div>
        
        <!-- Fixed Actions at Bottom -->
        <div class="server-actions-fixed">
            <div class="server-divider"></div>
            <button class="server-item add-server-btn" id="addServerBtn" title="Thêm Server" data-tooltip="Thêm Server">
                <i class="bi bi-plus"></i>
            </button>
            <button class="server-item discover-btn" id="discoverBtn" title="Khám phá Server" data-tooltip="Khám phá Server công khai">
                <i class="bi bi-compass"></i>
            </button>
        </div>
    </aside>
    
    <!-- Server Tooltip -->
    <div class="server-tooltip" id="serverTooltip"></div>

    <!-- Channel Sidebar (Contains User Area at Bottom) -->
    <aside class="channel-sidebar" aria-label="Channels">
        <div class="channel-header" id="serverHeader">
            <h5 id="serverName">Chọn một server</h5>
            <i class="bi bi-chevron-down" id="serverMenuToggle"></i>
        </div>
        
        <!-- Server Dropdown Menu -->
        <div class="server-dropdown" id="serverDropdown" style="display:none;">
            <div class="dropdown-item" id="invitePeopleBtn"><i class="bi bi-person-plus"></i> Mời mọi người</div>
            <div class="dropdown-item" id="serverSettingsBtn"><i class="bi bi-gear"></i> Cài đặt Server</div>
            <div class="dropdown-item" id="createChannelBtn"><i class="bi bi-hash"></i> Tạo Kênh</div>
            <div class="dropdown-item" id="createCategoryBtn"><i class="bi bi-folder-plus"></i> Tạo Danh mục</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item text-danger" id="leaveServerBtn"><i class="bi bi-box-arrow-left"></i> Rời Server</div>
        </div>

        <!-- Scrollable Channel List -->
        <div class="channel-list-wrapper">
            <div class="channel-list" id="channelList">
                <!-- Channel categories and items will be rendered here -->
            </div>
        </div>
        
        <!-- Voice Connected Bar (Hidden by default) -->
        <div class="voice-connected-bar" id="voiceConnectedBar">
            <div class="voice-info">
                <div class="voice-status">
                    <i class="bi bi-wifi voice-icon"></i>
                    <span class="voice-label">Voice Connected</span>
                </div>
                <div class="voice-channel-name" id="voiceChannelName">Kênh thoại</div>
            </div>
            <div class="voice-controls">
                <button class="voice-control-btn" id="voiceDisconnectBtn" title="Ngắt kết nối">
                    <i class="bi bi-telephone-x"></i>
                </button>
            </div>
        </div>
        
        <!-- User Area (Fixed at Bottom of Channel Sidebar) -->
        <div class="user-area" id="userPanel">
            <div class="user-info" id="userInfoBtn" role="button" tabindex="0">
                <div class="user-avatar" id="ucpAvatar">
                    <span class="status-indicator online" id="ucpStatusIndicator"></span>
                </div>
                <div class="user-details">
                    <div class="user-name" id="ucpName">User</div>
                    <div class="user-status" id="ucpStatus">Trực tuyến</div>
                </div>
            </div>
            <div class="user-controls" aria-label="Controls">
                <button class="control-btn" id="micBtn" title="Tắt/Bật Mic">
                    <i class="bi bi-mic"></i>
                </button>
                <button class="control-btn" id="deafenBtn" title="Tắt/Bật Tai nghe">
                    <i class="bi bi-headphones"></i>
                </button>
                <button class="control-btn" id="settingsBtn" title="Cài đặt người dùng">
                    <i class="bi bi-gear"></i>
                </button>
            </div>
            
            <!-- User Dropdown Menu -->
            <div class="user-dropdown" id="userDropdown" style="display:none;">
                <a href="${pageContext.request.contextPath}/profile" class="dropdown-item">
                    <i class="bi bi-person"></i> Hồ sơ của tôi
                </a>
                <a href="${pageContext.request.contextPath}/settings" class="dropdown-item">
                    <i class="bi bi-gear"></i> Cài đặt
                </a>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item status-item">
                    <i class="bi bi-circle-fill online"></i> Trực tuyến
                </div>
                <div class="dropdown-item status-item">
                    <i class="bi bi-moon-fill idle"></i> Vắng mặt
                </div>
                <div class="dropdown-item status-item">
                    <i class="bi bi-dash-circle-fill dnd"></i> Không làm phiền
                </div>
                <div class="dropdown-item status-item">
                    <i class="bi bi-circle offline"></i> Ẩn
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item text-danger" id="logoutBtnUser">
                    <i class="bi bi-box-arrow-right"></i> Đăng xuất
                </div>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" aria-label="Chat">
        <header class="content-header">
            <div class="channel-info">
                <i class="bi bi-hash channel-icon"></i>
                <span id="channelName">Chọn kênh</span>
                <span class="channel-topic" id="channelTopic"></span>
            </div>
            <div class="header-controls" aria-label="Header controls">
                <button class="header-btn" id="threadBtn" title="Threads">
                    <i class="bi bi-chat-square-text"></i>
                </button>
                <button class="header-btn" id="notifyBtn" title="Thông báo">
                    <i class="bi bi-bell"></i>
                </button>
                <button class="header-btn" id="pinBtn" title="Tin nhắn ghim">
                    <i class="bi bi-pin-angle"></i>
                </button>
                <button class="header-btn active" id="membersToggleBtn" title="Hiện/Ẩn danh sách thành viên">
                    <i class="bi bi-people"></i>
                </button>
                <div class="header-search">
                    <i class="bi bi-search"></i>
                    <input type="text" placeholder="Tìm kiếm" id="chatSearchInput" />
                </div>
                <button class="header-btn" id="inboxBtn" title="Hộp thư đến">
                    <i class="bi bi-inbox"></i>
                </button>
                <button class="header-btn" id="helpBtn" title="Trợ giúp">
                    <i class="bi bi-question-circle"></i>
                </button>
            </div>
        </header>

        <div class="content-body" id="messageList" aria-label="Messages">
            <div class="welcome-message" id="chatEmpty">
                <div class="welcome-icon">
                    <i class="bi bi-hash"></i>
                </div>
                <h2>Chào mừng đến với <span id="welcomeChannelName">#kênh</span>!</h2>
                <p class="text-muted">Đây là khởi đầu của kênh này. Gửi tin nhắn để bắt đầu cuộc trò chuyện!</p>
            </div>
        </div>

        <form class="chat-composer" id="chatComposer" autocomplete="off" style="display:none;">
            <div class="composer-attachments">
                <button type="button" class="composer-btn" id="attachBtn" title="Đính kèm file">
                    <i class="bi bi-plus-circle"></i>
                </button>
            </div>
            <div class="composer-box">
                <input class="composer-input" id="chatInput" type="text" placeholder="Nhắn tin vào #kênh" />
                <div class="composer-tools">
                    <button type="button" class="composer-btn" id="gifBtn" title="GIF">
                        <i class="bi bi-filetype-gif"></i>
                    </button>
                    <button type="button" class="composer-btn" id="stickerBtn" title="Sticker">
                        <i class="bi bi-stickies"></i>
                    </button>
                    <button type="button" class="composer-btn" id="emojiBtn" title="Emoji">
                        <i class="bi bi-emoji-smile"></i>
                    </button>
                </div>
            </div>
        </form>
    </main>

    <!-- Members Sidebar -->
    <aside class="members-sidebar" id="membersSidebar" aria-label="Members">
        <div class="members-section">
            <div class="members-category" id="onlineMembersSection">
                <span class="category-title">TRỰC TUYẾN — <span id="onlineCount">0</span></span>
                <div class="members-list" id="onlineMembersList"></div>
            </div>
            <div class="members-category" id="offlineMembersSection">
                <span class="category-title">NGOẠI TUYẾN — <span id="offlineCount">0</span></span>
                <div class="members-list" id="offlineMembersList"></div>
            </div>
        </div>
    </aside>
</div>

<!-- Create Server Modal -->
<div class="modal-overlay" id="createServerModal" style="display:none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Tạo Server của bạn</h3>
            <button class="modal-close" id="closeCreateServerModal">&times;</button>
        </div>
        <div class="modal-body">
            <p class="modal-desc">Server của bạn là nơi để bạn và bạn bè giao lưu. Hãy tạo server và bắt đầu trò chuyện.</p>
            <div class="form-group">
                <label for="serverNameInput">TÊN SERVER</label>
                <input type="text" id="serverNameInput" class="discord-input" placeholder="Server của bạn" />
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" id="cancelCreateServer">Hủy</button>
            <button class="btn-primary" id="confirmCreateServer">Tạo</button>
        </div>
    </div>
</div>

<!-- Create Channel Modal -->
<div class="modal-overlay" id="createChannelModal" style="display:none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Tạo Kênh</h3>
            <button class="modal-close" id="closeCreateChannelModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="channel-type-selector">
                <label class="channel-type-option active" data-type="TEXT">
                    <i class="bi bi-hash"></i>
                    <div>
                        <strong>Kênh văn bản</strong>
                        <span>Gửi tin nhắn, hình ảnh, GIF, emoji, ý kiến và trò đùa</span>
                    </div>
                </label>
                <label class="channel-type-option" data-type="VOICE">
                    <i class="bi bi-volume-up"></i>
                    <div>
                        <strong>Kênh thoại</strong>
                        <span>Trò chuyện thoại, video và chia sẻ màn hình</span>
                    </div>
                </label>
            </div>
            <div class="form-group">
                <label for="channelNameInput">TÊN KÊNH</label>
                <div class="channel-name-input">
                    <span class="channel-prefix">#</span>
                    <input type="text" id="channelNameInput" class="discord-input" placeholder="kênh-mới" />
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" id="cancelCreateChannel">Hủy</button>
            <button class="btn-primary" id="confirmCreateChannel">Tạo Kênh</button>
        </div>
    </div>
</div>

<!-- Create Category Modal -->
<div class="modal-overlay" id="createCategoryModal" style="display:none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Tạo Danh mục</h3>
            <button class="modal-close" id="closeCreateCategoryModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="categoryNameInput">TÊN DANH MỤC</label>
                <input type="text" id="categoryNameInput" class="discord-input" placeholder="Danh mục mới" />
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" id="cancelCreateCategory">Hủy</button>
            <button class="btn-primary" id="confirmCreateCategory">Tạo Danh mục</button>
        </div>
    </div>
</div>

<!-- User Settings Dropdown -->
<div class="user-settings-dropdown" id="userSettingsDropdown" style="display:none;">
    <a href="${pageContext.request.contextPath}/profile" class="dropdown-item"><i class="bi bi-person"></i> Hồ sơ</a>
    <a href="${pageContext.request.contextPath}/sessions" class="dropdown-item"><i class="bi bi-shield-lock"></i> Phiên đăng nhập</a>
    <a href="${pageContext.request.contextPath}/change-password" class="dropdown-item"><i class="bi bi-key"></i> Đổi mật khẩu</a>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item text-danger" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Đăng xuất</div>
</div>

<!-- User Settings Modal (Full-screen with Slide-up Animation) -->
<div class="settings-modal-overlay" id="userSettingsModal">
    <div class="settings-modal">
        <div class="settings-sidebar">
            <nav class="settings-nav">
                <div class="settings-nav-section">
                    <span class="settings-nav-header">NGƯỜI DÙNG</span>
                    <button class="settings-nav-item active" data-tab="account">
                        <i class="bi bi-person"></i> Tài khoản
                    </button>
                    <button class="settings-nav-item" data-tab="profile">
                        <i class="bi bi-person-badge"></i> Hồ sơ
                    </button>
                    <button class="settings-nav-item" data-tab="privacy">
                        <i class="bi bi-shield-lock"></i> Quyền riêng tư
                    </button>
                    <button class="settings-nav-item" data-tab="devices">
                        <i class="bi bi-laptop"></i> Thiết bị
                    </button>
                    <button class="settings-nav-item" data-tab="connections">
                        <i class="bi bi-link-45deg"></i> Kết nối
                    </button>
                </div>
                <div class="settings-nav-section">
                    <span class="settings-nav-header">CÀI ĐẶT ỨNG DỤNG</span>
                    <button class="settings-nav-item" data-tab="appearance">
                        <i class="bi bi-palette"></i> Giao diện
                    </button>
                    <button class="settings-nav-item" data-tab="accessibility">
                        <i class="bi bi-universal-access"></i> Trợ năng
                    </button>
                    <button class="settings-nav-item" data-tab="voice">
                        <i class="bi bi-mic"></i> Giọng nói & Video
                    </button>
                    <button class="settings-nav-item" data-tab="notifications">
                        <i class="bi bi-bell"></i> Thông báo
                    </button>
                    <button class="settings-nav-item" data-tab="keybinds">
                        <i class="bi bi-keyboard"></i> Phím tắt
                    </button>
                    <button class="settings-nav-item" data-tab="language">
                        <i class="bi bi-globe"></i> Ngôn ngữ
                    </button>
                </div>
                <div class="settings-nav-divider"></div>
                <button class="settings-nav-item danger" id="settingsLogoutBtn">
                    <i class="bi bi-box-arrow-right"></i> Đăng xuất
                </button>
            </nav>
        </div>
        <div class="settings-content">
            <div class="settings-header">
                <h2 id="settingsTitle">Tài khoản</h2>
                <button class="settings-close" id="closeUserSettingsModal">
                    <i class="bi bi-x-lg"></i>
                    <span>ESC</span>
                </button>
            </div>
            <div class="settings-body" id="settingsBody">
                <!-- Account Tab (Default) -->
                <div class="settings-tab active" data-tab="account">
                    <div class="account-card">
                        <div class="account-banner" id="accountBanner"></div>
                        <div class="account-info-row">
                            <div class="account-avatar" id="settingsAvatar">
                                <span class="status-indicator online"></span>
                            </div>
                            <div class="account-details">
                                <div class="account-name" id="settingsDisplayName">User</div>
                                <div class="account-tag" id="settingsUsername">@username</div>
                            </div>
                            <button class="btn-secondary" id="editProfileBtn">Chỉnh sửa hồ sơ</button>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Thông tin tài khoản</h3>
                        <div class="info-field">
                            <label>TÊN HIỂN THỊ</label>
                            <div class="info-value" id="settingsDisplayNameField">User</div>
                            <button class="btn-edit"><i class="bi bi-pencil"></i></button>
                        </div>
                        <div class="info-field">
                            <label>TÊN NGƯỜI DÙNG</label>
                            <div class="info-value" id="settingsUsernameField">@username</div>
                            <button class="btn-edit"><i class="bi bi-pencil"></i></button>
                        </div>
                        <div class="info-field">
                            <label>EMAIL</label>
                            <div class="info-value masked" id="settingsEmailField">u***@example.com</div>
                            <button class="btn-edit"><i class="bi bi-pencil"></i></button>
                        </div>
                        <div class="info-field">
                            <label>SỐ ĐIỆN THOẠI</label>
                            <div class="info-value" id="settingsPhoneField">Chưa thêm</div>
                            <button class="btn-edit"><i class="bi bi-plus"></i></button>
                        </div>
                    </div>
                    <div class="settings-section danger-zone">
                        <h3>Vùng nguy hiểm</h3>
                        <div class="danger-actions">
                            <button class="btn-danger-outline" id="changePasswordBtn">
                                <i class="bi bi-key"></i> Đổi mật khẩu
                            </button>
                            <button class="btn-danger" id="deleteAccountBtn">
                                <i class="bi bi-trash"></i> Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Voice & Video Tab -->
                <div class="settings-tab" data-tab="voice">
                    <div class="settings-section">
                        <h3>Cài đặt giọng nói</h3>
                        <div class="form-group">
                            <label>THIẾT BỊ NHẬP</label>
                            <select class="discord-select" id="inputDeviceSelect">
                                <option value="default">Mặc định</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ÂM LƯỢNG NHẬP</label>
                            <input type="range" class="discord-range" id="inputVolume" min="0" max="100" value="100">
                        </div>
                        <div class="form-group">
                            <label>THIẾT BỊ XUẤT</label>
                            <select class="discord-select" id="outputDeviceSelect">
                                <option value="default">Mặc định</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ÂM LƯỢNG XUẤT</label>
                            <input type="range" class="discord-range" id="outputVolume" min="0" max="200" value="100">
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Chế độ nhập liệu</h3>
                        <div class="radio-group">
                            <label class="radio-option active">
                                <input type="radio" name="inputMode" value="voiceActivity" checked>
                                <span class="radio-label">Hoạt động giọng nói</span>
                                <span class="radio-desc">Tự động truyền khi nói</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="inputMode" value="pushToTalk">
                                <span class="radio-label">Nhấn để nói</span>
                                <span class="radio-desc">Giữ phím để truyền</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Other tabs will be loaded dynamically -->
                <div class="settings-tab" data-tab="profile">
                    <div class="settings-section">
                        <h3>Hồ sơ</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
                <div class="settings-tab" data-tab="privacy">
                    <div class="settings-section">
                        <h3>Quyền riêng tư & An toàn</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
                <div class="settings-tab" data-tab="devices">
                    <div class="settings-section">
                        <h3>Thiết bị đã đăng nhập</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
                <div class="settings-tab" data-tab="connections">
                    <div class="settings-section">
                        <h3>Kết nối</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
                <div class="settings-tab" data-tab="appearance">
                    <div class="settings-section">
                        <h3>Giao diện</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
                <div class="settings-tab" data-tab="accessibility">
                    <div class="settings-section">
                        <h3>Trợ năng</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
                <div class="settings-tab" data-tab="notifications">
                    <div class="settings-section">
                        <h3>Thông báo</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
                <div class="settings-tab" data-tab="keybinds">
                    <div class="settings-section">
                        <h3>Phím tắt</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
                <div class="settings-tab" data-tab="language">
                    <div class="settings-section">
                        <h3>Ngôn ngữ</h3>
                        <p class="text-muted">Tính năng đang phát triển...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Invite Friends Modal -->
<div class="modal-overlay" id="inviteFriendsModal" style="display:none;">
    <div class="modal-content modal-invite-friends">
        <button class="modal-close" id="closeInviteFriendsModal">&times;</button>
        
        <div class="modal-header-left">
            <h2>Mời bạn bè vào <span id="inviteServerName">Máy chủ</span></h2>
        </div>
        
        <div class="modal-body">
            <!-- Search Bar -->
            <div class="invite-search-wrapper">
                <i class="bi bi-search"></i>
                <input type="text" id="inviteFriendSearch" placeholder="Tìm kiếm bạn bè" autocomplete="off" />
            </div>
            
            <!-- Friends List -->
            <div class="invite-friends-list" id="inviteFriendsList">
                <!-- Dynamic friend rows will be rendered here -->
                <div class="invite-friend-row">
                    <div class="invite-friend-avatar">
                        <img src="" alt="">
                        <span class="status-dot online"></span>
                    </div>
                    <span class="invite-friend-name">Đang tải...</span>
                    <button class="btn-invite" disabled>Mời</button>
                </div>
            </div>
            
            <!-- Invite Link Section -->
            <div class="invite-link-section">
                <label class="invite-link-label">HOẶC, GỬI LINK MỜI TỚI BẠN BÈ</label>
                <div class="invite-link-wrapper">
                    <input type="text" id="inviteLinkInput" readonly value="" />
                    <button class="btn-copy" id="copyInviteLinkBtn">Sao chép</button>
                </div>
                <a href="#" class="edit-invite-link" id="editInviteLinkBtn">Chỉnh sửa link mời</a>
            </div>
        </div>
    </div>
</div>

<!-- PeerJS for WebRTC Voice Chat -->
<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>

<script defer src="${pageContext.request.contextPath}/js/server-sidebar.js"></script>
<script defer src="${pageContext.request.contextPath}/js/chat.js"></script>
</body>
</html>
