<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Bạn bè - CoCoCord</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/server-sidebar.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/channel-panel.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/friends.css">
</head>
<body>
<div class="discord-app" id="friendsApp">
    <!-- Server Sidebar (72px) -->
    <aside class="server-sidebar" id="serverSidebar">
        <div class="server-list-wrapper">
            <div class="server-list" id="serverList">
                <!-- Home Button (Discord logo) -->
                <a class="server-item home-btn active" href="${pageContext.request.contextPath}/friends" title="Tin nhắn trực tiếp" data-tooltip="Tin nhắn trực tiếp">
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

    <!-- DM Sidebar -->
    <aside class="dm-sidebar">
        <div class="sidebar-search">
            <input id="globalSearch" class="search-input" type="text" placeholder="Tìm hoặc bắt đầu cuộc trò chuyện" autocomplete="off" />
        </div>

        <nav class="sidebar-nav">
            <a class="nav-item active" href="${pageContext.request.contextPath}/friends" data-menu="friends">
                <i class="bi bi-people-fill"></i>
                <span>Bạn bè</span>
            </a>
        </nav>

        <div class="sidebar-section">
            <span class="section-title">TIN NHẮN TRỰC TIẾP</span>
            <button class="section-action" title="Tạo DM"><i class="bi bi-plus"></i></button>
        </div>
        <div class="dm-list" id="dmList" role="list"></div>

        <!-- User Control Panel - Discord Desktop Style -->
        <div class="user-panel" id="userPanel">
            <div class="user-info" id="userInfo">
                <div class="user-avatar" id="ucpAvatar">
                    <span class="status-dot online" id="ucpStatusDot"></span>
                </div>
                <div class="user-meta">
                    <div class="user-name" id="ucpName">User</div>
                    <div class="user-status" id="ucpStatus">Trực tuyến</div>
                </div>
            </div>
            <div class="user-actions">
                <button class="action-btn" type="button" title="Tắt tiếng" id="muteBtn" data-muted="false">
                    <i class="bi bi-mic-fill"></i>
                </button>
                <button class="action-btn" type="button" title="Tắt âm thanh" id="deafenBtn" data-deafened="false">
                    <i class="bi bi-headphones"></i>
                </button>
                <button class="action-btn" type="button" title="Cài đặt người dùng" id="settingsBtn">
                    <i class="bi bi-gear-fill"></i>
                </button>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        <header class="main-header">
            <div class="header-left">
                <i class="bi bi-people-fill"></i>
                <span class="header-title">Bạn bè</span>
                <div class="header-divider"></div>
                <div class="tabs" role="tablist">
                    <button class="tab active" type="button" data-tab="online">Trực tuyến</button>
                    <button class="tab" type="button" data-tab="all">Tất cả</button>
                    <button class="tab" type="button" data-tab="pending">Đang chờ</button>
                    <button class="tab" type="button" data-tab="blocked">Đã chặn</button>
                </div>
                <button class="add-friend-btn" type="button" id="addFriendBtn">Thêm bạn</button>
            </div>
            <div class="header-right">
                <button class="header-action" title="Tạo nhóm DM"><i class="bi bi-chat-dots"></i></button>
                <div class="header-divider"></div>
                <button class="header-action" title="Hộp thư đến"><i class="bi bi-inbox"></i></button>
                <button class="header-action" title="Trợ giúp"><i class="bi bi-question-circle"></i></button>
            </div>
        </header>

        <div class="main-toolbar">
            <input id="friendsSearch" class="search-input" type="text" placeholder="Tìm kiếm" autocomplete="off" />
        </div>

        <!-- Friends list view -->
        <section class="friends-content" id="friendsList"></section>

        <!-- Add Friend view -->
        <section class="add-friend-view" id="addFriendView" style="display:none;">
            <div class="add-friend-header">
                <h3>THÊM BẠN</h3>
                <p>Bạn có thể thêm bạn bè bằng tên người dùng CoCoCord của họ.</p>
            </div>
            <div class="add-friend-input-wrapper">
                <input id="addFriendInput" class="add-friend-input" type="text" placeholder="Bạn có thể thêm bạn bè bằng tên người dùng CoCoCord của họ." autocomplete="off" />
                <button class="send-request-btn" type="button" id="sendFriendRequestBtn">Gửi Yêu Cầu Kết Bạn</button>
            </div>
            <div class="add-friend-hint" id="addFriendHint"></div>
        </section>
    </main>

    <!-- Activity Panel -->
    <aside class="activity-panel">
        <div class="activity-header">Đang Hoạt Động</div>
        <div class="activity-content">
            <div class="activity-empty" id="activityEmpty">
                <div class="empty-title">Hiện tại hơi yên tĩnh</div>
                <div class="empty-desc">Khi bạn bè của bạn bắt đầu một hoạt động — như chơi game hoặc ở trong voice — chúng tôi sẽ hiển thị ở đây!</div>
            </div>
        </div>
    </aside>
