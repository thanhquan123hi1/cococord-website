/**
 * CoCoCord Admin - User Detail Modal
 * Full-featured User Detail Popup with horizontal 3-column layout
 * Handles: View User Info, Audit Logs, Ban/Unban, Role Management
 */

var UserDetailModal = window.UserDetailModal || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let isOpen = false;
  let currentUser = null;
  let currentTab = 'info'; // 'info' | 'manage'
  let modalElement = null;
  let escapeKeyHandler = null; // Store reference for cleanup
  let presenceUnsub = null;

  // Audit Log Data - generated from real user data
  let auditLogs = [];
  
  function generateAuditLogsFromUser(user) {
    const events = [];
    
    // Account created event
    if (user.createdAt) {
      events.push({
        id: events.length + 1,
        type: 'account_created',
        title: 'Tạo tài khoản CoCoCord',
        time: user.createdAt,
        icon: 'success'
      });
    }
    
    // Last login event
    if (user.lastLogin) {
      events.push({
        id: events.length + 1,
        type: 'login',
        title: 'Đăng nhập gần nhất',
        time: user.lastLogin,
        icon: 'info'
      });
    }
    
    // Ban event
    if (user.isBanned && user.bannedAt) {
      events.push({
        id: events.length + 1,
        type: 'ban_received',
        title: user.banReason ? `Bị ban: ${user.banReason}` : 'Bị ban khỏi hệ thống',
        time: user.bannedAt,
        icon: 'danger'
      });
    }
    
    // Email verified event  
    if (user.isEmailVerified || user.emailVerified) {
      events.push({
        id: events.length + 1,
        type: 'account_verified',
        title: 'Xác minh email thành công',
        time: user.emailVerifiedAt || user.createdAt,
        icon: 'success'
      });
    }
    
    // Role change event (if not default USER)
    if (user.role && user.role !== 'USER') {
      events.push({
        id: events.length + 1,
        type: 'role_changed',
        title: `Được cấp quyền ${user.role}`,
        time: user.roleChangedAt || user.createdAt,
        icon: 'warning'
      });
    }
    
    // Sort by time descending (newest first)
    events.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    return events;
  }

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[UserDetailModal] Initialized');
  }

  // ========================================
  // Open / Close Modal
  // ========================================

  function open(user) {
    if (isOpen) closeModal();
    
    currentUser = user || getMockUser();
    currentTab = 'info';
    isOpen = true;
    auditLogs = generateAuditLogsFromUser(currentUser); // Generate from real user data
    
    renderModal();
    
    // Use setTimeout to ensure DOM is ready before attaching events
    setTimeout(() => {
      attachEventListeners();
    }, 0);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    console.log('[UserDetailModal] Opened for user:', currentUser.username);
  }

  function closeModal() {
    if (!isOpen) return;
    
    console.log('[UserDetailModal] Closing modal');
    isOpen = false;
    currentUser = null;
    
    // Remove escape key listener
    if (escapeKeyHandler) {
      document.removeEventListener('keydown', escapeKeyHandler);
      escapeKeyHandler = null;
    }

    if (presenceUnsub) {
      presenceUnsub();
      presenceUnsub = null;
    }
    
    if (modalElement) {
      modalElement.classList.add('closing');
      setTimeout(() => {
        if (modalElement) {
          modalElement.remove();
          modalElement = null;
        }
      }, 200);
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
  
  // Alias for backward compatibility
  function close() {
    closeModal();
  }

  // ========================================
  // Render Functions
  // ========================================

  function renderModal() {
    const html = `
      <div class="user-detail-backdrop" id="udm-user-detail-modal" data-udm="1">
        <div class="user-detail-modal">
          ${renderHeader()}
          ${renderTabs()}
          ${renderContentInfoAudit()}
          ${renderContentManagement()}
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    modalElement = document.getElementById('udm-user-detail-modal');
  }

  function renderHeader() {
    const user = currentUser;

    const isOnline = !user.isBanned
      && window.AdminPresence
      && AdminPresence.isOnline
      && AdminPresence.isOnline(user.id);

    const statusBadge = user.isBanned 
      ? '<span class="udm-badge udm-badge-banned">Bị ban</span>'
      : '<span class="udm-badge udm-badge-active">Hoạt động</span>';

    const presenceBadge = `<span class="udm-badge ${isOnline ? 'udm-badge-active' : 'udm-badge-unverified'}" id="udm-presence-badge">${isOnline ? 'Online' : 'Offline'}</span>`;
    
    const roleBadge = getRoleBadge(user.role);
    const emailBadge = user.emailVerified 
      ? '<span class="udm-badge udm-badge-verified">Email đã xác minh</span>'
      : '<span class="udm-badge udm-badge-unverified">Email chưa xác minh</span>';

    return `
      <div class="udm-header">
        <div class="udm-header-user">
          <div class="udm-avatar" style="background: ${getAvatarColor(user.id)}">
            ${user.avatarUrl 
              ? `<img src="${user.avatarUrl}" alt="${user.username}">`
              : `<span>${getInitials(user.username)}</span>`
            }
          </div>
          <div class="udm-user-info">
            <h3 class="udm-user-name">
              ${escapeHtml(user.displayName || user.username)}
            </h3>
            <p class="udm-user-email">${escapeHtml(user.email)}</p>
            <div class="udm-badges">
              ${statusBadge}
              ${presenceBadge}
              ${roleBadge}
              ${emailBadge}
            </div>
          </div>
        </div>
        <div class="udm-header-actions">
          <button class="udm-close-btn" id="udm-close-btn" title="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderTabs() {
    return `
      <div class="udm-tabs">
        <button class="udm-tab ${currentTab === 'info' ? 'active' : ''}" data-tab="info">
          <svg class="udm-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
          </svg>
          Thông tin & Audit Log
        </button>
        <button class="udm-tab udm-tab-danger ${currentTab === 'manage' ? 'active' : ''}" data-tab="manage">
          <svg class="udm-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/>
          </svg>
          Quản trị
        </button>
      </div>
    `;
  }

  function renderContentInfoAudit() {
    const user = currentUser;
    const isActive = currentTab === 'info';

    // Use real numbers from API; never show fake defaults
    const serversJoined = Number(user.serverCount ?? user.stats?.serversJoined ?? 0);
    const serversCreated = Number(user.serversCreated ?? user.stats?.serversCreated ?? 0);
    const banCount = Number(user.banCount ?? user.stats?.banCount ?? 0);
    const messageCount = Number(user.messageCount ?? user.stats?.messageCount ?? 0);
    
    return `
      <div class="udm-content ${isActive ? 'active' : ''}" id="udm-content-info">
        <div class="udm-columns">
          <!-- LEFT COLUMN: User Info (Read-only) -->
          <div class="udm-col udm-col-left">
            <div class="udm-col-scroll">
              <h4 class="udm-section-title">Thông tin người dùng</h4>
              <div class="udm-info-list">
                <div class="udm-info-item">
                  <span class="udm-info-label">User ID</span>
                  <span class="udm-info-value mono">#${user.id}</span>
                </div>
                <div class="udm-info-item">
                  <span class="udm-info-label">Tên hiển thị</span>
                  <span class="udm-info-value">${escapeHtml(user.displayName || user.username)}</span>
                </div>
                <div class="udm-info-item">
                  <span class="udm-info-label">Email</span>
                  <span class="udm-info-value">${escapeHtml(user.email)}</span>
                </div>
                <div class="udm-info-item">
                  <span class="udm-info-label">Ngày tạo tài khoản</span>
                  <span class="udm-info-value">${formatDate(user.createdAt)}</span>
                </div>
                <div class="udm-info-item">
                  <span class="udm-info-label">Lần đăng nhập gần nhất</span>
                  <span class="udm-info-value">${user.lastLogin ? formatDate(user.lastLogin) : 'Chưa đăng nhập'}</span>
                </div>
              </div>
              
              <h4 class="udm-section-title" style="margin-top: var(--space-6)">Thống kê</h4>
              <div class="udm-stats-grid">
                <div class="udm-stat-item">
                  <div class="udm-stat-value">${serversJoined}</div>
                  <div class="udm-stat-label">Server tham gia</div>
                </div>
                <div class="udm-stat-item">
                  <div class="udm-stat-value">${serversCreated}</div>
                  <div class="udm-stat-label">Server đã tạo</div>
                </div>
                <div class="udm-stat-item">
                  <div class="udm-stat-value">${banCount}</div>
                  <div class="udm-stat-label">Số lần bị ban</div>
                </div>
                <div class="udm-stat-item">
                  <div class="udm-stat-value">${messageCount}</div>
                  <div class="udm-stat-label">Tin nhắn</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- CENTER COLUMN: Audit Log -->
          <div class="udm-col udm-col-center">
            <div class="udm-col-scroll">
              <h4 class="udm-section-title udm-section-title-lg">Audit Log</h4>
              
              <!-- Summary Cards -->
              <div class="udm-audit-summary">
                <div class="udm-summary-card">
                  <div class="udm-summary-value">${serversCreated}</div>
                  <div class="udm-summary-label">Server đã tạo</div>
                </div>
                <div class="udm-summary-card">
                  <div class="udm-summary-value">${serversJoined}</div>
                  <div class="udm-summary-label">Server tham gia</div>
                </div>
                <div class="udm-summary-card danger">
                  <div class="udm-summary-value">${banCount}</div>
                  <div class="udm-summary-label">Số lần bị ban</div>
                </div>
              </div>
              
              <!-- Filters -->
              <div class="udm-audit-filters">
                <select class="udm-audit-filter" id="udm-audit-type-filter">
                  <option value="">Tất cả loại</option>
                  <option value="account_created">Tạo tài khoản</option>
                  <option value="account_verified">Xác minh email</option>
                  <option value="login">Đăng nhập</option>
                  <option value="role_changed">Thay đổi role</option>
                  <option value="ban_received">Bị ban</option>
                </select>
                <select class="udm-audit-filter" id="udm-audit-time-filter">
                  <option value="">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">7 ngày qua</option>
                  <option value="month">30 ngày qua</option>
                </select>
              </div>
              
              <!-- Log List -->
              <div class="udm-audit-log" id="udm-audit-log">
                ${renderAuditLogItems(auditLogs)}
              </div>
            </div>
          </div>
          
          <!-- RIGHT COLUMN: Status Panel -->
          <div class="udm-col udm-col-right">
            <div class="udm-col-scroll">
              <h4 class="udm-section-title">Trạng thái hiện tại</h4>
              ${renderStatusPanel()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAuditLogItems(logs) {
    if (!logs || logs.length === 0) {
      return `
        <div class="udm-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
          <p>Không có lịch sử hoạt động</p>
        </div>
      `;
    }
    
    return logs.map(log => `
      <div class="udm-log-item">
        <div class="udm-log-icon ${log.icon}">
          ${getLogIcon(log.type)}
        </div>
        <div class="udm-log-content">
          <p class="udm-log-title">${escapeHtml(log.title)}</p>
          <span class="udm-log-time">${formatDateTime(log.time)}</span>
        </div>
      </div>
    `).join('');
  }

  function getLogIcon(type) {
    const icons = {
      server_created: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
      server_joined: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>',
      message_sent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      role_changed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/></svg>',
      ban_received: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>',
      account_created: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>',
      account_verified: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
      login: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
    };
    return icons[type] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
  }

  function renderStatusPanel() {
    const user = currentUser;
    
    if (user.isBanned) {
      return `
        <div class="udm-status-panel">
          <div class="udm-status-header">
            <span class="udm-status-dot banned"></span>
            <span class="udm-status-text">Đang bị ban</span>
          </div>
          
          <div class="udm-ban-details">
            <div class="udm-ban-info-item">
              <span class="udm-ban-label">Kiểu ban</span>
              <span class="udm-ban-value">${user.banInfo?.type === 'permanent' ? 'Vĩnh viễn' : 'Có thời hạn'}</span>
            </div>
            ${user.banInfo?.type !== 'permanent' ? `
              <div class="udm-ban-info-item">
                <span class="udm-ban-label">Thời gian hết hạn</span>
                <span class="udm-ban-value">${formatDateTime(user.banInfo?.expiresAt)}</span>
              </div>
            ` : ''}
            <div class="udm-ban-info-item">
              <span class="udm-ban-label">Lý do ban</span>
              <span class="udm-ban-value">${escapeHtml(user.banInfo?.reason || 'Không có lý do')}</span>
            </div>
            <div class="udm-ban-info-item">
              <span class="udm-ban-label">Ban bởi</span>
              <span class="udm-ban-value">${escapeHtml(user.banInfo?.bannedBy || 'Admin')}</span>
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="udm-status-panel">
        <div class="udm-status-header">
          <span class="udm-status-dot"></span>
          <span class="udm-status-text">Hoạt động bình thường</span>
        </div>
        <p style="font-size: 13px; color: var(--admin-muted); margin-top: var(--space-3);">
          Người dùng này không bị hạn chế nào.
        </p>
      </div>
    `;
  }

  function renderContentManagement() {
    const user = currentUser;
    const isActive = currentTab === 'manage';
    
    return `
      <div class="udm-content ${isActive ? 'active' : ''}" id="udm-content-manage">
        <div class="udm-columns">
          <!-- LEFT COLUMN: User Summary -->
          <div class="udm-col udm-col-left">
            <div class="udm-col-scroll">
              <h4 class="udm-section-title">Tóm tắt người dùng</h4>
              <div class="udm-user-summary">
                <div class="udm-avatar" style="background: ${getAvatarColor(user.id)}">
                  ${user.avatarUrl 
                    ? `<img src="${user.avatarUrl}" alt="${user.username}">`
                    : `<span>${getInitials(user.username)}</span>`
                  }
                </div>
                <h4 class="udm-user-summary-name">${escapeHtml(user.displayName || user.username)}</h4>
                <div class="udm-user-summary-status">
                  ${user.isBanned 
                    ? '<span class="udm-badge udm-badge-banned">Đang bị ban</span>'
                    : '<span class="udm-badge udm-badge-active">Hoạt động</span>'
                  }
                  ${getRoleBadge(user.role)}
                </div>
              </div>
            </div>
          </div>
          
          <!-- CENTER COLUMN: Ban/Unban Form -->
          <div class="udm-col udm-col-center">
            <div class="udm-col-scroll">
              <h4 class="udm-section-title udm-section-title-lg">
                ${user.isBanned ? 'Quản lý ban' : 'Ban người dùng'}
              </h4>
              ${user.isBanned ? renderUnbanForm() : renderBanForm()}
            </div>
          </div>
          
          <!-- RIGHT COLUMN: Role Change -->
          <div class="udm-col udm-col-right">
            <div class="udm-col-scroll">
              <h4 class="udm-section-title">Thay đổi Role</h4>
              ${renderRoleForm()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderBanForm() {
    return `
      <div class="udm-ban-form">
        <div class="udm-form-group">
          <label class="udm-form-label">Loại ban</label>
          <div class="udm-radio-group">
            <label class="udm-radio-item">
              <input type="radio" name="ban-type" value="permanent" checked>
              <div class="udm-radio-content">
                <span class="udm-radio-title">Ban vĩnh viễn</span>
                <span class="udm-radio-desc">Người dùng sẽ bị ban cho đến khi được gỡ thủ công</span>
              </div>
            </label>
            <label class="udm-radio-item">
              <input type="radio" name="ban-type" value="temporary">
              <div class="udm-radio-content">
                <span class="udm-radio-title">Ban có thời hạn</span>
                <span class="udm-radio-desc">Chọn khoảng thời gian ban</span>
              </div>
            </label>
          </div>
          
          <div class="udm-duration-inputs" id="udm-duration-inputs" style="display: none;">
            <input type="number" class="udm-duration-input" id="udm-ban-duration" value="24" min="1" max="9999">
            <select class="udm-duration-select" id="udm-ban-unit">
              <option value="minutes">Phút</option>
              <option value="hours" selected>Giờ</option>
              <option value="days">Ngày</option>
            </select>
          </div>
        </div>
        
        <div class="udm-form-group">
          <label class="udm-form-label required">Lý do ban</label>
          <textarea 
            class="udm-textarea" 
            id="udm-ban-reason"
            placeholder="Nhập lý do ban (bắt buộc). Lý do này sẽ hiển thị cho người dùng khi họ cố đăng nhập."
            rows="4"
          ></textarea>
          <p class="udm-form-hint">Lý do này sẽ hiển thị cho người dùng khi họ cố đăng nhập vào hệ thống.</p>
        </div>
        
        <div class="udm-form-actions">
          <button class="udm-btn udm-btn-danger" id="udm-confirm-ban">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
              <circle cx="12" cy="12" r="10"/>
              <path d="M4.93 4.93l14.14 14.14"/>
            </svg>
            Ban người dùng
          </button>
          <button class="udm-btn udm-btn-secondary" id="udm-cancel-ban">Hủy</button>
        </div>
      </div>
    `;
  }

  function renderUnbanForm() {
    const user = currentUser;
    
    return `
      <div class="udm-ban-form">
        <!-- Current Ban Info -->
        <div class="udm-current-ban">
          <div class="udm-current-ban-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M4.93 4.93l14.14 14.14"/>
            </svg>
            <span class="udm-current-ban-title">Thông tin ban hiện tại</span>
          </div>
          <div class="udm-current-ban-info">
            <div class="udm-current-ban-item">
              <span class="udm-current-ban-label">Kiểu ban</span>
              <span class="udm-current-ban-value">${user.banInfo?.type === 'permanent' ? 'Vĩnh viễn' : 'Có thời hạn'}</span>
            </div>
            <div class="udm-current-ban-item">
              <span class="udm-current-ban-label">Thời gian hết hạn</span>
              <span class="udm-current-ban-value">
                ${user.banInfo?.type === 'permanent' ? 'Không có' : formatDateTime(user.banInfo?.expiresAt)}
              </span>
            </div>
            <div class="udm-current-ban-item udm-current-ban-reason">
              <span class="udm-current-ban-label">Lý do</span>
              <span class="udm-current-ban-value">${escapeHtml(user.banInfo?.reason || 'Không có lý do')}</span>
            </div>
          </div>
        </div>
        
        <!-- Extend Ban Option (if temporary) -->
        ${user.banInfo?.type !== 'permanent' ? `
          <div class="udm-form-group">
            <label class="udm-form-label">Gia hạn ban (tùy chọn)</label>
            <div class="udm-duration-inputs" style="display: flex; padding-left: 0;">
              <input type="number" class="udm-duration-input" id="udm-extend-duration" value="24" min="1" max="9999">
              <select class="udm-duration-select" id="udm-extend-unit">
                <option value="minutes">Phút</option>
                <option value="hours" selected>Giờ</option>
                <option value="days">Ngày</option>
              </select>
              <button class="udm-btn udm-btn-secondary" id="udm-extend-ban" style="margin-left: var(--space-2);">
                Gia hạn
              </button>
            </div>
          </div>
        ` : ''}
        
        <div class="udm-form-actions">
          <button class="udm-btn udm-btn-success" id="udm-confirm-unban">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
              <path d="M4 8l3 3 5-6"/>
            </svg>
            Gỡ ban người dùng
          </button>
          <button class="udm-btn udm-btn-secondary" id="udm-cancel-unban">Đóng</button>
        </div>
      </div>
    `;
  }

  function renderRoleForm() {
    const user = currentUser;
    
    return `
      <div class="udm-role-form">
        <div class="udm-form-group">
          <label class="udm-form-label">Role hiện tại</label>
          <select class="udm-role-select" id="udm-role-select">
            <option value="USER" ${user.role === 'USER' ? 'selected' : ''}>USER</option>
            <option value="MODERATOR" ${user.role === 'MODERATOR' ? 'selected' : ''}>MODERATOR</option>
            <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
          </select>
        </div>
        
        <div class="udm-role-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span class="udm-role-warning-text">
            Thay đổi role sẽ ảnh hưởng trực tiếp đến quyền hạn của người dùng trong toàn bộ hệ thống. Vui lòng cân nhắc kỹ trước khi thực hiện.
          </span>
        </div>
        
        <button class="udm-btn udm-btn-primary" id="udm-update-role" style="width: 100%;">
          Cập nhật Role
        </button>
      </div>
    `;
  }

  // ========================================
  // Event Listeners
  // ========================================

  function attachEventListeners() {
    if (!modalElement) {
      console.error('[UserDetailModal] modalElement is null in attachEventListeners');
      return;
    }

    console.log('[UserDetailModal] Attaching event listeners to:', modalElement);

    // Close button - direct binding
    const closeBtn = modalElement.querySelector('.udm-close-btn');
    console.log('[UserDetailModal] Close button:', closeBtn);
    if (closeBtn) {
      closeBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[UserDetailModal] Close button clicked');
        closeModal();
      };
    } else {
      console.warn('[UserDetailModal] Close button not found');
    }

    // Click outside to close - check if click is on backdrop (not modal content)
    modalElement.onclick = function(e) {
      // Check if the click target is exactly the backdrop element
      if (e.target === modalElement) {
        console.log('[UserDetailModal] Backdrop clicked');
        closeModal();
      }
    };

    // Escape key to close - store reference for cleanup
    escapeKeyHandler = function(e) {
      if (e.key === 'Escape' && isOpen) {
        console.log('[UserDetailModal] Escape key pressed');
        closeModal();
      }
    };
    document.addEventListener('keydown', escapeKeyHandler);

    // Tab switching - bind directly to each tab button
    const tabs = modalElement.querySelectorAll('.udm-tab');
    console.log('[UserDetailModal] Found tabs:', tabs.length);
    tabs.forEach(function(tab) {
      tab.onclick = function(e) {
        e.preventDefault();
        const tabName = this.getAttribute('data-tab');
        console.log('[UserDetailModal] Tab clicked:', tabName);
        if (tabName) {
          switchTab(tabName);
        }
      };
    });

    // Ban type radio toggle
    const banTypeRadios = modalElement.querySelectorAll('input[name="ban-type"]');
    banTypeRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        const durationInputs = document.getElementById('udm-duration-inputs');
        if (durationInputs) {
          durationInputs.style.display = this.value === 'temporary' ? 'flex' : 'none';
        }
      });
    });

    // Ban button
    const confirmBanBtn = modalElement.querySelector('#udm-confirm-ban');
    if (confirmBanBtn) {
      confirmBanBtn.addEventListener('click', handleBan);
    }

    // Unban button
    const confirmUnbanBtn = modalElement.querySelector('#udm-confirm-unban');
    if (confirmUnbanBtn) {
      confirmUnbanBtn.addEventListener('click', handleUnban);
    }

    // Extend ban button
    const extendBanBtn = modalElement.querySelector('#udm-extend-ban');
    if (extendBanBtn) {
      extendBanBtn.addEventListener('click', handleExtendBan);
    }

    // Role update button
    const updateRoleBtn = modalElement.querySelector('#udm-update-role');
    if (updateRoleBtn) {
      updateRoleBtn.addEventListener('click', handleRoleUpdate);
    }

    // Cancel buttons
    const cancelBanBtn = modalElement.querySelector('#udm-cancel-ban');
    const cancelUnbanBtn = modalElement.querySelector('#udm-cancel-unban');
    if (cancelBanBtn) cancelBanBtn.addEventListener('click', closeModal);
    if (cancelUnbanBtn) cancelUnbanBtn.addEventListener('click', closeModal);

    // Audit log filters - use onchange for select elements
    const typeFilter = modalElement.querySelector('#udm-audit-type-filter');
    const timeFilter = modalElement.querySelector('#udm-audit-time-filter');
    
    if (typeFilter) {
      console.log('[UserDetailModal] Type filter found');
      typeFilter.onchange = filterAuditLogs;
    }
    if (timeFilter) {
      console.log('[UserDetailModal] Time filter found');
      timeFilter.onchange = filterAuditLogs;
    }

    bindRealtimePresence();
  }

  function bindRealtimePresence() {
    if (presenceUnsub) {
      presenceUnsub();
      presenceUnsub = null;
    }

    if (!window.AdminPresence || !AdminPresence.subscribe) {
      updatePresenceBadge();
      return;
    }

    updatePresenceBadge();
    presenceUnsub = AdminPresence.subscribe((evt) => {
      if (!isOpen || !currentUser) return;
      if (!evt || evt.type !== 'presence') return;
      if (evt.userId !== currentUser.id) return;
      updatePresenceBadge();
    });
  }

  function updatePresenceBadge() {
    if (!modalElement || !currentUser) return;
    const badge = modalElement.querySelector('#udm-presence-badge');
    if (!badge) return;

    if (currentUser.isBanned) {
      badge.textContent = 'Offline';
      badge.className = 'udm-badge udm-badge-unverified';
      return;
    }

    const isOnline = window.AdminPresence && AdminPresence.isOnline && AdminPresence.isOnline(currentUser.id);
    badge.textContent = isOnline ? 'Online' : 'Offline';
    badge.className = `udm-badge ${isOnline ? 'udm-badge-active' : 'udm-badge-unverified'}`;
  }

  function emitUserUpdated(patch) {
    if (!currentUser || !currentUser.id) return;
    if (!patch || typeof patch !== 'object') return;
    window.dispatchEvent(new CustomEvent('cococord:user-updated', {
      detail: { userId: currentUser.id, patch }
    }));
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape' && isOpen) {
      closeModal();
    }
  }

  function switchTab(tabName) {
    console.log('[UserDetailModal] Switching to tab:', tabName);
    currentTab = tabName;
    
    // Update tab buttons
    const tabs = modalElement.querySelectorAll('.udm-tab');
    tabs.forEach(tab => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('active', isActive);
      console.log('[UserDetailModal] Tab', tab.dataset.tab, 'active:', isActive);
    });
    
    // Update content panels
    const contents = modalElement.querySelectorAll('.udm-content');
    contents.forEach(content => {
      content.classList.remove('active');
    });
    
    const activeContent = modalElement.querySelector(`#udm-content-${tabName}`);
    if (activeContent) {
      activeContent.classList.add('active');
      console.log('[UserDetailModal] Activated content:', `udm-content-${tabName}`);
    } else {
      console.error('[UserDetailModal] Content not found:', `udm-content-${tabName}`);
    }
  }

  // ========================================
  // Action Handlers
  // ========================================

  async function handleBan() {
    const banType = document.querySelector('input[name="ban-type"]:checked')?.value;
    const reason = document.getElementById('udm-ban-reason')?.value.trim();
    const duration = document.getElementById('udm-ban-duration')?.value;
    const unit = document.getElementById('udm-ban-unit')?.value;
    
    if (!reason) {
      showToast('Vui lòng nhập lý do ban', 'error');
      return;
    }

    // Disable button while processing
    const btn = modalElement?.querySelector('#udm-confirm-ban');
    if (btn) btn.disabled = true;

    try {
      // Build query params (backend uses @RequestParam)
      const params = new URLSearchParams();
      params.append('reason', reason);
      if (banType === 'temporary' && duration) {
        params.append('duration', `${duration}${unit === 'days' ? 'd' : unit === 'hours' ? 'h' : 'm'}`);
      }

      const token = localStorage.getItem('accessToken') || '';
      const response = await fetch(`/api/admin/users/${currentUser.id}/ban?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Ban thất bại');
      }
      
      // Update local state
      currentUser.isBanned = true;
      currentUser.banInfo = {
        type: banType,
        reason,
        expiresAt: banType === 'temporary' ? getFutureDate(duration, unit) : null,
        bannedBy: 'Admin'
      };

      // Force offline in presence
      if (window.AdminPresence && AdminPresence.forceDisconnect) {
        AdminPresence.forceDisconnect(currentUser.id);
      }

      emitUserUpdated({
        isBanned: true,
        banInfo: currentUser.banInfo
      });
      
      showToast('Đã ban người dùng thành công', 'success');
      refreshModal();
    } catch (e) {
      console.error('[UserDetailModal] Ban failed:', e);
      showToast(e.message || 'Không thể ban người dùng', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function handleUnban() {
    console.log('[UserDetailModal] Unban user:', currentUser.id);

    // Disable button while processing
    const btn = modalElement?.querySelector('#udm-confirm-unban');
    if (btn) btn.disabled = true;

    try {
      const token = localStorage.getItem('accessToken') || '';
      const response = await fetch(`/api/admin/users/${currentUser.id}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Gỡ ban thất bại');
      }
      
      // Update local state
      currentUser.isBanned = false;
      currentUser.banInfo = null;

      emitUserUpdated({
        isBanned: false,
        banInfo: null
      });
      
      showToast('Đã gỡ ban người dùng', 'success');
      refreshModal();
    } catch (e) {
      console.error('[UserDetailModal] Unban failed:', e);
      showToast(e.message || 'Không thể gỡ ban người dùng', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function handleExtendBan() {
    const duration = document.getElementById('udm-extend-duration')?.value;
    const unit = document.getElementById('udm-extend-unit')?.value;
    
    console.log('[UserDetailModal] Extend ban:', {
      userId: currentUser.id,
      extendBy: `${duration} ${unit}`
    });
    
    showToast(`Đã gia hạn ban thêm ${duration} ${unit}`, 'success');
  }

  async function handleRoleUpdate() {
    const newRole = document.getElementById('udm-role-select')?.value;
    
    if (newRole === currentUser.role) {
      showToast('Role không thay đổi', 'info');
      return;
    }

    // Disable button while processing
    const btn = modalElement?.querySelector('#udm-update-role');
    if (btn) btn.disabled = true;

    try {
      const token = localStorage.getItem('accessToken') || '';
      // Backend uses @RequestParam
      const response = await fetch(`/api/admin/users/${currentUser.id}/role?role=${encodeURIComponent(newRole)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Cập nhật role thất bại');
      }

      const oldRole = currentUser.role;
      
      // Update local state
      currentUser.role = newRole;

      emitUserUpdated({
        role: newRole
      });

      showToast(`Đã cập nhật role từ ${oldRole} thành ${newRole}`, 'success');
      refreshModal();
    } catch (e) {
      console.error('[UserDetailModal] Role update failed:', e);
      showToast(e.message || 'Không thể cập nhật role', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function filterAuditLogs() {
    const typeFilter = modalElement.querySelector('#udm-audit-type-filter')?.value;
    const timeFilter = modalElement.querySelector('#udm-audit-time-filter')?.value;
    
    console.log('[UserDetailModal] Filtering audit logs:', { typeFilter, timeFilter });
    
    let filteredLogs = [...auditLogs];
    
    // Type filter
    if (typeFilter) {
      filteredLogs = filteredLogs.filter(log => log.type === typeFilter);
      console.log('[UserDetailModal] After type filter:', filteredLogs.length, 'items');
    }
    
    // Time filter
    if (timeFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.time);
        switch (timeFilter) {
          case 'today':
            // Compare just the date parts
            const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
            return logDay.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return logDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return logDate >= monthAgo;
          default:
            return true;
        }
      });
      console.log('[UserDetailModal] After time filter:', filteredLogs.length, 'items');
    }
    
    const logContainer = modalElement.querySelector('#udm-audit-log');
    if (logContainer) {
      logContainer.innerHTML = renderAuditLogItems(filteredLogs);
    }
  }

  function refreshModal() {
    if (!isOpen || !currentUser) return;
    
    // Re-render modal with updated state
    const savedTab = currentTab;
    const savedUser = { ...currentUser };
    closeModal();
    setTimeout(() => {
      open(savedUser);
      switchTab(savedTab);
    }, 250);
  }

  // ========================================
  // Helper Functions
  // ========================================

  function getMockUser() {
    return {
      id: 12345,
      username: 'john_doe',
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'USER',
      emailVerified: true,
      isBanned: false,
      banInfo: null,
      createdAt: '2025-11-15T09:00:00',
      lastLogin: '2026-01-05T08:30:00',
      stats: {
        serversJoined: 5,
        serversCreated: 2,
        banCount: 1,
        messageCount: 1284
      }
    };
  }

  function getRoleBadge(role) {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return '<span class="udm-badge udm-badge-admin">ADMIN</span>';
      case 'MODERATOR':
        return '<span class="udm-badge udm-badge-mod">MOD</span>';
      default:
        return '<span class="udm-badge udm-badge-user">USER</span>';
    }
  }

  function getAvatarColor(id) {
    const colors = [
      'var(--admin-primary)',
      '#5865F2',
      '#57F287',
      '#FEE75C',
      '#EB459E',
      '#ED4245'
    ];
    return colors[(id || 0) % colors.length];
  }

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getFutureDate(amount, unit) {
    const now = new Date();
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000
    };
    return new Date(now.getTime() + amount * multipliers[unit]).toISOString();
  }

  function showToast(message, type = 'info') {
    // Use AdminUtils if available, otherwise log to console
    if (typeof AdminUtils !== 'undefined' && AdminUtils.showToast) {
      AdminUtils.showToast(message, type);
    } else {
      console.log(`[Toast ${type}] ${message}`);
      // Simple fallback toast
      const toast = document.createElement('div');
      toast.className = `admin-toast admin-toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        border-radius: 8px;
        font-size: 14px;
        z-index: 2000;
        animation: fadeIn 0.2s ease-out;
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    open,
    close: closeModal,
    isOpen: () => isOpen
  };

})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  UserDetailModal.init();
});
