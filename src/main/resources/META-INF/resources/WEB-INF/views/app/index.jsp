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
      <button
        class="section-action"
        type="button"
        title="Tạo DM"
        aria-label="Tạo DM"
      >
        <i class="bi bi-plus"></i>
      </button>
    </div>

    <div
      class="dm-list"
      id="dmList"
      role="list"
      aria-label="Direct Messages"
    >
      <div id="dmListSkeleton" class="skeleton-dm-list">
        <div class="skeleton-dm-item">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-text w-full"></div>
        </div>
        <div class="skeleton-dm-item">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-text w-80"></div>
        </div>
        <div class="skeleton-dm-item">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-text w-60"></div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Draggable divider (Primary Sidebar resize) -->
  <div
    class="primary-sidebar-resizer"
    id="primarySidebarResizer"
    role="separator"
    aria-orientation="vertical"
    aria-label="Resize sidebar"
  ></div>

  <!-- Main Content Area (dynamic) -->
  <main class="main-area" aria-label="Main Content">
    <!-- Top Bar / Header (persistent component; content updated by JS if needed) -->
    <header class="top-bar">
      <div class="top-left">
        <i class="bi bi-people-fill"></i>
        <span class="top-title">Bạn bè</span>
        <div class="top-divider"></div>
        <div class="top-tabs" role="tablist" aria-label="Friends Tabs">
          <button class="tab active" type="button" data-tab="online">
            Trực tuyến
          </button>
          <button class="tab" type="button" data-tab="all">Tất cả</button>
          <button class="tab" type="button" data-tab="pending">
            Đang chờ xử lý
          </button>
          <button class="tab" type="button" data-tab="blocked">Bị chặn</button>
        </div>
        <button class="btn-primary" type="button" id="addFriendBtn">
          Thêm Bạn
        </button>
      </div>
      <div class="top-right">
        <button class="icon-btn inbox-btn" type="button" title="Hộp thư">
          <i class="bi bi-inbox"></i>
        </button>
        <button class="icon-btn" type="button" title="Trợ giúp">
          <i class="bi bi-question-circle"></i>
        </button>
      </div>
    </header>

    <!-- Friends View -->
    <div class="view-content" id="friendsView" data-view="friends">
      <div class="toolbar">
        <div class="search-wrap">
          <i class="bi bi-search"></i>
          <input
            id="friendsSearch"
            class="search-input"
            type="text"
            placeholder="Tìm kiếm"
            autocomplete="off"
          />
        </div>
      </div>

      <section class="content" id="friendsList">
        <div id="friendsListSkeleton" class="skeleton-friends-list">
          <div class="skeleton-friend-item">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex: 1;">
              <div class="skeleton skeleton-text w-60" style="margin-bottom: 4px;"></div>
              <div class="skeleton skeleton-text w-40" style="height: 12px;"></div>
            </div>
          </div>
          <div class="skeleton-friend-item">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex: 1;">
              <div class="skeleton skeleton-text w-80" style="margin-bottom: 4px;"></div>
              <div class="skeleton skeleton-text w-60" style="height: 12px;"></div>
            </div>
          </div>
          <div class="skeleton-friend-item">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex: 1;">
              <div class="skeleton skeleton-text w-full" style="margin-bottom: 4px;"></div>
              <div class="skeleton skeleton-text w-40" style="height: 12px;"></div>
            </div>
          </div>
          <div class="skeleton-friend-item">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex: 1;">
              <div class="skeleton skeleton-text w-60" style="margin-bottom: 4px;"></div>
              <div class="skeleton skeleton-text w-80" style="height: 12px;"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="add-friend" id="addFriendView" style="display: none">
        <div class="add-friend-header">
          <h3>THÊM BẠN</h3>
          <p>Bạn có thể thêm bạn bè bằng tên người dùng CoCoCord của họ.</p>
        </div>
        <div class="add-friend-form">
          <input
            id="addFriendInput"
            class="add-friend-input"
            type="text"
            placeholder="Nhập username hoặc email"
            autocomplete="off"
          />
          <button class="btn-primary" type="button" id="sendFriendRequestBtn">
            Gửi Yêu Cầu Kết Bạn
          </button>
        </div>
        <div class="add-friend-hint" id="addFriendHint"></div>
      </section>
    </div>

    <!-- Nitro View -->
    <div class="view-content" id="nitroView" data-view="nitro" style="display: none">
      <div class="nitro-container">
        <div class="nitro-hero">
          <div class="nitro-hero-bg">
            <div class="nitro-particles">
              <span class="particle"></span>
              <span class="particle"></span>
              <span class="particle"></span>
              <span class="particle"></span>
              <span class="particle"></span>
            </div>
          </div>
          <div class="nitro-hero-content">
            <div class="nitro-logo">
              <i class="bi bi-lightning-charge-fill"></i>
              <span>Nitro</span>
            </div>
            <h1>Mở khóa trải nghiệm CoCoCord tốt hơn</h1>
            <p>Nitro giúp bạn nổi bật với hồ sơ độc đáo, upload file lớn hơn, emoji HD và nhiều hơn nữa!</p>
          </div>
        </div>

        <div class="nitro-plans">
          <div class="nitro-plan nitro-basic">
            <div class="plan-badge">Cơ bản</div>
            <div class="plan-name">Nitro Basic</div>
            <div class="plan-price">
              <span class="price-amount">29.000</span>
              <span class="price-unit">VNĐ/tháng</span>
            </div>
            <ul class="plan-features">
              <li><i class="bi bi-check-lg"></i> Emoji tùy chỉnh ở mọi nơi</li>
              <li><i class="bi bi-check-lg"></i> Upload file 50MB</li>
              <li><i class="bi bi-check-lg"></i> Huy hiệu Nitro</li>
              <li><i class="bi bi-check-lg"></i> Banner hồ sơ tùy chỉnh</li>
            </ul>
            <button class="btn-nitro btn-nitro-basic">Đăng ký</button>
          </div>

          <div class="nitro-plan nitro-full featured">
            <div class="plan-badge">Phổ biến</div>
            <div class="plan-name">Nitro</div>
            <div class="plan-price">
              <span class="price-amount">99.000</span>
              <span class="price-unit">VNĐ/tháng</span>
            </div>
            <ul class="plan-features">
              <li><i class="bi bi-check-lg"></i> Tất cả tính năng Basic</li>
              <li><i class="bi bi-check-lg"></i> Upload file 500MB</li>
              <li><i class="bi bi-check-lg"></i> Stream HD 4K/60fps</li>
              <li><i class="bi bi-check-lg"></i> 2 Server Boost miễn phí</li>
              <li><i class="bi bi-check-lg"></i> Avatar động (GIF)</li>
              <li><i class="bi bi-check-lg"></i> Hiệu ứng hồ sơ</li>
              <li><i class="bi bi-check-lg"></i> Trang trí avatar</li>
            </ul>
            <button class="btn-nitro btn-nitro-full">Đăng ký</button>
          </div>
        </div>

        <div class="nitro-features">
          <h2>Khám phá tính năng Nitro</h2>
          <div class="features-grid">
            <div class="feature-card">
              <i class="bi bi-emoji-smile"></i>
              <h3>Emoji Tùy Chỉnh</h3>
              <p>Sử dụng emoji từ bất kỳ server nào bạn tham gia</p>
            </div>
            <div class="feature-card">
              <i class="bi bi-cloud-upload"></i>
              <h3>Upload Lớn Hơn</h3>
              <p>Chia sẻ file lên đến 500MB với bạn bè</p>
            </div>
            <div class="feature-card">
              <i class="bi bi-camera-video"></i>
              <h3>Stream HD</h3>
              <p>Stream màn hình với chất lượng 4K 60fps</p>
            </div>
            <div class="feature-card">
              <i class="bi bi-person-badge"></i>
              <h3>Hồ Sơ Độc Đáo</h3>
              <p>Avatar động, banner và hiệu ứng hồ sơ</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shop View -->
    <div class="view-content" id="shopView" data-view="shop" style="display: none">
      <div class="shop-container">
        <div class="shop-header">
          <h1><i class="bi bi-bag-fill"></i> Cửa Hàng</h1>
          <p>Trang trí hồ sơ của bạn với các vật phẩm độc quyền</p>
        </div>

        <div class="shop-tabs">
          <button class="shop-tab active" data-shop-tab="decorations">Trang trí Avatar</button>
          <button class="shop-tab" data-shop-tab="effects">Hiệu ứng Hồ sơ</button>
          <button class="shop-tab" data-shop-tab="themes">Chủ đề</button>
        </div>

        <!-- Avatar Decorations -->
        <div class="shop-section" id="shopDecorations" data-shop-content="decorations">
          <h2>Trang trí Avatar</h2>
          <div class="shop-grid">
            <div class="shop-item">
              <div class="item-preview avatar-decoration">
                <div class="decoration-ring cyber"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Cyber Ring</span>
                <span class="item-price"><i class="bi bi-lightning-charge-fill"></i> Nitro</span>
              </div>
            </div>
            <div class="shop-item">
              <div class="item-preview avatar-decoration">
                <div class="decoration-ring flame"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Flame Aura</span>
                <span class="item-price">49.000 VNĐ</span>
              </div>
            </div>
            <div class="shop-item">
              <div class="item-preview avatar-decoration">
                <div class="decoration-ring sakura"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Sakura Petals</span>
                <span class="item-price">39.000 VNĐ</span>
              </div>
            </div>
            <div class="shop-item">
              <div class="item-preview avatar-decoration">
                <div class="decoration-ring galaxy"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Galaxy Swirl</span>
                <span class="item-price">59.000 VNĐ</span>
              </div>
            </div>
            <div class="shop-item">
              <div class="item-preview avatar-decoration">
                <div class="decoration-ring ice"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Ice Crystal</span>
                <span class="item-price">45.000 VNĐ</span>
              </div>
            </div>
            <div class="shop-item">
              <div class="item-preview avatar-decoration">
                <div class="decoration-ring neon"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Neon Glow</span>
                <span class="item-price"><i class="bi bi-lightning-charge-fill"></i> Nitro</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Effects -->
        <div class="shop-section" id="shopEffects" data-shop-content="effects" style="display: none">
          <h2>Hiệu ứng Hồ sơ</h2>
          <div class="shop-grid">
            <div class="shop-item effect-item">
              <div class="item-preview profile-effect">
                <div class="effect-demo sparkle"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Sparkle Burst</span>
                <span class="item-price">79.000 VNĐ</span>
              </div>
            </div>
            <div class="shop-item effect-item">
              <div class="item-preview profile-effect">
                <div class="effect-demo rain"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Digital Rain</span>
                <span class="item-price"><i class="bi bi-lightning-charge-fill"></i> Nitro</span>
              </div>
            </div>
            <div class="shop-item effect-item">
              <div class="item-preview profile-effect">
                <div class="effect-demo hearts"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Floating Hearts</span>
                <span class="item-price">69.000 VNĐ</span>
              </div>
            </div>
            <div class="shop-item effect-item">
              <div class="item-preview profile-effect">
                <div class="effect-demo lightning"></div>
              </div>
              <div class="item-info">
                <span class="item-name">Lightning Storm</span>
                <span class="item-price">89.000 VNĐ</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Themes -->
        <div class="shop-section" id="shopThemes" data-shop-content="themes" style="display: none">
          <h2>Chủ đề</h2>
          <div class="shop-grid themes-grid">
            <div class="shop-item theme-item">
              <div class="item-preview theme-preview midnight"></div>
              <div class="item-info">
                <span class="item-name">Midnight Purple</span>
                <span class="item-price"><i class="bi bi-lightning-charge-fill"></i> Nitro</span>
              </div>
            </div>
            <div class="shop-item theme-item">
              <div class="item-preview theme-preview sunset"></div>
              <div class="item-info">
                <span class="item-name">Sunset Orange</span>
                <span class="item-price">59.000 VNĐ</span>
              </div>
            </div>
            <div class="shop-item theme-item">
              <div class="item-preview theme-preview ocean"></div>
              <div class="item-info">
                <span class="item-name">Ocean Blue</span>
                <span class="item-price">59.000 VNĐ</span>
              </div>
            </div>
            <div class="shop-item theme-item">
              <div class="item-preview theme-preview forest"></div>
              <div class="item-info">
                <span class="item-name">Forest Green</span>
                <span class="item-price">59.000 VNĐ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quests View -->
    <div class="view-content" id="questsView" data-view="quests" style="display: none">
      <div class="quests-container">
        <div class="quests-header">
          <h1><i class="bi bi-compass-fill"></i> Nhiệm vụ</h1>
          <p>Hoàn thành nhiệm vụ để nhận phần thưởng độc quyền</p>
        </div>

        <div class="quests-stats">
          <div class="stat-card">
            <i class="bi bi-trophy-fill"></i>
            <div class="stat-info">
              <span class="stat-value" id="completedQuests">0</span>
              <span class="stat-label">Đã hoàn thành</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="bi bi-lightning-charge-fill"></i>
            <div class="stat-info">
              <span class="stat-value" id="activeQuests">3</span>
              <span class="stat-label">Đang thực hiện</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="bi bi-gem"></i>
            <div class="stat-info">
              <span class="stat-value" id="totalRewards">0</span>
              <span class="stat-label">Phần thưởng</span>
            </div>
          </div>
        </div>

        <div class="quests-list">
          <h2>Nhiệm vụ đang hoạt động</h2>
          
          <div class="quest-card" data-quest-id="1">
            <div class="quest-game-icon">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect fill='%23ff6b35' width='24' height='24' rx='4'/%3E%3Cpath fill='white' d='M12 6L6 18h12z'/%3E%3C/svg%3E" alt="Game">
            </div>
            <div class="quest-info">
              <div class="quest-header">
                <h3>Chơi Valorant 15 phút</h3>
                <span class="quest-reward"><i class="bi bi-gift"></i> Avatar Decoration</span>
              </div>
              <p class="quest-description">Chơi bất kỳ chế độ nào trong Valorant trong 15 phút</p>
              <div class="quest-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 60%"></div>
                </div>
                <span class="progress-text">9/15 phút</span>
              </div>
              <div class="quest-meta">
                <span class="quest-time"><i class="bi bi-clock"></i> Còn 2 ngày</span>
                <span class="quest-sponsor">Tài trợ bởi Riot Games</span>
              </div>
            </div>
          </div>

          <div class="quest-card" data-quest-id="2">
            <div class="quest-game-icon">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect fill='%2300d4aa' width='24' height='24' rx='4'/%3E%3Ccircle fill='white' cx='12' cy='12' r='6'/%3E%3C/svg%3E" alt="Game">
            </div>
            <div class="quest-info">
              <div class="quest-header">
                <h3>Stream 30 phút trên CoCoCord</h3>
                <span class="quest-reward"><i class="bi bi-gift"></i> 1 tháng Nitro Basic</span>
              </div>
              <p class="quest-description">Stream bất kỳ game nào cho bạn bè xem trong 30 phút</p>
              <div class="quest-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 33%"></div>
                </div>
                <span class="progress-text">10/30 phút</span>
              </div>
              <div class="quest-meta">
                <span class="quest-time"><i class="bi bi-clock"></i> Còn 5 ngày</span>
                <span class="quest-sponsor">CoCoCord Quest</span>
              </div>
            </div>
          </div>

          <div class="quest-card" data-quest-id="3">
            <div class="quest-game-icon">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect fill='%23845ef7' width='24' height='24' rx='4'/%3E%3Cpath fill='white' d='M8 8h8v8H8z'/%3E%3C/svg%3E" alt="Game">
            </div>
            <div class="quest-info">
              <div class="quest-header">
                <h3>Hoàn thành 3 ván Fortnite</h3>
                <span class="quest-reward"><i class="bi bi-gift"></i> Profile Effect</span>
              </div>
              <p class="quest-description">Chơi và hoàn thành 3 ván Battle Royale trong Fortnite</p>
              <div class="quest-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 0%"></div>
                </div>
                <span class="progress-text">0/3 ván</span>
              </div>
              <div class="quest-meta">
                <span class="quest-time"><i class="bi bi-clock"></i> Còn 7 ngày</span>
                <span class="quest-sponsor">Tài trợ bởi Epic Games</span>
              </div>
            </div>
          </div>

          <div class="quest-card completed" data-quest-id="4">
            <div class="quest-game-icon">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect fill='%2340c057' width='24' height='24' rx='4'/%3E%3Cpath fill='white' d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z'/%3E%3C/svg%3E" alt="Completed">
            </div>
            <div class="quest-info">
              <div class="quest-header">
                <h3>Gửi 50 tin nhắn</h3>
                <span class="quest-reward claimed"><i class="bi bi-check-circle"></i> Đã nhận</span>
              </div>
              <p class="quest-description">Gửi 50 tin nhắn trong bất kỳ server nào</p>
              <div class="quest-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 100%"></div>
                </div>
                <span class="progress-text">50/50 tin nhắn</span>
              </div>
              <div class="quest-meta">
                <span class="quest-completed"><i class="bi bi-check-circle-fill"></i> Hoàn thành</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- DM Chat View (hidden by default, shown when clicking a DM) -->
  <main class="dm-chat-area" id="dmChatArea" style="display: none">
    <header class="dm-chat-header">
      <div class="header-left">
        <button
          class="icon-btn"
          type="button"
          id="closeDmChatBtn"
          title="Quay lại"
        >
          <i class="bi bi-arrow-left"></i>
        </button>
        <i
          class="bi bi-at"
          style="font-size: 20px; color: var(--text-muted); margin-right: 8px"
        ></i>
        <span class="header-title" id="dmChatTitle">User</span>
      </div>
      <div class="header-right">
        <button
          class="icon-btn"
          type="button"
          id="dmVoiceCallBtn"
          title="Gọi thoại"
        >
          <i class="bi bi-telephone"></i>
        </button>
        <button
          class="icon-btn"
          type="button"
          id="dmVideoCallBtn"
          title="Gọi video"
        >
          <i class="bi bi-camera-video"></i>
        </button>
        <button class="icon-btn" type="button" title="Ghim">
          <i class="bi bi-pin"></i>
        </button>
        <button class="icon-btn" type="button" title="Thêm bạn vào DM">
          <i class="bi bi-person-plus"></i>
        </button>
        <div class="search-wrap" style="width: 140px">
          <input
            type="text"
            class="search-input"
            placeholder="Tìm kiếm"
            style="padding: 4px 8px; font-size: 13px"
          />
          <i
            class="bi bi-search"
            style="
              position: absolute;
              right: 8px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 12px;
            "
          ></i>
        </div>
        <button class="icon-btn inbox-btn" type="button" title="Hộp thư">
          <i class="bi bi-inbox"></i>
        </button>
        <button class="icon-btn" type="button" title="Trợ giúp">
          <i class="bi bi-question-circle"></i>
        </button>
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
        <button class="composer-btn" type="button" title="Đính kèm">
          <i class="bi bi-plus-circle"></i>
        </button>
        <input
          id="dmMessageInput"
          class="composer-input"
          type="text"
          placeholder="Nhắn tin tới @User"
        />
        <div class="composer-actions">
          <button class="composer-btn" type="button" title="GIF">
            <i class="bi bi-filetype-gif"></i>
          </button>
          <button class="composer-btn" type="button" title="Sticker">
            <i class="bi bi-sticky"></i>
          </button>
          <button class="composer-btn" type="button" title="Emoji">
            <i class="bi bi-emoji-smile"></i>
          </button>
        </div>
      </div>
    </form>
  </main>

  <!-- DM Call Overlay (Voice/Video) -->
  <div
    class="dm-call-overlay"
    id="dmCallOverlay"
    style="display: none"
    aria-hidden="true"
  >
    <div class="dm-call-surface">
      <div class="dm-call-header">
        <div class="dm-call-title" id="dmCallTitle">Call</div>
        <div class="dm-call-header-actions">
          <button
            class="btn-primary"
            type="button"
            id="dmCallAcceptBtn"
            style="display: none"
          >
            Chấp nhận
          </button>
          <button
            class="btn-secondary"
            type="button"
            id="dmCallDeclineBtn"
            style="display: none"
          >
            Từ chối
          </button>
          <button
            class="icon-btn"
            type="button"
            id="dmCallHangupBtn"
            title="Kết thúc cuộc gọi"
          >
            <i class="bi bi-telephone-x"></i>
          </button>
        </div>
      </div>

      <div class="dm-call-body">
        <div class="dm-call-prompt" id="dmCallPrompt" style="display: none">
          <div class="dm-call-prompt-text" id="dmCallPromptText"></div>
        </div>
        <video
          class="dm-call-remote"
          id="dmCallRemoteVideo"
          autoplay
          playsinline
        ></video>
        <video
          class="dm-call-local"
          id="dmCallLocalVideo"
          autoplay
          playsinline
          muted
        ></video>
        <audio id="dmCallRemoteAudio" autoplay></audio>
      </div>
    </div>
  </div>
</div>
<script src="${pageContext.request.contextPath}/js/app-home.js?v=20260105_release"></script>

<script>
    if (typeof window.forceInitAppHome === 'function') {
        window.forceInitAppHome();
    }
</script>