</div>

<!-- User Settings Dropdown -->
<div class="settings-dropdown" id="settingsDropdown" style="display:none;">
    <a href="${pageContext.request.contextPath}/profile" class="dropdown-item">
        <i class="bi bi-person"></i>
        <span>Hồ sơ</span>
    </a>
    <a href="${pageContext.request.contextPath}/sessions" class="dropdown-item">
        <i class="bi bi-shield-lock"></i>
        <span>Phiên đăng nhập</span>
    </a>
    <a href="${pageContext.request.contextPath}/change-password" class="dropdown-item">
        <i class="bi bi-key"></i>
        <span>Đổi mật khẩu</span>
    </a>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item logout" id="logoutBtn">
        <i class="bi bi-box-arrow-right"></i>
        <span>Đăng xuất</span>
    </div>
</div>

<!-- Server Context Menu -->
<div class="context-menu" id="serverContextMenu" style="display:none;">
    <div class="context-menu-item" id="ctxJoinServer">
        <i class="bi bi-box-arrow-in-right"></i>
        <span>Tham gia máy chủ</span>
    </div>
    <div class="context-menu-item" id="ctxCreateServer">
        <i class="bi bi-plus-circle"></i>
        <span>Tạo máy chủ</span>
    </div>
</div>

<!-- Create Server Modal - Multi-step Discord Style -->
<div class="modal-overlay" id="createServerModal" style="display:none;">
    <div class="modal-content modal-create-server">
        <button class="modal-close" id="closeCreateServerModal">&times;</button>
        
        <!-- Step 1: Template Selection -->
        <div class="modal-step" id="createServerStep1">
            <div class="modal-header">
                <h2>Tạo máy chủ</h2>
                <p>Máy chủ của bạn là nơi bạn và bạn bè có thể đi chơi cùng nhau. Hãy tạo máy chủ của bạn và bắt đầu nói chuyện.</p>
            </div>
            <div class="modal-body template-list">
                <button class="template-btn" data-template="custom">
                    <div class="template-icon"><i class="bi bi-file-earmark-plus"></i></div>
                    <span>Tạo của riêng tôi</span>
                    <i class="bi bi-chevron-right"></i>
                </button>
                <div class="template-divider">BẮT ĐẦU TỪ MẪU</div>
                <button class="template-btn" data-template="gaming">
                    <div class="template-icon gaming"><i class="bi bi-controller"></i></div>
                    <span>Chơi game</span>
                    <i class="bi bi-chevron-right"></i>
                </button>
                <button class="template-btn" data-template="school">
                    <div class="template-icon school"><i class="bi bi-mortarboard"></i></div>
                    <span>Câu lạc bộ trường học</span>
                    <i class="bi bi-chevron-right"></i>
                </button>
                <button class="template-btn" data-template="study">
                    <div class="template-icon study"><i class="bi bi-book"></i></div>
                    <span>Nhóm học tập</span>
                    <i class="bi bi-chevron-right"></i>
                </button>
                <button class="template-btn" data-template="friends">
                    <div class="template-icon friends"><i class="bi bi-people"></i></div>
                    <span>Bạn bè</span>
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>
            <div class="modal-footer-template">
                <p class="modal-hint">Bạn đã có lời mời rồi?</p>
                <button class="btn-secondary" id="switchToJoinServer">Tham gia máy chủ</button>
            </div>
        </div>
        
        <!-- Step 2: Customization -->
        <div class="modal-step" id="createServerStep2" style="display:none;">
            <div class="modal-header">
                <h2>Tùy chỉnh máy chủ của bạn</h2>
                <p>Tạo cho máy chủ mới của bạn một cái tên và biểu tượng. Bạn luôn có thể thay đổi sau.</p>
            </div>
            <div class="modal-body">
                <div class="server-icon-upload" id="serverIconUpload">
                    <div class="upload-circle" id="uploadCircle">
                        <i class="bi bi-camera-fill"></i>
                        <span>TẢI LÊN</span>
                    </div>
                    <img class="uploaded-icon" id="uploadedIcon" style="display:none;" />
                    <input type="file" id="serverIconInput" accept="image/*" style="display:none;" />
                </div>
                <div class="form-group">
                    <label for="serverNameInput">TÊN MÁY CHỦ</label>
                    <input type="text" id="serverNameInput" placeholder="Máy chủ của bạn" />
                </div>
                <p class="form-hint">Bằng việc tạo máy chủ, bạn đồng ý với <a href="#">Nguyên tắc cộng đồng</a> của CoCoCord.</p>
            </div>
            <div class="modal-footer space-between">
                <button class="btn-back" id="backToStep1">Quay lại</button>
                <button class="btn-primary" id="confirmCreateServer">Tạo</button>
            </div>
        </div>
    </div>
