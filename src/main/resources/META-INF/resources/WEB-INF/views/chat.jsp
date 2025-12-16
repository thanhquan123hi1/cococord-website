<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Trò chuyện - CoCoCord</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/chat.css">
</head>
<body>
<div class="app-container" id="chatApp">
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
            <div class="dropdown-divider"></div>
            <div class="dropdown-item text-danger" id="leaveServerBtn"><i class="bi bi-box-arrow-left"></i> Rời Server</div>
        </div>

        <!-- Scrollable Channel List -->
        <div class="channel-list-wrapper">
            <div class="channel-list" id="channelList">
                <!-- Channel categories and items will be rendered here -->
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

<!-- User Settings Dropdown -->
<div class="user-settings-dropdown" id="userSettingsDropdown" style="display:none;">
    <a href="${pageContext.request.contextPath}/profile" class="dropdown-item"><i class="bi bi-person"></i> Hồ sơ</a>
    <a href="${pageContext.request.contextPath}/sessions" class="dropdown-item"><i class="bi bi-shield-lock"></i> Phiên đăng nhập</a>
    <a href="${pageContext.request.contextPath}/change-password" class="dropdown-item"><i class="bi bi-key"></i> Đổi mật khẩu</a>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item text-danger" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Đăng xuất</div>
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

<script defer src="${pageContext.request.contextPath}/js/chat.js"></script>
</body>
</html>
