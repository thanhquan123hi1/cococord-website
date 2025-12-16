<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>Bạn bè - CoCoCord</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/friends.css">
</head>
<body>
<div class="discord-app" id="friendsApp">
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

<script defer src="${pageContext.request.contextPath}/js/friends.js"></script>
</body>
</html>
