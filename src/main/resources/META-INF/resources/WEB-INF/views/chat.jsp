<%@ page contentType="text/html;charset=UTF-8" language="java" %> <%-- Chat Page
- Được wrap bởi app.jsp decorator (SiteMesh) Server List Panel đã có sẵn trong
decorator, chỉ cần Channel Sidebar + Main Content + Members Sidebar --%>
<head>
  <title>Trò chuyện - CoCoCord</title>
  <link
    rel="stylesheet"
    href="${pageContext.request.contextPath}/css/channel-panel.css"
    data-cococord-page-style="1"
  />
  <link
    rel="stylesheet"
    href="${pageContext.request.contextPath}/css/chat.css"
    data-cococord-page-style="1"
  />
  <link
    rel="stylesheet"
    href="${pageContext.request.contextPath}/css/voice-channel.css"
    data-cococord-page-style="1"
  />
</head>

<div class="chat-page-container" id="chatApp">
  <!-- Channel Sidebar -->
  <aside class="channel-sidebar" aria-label="Channels">
    <div class="channel-header" id="serverHeader">
      <h5 id="serverName">Chọn một server</h5>
      <i class="bi bi-chevron-down" id="serverMenuToggle"></i>
    </div>

    <!-- Server Dropdown Menu -->
    <div class="server-dropdown" id="serverDropdown" style="display: none">
      <div class="dropdown-item" id="invitePeopleBtn">
        <i class="bi bi-person-plus"></i> Mời mọi người
      </div>
      <div class="dropdown-item" id="serverSettingsBtn">
        <i class="bi bi-gear"></i> Cài đặt Server
      </div>
      <div class="dropdown-item" id="createChannelBtn">
        <i class="bi bi-hash"></i> Tạo Kênh
      </div>
      <div class="dropdown-item" id="createCategoryBtn">
        <i class="bi bi-folder-plus"></i> Tạo Danh mục
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item text-danger" id="leaveServerBtn">
        <i class="bi bi-box-arrow-left"></i> Rời Server
      </div>
    </div>

    <!-- Scrollable Channel List -->
    <div class="channel-list-wrapper">
      <div class="channel-list" id="channelList">
        <!-- Channel categories and items will be rendered here -->
      </div>
    </div>

    <!-- Voice Connected Bar (shown when in voice channel) -->
    <div class="voice-connected-bar" id="voiceConnectedBar">
      <div class="voice-connected-info">
        <div class="voice-connected-status">
          <div class="voice-connected-label">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 1.5C6.753 1.5 2.5 5.753 2.5 11c0 2.243.79 4.303 2.1 5.922L3.5 21.5l5.025-1.587C9.628 20.43 10.782 20.5 12 20.5c5.247 0 9.5-4.253 9.5-9.5S17.247 1.5 12 1.5z"
              />
            </svg>
            Đã Kết Nối Giọng Nói
          </div>
          <div class="voice-connected-channel">
            <span id="voiceChannelName">Kênh thoại</span> /
            <span id="voiceServerName">Máy chủ</span>
          </div>
        </div>
        <div class="voice-signal-bars">
          <span></span><span></span><span></span>
        </div>
        <button
          class="voice-disconnect-btn"
          id="voiceBarDisconnect"
          title="Ngắt kết nối"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"
            />
          </svg>
        </button>
      </div>
      <div class="voice-controls">
        <button class="voice-control-btn" id="voiceBarMute" title="Tắt tiếng">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
            />
          </svg>
        </button>
        <button class="voice-control-btn" id="voiceBarDeafen" title="Tắt nghe">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"
            />
          </svg>
        </button>
        <button class="voice-control-btn" id="voiceBarSettings" title="Cài đặt">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            />
          </svg>
        </button>
      </div>
    </div>
  </aside>

  <!-- Draggable divider (Channel List resize) -->
  <div
    class="channel-resizer"
    id="channelResizer"
    role="separator"
    aria-orientation="vertical"
    aria-label="Resize channel list"
  ></div>

  <!-- Main Content -->
  <main class="main-content" aria-label="Chat">
    <!-- Text Channel View -->
    <div class="text-channel-view" id="textChannelView">
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
          <button
            class="header-btn active"
            id="membersToggleBtn"
            title="Hiện/Ẩn danh sách thành viên"
          >
            <i class="bi bi-people"></i>
          </button>
          <div class="header-search">
            <i class="bi bi-search"></i>
            <input type="text" placeholder="Tìm kiếm" id="chatSearchInput" />
          </div>
          <button
            class="header-btn inbox-btn"
            id="inboxBtn"
            title="Hộp thư đến"
          >
            <i class="bi bi-inbox"></i>
          </button>
          <button class="header-btn" id="helpBtn" title="Trợ giúp">
            <i class="bi bi-question-circle"></i>
          </button>
        </div>
      </header>

      <div class="content-body" id="messageList" aria-label="Messages">
        <div class="welcome-message" id="chatEmpty">
          <!-- Server onboarding (shown for new servers / empty default channel) -->
          <div
            class="server-onboarding"
            id="serverOnboardingState"
            style="display: none"
          >
            <h2 class="server-onboarding-title">
              Chào mừng đến với<br /><span id="welcomeServerName"
                >Máy chủ của bạn</span
              >
            </h2>
            <p class="server-onboarding-subtitle">
              Đây là máy chủ mới toanh của bạn. Sau đây là một vài bước để giúp
              bạn làm quen! Để tìm hiểu thêm, vui lòng tìm đọc
              <a
                href="#"
                class="server-onboarding-link"
                id="onboardingGettingStartedLink"
                >hướng dẫn Bắt Đầu.</a
              >
            </p>
            <div
              class="server-onboarding-actions"
              role="list"
              aria-label="Onboarding actions"
            >
              <button
                type="button"
                class="server-onboarding-action"
                id="onboardingInviteBtn"
              >
                <span class="action-left">
                  <span class="action-icon" aria-hidden="true"
                    ><i class="bi bi-person-plus"></i
                  ></span>
                  <span class="action-text">Mời bạn bè của bạn</span>
                </span>
                <i class="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="server-onboarding-action"
                id="onboardingPersonalizeBtn"
              >
                <span class="action-left">
                  <span class="action-icon" aria-hidden="true"
                    ><i class="bi bi-brush"></i
                  ></span>
                  <span class="action-text"
                    >Cá nhân hóa máy chủ bằng một biểu tượng</span
                  >
                </span>
                <i class="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="server-onboarding-action"
                id="onboardingFirstMessageBtn"
              >
                <span class="action-left">
                  <span class="action-icon" aria-hidden="true"
                    ><i class="bi bi-send"></i
                  ></span>
                  <span class="action-text">Gửi tin nhắn đầu tiên</span>
                </span>
                <i class="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="server-onboarding-action"
                id="onboardingDownloadBtn"
                aria-disabled="true"
              >
                <span class="action-left">
                  <span class="action-icon" aria-hidden="true"
                    ><i class="bi bi-download"></i
                  ></span>
                  <span class="action-text">Tải xuống Ứng Dụng Discord</span>
                </span>
                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="server-onboarding-action"
                id="onboardingAddAppBtn"
              >
                <span class="action-left">
                  <span class="action-icon" aria-hidden="true"
                    ><i class="bi bi-controller"></i
                  ></span>
                  <span class="action-text"
                    >Thêm ứng dụng đầu tiên của bạn</span
                  >
                </span>
                <i class="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <!-- Channel empty state (fallback for empty channels) -->
          <div class="channel-empty" id="channelEmptyState">
            <div class="welcome-icon">
              <i class="bi bi-hash"></i>
            </div>
            <h2>
              Chào mừng đến với <span id="welcomeChannelName">#kênh</span>!
            </h2>
            <p class="text-normal">
              Đây là khởi đầu của kênh này. Gửi tin nhắn để bắt đầu cuộc trò
              chuyện!
            </p>
          </div>
        </div>
      </div>

      <form
        class="chat-composer"
        id="chatComposer"
        autocomplete="off"
        style="display: none"
      >
        <div class="composer-attachments">
          <button
            type="button"
            class="composer-btn"
            id="attachBtn"
            title="Đính kèm file"
          >
            <i class="bi bi-plus-circle"></i>
          </button>
        </div>
        <div class="composer-box">
          <input
            class="composer-input"
            id="chatInput"
            type="text"
            placeholder="Nhắn tin vào #kênh"
          />
          <div class="composer-tools">
            <button type="button" class="composer-btn" id="gifBtn" title="GIF">
              <i class="bi bi-filetype-gif"></i>
            </button>
            <button
              type="button"
              class="composer-btn"
              id="stickerBtn"
              title="Sticker"
            >
              <i class="bi bi-stickies"></i>
            </button>
            <button
              type="button"
              class="composer-btn"
              id="emojiBtn"
              title="Emoji"
            >
              <i class="bi bi-emoji-smile"></i>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Voice Channel View (Hidden by default) -->
    <div class="voice-channel-view" id="voiceChannelView">
      <div class="voice-participants-area">
        <div
          class="voice-participants-grid"
          id="voiceParticipantsGrid"
          data-count="0"
        >
          <!-- Participant tiles will be rendered here -->
        </div>
      </div>

      <!-- Voice Bottom Controls -->
      <div class="voice-bottom-controls">
        <button
          class="voice-btn voice-btn-mute"
          id="voiceBtnMute"
          title="Bật/Tắt mic"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path
              d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
            />
          </svg>
        </button>
        <button
          class="voice-btn voice-btn-deafen"
          id="voiceBtnDeafen"
          title="Bật/Tắt headphone (deafen)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path
              d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"
            />
          </svg>
        </button>
        <button
          class="voice-btn voice-btn-camera"
          id="voiceBtnCamera"
          title="Bật/Tắt camera"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path
              d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"
            />
          </svg>
        </button>
        <button
          class="voice-btn voice-btn-screen"
          id="voiceBtnScreen"
          title="Chia sẻ màn hình"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path
              d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"
            />
          </svg>
        </button>
        <button
          class="voice-btn voice-btn-disconnect"
          id="voiceBtnDisconnect"
          title="Rời kênh thoại"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path
              d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"
            />
          </svg>
        </button>
      </div>
    </div>
  </main>

  <!-- Members Sidebar -->
  <aside class="members-sidebar" id="membersSidebar" aria-label="Members">
    <div class="members-section">
      <div class="members-category" id="onlineMembersSection">
        <span class="category-title"
          >TRỰC TUYẾN — <span id="onlineCount">0</span></span
        >
        <div class="members-list" id="onlineMembersList"></div>
      </div>
      <div class="members-category" id="offlineMembersSection">
        <span class="category-title"
          >NGOẠI TUYẾN — <span id="offlineCount">0</span></span
        >
        <div class="members-list" id="offlineMembersList"></div>
      </div>
    </div>
  </aside>
