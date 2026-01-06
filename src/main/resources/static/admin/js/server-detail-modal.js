/**
 * CoCoCord Admin - Server Detail Modal
 * Full-featured Server Detail Popup with 2-column layout
 * Vietnamese language support - Hoàn thiện đầy đủ các tab
 */

var ServerDetailModal = window.ServerDetailModal || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let isOpen = false;
  let currentServer = null;
  let currentTab = 'overview';
  let currentSidebarView = null; // 'members', 'channels', 'reports' or null
  let modalElement = null;
  let escapeKeyHandler = null;
  let isLoading = {
    reports: false,
    audit: false,
    members: false,
    channels: false
  };
  
  // Cached data
  let cachedReports = null;
  let cachedAuditLogs = null;
  let cachedMembers = null;
  let cachedChannels = null;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    server: (id) => `/api/admin/servers/${id}`,
    serverMembers: (id) => `/api/admin/servers/${id}/members`,
    serverChannels: (id) => `/api/admin/servers/${id}/channels`,
    serverReports: (id) => `/api/admin/servers/${id}/reports`,
    serverAudit: (id) => `/api/admin/servers/${id}/audit-log`,
    lock: (id) => `/api/admin/servers/${id}/lock`,
    unlock: (id) => `/api/admin/servers/${id}/unlock`,
    suspend: (id) => `/api/admin/servers/${id}/suspend`,
    unsuspend: (id) => `/api/admin/servers/${id}/unsuspend`,
    deleteServer: (id) => `/api/admin/servers/${id}`
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[ServerDetailModal] Initialized');
  }

  // ========================================
  // Open / Close Modal
  // ========================================

  function open(server, initialTab) {
    if (isOpen) closeModal();
    
    if (!server) {
      console.error('[ServerDetailModal] No server data provided');
      return;
    }
    
    currentServer = server;
    currentTab = initialTab || 'overview';
    currentSidebarView = null;
    isOpen = true;
    cachedReports = null;
    cachedAuditLogs = null;
    cachedMembers = null;
    cachedChannels = null;
    
    renderModal();
    
    setTimeout(() => {
      attachEventListeners();
      // Switch to the requested tab if not overview
      if (currentTab !== 'overview') {
        switchTab(currentTab);
      }
    }, 0);
    
    document.body.style.overflow = 'hidden';
    
    console.log('[ServerDetailModal] Opened for server:', currentServer.name, '| Tab:', currentTab);
  }

  function closeModal() {
    if (!isOpen) return;
    
    console.log('[ServerDetailModal] Closing modal');
    isOpen = false;
    currentServer = null;
    currentSidebarView = null;
    cachedReports = null;
    cachedAuditLogs = null;
    cachedMembers = null;
    cachedChannels = null;
    
    if (escapeKeyHandler) {
      document.removeEventListener('keydown', escapeKeyHandler);
      escapeKeyHandler = null;
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
    
    document.body.style.overflow = '';
  }
  
  function close() {
    closeModal();
  }

  // ========================================
  // Render Functions
  // ========================================

  function renderModal() {
    const server = currentServer;
    const isLocked = server.isLocked || server.locked || false;
    const isSuspended = server.isSuspended || server.suspended || false;
    
    const html = `
      <div class="server-detail-backdrop" id="sdm-server-detail-modal">
        <div class="server-detail-modal">
          ${renderWarningBanner(server, isLocked, isSuspended)}
          ${renderHeader(server, isLocked, isSuspended)}
          <div class="sdm-body">
            ${renderSidebar(server)}
            ${renderMainContent(server, isLocked, isSuspended)}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    modalElement = document.getElementById('sdm-server-detail-modal');
  }

  function renderWarningBanner(server, isLocked, isSuspended) {
    if (!isLocked && !isSuspended) return '';
    
    if (isSuspended) {
      return `
        <div class="sdm-warning-banner suspended">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="10" y1="15" x2="10" y2="9"/>
            <line x1="14" y1="15" x2="14" y2="9"/>
          </svg>
          <span class="sdm-warning-text">
            <strong>Server đang bị tạm ngưng.</strong> 
            ${server.suspendReason ? `Lý do: ${escapeHtml(server.suspendReason)}` : 'Không có lý do được cung cấp.'}
          </span>
          <button class="sdm-warning-action" data-action="unsuspend">Gỡ tạm ngưng</button>
        </div>
      `;
    }
    
    return `
      <div class="sdm-warning-banner locked">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <span class="sdm-warning-text">
          <strong>Server đang bị khóa.</strong>
          ${server.lockReason ? `Lý do: ${escapeHtml(server.lockReason)}` : 'Không có lý do được cung cấp.'}
        </span>
        <button class="sdm-warning-action" data-action="unlock">Mở khóa</button>
      </div>
    `;
  }

  function renderHeader(server, isLocked, isSuspended) {
    let statusBadge = '<span class="sdm-badge sdm-badge-active">ĐANG HOẠT ĐỘNG</span>';
    if (isSuspended) {
      statusBadge = '<span class="sdm-badge sdm-badge-suspended">TẠM NGƯNG</span>';
    } else if (isLocked) {
      statusBadge = '<span class="sdm-badge sdm-badge-locked">ĐÃ KHÓA</span>';
    }
    
    return `
      <div class="sdm-header">
        <div class="sdm-header-server">
          <h2 class="sdm-server-name">
            ${escapeHtml(server.name)}
            <div class="sdm-badges">${statusBadge}</div>
          </h2>
        </div>
        <div class="sdm-header-actions">
          <button class="sdm-close-btn" data-action="close" title="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderSidebar(server) {
    const isPublic = server.isPublic || server.visibility === 'PUBLIC' || true;
    
    return `
      <div class="sdm-sidebar">
        <div class="sdm-sidebar-scroll">
          <!-- Server Avatar Section -->
          <div class="sdm-server-avatar-section">
            <div class="sdm-server-avatar" style="background: ${getServerColor(server.id)}">
              ${server.iconUrl 
                ? `<img src="${escapeHtml(server.iconUrl)}" alt="${escapeHtml(server.name)}">`
                : `<span class="sdm-server-avatar-initials">${getInitials(server.name)}</span>`
              }
            </div>
            <h3 class="sdm-server-title">${escapeHtml(server.name)}</h3>
            <p class="sdm-server-description">${escapeHtml(server.description || 'Không có mô tả')}</p>
            <div class="sdm-visibility">
              ${isPublic ? `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Công khai
              ` : `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Riêng tư
              `}
            </div>
          </div>
          
          <!-- Server Stats - Clickable Sidebar Buttons -->
          <div class="sdm-server-stats">
            <div class="sdm-stat-item" data-sidebar="members">
              <div class="sdm-stat-left">
                <div class="sdm-stat-icon members">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <span class="sdm-stat-label">Thành viên</span>
              </div>
              <span class="sdm-stat-value">${formatNumber(server.memberCount || 0)}</span>
            </div>
            
            <div class="sdm-stat-item" data-sidebar="channels">
              <div class="sdm-stat-left">
                <div class="sdm-stat-icon channels">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>
                  </svg>
                </div>
                <span class="sdm-stat-label">Kênh</span>
              </div>
              <span class="sdm-stat-value">${formatNumber(server.channelCount || 0)}</span>
            </div>
            
            <div class="sdm-stat-item" data-sidebar="roles">
              <div class="sdm-stat-left">
                <div class="sdm-stat-icon roles">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="21.17" y1="8" x2="12" y2="8"/>
                    <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
                    <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
                  </svg>
                </div>
                <span class="sdm-stat-label">Vai trò</span>
              </div>
              <span class="sdm-stat-value">${formatNumber(server.roleCount || 0)}</span>
            </div>
            
            <div class="sdm-stat-item" data-sidebar="reports">
              <div class="sdm-stat-left">
                <div class="sdm-stat-icon reports">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <span class="sdm-stat-label">Báo cáo</span>
              </div>
              <span class="sdm-stat-value">${formatNumber(server.reportCount || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMainContent(server, isLocked, isSuspended) {
    const reportCount = server.reportCount || 0;
    
    return `
      <div class="sdm-main">
        <!-- Tab Navigation - Only admin/overview tabs -->
        <div class="sdm-tabs">
          <button class="sdm-tab active" data-tab="overview">
            <svg class="sdm-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Tổng quan
          </button>
          <button class="sdm-tab" data-tab="reports">
            <svg class="sdm-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            Báo cáo
            ${reportCount > 0 ? `<span class="sdm-tab-badge">${reportCount}</span>` : ''}
          </button>
          <button class="sdm-tab" data-tab="audit">
            <svg class="sdm-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            Lịch sử
          </button>
          <button class="sdm-tab" data-tab="actions">
            <svg class="sdm-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Thao tác
          </button>
        </div>
        
        <!-- Tab Contents -->
        ${renderOverviewTab(server, isLocked, isSuspended)}
        ${renderMembersTab(server)}
        ${renderChannelsTab(server)}
        ${renderRolesTab(server)}
        ${renderReportsTab(server)}
        ${renderAuditTab(server)}
        ${renderActionsTab(server, isLocked, isSuspended)}
      </div>
    `;
  }

  function renderOverviewTab(server, isLocked, isSuspended) {
    return `
      <div class="sdm-content active" data-content="overview">
        <div class="sdm-content-scroll">
          <!-- Server Information -->
          <div class="sdm-section">
            <h4 class="sdm-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              THÔNG TIN SERVER
            </h4>
            <div class="sdm-info-grid">
              <div class="sdm-info-card">
                <div class="sdm-info-label">Server ID</div>
                <div class="sdm-info-value mono">${server.id}</div>
              </div>
              <div class="sdm-info-card">
                <div class="sdm-info-label">Ngày tạo</div>
                <div class="sdm-info-value">${formatDateTime(server.createdAt)}</div>
              </div>
              <div class="sdm-info-card">
                <div class="sdm-info-label">Hoạt động gần nhất</div>
                <div class="sdm-info-value">${formatDateTime(server.lastActivityAt || server.updatedAt)}</div>
              </div>
              <div class="sdm-info-card">
                <div class="sdm-info-label">Giới hạn thành viên</div>
                <div class="sdm-info-value">${formatNumber(server.maxMembers || 500000)}</div>
              </div>
              <div class="sdm-info-card">
                <div class="sdm-info-label">Tổng tin nhắn</div>
                <div class="sdm-info-value">${formatNumber(server.messageCount || 0)}</div>
              </div>
              <div class="sdm-info-card">
                <div class="sdm-info-label">Server Boost</div>
                <div class="sdm-info-value">Level ${server.boostLevel || 0}</div>
              </div>
            </div>
          </div>
          
          <!-- Server Owner -->
          <div class="sdm-section">
            <h4 class="sdm-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              CHỦ SỞ HỮU
            </h4>
            <div class="sdm-owner-card">
              <div class="sdm-owner-avatar" style="background: ${getAvatarColor(server.ownerId)}">
                ${server.ownerAvatarUrl 
                  ? `<img src="${escapeHtml(server.ownerAvatarUrl)}" alt="${escapeHtml(server.ownerUsername)}">`
                  : `<span>${getInitials(server.ownerUsername || 'Unknown')}</span>`
                }
              </div>
              <div class="sdm-owner-info">
                <h5 class="sdm-owner-name">${escapeHtml(server.ownerUsername || 'Unknown')}</h5>
                <p class="sdm-owner-label">Chủ sở hữu · ID: ${server.ownerId || '--'}</p>
              </div>
              <button class="sdm-owner-action" data-action="view-owner" data-owner-id="${server.ownerId}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
                </svg>
                Xem hồ sơ
              </button>
            </div>
          </div>
          
          ${(isLocked || isSuspended) ? renderStatusDetails(server, isLocked, isSuspended) : ''}
        </div>
      </div>
    `;
  }

  function renderStatusDetails(server, isLocked, isSuspended) {
    if (isSuspended) {
      return `
        <div class="sdm-section">
          <h4 class="sdm-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            CHI TIẾT TẠM NGƯNG
          </h4>
          <div class="sdm-status-details suspended">
            <div class="sdm-status-header">
              <div class="sdm-status-icon suspended">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="10" y1="15" x2="10" y2="9"/>
                  <line x1="14" y1="15" x2="14" y2="9"/>
                </svg>
              </div>
              <h5 class="sdm-status-title">Server đang bị tạm ngưng</h5>
            </div>
            <div class="sdm-status-info">
              <div class="sdm-status-row">
                <span class="sdm-status-label">Lý do:</span>
                <span class="sdm-status-value">${escapeHtml(server.suspendReason || 'Không có lý do')}</span>
              </div>
              <div class="sdm-status-row">
                <span class="sdm-status-label">Thời hạn:</span>
                <span class="sdm-status-value">${server.suspendUntil ? formatDateTime(server.suspendUntil) : 'Vĩnh viễn'}</span>
              </div>
              <div class="sdm-status-row">
                <span class="sdm-status-label">Tạm ngưng lúc:</span>
                <span class="sdm-status-value">${formatDateTime(server.suspendedAt || server.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    if (isLocked) {
      return `
        <div class="sdm-section">
          <h4 class="sdm-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            CHI TIẾT KHÓA
          </h4>
          <div class="sdm-status-details">
            <div class="sdm-status-header">
              <div class="sdm-status-icon locked">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h5 class="sdm-status-title">Server đang bị khóa</h5>
            </div>
            <div class="sdm-status-info">
              <div class="sdm-status-row">
                <span class="sdm-status-label">Lý do:</span>
                <span class="sdm-status-value">${escapeHtml(server.lockReason || 'Không có lý do')}</span>
              </div>
              <div class="sdm-status-row">
                <span class="sdm-status-label">Khóa lúc:</span>
                <span class="sdm-status-value">${formatDateTime(server.lockedAt || server.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    return '';
  }

  // ========================================
  // MEMBERS TAB
  // ========================================

  function renderMembersTab(server) {
    const memberCount = server.memberCount || 0;
    
    return `
      <div class="sdm-content" data-content="members">
        <div class="sdm-content-scroll">
          <div class="sdm-section">
            <div class="sdm-sidebar-content-header">
              <button class="sdm-back-btn" data-action="back-to-overview">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Quay lại
              </button>
              <h4 class="sdm-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                DANH SÁCH THÀNH VIÊN
                <span class="sdm-section-count">${formatNumber(memberCount)}</span>
              </h4>
            </div>
          </div>
          <div class="sdm-members-list" id="sdm-members-list">
            ${memberCount === 0 ? renderEmptyState('members') : renderMembersLoading()}
          </div>
        </div>
      </div>
    `;
  }
  
  function renderRolesTab(server) {
    const roleCount = server.roleCount || 0;
    
    return `
      <div class="sdm-content" data-content="roles">
        <div class="sdm-content-scroll">
          <div class="sdm-section">
            <div class="sdm-sidebar-content-header">
              <button class="sdm-back-btn" data-action="back-to-overview">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Quay lại
              </button>
              <h4 class="sdm-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
                DANH SÁCH VAI TRÒ
                <span class="sdm-section-count">${formatNumber(roleCount)}</span>
              </h4>
            </div>
          </div>
          <div class="sdm-roles-list" id="sdm-roles-list">
            ${renderEmptyState('roles')}
          </div>
        </div>
      </div>
    `;
  }

  function renderMembersLoading() {
    return `
      <div class="sdm-loading">
        <div class="sdm-loading-spinner"></div>
        <span class="sdm-loading-text">Đang tải danh sách thành viên...</span>
      </div>
    `;
  }

  function renderMembersList(members) {
    if (!members || members.length === 0) {
      return renderEmptyState('members');
    }
    
    return members.map(member => {
      const isOnline = member.status === 'ONLINE' || member.online;
      const roleColor = member.roleColor || '#99AAB5';
      
      return `
        <div class="sdm-member-item" data-user-id="${member.userId || member.id}">
          <div class="sdm-member-avatar-wrapper">
            <div class="sdm-member-avatar" style="background: ${getAvatarColor(member.userId || member.id)}">
              ${member.avatarUrl 
                ? `<img src="${escapeHtml(member.avatarUrl)}" alt="">`
                : `<span>${getInitials(member.username || member.displayName)}</span>`
              }
            </div>
            <div class="sdm-member-status ${isOnline ? 'online' : 'offline'}"></div>
          </div>
          <div class="sdm-member-info">
            <div class="sdm-member-name-row">
              <span class="sdm-member-name">${escapeHtml(member.displayName || member.username)}</span>
              ${member.isOwner ? '<span class="sdm-member-crown" title="Chủ server">👑</span>' : ''}
            </div>
            <span class="sdm-member-username">@${escapeHtml(member.username)}</span>
          </div>
          <div class="sdm-member-meta">
            <span class="sdm-member-role" style="color: ${roleColor}">${escapeHtml(member.roleName || 'Member')}</span>
            <span class="sdm-member-id">ID: ${member.userId || member.id}</span>
          </div>
          <div class="sdm-member-status-badge ${isOnline ? 'online' : 'offline'}">
            ${isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
          </div>
        </div>
      `;
    }).join('');
  }

  // ========================================
  // CHANNELS TAB
  // ========================================

  function renderChannelsTab(server) {
    const channelCount = server.channelCount || 0;
    
    return `
      <div class="sdm-content" data-content="channels">
        <div class="sdm-content-scroll">
          <div class="sdm-section">
            <div class="sdm-sidebar-content-header">
              <button class="sdm-back-btn" data-action="back-to-overview">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Quay lại
              </button>
              <h4 class="sdm-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>
                </svg>
                DANH SÁCH KÊNH
                <span class="sdm-section-count">${formatNumber(channelCount)}</span>
              </h4>
            </div>
          </div>
          <div class="sdm-channels-list" id="sdm-channels-list">
            ${channelCount === 0 ? renderEmptyState('channels') : renderChannelsLoading()}
          </div>
        </div>
      </div>
    `;
  }

  function renderChannelsLoading() {
    return `
      <div class="sdm-loading">
        <div class="sdm-loading-spinner"></div>
        <span class="sdm-loading-text">Đang tải danh sách kênh...</span>
      </div>
    `;
  }

  function renderChannelsList(channels) {
    if (!channels || channels.length === 0) {
      return renderEmptyState('channels');
    }
    
    // Group channels by category
    const categorized = {};
    const uncategorized = [];
    
    channels.forEach(channel => {
      if (channel.categoryId || channel.category) {
        const catName = channel.categoryName || channel.category || 'Khác';
        if (!categorized[catName]) categorized[catName] = [];
        categorized[catName].push(channel);
      } else {
        uncategorized.push(channel);
      }
    });
    
    let html = '';
    
    // Render uncategorized first
    if (uncategorized.length > 0) {
      html += renderChannelGroup('Kênh chung', uncategorized);
    }
    
    // Render categorized
    Object.entries(categorized).forEach(([catName, catChannels]) => {
      html += renderChannelGroup(catName, catChannels);
    });
    
    return html;
  }

  function renderChannelGroup(categoryName, channels) {
    return `
      <div class="sdm-channel-group">
        <div class="sdm-channel-category">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          ${escapeHtml(categoryName)}
          <span class="sdm-channel-count">${channels.length}</span>
        </div>
        <div class="sdm-channel-items">
          ${channels.map(channel => renderChannelItem(channel)).join('')}
        </div>
      </div>
    `;
  }

  function renderChannelItem(channel) {
    const isVoice = channel.type === 'VOICE' || channel.type === 'voice';
    const isLocked = channel.locked || channel.isPrivate;
    
    return `
      <div class="sdm-channel-item ${isVoice ? 'voice' : 'text'}" data-channel-id="${channel.id}">
        <div class="sdm-channel-icon ${isVoice ? 'voice' : 'text'}">
          ${isVoice ? `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          ` : `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>
            </svg>
          `}
        </div>
        <div class="sdm-channel-info">
          <span class="sdm-channel-name">${escapeHtml(channel.name)}</span>
          ${channel.topic ? `<span class="sdm-channel-topic">${escapeHtml(channel.topic)}</span>` : ''}
        </div>
        <div class="sdm-channel-badges">
          ${isLocked ? `
            <span class="sdm-channel-badge locked" title="Kênh riêng tư">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </span>
          ` : ''}
          <span class="sdm-channel-type-badge ${isVoice ? 'voice' : 'text'}">
            ${isVoice ? 'Thoại' : 'Văn bản'}
          </span>
        </div>
      </div>
    `;
  }

  // ========================================
  // REPORTS TAB
  // ========================================

  function renderReportsTab(server) {
    const reportCount = server.reportCount || 0;
    
    return `
      <div class="sdm-content" data-content="reports">
        <div class="sdm-content-scroll">
          <!-- Reports Summary -->
          <div class="sdm-reports-summary">
            <div class="sdm-reports-total">
              <span class="sdm-reports-number" id="sdm-reports-count">${reportCount}</span>
              <span class="sdm-reports-label">Tổng báo cáo</span>
            </div>
            ${reportCount === 0 ? '<span class="sdm-reports-empty">Không có báo cáo</span>' : ''}
          </div>
          
          <!-- Reports List -->
          <div class="sdm-reports-list" id="sdm-reports-list">
            ${reportCount === 0 ? renderEmptyState('reports') : renderReportsLoading()}
          </div>
        </div>
      </div>
    `;
  }

  function renderAuditTab(server) {
    return `
      <div class="sdm-content" data-content="audit">
        <div class="sdm-content-scroll">
          <div class="sdm-audit-timeline" id="sdm-audit-timeline">
            ${renderAuditLoading()}
          </div>
        </div>
      </div>
    `;
  }

  function renderActionsTab(server, isLocked, isSuspended) {
    return `
      <div class="sdm-content" data-content="actions">
        <div class="sdm-content-scroll">
          <div class="sdm-section">
            <h4 class="sdm-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/>
              </svg>
              THAO TÁC QUẢN TRỊ
            </h4>
          </div>
          
          <div class="sdm-actions-grid">
            <!-- Lock/Unlock Action -->
            <div class="sdm-action-card ${isLocked ? 'active-state' : ''}">
              <div class="sdm-action-icon lock">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <div class="sdm-action-info">
                <h5 class="sdm-action-title">${isLocked ? 'Mở khóa Server' : 'Khóa Server'}</h5>
                <p class="sdm-action-description">
                  ${isLocked 
                    ? 'Mở khóa server để cho phép người dùng tham gia và hoạt động bình thường.'
                    : 'Khóa server sẽ ngăn người dùng mới tham gia và hạn chế một số hoạt động.'
                  }
                </p>
              </div>
              <button class="sdm-action-btn ${isLocked ? 'unlock' : 'lock'}" data-action="${isLocked ? 'unlock' : 'lock'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${isLocked ? `
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 018-4"/>
                  ` : `
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  `}
                </svg>
                ${isLocked ? 'Mở khóa' : 'Khóa'}
              </button>
            </div>
            
            <!-- Suspend/Unsuspend Action -->
            <div class="sdm-action-card ${isSuspended ? 'active-state suspended' : ''}">
              <div class="sdm-action-icon suspend">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="10" y1="15" x2="10" y2="9"/>
                  <line x1="14" y1="15" x2="14" y2="9"/>
                </svg>
              </div>
              <div class="sdm-action-info">
                <h5 class="sdm-action-title">${isSuspended ? 'Khôi phục Server' : 'Tạm ngưng Server'}</h5>
                <p class="sdm-action-description">
                  ${isSuspended 
                    ? 'Gỡ tạm ngưng để khôi phục hoạt động server. Mọi thành viên sẽ có thể truy cập lại.'
                    : 'Tạm ngưng server sẽ vô hiệu hóa hoàn toàn server. Không ai có thể truy cập.'
                  }
                </p>
              </div>
              <button class="sdm-action-btn ${isSuspended ? 'unsuspend' : 'suspend'}" data-action="${isSuspended ? 'unsuspend' : 'suspend'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${isSuspended ? `
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8"/>
                  ` : `
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="10" y1="15" x2="10" y2="9"/>
                    <line x1="14" y1="15" x2="14" y2="9"/>
                  `}
                </svg>
                ${isSuspended ? 'Khôi phục' : 'Tạm ngưng'}
              </button>
            </div>
            
            <!-- Delete Action -->
            <div class="sdm-action-card danger">
              <div class="sdm-action-icon delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
              <div class="sdm-action-info">
                <h5 class="sdm-action-title">Xóa Server vĩnh viễn</h5>
                <p class="sdm-action-description">
                  Xóa vĩnh viễn server này và toàn bộ dữ liệu. Hành động này không thể hoàn tác.
                </p>
              </div>
              <button class="sdm-action-btn delete" data-action="delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderEmptyState(type) {
    const configs = {
      members: {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>`,
        title: 'Chưa có thành viên',
        text: 'Server này chưa có thành viên nào.'
      },
      channels: {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>
        </svg>`,
        title: 'Chưa có kênh',
        text: 'Server này chưa có kênh nào.'
      },
      reports: {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>`,
        title: 'Không có báo cáo',
        text: 'Server này không có báo cáo nào. Tuyệt vời!'
      },
      audit: {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>`,
        title: 'Chưa có lịch sử hoạt động',
        text: 'Các hoạt động sẽ xuất hiện ở đây.'
      },
      roles: {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>`,
        title: 'Chưa có vai trò',
        text: 'Server này chưa có vai trò tùy chỉnh nào.'
      }
    };
    
    const config = configs[type] || configs.reports;
    
    return `
      <div class="sdm-empty-state">
        <div class="sdm-empty-icon">${config.icon}</div>
        <h4 class="sdm-empty-title">${config.title}</h4>
        <p class="sdm-empty-text">${config.text}</p>
      </div>
    `;
  }

  function renderReportsLoading() {
    return `
      <div class="sdm-loading">
        <div class="sdm-loading-spinner"></div>
        <span class="sdm-loading-text">Loading reports...</span>
      </div>
    `;
  }

  function renderAuditLoading() {
    return `
      <div class="sdm-loading">
        <div class="sdm-loading-spinner"></div>
        <span class="sdm-loading-text">Đang tải lịch sử hoạt động...</span>
      </div>
    `;
  }

  function renderReportsList(reports) {
    if (!reports || reports.length === 0) {
      return renderEmptyState('reports');
    }
    
    const statusLabels = {
      'PENDING': 'Chờ xử lý',
      'RESOLVED': 'Đã xử lý',
      'DISMISSED': 'Đã bác bỏ',
      'IN_PROGRESS': 'Đang xử lý'
    };
    
    const typeLabels = {
      'SPAM': 'Spam',
      'HARASSMENT': 'Quấy rối',
      'INAPPROPRIATE': 'Nội dung không phù hợp',
      'VIOLATION': 'Vi phạm quy tắc',
      'OTHER': 'Khác'
    };
    
    return reports.map(report => {
      const statusKey = (report.status || 'PENDING').toUpperCase();
      const typeKey = (report.type || 'OTHER').toUpperCase();
      
      return `
        <div class="sdm-report-item" data-report-id="${report.id}">
          <div class="sdm-report-icon ${report.status?.toLowerCase() || 'pending'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          </div>
          <div class="sdm-report-content">
            <h5 class="sdm-report-type">${escapeHtml(typeLabels[typeKey] || report.type || 'Báo cáo chung')}</h5>
            <p class="sdm-report-meta">
              Báo cáo bởi <strong>${escapeHtml(report.reporterUsername || 'Ẩn danh')}</strong> · ${formatRelativeTime(report.createdAt)}
            </p>
            ${report.description ? `<p class="sdm-report-description">${escapeHtml(report.description.substring(0, 100))}${report.description.length > 100 ? '...' : ''}</p>` : ''}
          </div>
          <span class="sdm-report-status ${report.status?.toLowerCase() || 'pending'}">
            ${statusLabels[statusKey] || report.status || 'Chờ xử lý'}
          </span>
        </div>
      `;
    }).join('');
  }

  function renderAuditTimeline(logs) {
    if (!logs || logs.length === 0) {
      return renderEmptyState('audit');
    }
    
    return logs.map(log => {
      const dotClass = getAuditDotClass(log.action);
      return `
        <div class="sdm-audit-item">
          <div class="sdm-audit-dot ${dotClass}"></div>
          <div class="sdm-audit-content">
            <div class="sdm-audit-header">
              <h5 class="sdm-audit-action">${escapeHtml(getAuditActionLabel(log.action))}</h5>
              <span class="sdm-audit-time">${formatRelativeTime(log.createdAt || log.timestamp)}</span>
            </div>
            <div class="sdm-audit-actor">
              <span class="sdm-audit-actor-avatar" style="background: ${getAvatarColor(log.actorId)}">${getInitials(log.actorUsername || 'System')}</span>
              <span class="sdm-audit-actor-name">${escapeHtml(log.actorUsername || 'Hệ thống')}</span>
            </div>
            ${log.details ? `<p class="sdm-audit-details">${escapeHtml(log.details)}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // ========================================
  // Event Handlers
  // ========================================

  function attachEventListeners() {
    if (!modalElement) return;
    
    // Close button
    modalElement.querySelector('[data-action="close"]')?.addEventListener('click', closeModal);
    
    // Click outside to close
    modalElement.addEventListener('click', (e) => {
      if (e.target === modalElement) closeModal();
    });
    
    // Escape key
    escapeKeyHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escapeKeyHandler);
    
    // Tab switching
    modalElement.querySelectorAll('.sdm-tab').forEach(tab => {
      tab.addEventListener('click', () => handleTabChange(tab.dataset.tab));
    });
    
    // Sidebar button clicks
    modalElement.querySelectorAll('.sdm-stat-item[data-sidebar]').forEach(item => {
      item.addEventListener('click', () => handleSidebarClick(item.dataset.sidebar));
    });
    
    // Warning banner actions
    modalElement.querySelectorAll('.sdm-warning-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAction(btn.dataset.action);
      });
    });
    
    // Action buttons
    modalElement.querySelectorAll('.sdm-action-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.dataset.action));
    });
    
    // View owner profile
    modalElement.querySelector('[data-action="view-owner"]')?.addEventListener('click', (e) => {
      const ownerId = e.currentTarget.dataset.ownerId;
      if (ownerId && window.UserDetailModal) {
        closeModal();
        // Fetch and open user detail modal
        fetchUserAndOpenModal(ownerId);
      }
    });
  }

  function handleTabChange(tab) {
    if (tab === currentTab && !currentSidebarView) return;
    
    // Clear sidebar view when switching to topbar tabs
    currentSidebarView = null;
    updateSidebarActiveState();
    switchTab(tab);
  }
  
  function handleSidebarClick(view) {
    if (view === currentSidebarView) return;
    
    currentSidebarView = view;
    updateSidebarActiveState();
    
    // Show corresponding content in main area
    if (view === 'members') {
      switchToSidebarContent('members');
      if (!cachedMembers) loadMembers();
    } else if (view === 'channels') {
      switchToSidebarContent('channels');
      if (!cachedChannels) loadChannels();
    } else if (view === 'reports') {
      // Reports is both sidebar and topbar - switch to reports tab
      currentSidebarView = null;
      updateSidebarActiveState();
      switchTab('reports');
    } else if (view === 'roles') {
      // Roles - show message for now
      switchToSidebarContent('roles');
    }
  }
  
  function updateSidebarActiveState() {
    if (!modalElement) return;
    modalElement.querySelectorAll('.sdm-stat-item[data-sidebar]').forEach(item => {
      item.classList.toggle('active', item.dataset.sidebar === currentSidebarView);
    });
    
    // Also update topbar tabs - clear active if showing sidebar content
    if (currentSidebarView) {
      modalElement.querySelectorAll('.sdm-tab').forEach(t => t.classList.remove('active'));
    }
  }
  
  function switchToSidebarContent(view) {
    // Hide all tab contents
    modalElement.querySelectorAll('.sdm-content').forEach(c => {
      c.classList.remove('active');
    });
    
    // Show the sidebar content
    const content = modalElement.querySelector(`[data-content="${view}"]`);
    if (content) {
      content.classList.add('active');
      content.style.animation = 'sdmTabFadeIn 0.3s ease forwards';
    }
  }
  
  function switchTab(tab) {
    currentTab = tab;
    currentSidebarView = null;
    updateSidebarActiveState();
    
    // Update tab UI with animation
    modalElement.querySelectorAll('.sdm-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    modalElement.querySelectorAll('.sdm-content').forEach(c => {
      const isActive = c.dataset.content === tab;
      if (isActive) {
        c.classList.add('active');
        c.style.animation = 'sdmTabFadeIn 0.3s ease forwards';
      } else {
        c.classList.remove('active');
      }
    });
    
    // Load data for tab if needed
    if (tab === 'reports' && !cachedReports) {
      loadReports();
    } else if (tab === 'audit' && !cachedAuditLogs) {
      loadAuditLogs();
    }
  }

  async function handleAction(action) {
    if (!currentServer) return;
    
    // Use ServerActionModals for Lock, Suspend, Delete actions
    if (window.ServerActionModals) {
      switch (action) {
        case 'lock':
          ServerActionModals.showLockModal(currentServer);
          return;
        case 'unlock':
          // Quick unlock confirmation
          if (confirm(`Bạn có chắc muốn mở khóa server "${currentServer.name}"?`)) {
            await unlockServer(currentServer.id);
          }
          return;
        case 'suspend':
          ServerActionModals.showSuspendModal(currentServer);
          return;
        case 'unsuspend':
          // Quick unsuspend confirmation  
          if (confirm(`Bạn có chắc muốn khôi phục server "${currentServer.name}"?`)) {
            await unsuspendServer(currentServer.id);
          }
          return;
        case 'delete':
          ServerActionModals.showDeleteModal(currentServer);
          return;
      }
    }
    
    // Fallback to old confirmation modal if ServerActionModals not available
    const serverId = currentServer.id;
    const serverName = currentServer.name;
    
    switch (action) {
      case 'lock':
        showConfirmationModal({
          title: 'Lock Server',
          message: `Are you sure you want to lock "${serverName}"? New users won't be able to join.`,
          confirmText: 'Lock',
          confirmClass: 'admin-btn-warning',
          onConfirm: () => lockServer(serverId)
        });
        break;
        
      case 'unlock':
        showConfirmationModal({
          title: 'Unlock Server',
          message: `Are you sure you want to unlock "${serverName}"?`,
          confirmText: 'Unlock',
          confirmClass: 'admin-btn-success',
          onConfirm: () => unlockServer(serverId)
        });
        break;
        
      case 'suspend':
        showConfirmationModal({
          title: 'Suspend Server',
          message: `Are you sure you want to suspend "${serverName}"? This will completely disable the server.`,
          confirmText: 'Suspend',
          confirmClass: 'admin-btn-danger',
          isDangerous: true,
          onConfirm: () => suspendServer(serverId)
        });
        break;
        
      case 'unsuspend':
        showConfirmationModal({
          title: 'Resume Server',
          message: `Are you sure you want to resume "${serverName}"?`,
          confirmText: 'Resume',
          confirmClass: 'admin-btn-success',
          onConfirm: () => unsuspendServer(serverId)
        });
        break;
        
      case 'delete':
        showConfirmationModal({
          title: 'Delete Server',
          message: `Are you sure you want to permanently delete "${serverName}"? This action cannot be undone!`,
          confirmText: 'Delete Forever',
          confirmClass: 'admin-btn-danger',
          isDangerous: true,
          onConfirm: () => deleteServer(serverId)
        });
        break;
    }
  }

  // ========================================
  // API Calls
  // ========================================

  async function loadMembers() {
    if (isLoading.members || !currentServer) return;
    
    isLoading.members = true;
    const listEl = document.getElementById('sdm-members-list');
    if (listEl) listEl.innerHTML = renderMembersLoading();
    
    try {
      const response = await AdminUtils.api.get(API.serverMembers(currentServer.id));
      cachedMembers = Array.isArray(response) ? response : (response?.content || []);
      
      if (listEl) {
        listEl.innerHTML = renderMembersList(cachedMembers);
      }
    } catch (error) {
      console.error('[ServerDetailModal] Failed to load members:', error);
      if (listEl) listEl.innerHTML = renderEmptyState('members');
    } finally {
      isLoading.members = false;
    }
  }

  async function loadChannels() {
    if (isLoading.channels || !currentServer) return;
    
    isLoading.channels = true;
    const listEl = document.getElementById('sdm-channels-list');
    if (listEl) listEl.innerHTML = renderChannelsLoading();
    
    try {
      const response = await AdminUtils.api.get(API.serverChannels(currentServer.id));
      cachedChannels = Array.isArray(response) ? response : (response?.content || []);
      
      if (listEl) {
        listEl.innerHTML = renderChannelsList(cachedChannels);
      }
    } catch (error) {
      console.error('[ServerDetailModal] Failed to load channels:', error);
      if (listEl) listEl.innerHTML = renderEmptyState('channels');
    } finally {
      isLoading.channels = false;
    }
  }

  async function loadReports() {
    if (isLoading.reports || !currentServer) return;
    
    isLoading.reports = true;
    const listEl = document.getElementById('sdm-reports-list');
    if (listEl) listEl.innerHTML = renderReportsLoading();
    
    try {
      const response = await AdminUtils.api.get(API.serverReports(currentServer.id));
      // API returns { content: [...], totalElements, ... } or array
      cachedReports = Array.isArray(response) ? response : (response?.content || []);
      
      if (listEl) {
        listEl.innerHTML = renderReportsList(cachedReports);
      }
      
      // Update count
      const countEl = document.getElementById('sdm-reports-count');
      if (countEl) countEl.textContent = cachedReports.length;
    } catch (error) {
      console.error('[ServerDetailModal] Failed to load reports:', error);
      if (listEl) listEl.innerHTML = renderEmptyState('reports');
    } finally {
      isLoading.reports = false;
    }
  }

  async function loadAuditLogs() {
    if (isLoading.audit || !currentServer) return;
    
    isLoading.audit = true;
    const timelineEl = document.getElementById('sdm-audit-timeline');
    if (timelineEl) timelineEl.innerHTML = renderAuditLoading();
    
    try {
      const response = await AdminUtils.api.get(API.serverAudit(currentServer.id));
      // API returns { content: [...], totalElements, ... } or array
      cachedAuditLogs = Array.isArray(response) ? response : (response?.content || []);
      
      if (timelineEl) {
        timelineEl.innerHTML = renderAuditTimeline(cachedAuditLogs);
      }
    } catch (error) {
      console.error('[ServerDetailModal] Failed to load audit logs:', error);
      if (timelineEl) timelineEl.innerHTML = renderEmptyState('audit');
    } finally {
      isLoading.audit = false;
    }
  }

  async function lockServer(serverId) {
    try {
      await AdminUtils.api.post(API.lock(serverId));
      AdminUtils?.showToast?.('Server locked successfully', 'success');
      refreshServerData(serverId);
    } catch (error) {
      console.error('[ServerDetailModal] Failed to lock server:', error);
      AdminUtils?.showToast?.('Failed to lock server', 'danger');
    }
  }

  async function unlockServer(serverId) {
    try {
      await AdminUtils.api.post(API.unlock(serverId));
      AdminUtils?.showToast?.('Server unlocked successfully', 'success');
      refreshServerData(serverId);
    } catch (error) {
      console.error('[ServerDetailModal] Failed to unlock server:', error);
      AdminUtils?.showToast?.('Failed to unlock server', 'danger');
    }
  }

  async function suspendServer(serverId) {
    try {
      await AdminUtils.api.post(API.suspend(serverId));
      AdminUtils?.showToast?.('Server suspended successfully', 'success');
      refreshServerData(serverId);
    } catch (error) {
      console.error('[ServerDetailModal] Failed to suspend server:', error);
      AdminUtils?.showToast?.('Failed to suspend server', 'danger');
    }
  }

  async function unsuspendServer(serverId) {
    try {
      await AdminUtils.api.post(API.unsuspend(serverId));
      AdminUtils?.showToast?.('Server resumed successfully', 'success');
      refreshServerData(serverId);
    } catch (error) {
      console.error('[ServerDetailModal] Failed to resume server:', error);
      AdminUtils?.showToast?.('Failed to resume server', 'danger');
    }
  }

  async function deleteServer(serverId) {
    try {
      await AdminUtils.api.delete(API.deleteServer(serverId));
      AdminUtils?.showToast?.('Server deleted successfully', 'success');
      closeModal();
      // Refresh servers list
      if (window.AdminServers?.fetchServers) {
        AdminServers.fetchServers();
      }
    } catch (error) {
      console.error('[ServerDetailModal] Failed to delete server:', error);
      AdminUtils?.showToast?.('Failed to delete server', 'danger');
    }
  }

  async function refreshServerData(serverId) {
    try {
      const server = await AdminUtils.api.get(API.server(serverId));
      if (server) {
        currentServer = server;
        // Re-render modal with new data
        if (modalElement) {
          modalElement.remove();
        }
        renderModal();
        setTimeout(() => attachEventListeners(), 0);
        
        // Clear cached data
        cachedReports = null;
        cachedAuditLogs = null;
      }
    } catch (error) {
      console.error('[ServerDetailModal] Failed to refresh server data:', error);
    }
  }

  async function fetchUserAndOpenModal(userId) {
    try {
      const user = await AdminUtils.api.get(`/api/admin/users/${userId}`);
      if (user && window.UserDetailModal) {
        UserDetailModal.open(user);
      }
    } catch (error) {
      console.error('[ServerDetailModal] Failed to fetch user:', error);
      AdminUtils?.showToast?.('Failed to load user profile', 'danger');
    }
  }

  // ========================================
  // Confirmation Modal
  // ========================================

  function showConfirmationModal(options) {
    const { title, message, confirmText, confirmClass, isDangerous, onConfirm } = options;
    
    const existingModal = document.getElementById('sdm-confirmation-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'sdm-confirmation-modal';
    modal.className = 'admin-modal-backdrop glass-backdrop';
    modal.style.cssText = 'display: flex; z-index: 1200;';
    modal.innerHTML = `
      <div class="admin-modal admin-modal-sm glass-modal confirmation-modal">
        <div class="confirmation-modal-header ${isDangerous ? 'confirmation-header-danger' : 'confirmation-header-warning'}">
          <div class="confirmation-modal-icon">
            ${isDangerous ? `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 20h20L12 2z"/>
                <path d="M12 9v4M12 17v.01"/>
              </svg>
            ` : `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16v.01"/>
              </svg>
            `}
          </div>
          <h3 class="confirmation-modal-title">${escapeHtml(title)}</h3>
        </div>
        <div class="admin-modal-body">
          <p class="confirmation-message">${escapeHtml(message)}</p>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-btn admin-btn-ghost" id="sdm-confirm-cancel">Cancel</button>
          <button class="admin-btn ${confirmClass || 'admin-btn-primary'}" id="sdm-confirm-ok">
            ${escapeHtml(confirmText || 'Confirm')}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeConfirmModal = () => {
      modal.remove();
    };
    
    modal.querySelector('#sdm-confirm-cancel').addEventListener('click', closeConfirmModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeConfirmModal();
    });
    
    modal.querySelector('#sdm-confirm-ok').addEventListener('click', () => {
      closeConfirmModal();
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  // ========================================
  // Utility Functions
  // ========================================

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  function getServerColor(id) {
    const colors = [
      'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
      'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)'
    ];
    return colors[(id || 0) % colors.length];
  }

  function getAvatarColor(id) {
    const colors = ['#4F507F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[(id || 0) % colors.length];
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return formatDateTime(dateStr);
  }

  function getAuditDotClass(action) {
    const mapping = {
      'SERVER_CREATED': 'success',
      'SERVER_UPDATED': 'info',
      'MEMBER_JOINED': 'success',
      'MEMBER_LEFT': 'warning',
      'MEMBER_KICKED': 'danger',
      'MEMBER_BANNED': 'danger',
      'SERVER_LOCKED': 'warning',
      'SERVER_UNLOCKED': 'success',
      'SERVER_SUSPENDED': 'danger',
      'SERVER_UNSUSPENDED': 'success',
      'SERVER_DELETED': 'danger',
      'CHANNEL_CREATED': 'success',
      'CHANNEL_DELETED': 'danger',
      'ROLE_CREATED': 'info',
      'ROLE_UPDATED': 'info',
      'ROLE_DELETED': 'warning'
    };
    return mapping[action] || 'info';
  }

  function getAuditActionLabel(action) {
    const labels = {
      'SERVER_CREATED': 'Server được tạo',
      'SERVER_UPDATED': 'Server được cập nhật',
      'MEMBER_JOINED': 'Thành viên tham gia',
      'MEMBER_LEFT': 'Thành viên rời đi',
      'MEMBER_KICKED': 'Thành viên bị kick',
      'MEMBER_BANNED': 'Thành viên bị cấm',
      'SERVER_LOCKED': 'Server bị khóa',
      'SERVER_UNLOCKED': 'Server được mở khóa',
      'SERVER_SUSPENDED': 'Server bị tạm ngưng',
      'SERVER_UNSUSPENDED': 'Server được khôi phục',
      'SERVER_DELETED': 'Server bị xóa',
      'CHANNEL_CREATED': 'Kênh được tạo',
      'CHANNEL_DELETED': 'Kênh bị xóa',
      'ROLE_CREATED': 'Role được tạo',
      'ROLE_UPDATED': 'Role được cập nhật',
      'ROLE_DELETED': 'Role bị xóa'
    };
    return labels[action] || action;
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    open,
    close,
    closeModal,
    switchTab
  };

})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ServerDetailModal.init);
} else {
  ServerDetailModal.init();
}