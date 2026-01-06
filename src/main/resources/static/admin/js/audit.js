/**
 * CoCoCord Admin - Audit Log Page V2
 * Modern timeline-style audit log with Vietnamese UI
 * All user-facing text in Vietnamese
 */

var AdminAudit = window.AdminAudit || (function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================

  const CONFIG = {
    apiBase: '/api/admin',
    pageSize: 50
  };

  // ========================================
  // State
  // ========================================

  let currentFilters = {
    search: '',
    actor: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  };

  let auditLogs = [];
  let pagination = {
    page: 0,
    size: CONFIG.pageSize,
    totalElements: 0,
    totalPages: 0
  };
  let isLoading = false;

  // ========================================
  // Vietnamese Action Map
  // ========================================

  const ACTION_MAP = {
    // User actions
    'user_ban': { 
      icon: 'fas fa-user-slash', 
      label: 'Cấm người dùng',
      iconClass: 'icon-danger',
      description: 'Người dùng đã bị cấm khỏi nền tảng'
    },
    'USER_BAN': { 
      icon: 'fas fa-user-slash', 
      label: 'Cấm người dùng',
      iconClass: 'icon-danger',
      description: 'Quản trị viên đã cấm người dùng khỏi nền tảng'
    },
    'USER_BANNED': { 
      icon: 'fas fa-user-slash', 
      label: 'Cấm người dùng',
      iconClass: 'icon-danger',
      description: 'Người dùng đã bị cấm khỏi nền tảng'
    },
    'user_unban': { 
      icon: 'fas fa-user-check', 
      label: 'Gỡ cấm người dùng',
      iconClass: 'icon-success',
      description: 'Người dùng đã được gỡ bỏ lệnh cấm'
    },
    'USER_UNBAN': { 
      icon: 'fas fa-user-check', 
      label: 'Gỡ cấm người dùng',
      iconClass: 'icon-success',
      description: 'Quản trị viên đã gỡ bỏ lệnh cấm cho người dùng'
    },
    'USER_UNBANNED': { 
      icon: 'fas fa-user-check', 
      label: 'Gỡ cấm người dùng',
      iconClass: 'icon-success',
      description: 'Người dùng đã được gỡ bỏ lệnh cấm'
    },
    'USER_ROLE_CHANGE': { 
      icon: 'fas fa-user-tag', 
      label: 'Thay đổi vai trò',
      iconClass: 'icon-info',
      description: 'Vai trò của người dùng đã được thay đổi'
    },
    'USER_MUTED': { 
      icon: 'fas fa-volume-mute', 
      label: 'Tắt tiếng người dùng',
      iconClass: 'icon-warning',
      description: 'Người dùng đã bị tắt tiếng'
    },
    'USER_UNMUTED': { 
      icon: 'fas fa-volume-up', 
      label: 'Bật tiếng người dùng',
      iconClass: 'icon-success',
      description: 'Người dùng đã được bật tiếng trở lại'
    },
    'USER_CREATED': { 
      icon: 'fas fa-user-plus', 
      label: 'Tạo người dùng',
      iconClass: 'icon-success',
      description: 'Người dùng mới đã được tạo'
    },
    'USER_DELETED': { 
      icon: 'fas fa-user-times', 
      label: 'Xóa người dùng',
      iconClass: 'icon-danger',
      description: 'Tài khoản người dùng đã bị xóa'
    },
    'USER_UPDATED': { 
      icon: 'fas fa-user-edit', 
      label: 'Cập nhật người dùng',
      iconClass: 'icon-info',
      description: 'Thông tin người dùng đã được cập nhật'
    },
    
    // Server actions
    'server_suspend': { 
      icon: 'fas fa-lock', 
      label: 'Khóa máy chủ',
      iconClass: 'icon-warning',
      description: 'Máy chủ đã bị tạm khóa'
    },
    'SERVER_LOCK': { 
      icon: 'fas fa-lock', 
      label: 'Khóa máy chủ',
      iconClass: 'icon-warning',
      description: 'Quản trị viên đã khóa máy chủ'
    },
    'SERVER_LOCKED': { 
      icon: 'fas fa-lock', 
      label: 'Khóa máy chủ',
      iconClass: 'icon-warning',
      description: 'Máy chủ đã bị tạm khóa'
    },
    'server_restore': { 
      icon: 'fas fa-unlock', 
      label: 'Mở khóa máy chủ',
      iconClass: 'icon-success',
      description: 'Máy chủ đã được mở khóa'
    },
    'SERVER_UNLOCK': { 
      icon: 'fas fa-unlock', 
      label: 'Mở khóa máy chủ',
      iconClass: 'icon-success',
      description: 'Quản trị viên đã mở khóa máy chủ'
    },
    'SERVER_UNLOCKED': { 
      icon: 'fas fa-unlock', 
      label: 'Mở khóa máy chủ',
      iconClass: 'icon-success',
      description: 'Máy chủ đã được mở khóa'
    },
    'SERVER_DELETED': { 
      icon: 'fas fa-trash', 
      label: 'Xóa máy chủ',
      iconClass: 'icon-danger',
      description: 'Máy chủ đã bị xóa vĩnh viễn'
    },
    'SERVER_CREATED': { 
      icon: 'fas fa-server', 
      label: 'Tạo máy chủ',
      iconClass: 'icon-success',
      description: 'Máy chủ mới đã được tạo'
    },
    'SERVER_UPDATED': { 
      icon: 'fas fa-edit', 
      label: 'Cập nhật máy chủ',
      iconClass: 'icon-info',
      description: 'Thông tin máy chủ đã được cập nhật'
    },
    
    // Role actions
    'role_update': { 
      icon: 'fas fa-user-shield', 
      label: 'Cập nhật vai trò',
      iconClass: 'icon-info',
      description: 'Vai trò người dùng đã được thay đổi'
    },
    'ROLE_UPDATED': { 
      icon: 'fas fa-user-shield', 
      label: 'Cập nhật vai trò',
      iconClass: 'icon-info',
      description: 'Vai trò người dùng đã được thay đổi'
    },
    'ROLE_CREATED': { 
      icon: 'fas fa-plus-circle', 
      label: 'Tạo vai trò',
      iconClass: 'icon-success',
      description: 'Vai trò mới đã được tạo'
    },
    'ROLE_DELETED': { 
      icon: 'fas fa-minus-circle', 
      label: 'Xóa vai trò',
      iconClass: 'icon-danger',
      description: 'Vai trò đã bị xóa'
    },
    
    // Settings actions
    'settings_change': { 
      icon: 'fas fa-cog', 
      label: 'Thay đổi cài đặt',
      iconClass: 'icon-purple',
      description: 'Cài đặt hệ thống đã được cập nhật'
    },
    'SETTINGS_UPDATED': { 
      icon: 'fas fa-cog', 
      label: 'Thay đổi cài đặt',
      iconClass: 'icon-purple',
      description: 'Cài đặt hệ thống đã được cập nhật'
    },
    'SYSTEM_CONFIG_CHANGED': { 
      icon: 'fas fa-sliders-h', 
      label: 'Thay đổi cấu hình',
      iconClass: 'icon-purple',
      description: 'Cấu hình hệ thống đã được thay đổi'
    },
    
    // Auth actions
    'login': { 
      icon: 'fas fa-sign-in-alt', 
      label: 'Đăng nhập',
      iconClass: 'icon-info',
      description: 'Quản trị viên đã đăng nhập vào hệ thống'
    },
    'ADMIN_LOGIN': { 
      icon: 'fas fa-sign-in-alt', 
      label: 'Đăng nhập Admin',
      iconClass: 'icon-info',
      description: 'Quản trị viên đã đăng nhập vào hệ thống'
    },
    'ADMIN_LOGOUT': { 
      icon: 'fas fa-sign-out-alt', 
      label: 'Đăng xuất Admin',
      iconClass: 'icon-gray',
      description: 'Quản trị viên đã đăng xuất khỏi hệ thống'
    },
    
    // Report actions
    'report_review': { 
      icon: 'fas fa-flag', 
      label: 'Xem xét báo cáo',
      iconClass: 'icon-warning',
      description: 'Báo cáo đã được xem xét'
    },
    'REPORT_RESOLVED': { 
      icon: 'fas fa-check-circle', 
      label: 'Giải quyết báo cáo',
      iconClass: 'icon-success',
      description: 'Báo cáo đã được giải quyết thành công'
    },
    'REPORT_REJECTED': { 
      icon: 'fas fa-times-circle', 
      label: 'Từ chối báo cáo',
      iconClass: 'icon-warning',
      description: 'Báo cáo đã bị từ chối'
    },
    'REPORT_CREATED': { 
      icon: 'fas fa-flag', 
      label: 'Tạo báo cáo',
      iconClass: 'icon-warning',
      description: 'Báo cáo mới đã được tạo'
    },
    
    // Message actions
    'MESSAGE_DELETED': { 
      icon: 'fas fa-comment-slash', 
      label: 'Xóa tin nhắn',
      iconClass: 'icon-danger',
      description: 'Tin nhắn đã bị xóa'
    },
    'MESSAGE_EDITED': { 
      icon: 'fas fa-comment-dots', 
      label: 'Chỉnh sửa tin nhắn',
      iconClass: 'icon-info',
      description: 'Tin nhắn đã được chỉnh sửa'
    },
    
    // Channel actions
    'CHANNEL_CREATED': { 
      icon: 'fas fa-hashtag', 
      label: 'Tạo kênh',
      iconClass: 'icon-success',
      description: 'Kênh mới đã được tạo'
    },
    'CHANNEL_DELETED': { 
      icon: 'fas fa-hashtag', 
      label: 'Xóa kênh',
      iconClass: 'icon-danger',
      description: 'Kênh đã bị xóa'
    },
    'CHANNEL_UPDATED': { 
      icon: 'fas fa-hashtag', 
      label: 'Cập nhật kênh',
      iconClass: 'icon-info',
      description: 'Thông tin kênh đã được cập nhật'
    }
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminAudit] Khởi tạo Audit Log...');
    
    // Create modal if it doesn't exist
    ensureModalExists();
    
    setupEventListeners();
    fetchAuditLogs();
    
    console.log('[AdminAudit] Đã khởi tạo thành công');
  }

  function ensureModalExists() {
    // Check if modal already exists
    if (document.getElementById('auditModal')) {
      console.log('[AdminAudit] Modal đã tồn tại');
      return;
    }

    console.log('[AdminAudit] Tạo modal mới...');

    // Create modal HTML and append to body
    const modalHTML = `
      <div class="audit-modal" id="auditModal" style="display: none;">
        <div class="audit-modal-overlay" id="auditModalOverlay"></div>
        <div class="audit-modal-content">
          <div class="audit-modal-header">
            <h2 class="audit-modal-title">Chi tiết Audit Log</h2>
            <button class="audit-modal-close" id="btnCloseModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="audit-modal-body" id="auditModalBody">
            <!-- Modal content will be rendered here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('[AdminAudit] Đã tạo modal thành công');
  }

  // ========================================
  // API Calls
  // ========================================

  async function fetchAuditLogs() {
    if (isLoading) return;
    isLoading = true;
    showLoadingState();

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size
      });

      // Try to fetch from API
      const response = await AdminUtils.api.get(`${CONFIG.apiBase}/audit-log?${params}`);
      
      if (response && response.content) {
        auditLogs = response.content;
        pagination.totalElements = response.totalElements || 0;
        pagination.totalPages = response.totalPages || 0;
      } else if (Array.isArray(response)) {
        auditLogs = response;
        pagination.totalElements = response.length;
        pagination.totalPages = 1;
      } else {
        console.warn('[AdminAudit] API returned unexpected format, using mock data');
        generateMockData();
      }
      
      renderTimeline();
      updatePagination();
    } catch (error) {
      console.error('[AdminAudit] Lỗi khi tải audit log:', error);
      // Fallback to mock data
      generateMockData();
      renderTimeline();
      updatePagination();
    } finally {
      isLoading = false;
    }
  }

  // ========================================
  // Mock Data (Fallback)
  // ========================================

  function generateMockData() {
    const actors = [
      { name: 'Quản trị viên', email: 'admin@cococord.com', role: 'Quản trị viên' },
      { name: 'Điều hành viên', email: 'moderator@cococord.com', role: 'Điều hành viên' },
      { name: 'Hệ thống', email: 'system', role: 'Hệ thống' },
      { name: 'Hỗ trợ', email: 'support@cococord.com', role: 'Hỗ trợ' }
    ];
    
    const actions = Object.keys(ACTION_MAP);
    const targets = ['user_123', 'server_gaming', 'user_xyz', 'server_cococord', 'role_moderator', null];
    
    auditLogs = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const actor = actors[Math.floor(Math.random() * actors.length)];
      const actionType = actions[Math.floor(Math.random() * actions.length)];
      const date = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      auditLogs.push({
        id: i + 1,
        actor: actor.email,
        actorName: actor.name,
        actorRole: actor.role,
        actionType: actionType,
        target: targets[Math.floor(Math.random() * targets.length)],
        targetType: 'user',
        targetId: Math.floor(Math.random() * 1000),
        timestamp: date.toISOString(),
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        details: ACTION_MAP[actionType]?.description || 'Hành động đã được thực hiện',
        metadata: {
          reason: 'Vi phạm quy tắc cộng đồng',
          duration: '7 ngày',
          category: 'Nội dung không phù hợp'
        }
      });
    }
    
    // Sort by timestamp desc
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    pagination.totalElements = auditLogs.length;
    pagination.totalPages = Math.ceil(auditLogs.length / pagination.size);
  }

  // ========================================
  // Rendering
  // ========================================

  function showLoadingState() {
    const container = document.getElementById('auditTimeline');
    if (!container) return;

    const skeletonItems = Array(7).fill(0).map(() => `
      <div class="audit-skeleton-item">
        <div class="skeleton-icon"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line shorter"></div>
        </div>
      </div>
    `).join('');

    container.innerHTML = skeletonItems;
  }

  function renderTimeline() {
    const container = document.getElementById('auditTimeline');
    if (!container) return;
    
    const filtered = applyFilters();
    
    // Empty state
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="audit-empty-state">
          <i class="fas fa-search"></i>
          <h3>Không có audit log nào</h3>
          <p>Hãy thử thay đổi bộ lọc</p>
        </div>
      `;
      return;
    }
    
    // Render timeline items
    container.innerHTML = filtered.map(log => renderTimelineItem(log)).join('');
    
    // Attach click listeners
    document.querySelectorAll('.audit-item').forEach(item => {
      item.addEventListener('click', (e) => {
        console.log('[AdminAudit] Click on item, id:', item.dataset.id);
        if (!e.target.closest('.audit-more')) {
          openModal(item.dataset.id);
        }
      });
    });

    // Attach more button listeners
    document.querySelectorAll('.audit-more').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showMoreOptions(btn.closest('.audit-item').dataset.id);
      });
    });
  }

  function renderTimelineItem(log) {
    const actionInfo = getActionInfo(log);
    const actor = log.actorName || log.actor || 'Hệ thống';
    const actorRole = log.actorRole || getActorRole(log.actor);
    const timestamp = log.timestamp || log.createdAt;
    const relativeTime = formatRelativeTime(timestamp);
    
    return `
      <div class="audit-item" data-id="${log.id}">
        <div class="audit-icon ${actionInfo.iconClass}">
          <i class="${actionInfo.icon}"></i>
        </div>
        <div class="audit-content">
          <div class="audit-action">${actionInfo.label}</div>
          <div class="audit-actor">${actor} • ${actorRole}</div>
          <div class="audit-time">${relativeTime}</div>
        </div>
        <button class="audit-more">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </div>
    `;
  }

  function getActionInfo(log) {
    const actionType = log.actionType || log.action?.type || log.action || '';
    return ACTION_MAP[actionType] || { 
      icon: 'fas fa-info-circle', 
      label: actionType || 'Hành động không xác định',
      iconClass: 'icon-gray',
      description: 'Không có mô tả'
    };
  }

  function getActorRole(actor) {
    if (!actor) return 'Hệ thống';
    if (actor.includes('admin')) return 'Quản trị viên';
    if (actor.includes('moderator')) return 'Điều hành viên';
    if (actor.includes('system')) return 'Hệ thống';
    return 'Quản trị viên';
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatAbsoluteTime(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ========================================
  // Filtering
  // ========================================

  function applyFilters() {
    let filtered = [...auditLogs];
    
    // Search filter
    if (currentFilters.search) {
      const search = currentFilters.search.toLowerCase();
      filtered = filtered.filter(log => {
        const actor = (log.actorName || log.actor || '').toLowerCase();
        const actionInfo = getActionInfo(log);
        const actionLabel = actionInfo.label.toLowerCase();
        const target = (log.target || '').toLowerCase();
        
        return actor.includes(search) || 
               actionLabel.includes(search) || 
               target.includes(search);
      });
    }
    
    // Actor filter
    if (currentFilters.actor) {
      filtered = filtered.filter(log => {
        const actor = log.actor || '';
        if (currentFilters.actor === 'admin') return actor.includes('admin');
        if (currentFilters.actor === 'moderator') return actor.includes('moderator');
        if (currentFilters.actor === 'system') return actor.includes('system');
        return true;
      });
    }
    
    // Action filter
    if (currentFilters.action) {
      filtered = filtered.filter(log => 
        log.actionType === currentFilters.action
      );
    }
    
    // Date range filter
    if (currentFilters.dateFrom) {
      const fromDate = new Date(currentFilters.dateFrom);
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= fromDate
      );
    }
    
    if (currentFilters.dateTo) {
      const toDate = new Date(currentFilters.dateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= toDate
      );
    }
    
    return filtered;
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('filterSearch');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentFilters.search = e.target.value;
          renderTimeline();
          updateClearFiltersButton();
        }, 300);
      });
    }
    
    // Actor filter
    const actorFilter = document.getElementById('filterActor');
    if (actorFilter) {
      actorFilter.addEventListener('change', (e) => {
        currentFilters.actor = e.target.value;
        renderTimeline();
        updateClearFiltersButton();
      });
    }
    
    // Action filter
    const actionFilter = document.getElementById('filterAction');
    if (actionFilter) {
      actionFilter.addEventListener('change', (e) => {
        currentFilters.action = e.target.value;
        renderTimeline();
        updateClearFiltersButton();
      });
    }
    
    // Date filters
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    
    if (dateFrom) {
      dateFrom.addEventListener('change', (e) => {
        currentFilters.dateFrom = e.target.value;
        renderTimeline();
        updateClearFiltersButton();
      });
    }
    
    if (dateTo) {
      dateTo.addEventListener('change', (e) => {
        currentFilters.dateTo = e.target.value;
        renderTimeline();
        updateClearFiltersButton();
      });
    }
    
    // Clear filters button
    const clearBtn = document.getElementById('btnClearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearFilters);
    }
    
    // Export button
    const exportBtn = document.getElementById('btnExport');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExport);
    }

    // Pagination
    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (pagination.page > 0) {
          pagination.page--;
          fetchAuditLogs();
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (pagination.page < pagination.totalPages - 1) {
          pagination.page++;
          fetchAuditLogs();
        }
      });
    }

    // Modal close
    const modalOverlay = document.getElementById('auditModalOverlay');
    const modalClose = document.getElementById('btnCloseModal');
    
    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeModal);
    }
    
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  function updateClearFiltersButton() {
    const clearBtn = document.getElementById('btnClearFilters');
    if (!clearBtn) return;
    
    const hasActiveFilters = 
      currentFilters.search || 
      currentFilters.actor || 
      currentFilters.action || 
      currentFilters.dateFrom || 
      currentFilters.dateTo;
    
    clearBtn.style.display = hasActiveFilters ? 'block' : 'none';
  }

  function clearFilters() {
    currentFilters = {
      search: '',
      actor: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    };
    
    // Reset UI
    const searchInput = document.getElementById('filterSearch');
    const actorFilter = document.getElementById('filterActor');
    const actionFilter = document.getElementById('filterAction');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    
    if (searchInput) searchInput.value = '';
    if (actorFilter) actorFilter.value = '';
    if (actionFilter) actionFilter.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    renderTimeline();
    updateClearFiltersButton();
  }

  // ========================================
  // Pagination
  // ========================================

  function updatePagination() {
    const paginationEl = document.getElementById('auditPagination');
    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');
    const infoEl = document.getElementById('paginationInfo');
    
    if (!paginationEl) return;
    
    if (pagination.totalPages <= 1) {
      paginationEl.style.display = 'none';
      return;
    }
    
    paginationEl.style.display = 'flex';
    
    if (prevBtn) {
      prevBtn.disabled = pagination.page === 0;
    }
    
    if (nextBtn) {
      nextBtn.disabled = pagination.page >= pagination.totalPages - 1;
    }
    
    if (infoEl) {
      infoEl.textContent = `Trang ${pagination.page + 1} / ${pagination.totalPages}`;
    }
  }

  // ========================================
  // Modal
  // ========================================

  function openModal(logId) {
    console.log('[AdminAudit] openModal called with id:', logId);
    console.log('[AdminAudit] auditLogs count:', auditLogs.length);
    
    const log = auditLogs.find(l => l.id == logId);
    console.log('[AdminAudit] Found log:', log);
    
    if (!log) {
      console.warn('[AdminAudit] Không tìm thấy log với ID:', logId);
      return;
    }
    
    const modal = document.getElementById('auditModal');
    const modalBody = document.getElementById('auditModalBody');
    
    console.log('[AdminAudit] Modal element:', modal);
    console.log('[AdminAudit] Modal body element:', modalBody);
    
    if (!modal || !modalBody) {
      console.warn('[AdminAudit] Không tìm thấy modal elements');
      return;
    }
    
    const actionInfo = getActionInfo(log);
    const actor = log.actorName || log.actor || 'Hệ thống';
    const actorRole = log.actorRole || getActorRole(log.actor);
    const actorInitial = actor.charAt(0).toUpperCase();
    const timestamp = log.timestamp || log.createdAt;
    const absoluteTime = formatAbsoluteTime(timestamp);
    const relativeTime = formatRelativeTime(timestamp);
    
    // Build target section HTML
    const targetHtml = buildTargetSection(log);
    
    modalBody.innerHTML = `
      <!-- Action Type -->
      <div class="modal-section">
        <div class="modal-section-title">Loại hành động</div>
        <div class="modal-action-badge badge-${getBadgeClass(actionInfo.iconClass)}">
          <i class="${actionInfo.icon}"></i>
          ${actionInfo.label}
        </div>
      </div>

      <!-- Actor -->
      <div class="modal-section">
        <div class="modal-section-title">Người thực hiện</div>
        <div class="modal-actor-info">
          <div class="modal-actor-avatar">${actorInitial}</div>
          <div class="modal-actor-details">
            <div class="modal-actor-name">${actor}</div>
            <div class="modal-actor-role">${actorRole}</div>
          </div>
        </div>
      </div>

      <!-- Target -->
      ${targetHtml}

      <!-- Description -->
      <div class="modal-section">
        <div class="modal-section-title">Mô tả hành động</div>
        <div class="modal-description">${buildDescription(log, actionInfo)}</div>
      </div>

      <!-- Timestamp -->
      <div class="modal-section">
        <div class="modal-section-title">Thời gian</div>
        <div class="modal-timestamp">
          <div class="modal-timestamp-absolute">${absoluteTime}</div>
          <div class="modal-timestamp-relative">${relativeTime}</div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="modal-section">
        <div class="modal-section-title">Thông tin bổ sung</div>
        <div class="modal-metadata">
          ${log.ipAddress ? `
          <div class="modal-metadata-row">
            <div class="modal-metadata-key">Địa chỉ IP</div>
            <div class="modal-metadata-value">${log.ipAddress}</div>
          </div>
          ` : ''}
          ${log.userAgent ? `
          <div class="modal-metadata-row">
            <div class="modal-metadata-key">Trình duyệt</div>
            <div class="modal-metadata-value">${log.userAgent}</div>
          </div>
          ` : ''}
          ${log.reason ? `
          <div class="modal-metadata-row">
            <div class="modal-metadata-key">Lý do</div>
            <div class="modal-metadata-value">${log.reason}</div>
          </div>
          ` : ''}
          ${log.duration ? `
          <div class="modal-metadata-row">
            <div class="modal-metadata-key">Thời hạn</div>
            <div class="modal-metadata-value">${log.duration}</div>
          </div>
          ` : ''}
          ${log.metadata ? Object.entries(log.metadata).map(([key, value]) => `
          <div class="modal-metadata-row">
            <div class="modal-metadata-key">${translateMetadataKey(key)}</div>
            <div class="modal-metadata-value">${value}</div>
          </div>
          `).join('') : ''}
          <div class="modal-metadata-row">
            <div class="modal-metadata-key">Mã log</div>
            <div class="modal-metadata-value">#${log.id}</div>
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('auditModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function getBadgeClass(iconClass) {
    if (iconClass.includes('danger')) return 'danger';
    if (iconClass.includes('success')) return 'success';
    if (iconClass.includes('warning')) return 'warning';
    if (iconClass.includes('info')) return 'info';
    if (iconClass.includes('purple')) return 'purple';
    return 'gray';
  }

  function buildTargetSection(log) {
    if (!log.target && !log.targetName && !log.targetId) return '';
    
    const targetName = log.targetName || log.target || `ID: ${log.targetId}`;
    const targetType = getTargetTypeLabel(log.targetType);
    
    return `
      <div class="modal-section">
        <div class="modal-section-title">Đối tượng bị tác động</div>
        <div class="modal-target-info">
          <div class="modal-target-name">${targetName}</div>
          <div class="modal-target-type">${targetType}</div>
        </div>
      </div>
    `;
  }

  function getTargetTypeLabel(type) {
    const types = {
      'user': 'Người dùng',
      'USER': 'Người dùng',
      'server': 'Máy chủ',
      'SERVER': 'Máy chủ',
      'channel': 'Kênh',
      'CHANNEL': 'Kênh',
      'role': 'Vai trò',
      'ROLE': 'Vai trò',
      'message': 'Tin nhắn',
      'MESSAGE': 'Tin nhắn'
    };
    return types[type] || type || 'Không xác định';
  }

  function buildDescription(log, actionInfo) {
    // Use custom description if available
    if (log.description) return log.description;
    
    const actor = log.actorName || log.actor || 'Hệ thống';
    const target = log.targetName || log.target || '';
    const actionType = log.actionType || '';
    
    // Build contextual description
    const descriptions = {
      'SERVER_LOCK': `${actor} đã khóa máy chủ${target ? ` "${target}"` : ''}.`,
      'SERVER_UNLOCK': `${actor} đã mở khóa máy chủ${target ? ` "${target}"` : ''}.`,
      'USER_BAN': `${actor} đã cấm người dùng${target ? ` "${target}"` : ''} khỏi nền tảng.`,
      'USER_UNBAN': `${actor} đã gỡ lệnh cấm cho người dùng${target ? ` "${target}"` : ''}.`,
      'USER_ROLE_CHANGE': `${actor} đã thay đổi vai trò của người dùng${target ? ` "${target}"` : ''}.`,
      'ROLE_UPDATED': `${actor} đã cập nhật quyền hạn vai trò${target ? ` "${target}"` : ''}.`
    };
    
    return descriptions[actionType] || actionInfo.description || 'Hành động đã được thực hiện.';
  }

  function translateMetadataKey(key) {
    const translations = {
      'reason': 'Lý do',
      'duration': 'Thời hạn',
      'category': 'Danh mục',
      'notes': 'Ghi chú',
      'status': 'Trạng thái'
    };
    return translations[key] || key;
  }

  function showMoreOptions(logId) {
    const log = auditLogs.find(l => l.id == logId);
    if (!log) return;
    
    // Create context menu (simplified version)
    const options = [
      { label: 'Xem chi tiết', action: () => openModal(logId) },
      { label: 'Sao chép mã log', action: () => copyLogId(logId) }
    ];
    
    // For now, just open modal
    openModal(logId);
  }

  function copyLogId(logId) {
    const text = `#${logId}`;
    navigator.clipboard.writeText(text).then(() => {
      if (window.AdminUtils?.showToast) {
        AdminUtils.showToast('Đã sao chép mã log', 'success');
      }
    });
  }

  // ========================================
  // Export
  // ========================================

  function handleExport() {
    if (auditLogs.length === 0) {
      if (window.AdminUtils?.showToast) {
        AdminUtils.showToast('Không có dữ liệu để xuất', 'warning');
      }
      return;
    }
    
    const filtered = applyFilters();
    const header = 'Mã,Tác nhân,Hành động,Mục tiêu,Thời gian,Địa chỉ IP\n';
    const csvContent = filtered.map(log => {
      const actor = log.actorName || log.actor || 'Hệ thống';
      const actionInfo = getActionInfo(log);
      const target = log.target || '';
      const timestamp = formatAbsoluteTime(log.timestamp);
      const ip = log.ipAddress || '';
      return `${log.id},"${actor}","${actionInfo.label}","${target}","${timestamp}","${ip}"`;
    }).join('\n');
    
    const blob = new Blob(['\ufeff' + header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    if (window.AdminUtils?.showToast) {
      AdminUtils.showToast('Đã xuất audit log', 'success');
    }
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: fetchAuditLogs,
    openDetail: openModal
  };

})();

// Expose to window
window.AdminAudit = AdminAudit;