</div>

<!-- Create Server Modal -->
<div class="modal-overlay" id="createServerModal" style="display: none">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Tạo Server của bạn</h3>
      <button class="modal-close" id="closeCreateServerModal">&times;</button>
    </div>
    <div class="modal-body">
      <p class="modal-desc">
        Server của bạn là nơi để bạn và bạn bè giao lưu. Hãy tạo server và bắt
        đầu trò chuyện.
      </p>
      <div class="form-group">
        <label for="serverNameInput">TÊN SERVER</label>
        <input
          type="text"
          id="serverNameInput"
          class="discord-input"
          placeholder="Server của bạn"
        />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" id="cancelCreateServer">Hủy</button>
      <button class="btn-primary" id="confirmCreateServer">Tạo</button>
    </div>
  </div>
</div>

<!-- Create Channel Modal -->
<div class="modal-overlay" id="createChannelModal" style="display: none">
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
          <input
            type="text"
            id="channelNameInput"
            class="discord-input"
            placeholder="kênh-mới"
          />
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
<div class="modal-overlay" id="createCategoryModal" style="display: none">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Tạo Danh mục</h3>
      <button class="modal-close" id="closeCreateCategoryModal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label for="categoryNameInput">TÊN DANH MỤC</label>
        <input
          type="text"
          id="categoryNameInput"
          class="discord-input"
          placeholder="Danh mục mới"
        />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" id="cancelCreateCategory">Hủy</button>
      <button class="btn-primary" id="confirmCreateCategory">
        Tạo Danh mục
      </button>
    </div>
  </div>
