<%@ page contentType="text/html;charset=UTF-8" language="java" %>

    <head>
        <title>Tin nhắn trực tiếp - CoCoCord</title>
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/messages.css?v=20260106b">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/markdown.css">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/css/message-actions.css?v=20260107a">
    </head>

    <div class="discord-app" id="dmApp">

        <!-- DM Sidebar -->
        <aside class="dm-sidebar">
            <nav class="nav-menu" aria-label="Menu">
                <a class="nav-item" href="${pageContext.request.contextPath}/app"><i class="bi bi-people-fill"></i> Bạn
                    bè</a>
            </nav>

            <div class="section-header">TIN NHẮN TRỰC TIẾP <button class="section-add" type="button" title="Tạo DM"><i
                        class="bi bi-plus"></i></button></div>
            <div class="dm-list" id="dmList" role="list"></div>

        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="main-header">
                <div class="header-left">
                    <i class="bi bi-at" style="font-size: 20px; color: var(--channel-icon); margin-right: 8px;"></i>
                    <span class="header-title" id="dmTitle">Tin nhắn trực tiếp</span>
                    <span class="header-status" id="headerStatus"></span>
                </div>
                <div class="header-right">
                    <button class="icon-btn" type="button" id="dmVoiceCallBtn" title="Gọi thoại"><i
                            class="bi bi-telephone"></i></button>
                    <button class="icon-btn" type="button" id="dmVideoCallBtn" title="Gọi video"><i
                            class="bi bi-camera-video"></i></button>
                    <button class="icon-btn" type="button" title="Ghim tin nhắn"><i class="bi bi-pin"></i></button>
                    <button class="icon-btn" type="button" title="Thêm bạn bè vào DM"><i
                            class="bi bi-person-plus"></i></button>
                    <div class="header-search">
                        <input type="text" placeholder="Tìm kiếm" id="messageSearch" />
                        <i class="bi bi-search"></i>
                    </div>
                    <button class="icon-btn inbox-btn" type="button" title="Hộp thư"><i
                            class="bi bi-inbox"></i></button>
                    <button class="icon-btn" type="button" title="Trợ giúp"><i
                            class="bi bi-question-circle"></i></button>
                </div>
            </header>

            <section class="messages-area" id="messagesArea">
                <div class="empty-state" id="emptyState">
                    <div class="empty-state-icon"><i class="bi bi-chat-left-text"></i></div>
                    <div class="empty-state-title">Chọn một cuộc trò chuyện</div>
                    <div class="empty-state-text">Chọn một bạn bè từ danh sách bên trái để bắt đầu nhắn tin.</div>
                </div>

                <!-- DM Header when conversation is active -->
                <div class="dm-start" id="dmStart" style="display: none;">
                    <div class="dm-start-avatar" id="dmStartAvatar"></div>
                    <h3 class="dm-start-name" id="dmStartName"></h3>
                    <p class="dm-start-info" id="dmStartInfo">Đây là khởi đầu cuộc trò chuyện của bạn.</p>
                </div>

                <div class="messages-list" id="messagesList"></div>
            </section>

            <div class="chat-input-area">
                <div id="composer" class="chat-composer">
                    <div class="composer-box">
                        <button type="button" id="attachBtn" class="composer-btn" title="Đính kèm file">
                            <i class="bi bi-plus-circle-fill"></i>
                        </button>

                        <div class="input-wrapper">
                            <textarea id="messageInput" placeholder="Nhắn tin..." rows="1"></textarea>
                        </div>

                        <div class="composer-tools">
                            <button type="button" id="gifBtn" class="composer-btn"><i
                                    class="bi bi-filetype-gif"></i></button>
                            <button type="button" id="stickerBtn" class="composer-btn"><i
                                    class="bi bi-stickies-fill"></i></button>
                            <button type="button" id="emojiBtn" class="composer-btn"><i
                                    class="bi bi-emoji-smile-fill"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <script src="${pageContext.request.contextPath}/js/markdown-renderer.js"></script>
            <script src="${pageContext.request.contextPath}/js/chat-input-manager.js"></script>
        </main>

        <!-- User Profile Panel (right sidebar) -->
        <aside class="profile-panel" id="profilePanel" style="display: none;">
            <div class="profile-banner" id="profileBanner"></div>
            <div class="profile-header">
                <div class="profile-avatar" id="profileAvatar"></div>
                <h2 class="profile-name" id="profileName"></h2>
                <div class="profile-username" id="profileUsername"></div>
            </div>
            <div class="profile-body">
                <div class="profile-section">
                    <h3>VỀ TÔI</h3>
                    <p id="profileBio"></p>
                </div>
                <div class="profile-section">
                    <h3>THÀNH VIÊN DISCORD TỪ</h3>
                    <p id="profileJoined"></p>
                </div>
                <div class="profile-section">
                    <h3>GHI CHÚ</h3>
                    <textarea class="profile-note" placeholder="Click để thêm ghi chú"></textarea>
                </div>
            </div>
        </aside>
    </div>

    <!-- DM Call Overlay (Voice/Video) -->
    <div class="dm-call-overlay" id="dmCallOverlay" style="display:none;" aria-hidden="true">
        <div class="dm-call-surface">
            <div class="dm-call-header">
                <div class="dm-call-title" id="dmCallTitle">Call</div>
                <button class="icon-btn" type="button" id="dmCallHangupBtn" title="Kết thúc cuộc gọi">
                    <i class="bi bi-telephone-x"></i>
                </button>
            </div>

            <div class="dm-call-body">
                <video class="dm-call-remote" id="dmCallRemoteVideo" autoplay playsinline></video>
                <video class="dm-call-local" id="dmCallLocalVideo" autoplay playsinline muted></video>
                <audio id="dmCallRemoteAudio" autoplay></audio>
            </div>
        </div>
    </div>

    <!-- User Settings Dropdown -->
    <div class="settings-dropdown" id="settingsDropdown" style="display:none;">
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
                    <p>Máy chủ của bạn là nơi bạn và bạn bè có thể đi chơi cùng nhau. Hãy tạo máy chủ của bạn và bắt đầu
                        nói chuyện.</p>
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
                    <p class="form-hint">Bằng việc tạo máy chủ, bạn đồng ý với <a href="#">Nguyên tắc cộng đồng</a> của
                        CoCoCord.</p>
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
                                <span class="channel-type-desc">Gửi tin nhắn, hình ảnh, GIF, emoji, ý kiến và trò
                                    đùa</span>
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
                                <span class="channel-type-desc">Trò chuyện cùng nhau bằng giọng nói, video và chia sẻ
                                    màn hình</span>
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
                            <span class="private-channel-desc">Chỉ thành viên và vai trò được chọn mới có thể xem kênh
                                này.</span>
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

    <!-- Markdown & Syntax Highlighting Libraries -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css"
        integrity="sha512-IHD9jLLUjCx53TLIPc/t0vCJJH/FH8SFzUxjUJv/+R+qEd8WTF/OXI0yfnkQa0OgFQY9bJQIYqHuN0o9W1/5Ng=="
        crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/11.2.0/marked.min.js"
        integrity="sha512-eUxlZzJK5H7MjNWdmLRZR2YqzEoJPjNnYfSCW+r7L7R2FYvZ0nZjGDr0JdGX2+BxQZ6k7xzJxT4ZBaHnmNIQzg=="
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"
        integrity="sha512-H8S3B7t4vTnfg1IXSvWXGMxvYlSLXr7IzaSwG3Prd/aCQjqnPxCYXWP5KgRpMW/JFY48Gn3S1X1vR2UkuB+kJQ=="
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="${pageContext.request.contextPath}/js/markdown-renderer.js?v=20260104"></script>
    <script defer src="${pageContext.request.contextPath}/js/messages.js?v=20260106d"></script>