</div>

<!-- Join Server Modal -->
<div class="modal-overlay" id="joinServerModal" style="display:none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Tham gia máy chủ</h2>
            <p>Nhập mã mời bên dưới để tham gia máy chủ hiện có</p>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="inviteCodeInput">LINK MỜI</label>
                <input type="text" id="inviteCodeInput" placeholder="https://cococord.vn/invite/abc123" />
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-cancel" id="cancelJoinServer">Hủy</button>
            <button class="btn-primary" id="confirmJoinServer">Tham gia</button>
        </div>
    </div>
</div>

<!-- Create Channel Modal -->
<div class="modal-overlay" id="createChannelModal" style="display:none;">
    <div class="modal-content modal-create-channel">
        <button class="modal-close" id="closeCreateChannelModal">&times;</button>
        <div class="modal-header-left">
            <h2>Tạo kênh</h2>
            <p id="channelCategoryName">trong Kênh văn bản</p>
        </div>
        
        <div class="modal-body">
            <div class="channel-type-section">
                <label class="section-label">LOẠI KÊNH</label>
                <div class="channel-type-options">
                    <label class="channel-type-option selected" data-type="text">
                        <div class="channel-type-radio">
                            <span class="radio-dot"></span>
                        </div>
                        <div class="channel-type-icon">
                            <i class="bi bi-hash"></i>
                        </div>
                        <div class="channel-type-info">
                            <span class="channel-type-name">Kênh văn bản</span>
                            <span class="channel-type-desc">Gửi tin nhắn, hình ảnh, GIF, emoji, ý kiến và trò đùa</span>
                        </div>
                    </label>
                    <label class="channel-type-option" data-type="voice">
                        <div class="channel-type-radio">
                            <span class="radio-dot"></span>
                        </div>
                        <div class="channel-type-icon">
                            <i class="bi bi-volume-up-fill"></i>
                        </div>
                        <div class="channel-type-info">
                            <span class="channel-type-name">Kênh thoại</span>
                            <span class="channel-type-desc">Trò chuyện cùng nhau bằng giọng nói, video và chia sẻ màn hình</span>
                        </div>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label for="channelNameInput">TÊN KÊNH</label>
                <div class="channel-name-input-wrapper">
                    <i class="bi bi-hash" id="channelNameIcon"></i>
                    <input type="text" id="channelNameInput" placeholder="kênh-mới" />
                </div>
            </div>
            
            <div class="private-channel-section">
                <div class="private-channel-info">
                    <i class="bi bi-lock-fill"></i>
                    <div class="private-channel-text">
                        <span class="private-channel-label">Kênh riêng tư</span>
                        <span class="private-channel-desc">Chỉ thành viên và vai trò được chọn mới có thể xem kênh này.</span>
                    </div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" id="privateChannelToggle" />
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>
        
        <div class="modal-footer space-between">
            <button class="btn-cancel" id="cancelCreateChannel">Hủy</button>
            <button class="btn-primary" id="confirmCreateChannel">Tạo kênh</button>
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

<script defer src="${pageContext.request.contextPath}/js/server-sidebar.js"></script>
<script defer src="${pageContext.request.contextPath}/js/friends.js"></script>
</body>
</html>