</div>

<!-- User Settings Dropdown -->
<div
  class="user-settings-dropdown"
  id="userSettingsDropdown"
  style="display: none"
>
  <a href="${pageContext.request.contextPath}/sessions" class="dropdown-item"
    ><i class="bi bi-shield-lock"></i> Phiên đăng nhập</a
  >
  <a
    href="${pageContext.request.contextPath}/change-password"
    class="dropdown-item"
    ><i class="bi bi-key"></i> Đổi mật khẩu</a
  >
  <div class="dropdown-divider"></div>
  <div class="dropdown-item text-danger" id="logoutBtn">
    <i class="bi bi-box-arrow-right"></i> Đăng xuất
  </div>
</div>

<!-- Invite Friends Modal -->
<div class="modal-overlay" id="inviteFriendsModal" style="display: none">
  <div class="modal-content modal-invite-friends">
    <button class="modal-close" id="closeInviteFriendsModal">&times;</button>

    <div class="modal-header-left">
      <h2>Mời bạn bè vào <span id="inviteServerName">Máy chủ</span></h2>
    </div>

    <div class="modal-body">
      <!-- Search Bar -->
      <div class="invite-search-wrapper">
        <i class="bi bi-search"></i>
        <input
          type="text"
          id="inviteFriendSearch"
          placeholder="Tìm kiếm bạn bè"
          autocomplete="off"
        />
      </div>

      <!-- Friends List -->
      <div class="invite-friends-list" id="inviteFriendsList">
        <!-- Dynamic friend rows will be rendered here -->
        <div class="invite-friend-row">
          <div class="invite-friend-avatar">
            <img src="" alt="" />
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
        <a href="#" class="edit-invite-link" id="editInviteLinkBtn"
          >Chỉnh sửa link mời</a
        >
      </div>
    </div>
  </div>
</div>

<!-- PeerJS for WebRTC Voice Chat -->
<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
<script src="${pageContext.request.contextPath}/js/auth.js?v=20260101"></script>
<script src="${pageContext.request.contextPath}/js/voice-manager.js?v=20260102b"></script>
<script src="${pageContext.request.contextPath}/js/chat.js?v=20260103a"></script>
