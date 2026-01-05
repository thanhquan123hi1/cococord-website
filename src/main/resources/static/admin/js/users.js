/**
 * CoCoCord Admin - Users Page JavaScript
 * Handles user table, filters, search, and modal interactions using real API
 */

var AdminUsers = window.AdminUsers || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let currentFilters = {
    search: '',
    status: '',
    role: '',
    time: ''
  };

  let pagination = {
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  };

  let sortConfig = {
    sortBy: 'createdAt',
    sortDir: 'desc'
  };

  let usersData = [];
  let allUsers = [];
  let selectedUsers = new Set();
  let isLoading = false;
  let currentUser = null; // User currently being viewed in modal

  // Realtime presence
  let presenceUnsub = null;

  // Presence-only filter (independent from backend status/role/time)
  let presenceFilter = ''; // '' | 'online' | 'offline'

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    users: '/api/admin/users',
    userById: (id) => `/api/admin/users/${id}`,
    ban: (id) => `/api/admin/users/${id}/ban`,
    unban: (id) => `/api/admin/users/${id}/unban`,
    mute: (id) => `/api/admin/users/${id}/mute`,
    unmute: (id) => `/api/admin/users/${id}/unmute`,
    updateRole: (id) => `/api/admin/users/${id}/role`,
    deleteUser: (id) => `/api/admin/users/${id}`,
    dashboardSummary: '/api/admin/dashboard/summary'
  };

  // ========================================
  // Initialization
  // ========================================

  async function init() {
    console.log('[AdminUsers] Initializing...');
    
    // Setup event listeners first
    initSearch();
    initFilters();
    initSorting();
    initSelectAll();
    initBulkActions();
    initBulkRoleModal();
    initStatCards();
    initModal();
    initAddUserModal();
    initRefreshButton();
    initRightClickMenu();
    initQuickBanModal();
    initModerationTab();
    initActiveNowModal();
    initRealtimePresence();
    
    // Fetch data
    await Promise.all([
      fetchUsers(),
      fetchStats()
    ]);
    
    console.log('[AdminUsers] Initialized');
  }

  function initBulkRoleModal() {
    const modal = document.getElementById('bulk-role-modal');
    if (!modal) return;

    // Close buttons (X + Cancel)
    document.querySelectorAll('[data-action="close-bulk-role-modal"]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal('bulk-role-modal'));
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal('bulk-role-modal');
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const isOpen = modal.style.display !== 'none' && modal.style.display !== '';
      if (isOpen) closeModal('bulk-role-modal');
    });
  }

  // ========================================
  // Data Fetching
  // ========================================

  async function fetchUsers() {
    if (isLoading) return;
    isLoading = true;
    
    showLoadingState();
    
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size,
        sortBy: sortConfig.sortBy,
        sortDir: sortConfig.sortDir
      });
      
      if (currentFilters.search) {
        params.append('search', currentFilters.search);
      }
      if (currentFilters.status) {
        params.append('status', currentFilters.status);
      }
      if (currentFilters.role) {
        params.append('role', currentFilters.role);
      }
      
      const response = await AdminUtils.api.get(`${API.users}?${params}`);
      
      allUsers = response.content || [];
      usersData = allUsers;

      // Seed realtime presence snapshot for UI-first realtime features
      if (window.AdminPresence && AdminPresence.seedUsers) {
        await Promise.resolve(AdminPresence.seedUsers(allUsers));
      }

      pagination.total = response.totalElements || 0;
      pagination.totalPages = response.totalPages || 0;
      
      applyPresenceFilterAndRender();
      renderPagination();

      updateActiveNowStat();
      updateRealtimeFilterSummary();
      
      return usersData;
    } catch (error) {
      console.error('[AdminUsers] Failed to fetch users:', error);
      AdminUtils.showToast('Không thể tải danh sách người dùng', 'error');
      showEmptyState('Không thể tải dữ liệu');
    } finally {
      isLoading = false;
    }
  }

  async function fetchStats() {
    try {
      const response = await AdminUtils.api.get(API.dashboardSummary);
      
      // Update stat cards
      setStatValue('stat-total-users', response.totalUsers);
      updateActiveNowStat();
      setStatValue('stat-new-users', response.usersGrowth ? `+${Math.round(response.usersGrowth)}%` : '--');
      setStatValue('stat-banned-users', response.bannedUsers);
    } catch (error) {
      console.error('[AdminUsers] Failed to fetch stats:', error);
    }
  }

  function setStatValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value != null ? AdminUtils.formatNumber(value) : '--';
    }
  }

  function updateActiveNowStat() {
    const el = document.getElementById('stat-active-users');
    if (!el) return;
    const count = window.AdminPresence && AdminPresence.countOnline ? AdminPresence.countOnline() : 0;
    el.textContent = AdminUtils.formatNumber(count);
  }

  function initPresenceFilter() {
    const el = document.getElementById('filter-presence');
    if (!el) return;

    el.addEventListener('change', () => {
      presenceFilter = el.value || '';

      // Selection no longer valid after list changes
      selectedUsers.clear();
      updateCheckboxes();
      updateSelectAllCheckbox();
      updateBulkActionsBar();

      applyPresenceFilterAndRender();
      updateRealtimeFilterSummary();
    });
  }

  function applyPresenceFilterAndRender() {
    const p = (presenceFilter || '').toLowerCase();
    const hasPresence = window.AdminPresence && typeof AdminPresence.isOnline === 'function';

    if (!p) {
      usersData = allUsers.slice();
      renderUsersTable();
      return;
    }

    usersData = allUsers.filter((u) => {
      const isOnline = hasPresence ? AdminPresence.isOnline(u.id) === true : false;
      if (p === 'online') return isOnline;
      if (p === 'offline') return !isOnline;
      return true;
    });

    renderUsersTable();
  }

  function updateRealtimeFilterSummary() {
    const visibleEl = document.getElementById('realtime-visible-count');
    const totalEl = document.getElementById('realtime-total-count');
    const onlineEl = document.getElementById('realtime-online-count');
    const offlineEl = document.getElementById('realtime-offline-count');
    if (!visibleEl || !totalEl || !onlineEl || !offlineEl) return;

    const visible = Array.isArray(usersData) ? usersData.length : 0;
    const total = Number.isFinite(pagination.total) ? pagination.total : (Array.isArray(allUsers) ? allUsers.length : 0);

    let onlineCount = 0;
    let offlineCount = 0;

    const hasPresence = window.AdminPresence && typeof AdminPresence.isOnline === 'function';
    (usersData || []).forEach((u) => {
      const isOnline = !u?.isBanned && hasPresence && AdminPresence.isOnline(u.id) === true;
      if (isOnline) onlineCount += 1;
      else offlineCount += 1;
    });

    visibleEl.textContent = AdminUtils.formatNumber(visible);
    totalEl.textContent = AdminUtils.formatNumber(total);
    onlineEl.textContent = AdminUtils.formatNumber(onlineCount);
    offlineEl.textContent = AdminUtils.formatNumber(offlineCount);
  }

  // ========================================
  // Table Rendering
  // ========================================

  function showLoadingState() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = `
      <tr class="skeleton-row">
        <td colspan="8">
          <div class="skeleton-loading">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
          </div>
        </td>
      </tr>
    `;
  }

  function showEmptyState(message = 'Không tìm thấy người dùng') {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center" style="padding: 40px;">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:16px;opacity:0.5">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
            </svg>
            <p style="margin:0;color:var(--admin-text-secondary)">${message}</p>
          </div>
        </td>
      </tr>
    `;
  }

  function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    if (usersData.length === 0) {
      showEmptyState();
      return;
    }
    
    tbody.innerHTML = usersData.map(user => `
      <tr data-id="${user.id}" class="${selectedUsers.has(user.id) ? 'selected' : ''}">
        <td>
          <input type="checkbox" class="user-checkbox admin-checkbox" value="${user.id}" ${selectedUsers.has(user.id) ? 'checked' : ''}>
        </td>
        <td class="cell-id">${user.id}</td>
        <td>
          <div class="cell-user">
            <div class="user-avatar-sm" style="background: ${getAvatarColor(user.id)};">
              ${user.avatarUrl 
                ? `<img src="${user.avatarUrl}" alt="${user.username}">`
                : `<span>${getInitials(user.username)}</span>`
              }
            </div>
            <div class="cell-user-info">
              <span class="cell-user-name">${escapeHtml(user.displayName || user.username)}</span>
              <span class="cell-user-email">${escapeHtml(user.email)}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-role badge-${getRoleClass(user.role)}">${user.role || 'USER'}</span>
        </td>
        <td>
          <span class="badge badge-${getStatusClass(user)}">${getStatusText(user)}</span>
        </td>
        <td>${AdminUtils.formatDate(user.createdAt, { year: true })}</td>
        <td>${user.lastLogin ? AdminUtils.timeAgo(user.lastLogin) : 'Chưa đăng nhập'}</td>
        <td class="cell-presence" data-presence-user="${user.id}">
          ${renderPresenceBadge(user)}
        </td>
      </tr>
    `).join('');
    
    // View is left-click on row; actions are in right-click context menu.
    attachRowViewListeners();
    attachCheckboxListeners();
  }

  function renderPresenceBadge(user) {
    const isOnline = !user?.isBanned && window.AdminPresence && AdminPresence.isOnline
      ? AdminPresence.isOnline(user.id)
      : false;

    return isOnline
      ? '<span class="badge badge-success">Online</span>'
      : '<span class="badge badge-default">Offline</span>';
  }

  function attachRowViewListeners() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.querySelectorAll('tr[data-id]').forEach((row) => {
      row.addEventListener('click', async (e) => {
        if (e.target.closest('input[type="checkbox"]')) return;

        const userId = parseInt(row.dataset.id);
        if (Number.isFinite(userId)) {
          await showUserDetailModal(userId);
        }
      });
    });
  }

  function getStatusClass(user) {
    if (user.isBanned) return 'danger';
    if (user.isMuted) return 'warning';
    if (user.isActive) return 'success';
    return 'default';
  }

  function getStatusText(user) {
    if (user.isBanned) return 'Đã cấm';
    if (user.isMuted) return 'Đã tắt tiếng';
    if (user.isActive) return 'Hoạt động';
    return 'Không hoạt động';
  }

  function getRoleClass(role) {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'admin';
      case 'MODERATOR': return 'mod';
      default: return 'user';
    }
  }

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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
    return colors[id % colors.length];
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

  // ========================================
  // Pagination
  // ========================================

  function renderPagination() {
    const fromEl = document.getElementById('pagination-from');
    const toEl = document.getElementById('pagination-to');
    const totalEl = document.getElementById('pagination-total');
    const controlsEl = document.getElementById('pagination-controls');
    
    const from = pagination.total > 0 ? pagination.page * pagination.size + 1 : 0;
    const to = Math.min((pagination.page + 1) * pagination.size, pagination.total);
    
    if (fromEl) fromEl.textContent = from;
    if (toEl) toEl.textContent = to;
    if (totalEl) totalEl.textContent = pagination.total;
    
    if (controlsEl) {
      const buttons = [];
      
      // Previous button
      buttons.push(`
        <button class="pagination-btn" ${pagination.page === 0 ? 'disabled' : ''} data-page="${pagination.page - 1}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 4l-4 4 4 4"/></svg>
        </button>
      `);
      
      // Page numbers
      const maxButtons = 5;
      let startPage = Math.max(0, pagination.page - Math.floor(maxButtons / 2));
      let endPage = Math.min(pagination.totalPages - 1, startPage + maxButtons - 1);
      
      if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(0, endPage - maxButtons + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        buttons.push(`
          <button class="pagination-btn ${i === pagination.page ? 'active' : ''}" data-page="${i}">
            ${i + 1}
          </button>
        `);
      }
      
      // Next button
      buttons.push(`
        <button class="pagination-btn" ${pagination.page >= pagination.totalPages - 1 ? 'disabled' : ''} data-page="${pagination.page + 1}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l4 4-4 4"/></svg>
        </button>
      `);
      
      controlsEl.innerHTML = buttons.join('');
      
      // Attach pagination click handlers
      controlsEl.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (btn.disabled) return;
          const page = parseInt(btn.dataset.page);
          if (page >= 0 && page < pagination.totalPages) {
            pagination.page = page;
            await fetchUsers();
          }
        });
      });
    }
  }

  // ========================================
  // Search & Filters
  // ========================================

  function initSearch() {
    const searchInput = document.getElementById('user-search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', AdminUtils.debounce(async (e) => {
      currentFilters.search = e.target.value.trim();
      pagination.page = 0;
      await fetchUsers();
    }, 300));
  }

  function initFilters() {
    const filterStatus = document.getElementById('filter-status');
    const filterRole = document.getElementById('filter-role');
    const filterTime = document.getElementById('filter-time');
    
    if (filterStatus) {
      filterStatus.addEventListener('change', async (e) => {
        currentFilters.status = e.target.value;
        pagination.page = 0;
        await fetchUsers();
      });
    }
    
    if (filterRole) {
      filterRole.addEventListener('change', async (e) => {
        currentFilters.role = e.target.value;
        pagination.page = 0;
        await fetchUsers();
      });
    }
    
    if (filterTime) {
      filterTime.addEventListener('change', async (e) => {
        currentFilters.time = e.target.value;
        pagination.page = 0;
        await fetchUsers();
      });
    }

    initPresenceFilter();
  }

  function initSorting() {
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', async (e) => {
        const [sortBy, sortDir] = e.target.value.split('-');
        sortConfig.sortBy = sortBy;
        sortConfig.sortDir = sortDir;
        pagination.page = 0;
        await fetchUsers();
      });
    }
    
    // Table header sorting
    document.querySelectorAll('.admin-table th.sortable').forEach(th => {
      th.addEventListener('click', async () => {
        const sortBy = th.dataset.sort;
        if (sortConfig.sortBy === sortBy) {
          sortConfig.sortDir = sortConfig.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortConfig.sortBy = sortBy;
          sortConfig.sortDir = 'asc';
        }
        pagination.page = 0;
        await fetchUsers();
      });
    });
  }

  function initStatCards() {
    document.querySelectorAll('.admin-stat-card.clickable').forEach(card => {
      card.addEventListener('click', async () => {
        const filterStatus = card.dataset.filterStatus;
        const filterTime = card.dataset.filterTime;

        // Active Now opens realtime list
        if (filterStatus === 'active') {
          openActiveNowModal();
          return;
        }
        
        if (filterStatus !== undefined) {
          currentFilters.status = filterStatus;
          const statusSelect = document.getElementById('filter-status');
          if (statusSelect) statusSelect.value = filterStatus;
        }
        
        if (filterTime) {
          currentFilters.time = filterTime;
          const timeSelect = document.getElementById('filter-time');
          if (timeSelect) timeSelect.value = filterTime;
        }
        
        pagination.page = 0;
        await fetchUsers();
      });
    });
  }

  function initActiveNowModal() {
    document.querySelectorAll('[data-action="close-active-now"]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal('active-now-modal'));
    });

    const modal = document.getElementById('active-now-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal('active-now-modal');
      });
    }

    const search = document.getElementById('active-now-search-input');
    if (search) {
      search.addEventListener('input', () => {
        const m = document.getElementById('active-now-modal');
        if (m && m.style.display === 'flex') {
          renderActiveNowList();
        }
      });
    }
  }

  function openActiveNowModal() {
    const modal = document.getElementById('active-now-modal');
    if (!modal) return;
    renderActiveNowList();
    modal.style.display = 'flex';
  }

  function renderActiveNowList() {
    const list = document.getElementById('active-now-list');
    if (!list) return;

    const q = (document.getElementById('active-now-search-input')?.value || '').trim().toLowerCase();

    const onlineIds = window.AdminPresence && AdminPresence.getOnlineUsers ? AdminPresence.getOnlineUsers() : [];
    const onlineUsers = onlineIds
      .map((id) => allUsers.find((u) => u.id === id) || (AdminPresence.getKnownUser ? AdminPresence.getKnownUser(id) : null))
      .filter(Boolean)
      .filter((u) => !u.isBanned);

    const filtered = q
      ? onlineUsers.filter((u) => {
          const name = String(u.displayName || u.username || '').toLowerCase();
          const email = String(u.email || '').toLowerCase();
          return name.includes(q) || email.includes(q);
        })
      : onlineUsers;

    if (filtered.length === 0) {
      list.innerHTML = `<div style="color:var(--admin-text-secondary);font-size:14px;">Không có user nào đang online.</div>`;
      return;
    }

    list.innerHTML = filtered.map((u) => {
      const initials = getInitials(u.username);
      const avatar = u.avatarUrl
        ? `<img src="${u.avatarUrl}" alt="${escapeHtml(u.username)}" style="width:32px;height:32px;border-radius:999px;object-fit:cover;">`
        : `<div style="width:32px;height:32px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:${getAvatarColor(u.id)};color:#fff;font-weight:600;">${initials}</div>`;

      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--admin-border-light);">
          ${avatar}
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-weight:600;color:var(--admin-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.displayName || u.username)}</span>
              <span class="badge badge-success">Online</span>
            </div>
            <span style="font-size:12px;color:var(--admin-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.email || '')}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function initRealtimePresence() {
    if (!window.AdminPresence || !AdminPresence.subscribe) return;

    if (presenceUnsub) {
      presenceUnsub();
      presenceUnsub = null;
    }

    presenceUnsub = AdminPresence.subscribe((evt) => {
      if (!evt || evt.type !== 'presence') return;

      const cell = document.querySelector(`[data-presence-user="${evt.userId}"]`);
      if (cell) {
        const user = allUsers.find((u) => u.id === evt.userId) || usersData.find((u) => u.id === evt.userId) || {};
        cell.innerHTML = renderPresenceBadge(user);
      }

      updateActiveNowStat();

      // Re-apply presence filter + update summary in realtime
      if (presenceFilter) {
        applyPresenceFilterAndRender();
      }
      updateRealtimeFilterSummary();

      const modal = document.getElementById('active-now-modal');
      if (modal && modal.style.display === 'flex') {
        renderActiveNowList();
      }
    });

    // Connect to real WebSocket for presence updates
    if (AdminPresence.startRealtime) {
      AdminPresence.startRealtime();
    }

    // Listen for user patches from UserDetailModal
    window.addEventListener('cococord:user-updated', (e) => {
      const detail = e?.detail;
      const userId = Number(detail?.userId);
      if (!Number.isFinite(userId)) return;

      const patch = detail?.patch;
      if (!patch || typeof patch !== 'object') return;

      const u = allUsers.find((x) => x.id === userId);
      if (!u) return;

      Object.assign(u, patch);

      if (u.isBanned && AdminPresence.forceDisconnect) {
        AdminPresence.forceDisconnect(u.id);
      }

      applyPresenceFilterAndRender();
      updateActiveNowStat();
      updateRealtimeFilterSummary();

      // Update visible row cells
      const row = document.querySelector(`tr[data-id="${u.id}"]`);
      if (row) {
        const roleBadge = row.querySelector('.badge-role');
        if (roleBadge) {
          roleBadge.textContent = u.role || 'USER';
          roleBadge.className = `badge badge-role badge-${getRoleClass(u.role)}`;
        }

        const statusBadge = row.querySelector('td:nth-child(5) .badge');
        if (statusBadge) {
          statusBadge.textContent = getStatusText(u);
          statusBadge.className = `badge badge-${getStatusClass(u)}`;
        }

        const presenceCell = row.querySelector(`[data-presence-user="${u.id}"]`);
        if (presenceCell) {
          presenceCell.innerHTML = renderPresenceBadge(u);
        }
      }
    });
  }

  // ========================================
  // Checkbox Selection
  // ========================================

  function initSelectAll() {
    const selectAll = document.getElementById('select-all-users');
    if (!selectAll) return;
    
    selectAll.addEventListener('change', function() {
      if (this.checked) {
        usersData.forEach(user => selectedUsers.add(user.id));
      } else {
        selectedUsers.clear();
      }
      updateCheckboxes();
      updateBulkActionsBar();
    });
  }

  function attachCheckboxListeners() {
    document.querySelectorAll('.user-checkbox').forEach(cb => {
      cb.addEventListener('change', function() {
        const userId = parseInt(this.value);
        if (this.checked) {
          selectedUsers.add(userId);
        } else {
          selectedUsers.delete(userId);
        }
        updateSelectAllCheckbox();
        updateBulkActionsBar();
      });
    });
  }

  function updateCheckboxes() {
    document.querySelectorAll('.user-checkbox').forEach(cb => {
      const userId = parseInt(cb.value);
      cb.checked = selectedUsers.has(userId);
      cb.closest('tr').classList.toggle('selected', cb.checked);
    });
  }

  function updateSelectAllCheckbox() {
    const selectAll = document.getElementById('select-all-users');
    if (!selectAll) return;
    
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const checkedCount = document.querySelectorAll('.user-checkbox:checked').length;
    
    selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
  }

  function updateBulkActionsBar() {
    const bar = document.getElementById('bulk-actions-bar');
    const countEl = document.getElementById('selected-count');
    
    if (bar) {
      bar.style.display = selectedUsers.size > 0 ? 'flex' : 'none';
    }
    if (countEl) {
      countEl.textContent = selectedUsers.size;
    }
  }

  // ========================================
  // Bulk Actions
  // ========================================

  function initBulkActions() {
    document.querySelectorAll('[data-bulk-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.bulkAction;
        if (selectedUsers.size === 0) return;
        
        switch (action) {
          case 'ban':
            await bulkBanUsers();
            break;
          case 'unban':
            await bulkUnbanUsers();
            break;
          case 'role':
            showBulkRoleModal();
            break;
          case 'delete':
            await bulkDeleteUsers();
            break;
        }
      });
    });
  }

  async function bulkBanUsers() {
    if (!confirm(`Bạn có chắc muốn cấm ${selectedUsers.size} người dùng?`)) return;
    
    let successCount = 0;
    for (const userId of selectedUsers) {
      try {
        await AdminUtils.api.post(`${API.ban(userId)}?reason=Bulk ban by admin&duration=permanent`);
        successCount++;
      } catch (error) {
        console.error(`Failed to ban user ${userId}:`, error);
      }
    }
    
    AdminUtils.showToast(`Đã cấm ${successCount}/${selectedUsers.size} người dùng`, 'success');
    selectedUsers.clear();
    await fetchUsers();
  }

  async function bulkUnbanUsers() {
    if (!confirm(`Bạn có chắc muốn bỏ cấm ${selectedUsers.size} người dùng?`)) return;
    
    let successCount = 0;
    for (const userId of selectedUsers) {
      try {
        await AdminUtils.api.post(API.unban(userId));
        successCount++;
      } catch (error) {
        console.error(`Failed to unban user ${userId}:`, error);
      }
    }
    
    AdminUtils.showToast(`Đã bỏ cấm ${successCount}/${selectedUsers.size} người dùng`, 'success');
    selectedUsers.clear();
    await fetchUsers();
  }

  async function bulkDeleteUsers() {
    if (!confirm(`CẢNH BÁO: Bạn có chắc muốn XÓA VĨNH VIỄN ${selectedUsers.size} người dùng? Hành động này không thể hoàn tác!`)) return;
    
    let successCount = 0;
    for (const userId of selectedUsers) {
      try {
        await AdminUtils.api.delete(API.deleteUser(userId));
        successCount++;
      } catch (error) {
        console.error(`Failed to delete user ${userId}:`, error);
      }
    }
    
    AdminUtils.showToast(`Đã xóa ${successCount}/${selectedUsers.size} người dùng`, 'success');
    selectedUsers.clear();
    await fetchUsers();
  }

  function showBulkRoleModal() {
    const modal = document.getElementById('bulk-role-modal');
    const countEl = document.getElementById('bulk-role-count');

    if (!selectedUsers || selectedUsers.size === 0) {
      AdminUtils.showToast('Vui lòng chọn ít nhất 1 người dùng', 'info');
      return;
    }
    
    if (countEl) countEl.textContent = selectedUsers.size;
    if (modal) modal.style.display = 'flex';
    
    // Setup apply button
    const applyBtn = document.getElementById('btn-apply-bulk-role');
    if (applyBtn) {
      applyBtn.onclick = async () => {
        const newRole = document.getElementById('bulk-new-role').value;
        
        let successCount = 0;
        for (const userId of selectedUsers) {
          try {
            await AdminUtils.api.put(`${API.updateRole(userId)}?role=${newRole}`);
            successCount++;
          } catch (error) {
            console.error(`Failed to update role for user ${userId}:`, error);
          }
        }
        
        AdminUtils.showToast(`Đã cập nhật vai trò cho ${successCount}/${selectedUsers.size} người dùng`, 'success');
        selectedUsers.clear();
        closeModal('bulk-role-modal');
        await fetchUsers();
      };
    }
  }

  function showSingleRoleModal(userId) {
    if (!userId && userId !== 0) return;

    // Use the existing bulk role modal for a single user.
    // Keep current selection intact by restoring after modal closes.
    const prevSelected = new Set(selectedUsers);
    selectedUsers.clear();
    selectedUsers.add(userId);

    showBulkRoleModal();

    // Restore selection when modal closes (either via close button or cancel)
    const restore = () => {
      selectedUsers.clear();
      prevSelected.forEach((id) => selectedUsers.add(id));
      document.removeEventListener('click', restoreOnClose, true);
    };

    const restoreOnClose = (e) => {
      const modal = document.getElementById('bulk-role-modal');
      if (!modal) {
        restore();
        return;
      }
      // When bulk-role-modal is hidden, restore selection
      if (modal.style.display === 'none' || modal.style.display === '') {
        restore();
      }
    };

    // Capture phase so it runs even if other handlers stop propagation
    document.addEventListener('click', restoreOnClose, true);
  }

  // ========================================
  // Action Buttons
  // ========================================

  function attachActionListeners() {
    // View Profile buttons
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.onclick = async function() {
        const userId = parseInt(this.dataset.id);
        await showUserDetailModal(userId);
      };
    });
    
    // Quick Ban buttons
    document.querySelectorAll('[data-action="ban"]').forEach(btn => {
      btn.onclick = async function() {
        const userId = parseInt(this.dataset.id);
        const user = usersData.find(u => u.id === userId);
        await showBanModal(user);
      };
    });
    
    // Quick Unban buttons
    document.querySelectorAll('[data-action="unban"]').forEach(btn => {
      btn.onclick = async function() {
        const userId = parseInt(this.dataset.id);
        const user = usersData.find(u => u.id === userId);
        
        if (confirm(`Bạn có chắc muốn bỏ cấm ${user?.username}?`)) {
          try {
            await AdminUtils.api.post(API.unban(userId));
            AdminUtils.showToast(`Đã bỏ cấm ${user?.username}`, 'success');
            await fetchUsers();
          } catch (error) {
            AdminUtils.showToast('Không thể bỏ cấm người dùng: ' + error.message, 'error');
          }
        }
      };
    });
    
    // More actions menu
    document.querySelectorAll('[data-action="more"]').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const userId = parseInt(this.dataset.id);
        showContextMenu(userId, e.clientX, e.clientY);
      };
    });
  }

  function showContextMenu(userId, x, y) {
    // Remove existing menu
    const existingMenu = document.querySelector('.admin-context-menu');
    if (existingMenu) existingMenu.remove();
    
    const user = usersData.find(u => u.id === userId);
    if (!user) return;
    
    const menu = document.createElement('div');
    menu.className = 'admin-context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    // Build menu items based on user status
    let menuItems = `
      <button class="context-menu-item" data-action="view-detail">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/></svg>
        Xem chi tiết
      </button>
      <button class="context-menu-item" data-action="change-role">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>
        Đổi vai trò
      </button>
      <div class="context-menu-divider"></div>
    `;
    
    // Ban/Unban based on current status
    if (user.isBanned) {
      menuItems += `
        <button class="context-menu-item success" data-action="unban">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8l3 3 5-6"/></svg>
          Bỏ cấm
        </button>
      `;
    } else {
      menuItems += `
        <button class="context-menu-item danger" data-action="ban">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/></svg>
          Cấm người dùng
        </button>
      `;
    }
    
    // Mute/Unmute
    if (user.isMuted) {
      menuItems += `
        <button class="context-menu-item" data-action="unmute">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 5v6h3l4 4V1L5 5H2z"/><path d="M12 6v4"/></svg>
          Bật tiếng
        </button>
      `;
    } else {
      menuItems += `
        <button class="context-menu-item" data-action="mute">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 5v6h3l4 4V1L5 5H2z"/><path d="M14 5l-4 6M10 5l4 6"/></svg>
          Tắt tiếng
        </button>
      `;
    }
    
    menuItems += `
      <div class="context-menu-divider"></div>
      <button class="context-menu-item danger" data-action="delete">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
        Xóa người dùng
      </button>
    `;
    
    menu.innerHTML = menuItems;
    document.body.appendChild(menu);
    
    // Adjust position if menu goes off screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
    
    // Handle menu item clicks
    menu.querySelectorAll('.context-menu-item').forEach(item => {
      item.onclick = async () => {
        const action = item.dataset.action;
        menu.remove();
        
        switch (action) {
          case 'view-detail':
            await showUserDetailModal(userId);
            break;
          case 'change-role':
            showSingleRoleModal(userId);
            break;
          case 'mute':
            await muteUser(user);
            break;
          case 'unmute':
            await unmuteUser(user);
            break;
          case 'ban':
            await showQuickBanModal(user);
            break;
          case 'unban':
            await unbanUser(user);
            break;
          case 'delete':
            await deleteUser(user);
            break;
        }
      };
    });
    
    // Close menu on click outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }

  // Enable right-click context menu on table rows
  function initRightClickMenu() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    tbody.addEventListener('contextmenu', (e) => {
      const row = e.target.closest('tr[data-id]');
      if (row) {
        e.preventDefault();
        const userId = parseInt(row.dataset.id);
        showContextMenu(userId, e.clientX, e.clientY);
      }
    });
  }

  // ========================================
  // Quick Ban Modal (New)
  // ========================================

  async function showQuickBanModal(user) {
    if (!user) return;
    currentUser = user;
    
    const modal = document.getElementById('quick-ban-modal');
    if (!modal) return;
    
    // Populate user preview
    const avatarInitials = document.getElementById('quick-ban-avatar-initials');
    if (avatarInitials) avatarInitials.textContent = getInitials(user.username);
    
    setTextContent('quick-ban-username', user.displayName || user.username);
    setTextContent('quick-ban-email', user.email);
    
    // Reset form
    const permanentRadio = document.querySelector('input[name="quick-ban-type"][value="permanent"]');
    if (permanentRadio) permanentRadio.checked = true;
    
    const durationGroup = document.getElementById('quick-ban-duration-group');
    if (durationGroup) durationGroup.style.display = 'none';
    
    const reasonInput = document.getElementById('quick-ban-reason');
    if (reasonInput) reasonInput.value = '';
    
    const adminNoteInput = document.getElementById('quick-ban-admin-note');
    if (adminNoteInput) adminNoteInput.value = '';
    
    modal.style.display = 'flex';
  }

  function initQuickBanModal() {
    // Toggle duration selector based on ban type
    document.querySelectorAll('input[name="quick-ban-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const durationGroup = document.getElementById('quick-ban-duration-group');
        if (durationGroup) {
          durationGroup.style.display = e.target.value === 'temporary' ? 'block' : 'none';
        }
      });
    });
    
    // Close buttons
    document.querySelectorAll('[data-action="close-quick-ban"]').forEach(btn => {
      btn.addEventListener('click', () => closeModal('quick-ban-modal'));
    });
    
    // Close on backdrop click
    const modal = document.getElementById('quick-ban-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal('quick-ban-modal');
      });
    }
    
    // Confirm ban button
    const confirmBtn = document.getElementById('btn-confirm-quick-ban');
    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        if (!currentUser) return;
        
        const reason = document.getElementById('quick-ban-reason')?.value?.trim();
        if (!reason) {
          AdminUtils.showToast('Vui lòng nhập lý do cấm', 'error');
          document.getElementById('quick-ban-reason')?.focus();
          return;
        }
        
        const banType = document.querySelector('input[name="quick-ban-type"]:checked')?.value;
        let duration = 'permanent';
        
        if (banType === 'temporary') {
          duration = document.getElementById('quick-ban-duration')?.value || '7d';
        }
        
        const adminNote = document.getElementById('quick-ban-admin-note')?.value?.trim();
        
        try {
          const params = new URLSearchParams();
          params.append('reason', reason);
          params.append('duration', duration);
          if (adminNote) params.append('adminNote', adminNote);
          
          await AdminUtils.api.post(`${API.ban(currentUser.id)}?${params}`);
          AdminUtils.showToast(`Đã cấm ${currentUser.username}`, 'success');
          closeModal('quick-ban-modal');
          await fetchUsers();
        } catch (error) {
          AdminUtils.showToast('Không thể cấm người dùng: ' + error.message, 'error');
        }
      };
    }
  }

  // ========================================
  // User Actions (Original Ban Modal - now redirects to Quick Ban)
  // ========================================

  async function showBanModal(user) {
    // Redirect to new Quick Ban Modal
    await showQuickBanModal(user);
  }

  function createBanModal() {
    // Legacy - now using quick-ban-modal from JSP
    return document.getElementById('quick-ban-modal');
  }

  async function unbanUser(user) {
    if (!confirm(`Bạn có chắc muốn bỏ cấm ${user.username}?`)) return;
    
    try {
      await AdminUtils.api.post(API.unban(user.id));
      AdminUtils.showToast(`Đã bỏ cấm ${user.username}`, 'success');
      await fetchUsers();
    } catch (error) {
      AdminUtils.showToast('Không thể bỏ cấm người dùng: ' + error.message, 'error');
    }
  }

  async function muteUser(user) {
    const reason = prompt('Nhập lý do tắt tiếng:');
    if (reason === null) return;
    
    try {
      const params = new URLSearchParams();
      if (reason) params.append('reason', reason);
      params.append('duration', '60'); // Default 60 minutes
      
      await AdminUtils.api.post(`${API.mute(user.id)}?${params}`);
      AdminUtils.showToast(`Đã tắt tiếng ${user.username}`, 'success');
      await fetchUsers();
    } catch (error) {
      AdminUtils.showToast('Không thể tắt tiếng người dùng: ' + error.message, 'error');
    }
  }

  async function unmuteUser(user) {
    try {
      await AdminUtils.api.post(API.unmute(user.id));
      AdminUtils.showToast(`Đã bật tiếng ${user.username}`, 'success');
      await fetchUsers();
    } catch (error) {
      AdminUtils.showToast('Không thể bật tiếng người dùng: ' + error.message, 'error');
    }
  }

  async function deleteUser(user) {
    const confirmText = prompt(`Nhập "${user.username}" để xác nhận xóa người dùng này vĩnh viễn:`);
    if (confirmText !== user.username) {
      if (confirmText !== null) {
        AdminUtils.showToast('Tên người dùng không khớp', 'error');
      }
      return;
    }
    
    try {
      await AdminUtils.api.delete(API.deleteUser(user.id));
      AdminUtils.showToast(`Đã xóa ${user.username}`, 'success');
      await fetchUsers();
    } catch (error) {
      AdminUtils.showToast('Không thể xóa người dùng: ' + error.message, 'error');
    }
  }

  // ========================================
  // User Detail Modal (New 3-Column Layout)
  // ========================================

  async function showUserDetailModal(userId, activeTab = 'overview') {
    // Try to use the new UserDetailModal if available
    if (typeof UserDetailModal !== 'undefined' && UserDetailModal.open) {
      try {
        // Fetch user details
        const user = await AdminUtils.api.get(API.userById(userId));
        currentUser = user;
        
        // Add mock stats if not present
        if (!user.stats) {
          user.stats = {
            serversJoined: user.serverCount || 0,
            serversCreated: user.serversCreated || 0,
            banCount: user.banCount || 0,
            messageCount: user.messageCount || 0
          };
        }
        
        // Add ban info if banned
        if (user.isBanned) {
          user.banInfo = {
            type: user.bannedUntil ? 'temporary' : 'permanent',
            reason: user.banReason || 'Không có lý do',
            expiresAt: user.bannedUntil,
            bannedBy: user.bannedBy || 'Admin'
          };
        }
        
        // Open new modal
        UserDetailModal.open(user);
        
      } catch (error) {
        console.error('Failed to load user details:', error);
        AdminUtils.showToast('Không thể tải thông tin người dùng', 'error');
      }
      return;
    }
    
    // Fallback to legacy modal
    const modal = document.getElementById('user-detail-modal');
    if (!modal) return;
    
    try {
      // Fetch user details
      const user = await AdminUtils.api.get(API.userById(userId));
      currentUser = user;
      
      // Populate modal
      populateUserModal(user);
      
      // Show modal and switch to tab
      modal.style.display = 'flex';
      switchTab(activeTab);
      
    } catch (error) {
      console.error('Failed to load user details:', error);
      AdminUtils.showToast('Không thể tải thông tin người dùng', 'error');
    }
  }

  function populateUserModal(user) {
    // Avatar (now an img element)
    const avatarEl = document.getElementById('modal-avatar');
    if (avatarEl) {
      avatarEl.src = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=6366f1&color=fff&size=88`;
      avatarEl.alt = user.username;
    }
    
    setTextContent('modal-username', user.displayName || user.username);
    setTextContent('modal-email', user.email);
    
    // Role text in header
    setTextContent('modal-role-text', user.role || 'USER');
    
    // Join date in header
    setTextContent('modal-join-date', user.createdAt ? AdminUtils.formatDate(user.createdAt) : '--');
    
    // Email verified icon
    const emailVerifiedIcon = document.getElementById('modal-email-verified-icon');
    if (emailVerifiedIcon) {
      emailVerifiedIcon.textContent = user.isEmailVerified ? '✓ Verified' : '✗ Unverified';
      emailVerifiedIcon.style.color = user.isEmailVerified ? 'var(--color-success)' : 'var(--color-warning)';
    }
    
    // Status badge
    const statusBadge = document.getElementById('modal-status-badge');
    if (statusBadge) {
      const statusText = getStatusText(user);
      const statusClass = getStatusClass(user);
      statusBadge.textContent = statusText;
      statusBadge.className = `admin-status-badge badge-${statusClass}`;
    }
    
    // Overview tab details
    setTextContent('modal-user-id', user.id);
    setTextContent('modal-display-name', user.displayName || '--');
    setTextContent('modal-user-email', user.email);
    setTextContent('modal-user-role', user.role || 'USER');
    setTextContent('modal-account-status', getStatusText(user));
    setTextContent('modal-email-verified', user.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh');
    setTextContent('modal-2fa-status', user.twoFactorEnabled ? 'Đã bật' : 'Chưa bật');
    setTextContent('modal-created-at', AdminUtils.formatDateTime(user.createdAt));
    setTextContent('modal-last-login', user.lastLogin ? AdminUtils.formatDateTime(user.lastLogin) : 'Chưa đăng nhập');
    setTextContent('modal-servers-count', user.serverCount || 0);
    setTextContent('modal-user-bio', user.bio || '--');
    
    // Set current role in role selector
    const roleRadios = document.querySelectorAll('input[name="user-role"]');
    roleRadios.forEach(radio => {
      radio.checked = radio.value === (user.role || 'USER');
    });
    
    // Populate Audit Log tab
    populateAuditLog(user);
    
    // Populate Moderation tab
    populateModerationTab(user);
  }

  function populateAuditLog(user) {
    // Update summary stats (mock data for now - should come from API)
    setTextContent('audit-servers-created', user.serversCreated || 0);
    setTextContent('audit-servers-joined', user.serverCount || 0);
    setTextContent('audit-messages-sent', user.messageCount || 0);
    setTextContent('audit-bans-received', user.banCount || 0);
    
    // Load activity timeline
    const timeline = document.getElementById('audit-timeline');
    if (!timeline) return;
    
    // Mock audit log data (should come from API)
    const auditEvents = generateMockAuditEvents(user);
    
    if (auditEvents.length === 0) {
      timeline.innerHTML = `
        <div class="audit-item">
          <div class="audit-icon audit-icon-info">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
          </div>
          <div class="audit-content">
            <div class="audit-text">Không có hoạt động nào được ghi nhận</div>
            <div class="audit-time">--</div>
          </div>
        </div>
      `;
      return;
    }
    
    timeline.innerHTML = auditEvents.map(event => `
      <div class="audit-item">
        <div class="audit-icon audit-icon-${event.type}">
          ${getAuditIcon(event.type)}
        </div>
        <div class="audit-content">
          <div class="audit-text">${event.text}</div>
          <div class="audit-time">${AdminUtils.timeAgo(event.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  function generateMockAuditEvents(user) {
    const events = [];
    
    // Account created
    events.push({
      type: 'membership',
      text: `<strong>${user.username}</strong> đã tạo tài khoản`,
      timestamp: user.createdAt
    });
    
    // Last login
    if (user.lastLogin) {
      events.push({
        type: 'security',
        text: `Đăng nhập gần nhất`,
        timestamp: user.lastLogin
      });
    }
    
    // Ban history
    if (user.isBanned && user.bannedAt) {
      events.push({
        type: 'moderation',
        text: `<strong>${user.username}</strong> đã bị cấm${user.banReason ? `: ${user.banReason}` : ''}`,
        timestamp: user.bannedAt
      });
    }
    
    // Sort by timestamp desc
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return events;
  }

  function getAuditIcon(type) {
    const icons = {
      server: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><circle cx="8" cy="8" r="2"/></svg>',
      membership: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>',
      moderation: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/></svg>',
      role: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2L2 5v5c0 4 6 6 6 6s6-2 6-6V5l-6-3z"/></svg>',
      security: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>',
      info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>'
    };
    return icons[type] || icons.info;
  }

  function populateModerationTab(user) {
    const banInfo = document.getElementById('current-ban-info');
    const banPanel = document.getElementById('moderation-ban-panel');
    const banPanelTitle = document.getElementById('ban-panel-title');
    
    if (user.isBanned) {
      // Show current ban info
      if (banInfo) {
        banInfo.style.display = 'block';
        
        const isPermanent = !user.bannedUntil;
        setTextContent('current-ban-type', isPermanent ? 'Vĩnh viễn' : 'Tạm thời');
        setTextContent('current-ban-date', AdminUtils.formatDateTime(user.bannedAt));
        
        const untilRow = document.getElementById('current-ban-until-row');
        if (untilRow) {
          untilRow.style.display = isPermanent ? 'none' : 'flex';
          if (!isPermanent) {
            setTextContent('current-ban-until', AdminUtils.formatDateTime(user.bannedUntil));
          }
        }
        
        setTextContent('current-ban-reason', user.banReason || 'Không có lý do');
        setTextContent('current-ban-by', user.bannedBy || 'Admin');
      }
      
      // Change ban panel to "Extend Ban"
      if (banPanelTitle) {
        banPanelTitle.innerHTML = `
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
            <path d="M8 3v5l3 3"/><circle cx="8" cy="8" r="6"/>
          </svg>
          Gia hạn lệnh cấm
        `;
      }
    } else {
      // Hide current ban info
      if (banInfo) banInfo.style.display = 'none';
      
      // Reset ban panel title
      if (banPanelTitle) {
        banPanelTitle.innerHTML = `
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
            <circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/>
          </svg>
          Cấm người dùng
        `;
      }
    }
    
    // Reset form fields
    const permanentRadio = document.querySelector('input[name="ban-type-mod"][value="permanent"]');
    if (permanentRadio) permanentRadio.checked = true;
    
    const durationGroup = document.getElementById('ban-duration-group-mod');
    if (durationGroup) durationGroup.style.display = 'none';
    
    const reasonInput = document.getElementById('ban-reason-mod');
    if (reasonInput) reasonInput.value = '';
    
    const adminNoteInput = document.getElementById('ban-admin-note-mod');
    if (adminNoteInput) adminNoteInput.value = '';
  }

  function initModerationTab() {
    // Ban type radio toggle
    document.querySelectorAll('input[name="ban-type-mod"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const durationGroup = document.getElementById('ban-duration-group-mod');
        if (durationGroup) {
          durationGroup.style.display = e.target.value === 'temporary' ? 'block' : 'none';
        }
      });
    });
    
    // Duration selector - show custom input when "custom" selected
    const durationSelect = document.getElementById('ban-duration-mod');
    if (durationSelect) {
      durationSelect.addEventListener('change', (e) => {
        const customDuration = document.getElementById('custom-duration-mod');
        if (customDuration) {
          customDuration.style.display = e.target.value === 'custom' ? 'flex' : 'none';
        }
      });
    }
    
    // Apply ban button (in moderation tab)
    const applyBanBtn = document.getElementById('btn-apply-ban-mod');
    if (applyBanBtn) {
      applyBanBtn.onclick = async () => {
        if (!currentUser) return;
        
        const reason = document.getElementById('ban-reason-mod')?.value?.trim();
        if (!reason) {
          AdminUtils.showToast('Vui lòng nhập lý do cấm', 'error');
          document.getElementById('ban-reason-mod')?.focus();
          return;
        }
        
        const banType = document.querySelector('input[name="ban-type-mod"]:checked')?.value;
        let duration = 'permanent';
        
        if (banType === 'temporary') {
          const durationValue = document.getElementById('ban-duration-mod')?.value;
          if (durationValue === 'custom') {
            const customValue = document.getElementById('ban-custom-value-mod')?.value || 1;
            const customUnit = document.getElementById('ban-custom-unit-mod')?.value || 'days';
            duration = `${customValue}${customUnit.charAt(0)}`; // e.g., "7d"
          } else {
            duration = durationValue || '7d';
          }
        }
        
        const adminNote = document.getElementById('ban-admin-note-mod')?.value?.trim();
        
        try {
          const params = new URLSearchParams();
          params.append('reason', reason);
          params.append('duration', duration);
          if (adminNote) params.append('adminNote', adminNote);
          
          await AdminUtils.api.post(`${API.ban(currentUser.id)}?${params}`);
          AdminUtils.showToast(`Đã ${currentUser.isBanned ? 'gia hạn lệnh cấm' : 'cấm'} ${currentUser.username}`, 'success');
          
          // Refresh user data
          const updatedUser = await AdminUtils.api.get(API.userById(currentUser.id));
          currentUser = updatedUser;
          populateUserModal(currentUser);
          await fetchUsers();
        } catch (error) {
          AdminUtils.showToast('Không thể cấm người dùng: ' + error.message, 'error');
        }
      };
    }
    
    // Unban button (in moderation tab)
    const unbanBtn = document.getElementById('btn-unban-user-mod');
    if (unbanBtn) {
      unbanBtn.onclick = async () => {
        if (!currentUser) return;
        
        if (!confirm(`Bạn có chắc muốn bỏ cấm ${currentUser.username}?`)) return;
        
        try {
          await AdminUtils.api.post(API.unban(currentUser.id));
          AdminUtils.showToast(`Đã bỏ cấm ${currentUser.username}`, 'success');
          
          // Refresh user data
          const updatedUser = await AdminUtils.api.get(API.userById(currentUser.id));
          currentUser = updatedUser;
          populateUserModal(currentUser);
          await fetchUsers();
        } catch (error) {
          AdminUtils.showToast('Không thể bỏ cấm người dùng: ' + error.message, 'error');
        }
      };
    }
    
    // Extend ban button
    const extendBanBtn = document.getElementById('btn-extend-ban');
    if (extendBanBtn) {
      extendBanBtn.onclick = () => {
        // Scroll to ban panel
        const banPanel = document.getElementById('moderation-ban-panel');
        if (banPanel) {
          banPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    }
    
    // Delete user button (in moderation tab)
    const deleteBtn = document.getElementById('btn-delete-user-mod');
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (!currentUser) return;
        await deleteUser(currentUser);
        closeModal('user-detail-modal');
      };
    }
    
    // Reset password button
    const resetPwdBtn = document.getElementById('btn-reset-password-mod');
    if (resetPwdBtn) {
      resetPwdBtn.onclick = () => {
        AdminUtils.showToast('Tính năng đặt lại mật khẩu đang được phát triển', 'info');
      };
    }
  }

  function setTextContent(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '--';
  }

  function switchTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.admin-tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tabContent === tabName);
    });
  }

  function initModal() {
    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        switchTab(tab.dataset.tab);
      });
    });
    
    // Close modal buttons
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => closeModal('user-detail-modal'));
    });
    
    // Close on backdrop click
    const modal = document.getElementById('user-detail-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal('user-detail-modal');
      });
    }
    
    // Action buttons in modal
    initModalActions();
  }

  function initModalActions() {
    // Save role button (in Overview tab)
    const saveRoleBtn = document.getElementById('btn-save-role');
    if (saveRoleBtn) {
      saveRoleBtn.onclick = async () => {
        if (!currentUser) return;
        
        const selectedRole = document.querySelector('input[name="user-role"]:checked')?.value;
        if (!selectedRole) return;
        
        try {
          await AdminUtils.api.put(`${API.updateRole(currentUser.id)}?role=${selectedRole}`);
          AdminUtils.showToast(`Đã cập nhật vai trò thành ${selectedRole}`, 'success');
          currentUser.role = selectedRole;
          populateUserModal(currentUser);
          await fetchUsers();
        } catch (error) {
          AdminUtils.showToast('Không thể cập nhật vai trò: ' + error.message, 'error');
        }
      };
    }
  }

  // ========================================
  // Add User Modal
  // ========================================

  function initAddUserModal() {
    const addBtn = document.getElementById('btn-add-user');
    if (addBtn) {
      addBtn.onclick = () => {
        const modal = document.getElementById('add-user-modal');
        if (modal) modal.style.display = 'flex';
      };
    }
    
    // Close buttons
    document.querySelectorAll('[data-action="close-add-modal"]').forEach(btn => {
      btn.addEventListener('click', () => closeModal('add-user-modal'));
    });

    // Close on backdrop click
    const modal = document.getElementById('add-user-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal('add-user-modal');
      });
    }

    const form = document.getElementById('add-user-form');
    
    // Create user button
    const createBtn = document.getElementById('btn-create-user');
    if (createBtn) {
      createBtn.onclick = async (e) => {
        e.preventDefault();
        if (form && typeof form.requestSubmit === 'function') {
          form.requestSubmit();
          return;
        }
        await submitAddUserForm();
      };
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitAddUserForm();
      });
    }
  }

  async function submitAddUserForm() {
    const usernameEl = document.getElementById('new-username');
    const emailEl = document.getElementById('new-email');
    const passwordEl = document.getElementById('new-password');
    const roleEl = document.getElementById('new-role');
    const verifiedEl = document.getElementById('new-email-verified');
    const welcomeEl = document.getElementById('new-send-welcome');
    const createBtn = document.getElementById('btn-create-user');

    const username = (usernameEl?.value || '').trim();
    const email = (emailEl?.value || '').trim();
    const password = passwordEl?.value || '';
    const role = (roleEl?.value || 'USER').trim();
    const emailVerified = Boolean(verifiedEl?.checked);
    const sendWelcomeEmail = Boolean(welcomeEl?.checked);

    if (!username) {
      AdminUtils.showToast('Vui lòng nhập Username', 'warning');
      usernameEl?.focus();
      return;
    }
    if (!email) {
      AdminUtils.showToast('Vui lòng nhập Email', 'warning');
      emailEl?.focus();
      return;
    }
    if (!password) {
      AdminUtils.showToast('Vui lòng nhập Password', 'warning');
      passwordEl?.focus();
      return;
    }

    // Match backend register password rules for consistency
    const pwdOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    if (!pwdOk) {
      AdminUtils.showToast('Password cần có chữ hoa, chữ thường, số và ký tự đặc biệt (>=8)', 'warning');
      passwordEl?.focus();
      return;
    }

    const payload = {
      username,
      email,
      password,
      role,
      emailVerified,
      sendWelcomeEmail
    };

    const prevText = createBtn?.textContent;
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';
    }

    try {
      await AdminUtils.api.post(API.users, payload);
      AdminUtils.showToast('Đã tạo user mới', 'success');

      // Reset form
      if (usernameEl) usernameEl.value = '';
      if (emailEl) emailEl.value = '';
      if (passwordEl) passwordEl.value = '';
      if (roleEl) roleEl.value = 'USER';
      if (verifiedEl) verifiedEl.checked = false;
      if (welcomeEl) welcomeEl.checked = false;

      closeModal('add-user-modal');

      // New users should appear on first page with createdAt desc
      pagination.page = 0;
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (error) {
      AdminUtils.showToast('Không thể tạo user: ' + (error?.message || 'Unknown error'), 'error');
    } finally {
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = prevText || 'Create User';
      }
    }
  }

  // ========================================
  // Refresh Button
  // ========================================

  function initRefreshButton() {
    const refreshBtn = document.getElementById('btn-refresh-users');
    if (refreshBtn) {
      refreshBtn.onclick = async function() {
        this.classList.add('spinning');
        await Promise.all([fetchUsers(), fetchStats()]);
        this.classList.remove('spinning');
        AdminUtils.showToast('Đã làm mới danh sách', 'success');
      };
    }
  }

  // ========================================
  // Modal Utilities
  // ========================================

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: async () => {
      await Promise.all([fetchUsers(), fetchStats()]);
    },
    closeModal
  };

})();

// Expose to window for router
window.AdminUsers = AdminUsers;
