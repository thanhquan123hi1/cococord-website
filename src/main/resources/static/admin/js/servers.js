/**
 * CoCoCord Admin - Servers Page JavaScript
 * Handles server table, filters, search, modals and admin actions
 * Updated with full detail modal and admin actions
 */

var AdminServers = window.AdminServers || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let currentFilters = {
    search: '',
    status: '',
    size: '',
    time: '',
    sortBy: 'createdAt',
    sortDir: 'desc'
  };

  let serversData = [];
  let currentServer = null;
  let pagination = {
    page: 0,
    size: 15,
    totalElements: 0,
    totalPages: 0
  };
  let isLoading = false;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    servers: '/api/admin/servers',
    serverStats: '/api/admin/servers/stats',
    server: (id) => `/api/admin/servers/${id}`,
    lock: (id) => `/api/admin/servers/${id}/lock`,
    unlock: (id) => `/api/admin/servers/${id}/unlock`,
    transfer: (id) => `/api/admin/servers/${id}/transfer`,
    serverAudit: (id) => `/api/admin/servers/${id}/audit-log`,
    serverReports: (id) => `/api/admin/servers/${id}/reports`
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminServers] Initializing...');
    
    initSearch();
    initFilters();
    initSelectAll();
    initBulkActions();
    initModalTabs();
    initModalActions();
    initModals();
    initPagination();
    initStatCardClicks();
    
    // Fetch initial data
    fetchStats();
    fetchServers();
    
    console.log('[AdminServers] Initialized');
  }

  // ========================================
  // Stats API
  // ========================================

  async function fetchStats() {
    try {
      const stats = await AdminUtils.api.get(API.serverStats);
      if (stats) {
        updateStatCard('stat-total-servers', stats.totalServers);
        updateStatCard('stat-active-servers', stats.activeServers);
        updateStatCard('stat-total-members', stats.totalMembers);
        updateStatCard('stat-flagged-servers', stats.flaggedServers);
      }
    } catch (error) {
      console.error('[AdminServers] Failed to fetch stats:', error);
    }
  }

  function updateStatCard(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = AdminUtils?.formatNumber?.(value) || value;
  }

  // ========================================
  // Servers List API
  // ========================================

  async function fetchServers() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size,
        sortBy: currentFilters.sortBy,
        sortDir: currentFilters.sortDir
      });
      
      if (currentFilters.search) {
        params.append('search', currentFilters.search);
      }

      const response = await AdminUtils.api.get(`${API.servers}?${params}`);
      
      if (response && response.content) {
        serversData = response.content;
        pagination.totalElements = response.totalElements || 0;
        pagination.totalPages = response.totalPages || 0;
      } else if (Array.isArray(response)) {
        serversData = response;
        pagination.totalElements = response.length;
        pagination.totalPages = 1;
      } else {
        serversData = [];
        pagination.totalElements = 0;
        pagination.totalPages = 0;
      }
      
      renderServersTable();
      updatePaginationUI();
    } catch (error) {
      console.error('[AdminServers] Failed to fetch servers:', error);
      AdminUtils?.showToast?.('Failed to load servers', 'danger');
      serversData = [];
      renderServersTable();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  // ========================================
  // Loading State
  // ========================================

  function showLoading(show) {
    const tbody = document.getElementById('servers-table-body');
    if (!tbody) return;

    if (show) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-8">
            <div class="loading-spinner"></div>
            <div class="mt-2 text-muted">Loading servers...</div>
          </td>
        </tr>
      `;
    }
  }

  // ========================================
  // Table Rendering
  // ========================================

  function renderServersTable() {
    const tbody = document.getElementById('servers-table-body');
    if (!tbody) return;
    
    const servers = getFilteredServers();
    
    if (servers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center py-8">No servers found</td></tr>';
      return;
    }
    
    tbody.innerHTML = servers.map(server => {
      const isLocked = server.isLocked || server.locked || false;
      const status = isLocked ? 'Locked' : 'Active';
      const statusClass = isLocked ? 'danger' : 'success';
      
      return `
      <tr data-id="${server.id}">
        <td>
          <input type="checkbox" class="server-checkbox admin-checkbox" value="${server.id}">
        </td>
        <td class="text-muted">#${server.id}</td>
        <td>
          <div class="user-cell">
            <div class="server-avatar-sm" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--admin-primary);width:36px;height:36px;border-radius:10px;">
              ${getInitials(server.name)}
            </div>
            <div class="user-info">
              <span class="cell-user-name">${escapeHtml(server.name)}</span>
              <span class="cell-user-email">${escapeHtml(server.description || 'No description')}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="owner-link" data-owner-id="${server.ownerId}">@${escapeHtml(server.ownerUsername || 'unknown')}</span>
        </td>
        <td>${AdminUtils?.formatNumber?.(server.memberCount || 0)}</td>
        <td>${server.channelCount || 0}</td>
        <td>
          <span class="badge badge-${statusClass}">${status}</span>
        </td>
        <td>${formatDate(server.createdAt)}</td>
        <td>${formatDate(server.lastActivityAt || server.updatedAt)}</td>
        <td>
          <div class="action-buttons">
            <button class="admin-btn admin-btn-sm admin-btn-ghost" title="View Details" data-action="view" data-id="${server.id}">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/></svg>
            </button>
            ${isLocked ? `
              <button class="admin-btn admin-btn-sm admin-btn-ghost text-success" title="Unlock" data-action="unlock" data-id="${server.id}">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M11 7V5a3 3 0 00-5-2"/></svg>
              </button>
            ` : `
              <button class="admin-btn admin-btn-sm admin-btn-ghost text-warning" title="Lock" data-action="lock" data-id="${server.id}">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
              </button>
            `}
            <button class="admin-btn admin-btn-sm admin-btn-ghost text-danger" title="Delete" data-action="delete" data-id="${server.id}">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `}).join('');
    
    attachTableListeners();
  }

  function getFilteredServers() {
    let servers = [...serversData];
    
    // Apply client-side filters
    if (currentFilters.status) {
      servers = servers.filter(s => {
        const isLocked = s.isLocked || s.locked;
        if (currentFilters.status === 'locked') return isLocked;
        if (currentFilters.status === 'active') return !isLocked;
        return true;
      });
    }
    
    if (currentFilters.size) {
      servers = servers.filter(s => {
        const memberCount = s.memberCount || 0;
        switch (currentFilters.size) {
          case 'small': return memberCount < 100;
          case 'medium': return memberCount >= 100 && memberCount < 1000;
          case 'large': return memberCount >= 1000;
          default: return true;
        }
      });
    }

    if (currentFilters.time) {
      const now = new Date();
      servers = servers.filter(s => {
        const created = new Date(s.createdAt);
        switch (currentFilters.time) {
          case 'today':
            return created.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return created >= weekAgo;
          case 'month':
            const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
            return created >= monthAgo;
          case 'year':
            const yearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);
            return created >= yearAgo;
          default: return true;
        }
      });
    }
    
    return servers;
  }

  // ========================================
  // Table Action Listeners
  // ========================================

  function attachTableListeners() {
    // View buttons
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (server) showServerDetailModal(server);
      };
    });

    // Lock buttons
    document.querySelectorAll('[data-action="lock"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (server) showQuickLockModal(server);
      };
    });

    // Unlock buttons
    document.querySelectorAll('[data-action="unlock"]').forEach(btn => {
      btn.onclick = async function() {
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (confirm(`Are you sure you want to unlock "${server?.name || 'this server'}"?`)) {
          await unlockServer(serverId);
        }
      };
    });

    // Delete buttons
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (server) showConfirmDeleteModal(server);
      };
    });

    // Refresh button
    document.getElementById('btn-refresh-servers')?.addEventListener('click', function() {
      this.classList.add('spinning');
      Promise.all([fetchStats(), fetchServers()]).finally(() => {
        this.classList.remove('spinning');
        AdminUtils?.showToast?.('Servers refreshed', 'info');
      });
    });

    // Export button
    document.getElementById('btn-export-servers')?.addEventListener('click', function() {
      AdminUtils?.showToast?.('Export feature coming soon', 'info');
    });
  }

  // ========================================
  // Server Actions
  // ========================================

  async function lockServer(serverId, reason) {
    try {
      const params = new URLSearchParams();
      if (reason) params.append('reason', reason);
      
      await AdminUtils.api.post(`${API.lock(serverId)}?${params}`);
      AdminUtils?.showToast?.('Server locked successfully', 'warning');
      await Promise.all([fetchStats(), fetchServers()]);
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to lock server:', error);
      AdminUtils?.showToast?.('Failed to lock server', 'danger');
      return false;
    }
  }

  async function unlockServer(serverId) {
    try {
      await AdminUtils.api.post(API.unlock(serverId));
      AdminUtils?.showToast?.('Server unlocked successfully', 'success');
      await Promise.all([fetchStats(), fetchServers()]);
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to unlock server:', error);
      AdminUtils?.showToast?.('Failed to unlock server', 'danger');
      return false;
    }
  }

  async function deleteServer(serverId, reason) {
    try {
      const params = new URLSearchParams();
      if (reason) params.append('reason', reason);
      
      await AdminUtils.api.delete(`${API.server(serverId)}?${params}`);
      AdminUtils?.showToast?.('Server deleted successfully', 'success');
      await Promise.all([fetchStats(), fetchServers()]);
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to delete server:', error);
      AdminUtils?.showToast?.('Failed to delete server', 'danger');
      return false;
    }
  }

  async function transferOwnership(serverId, newOwnerId, reason) {
    try {
      const params = new URLSearchParams({ newOwnerId });
      if (reason) params.append('reason', reason);
      
      await AdminUtils.api.post(`${API.transfer(serverId)}?${params}`);
      AdminUtils?.showToast?.('Ownership transferred successfully', 'success');
      await fetchServers();
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to transfer ownership:', error);
      AdminUtils?.showToast?.('Failed to transfer ownership', 'danger');
      return false;
    }
  }

  // ========================================
  // Search & Filters
  // ========================================

  function initSearch() {
    const searchInput = document.getElementById('server-search-input');
    if (!searchInput) return;
    
    let debounceTimer;
    searchInput.addEventListener('input', function(e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        pagination.page = 0;
        fetchServers();
      }, 300);
    });
  }

  function initFilters() {
    const filterStatus = document.getElementById('filter-status');
    const filterSize = document.getElementById('filter-size');
    const filterTime = document.getElementById('filter-time');
    const sortBy = document.getElementById('sort-by');
    
    filterStatus?.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      renderServersTable();
      updatePaginationUI();
    });
    
    filterSize?.addEventListener('change', (e) => {
      currentFilters.size = e.target.value;
      renderServersTable();
      updatePaginationUI();
    });

    filterTime?.addEventListener('change', (e) => {
      currentFilters.time = e.target.value;
      renderServersTable();
      updatePaginationUI();
    });
    
    sortBy?.addEventListener('change', (e) => {
      const [field, dir] = e.target.value.split('-');
      currentFilters.sortBy = field;
      currentFilters.sortDir = dir;
      pagination.page = 0;
      fetchServers();
    });
  }

  function initStatCardClicks() {
    document.querySelectorAll('[data-filter-status]').forEach(card => {
      card.addEventListener('click', function() {
        const status = this.dataset.filterStatus;
        const filterSelect = document.getElementById('filter-status');
        if (filterSelect) {
          filterSelect.value = status;
          currentFilters.status = status;
          renderServersTable();
          updatePaginationUI();
        }
      });
    });
  }

  // ========================================
  // Pagination
  // ========================================

  function initPagination() {
    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
      if (pagination.page > 0) {
        pagination.page--;
        fetchServers();
      }
    });

    document.getElementById('btn-next-page')?.addEventListener('click', () => {
      if (pagination.page < pagination.totalPages - 1) {
        pagination.page++;
        fetchServers();
      }
    });
  }

  function updatePaginationUI() {
    const filtered = getFilteredServers();
    const showingEl = document.getElementById('pagination-showing');
    const totalEl = document.getElementById('pagination-total');
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    const pagesContainer = document.getElementById('pagination-pages');

    if (showingEl) {
      const start = pagination.page * pagination.size + 1;
      const end = Math.min((pagination.page + 1) * pagination.size, pagination.totalElements);
      showingEl.textContent = pagination.totalElements > 0 ? `${start}-${end}` : '0';
    }

    if (totalEl) {
      totalEl.textContent = filtered.length;
    }

    if (prevBtn) prevBtn.disabled = pagination.page === 0;
    if (nextBtn) nextBtn.disabled = pagination.page >= pagination.totalPages - 1;

    if (pagesContainer) {
      let html = '';
      for (let i = 0; i < Math.min(pagination.totalPages, 5); i++) {
        const isActive = i === pagination.page;
        html += `<button class="admin-btn admin-btn-sm ${isActive ? 'admin-btn-primary' : 'admin-btn-ghost'}" data-page-num="${i}">${i + 1}</button>`;
      }
      pagesContainer.innerHTML = html;
      
      pagesContainer.querySelectorAll('[data-page-num]').forEach(btn => {
        btn.onclick = function() {
          pagination.page = parseInt(this.dataset.pageNum);
          fetchServers();
        };
      });
    }
  }

  // ========================================
  // Select All & Bulk Actions
  // ========================================

  function initSelectAll() {
    const selectAll = document.getElementById('select-all-servers');
    if (!selectAll) return;
    
    selectAll.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.server-checkbox');
      checkboxes.forEach(cb => cb.checked = this.checked);
      updateBulkActionsBar();
    });

    document.addEventListener('change', function(e) {
      if (e.target.classList.contains('server-checkbox')) {
        updateBulkActionsBar();
      }
    });
  }

  function updateBulkActionsBar() {
    const selected = document.querySelectorAll('.server-checkbox:checked');
    const bar = document.getElementById('bulk-actions-bar');
    const countEl = document.getElementById('selected-count');
    
    if (bar) bar.style.display = selected.length > 0 ? 'flex' : 'none';
    if (countEl) countEl.textContent = selected.length;
  }

  function initBulkActions() {
    document.querySelectorAll('[data-bulk-action]').forEach(btn => {
      btn.onclick = async function() {
        const action = this.dataset.bulkAction;
        const selected = Array.from(document.querySelectorAll('.server-checkbox:checked')).map(cb => cb.value);
        
        if (selected.length === 0) return;

        if (action === 'lock') {
          const reason = prompt('Enter reason for locking these servers:');
          if (reason !== null) {
            for (const id of selected) {
              await lockServer(id, reason);
            }
          }
        } else if (action === 'unlock') {
          if (confirm(`Are you sure you want to unlock ${selected.length} servers?`)) {
            for (const id of selected) {
              await unlockServer(id);
            }
          }
        } else if (action === 'delete') {
          if (confirm(`WARNING: Are you sure you want to delete ${selected.length} servers? This cannot be undone!`)) {
            const reason = prompt('Enter reason for deletion:');
            if (reason !== null) {
              for (const id of selected) {
                await deleteServer(id, reason);
              }
            }
          }
        }
        
        document.getElementById('select-all-servers').checked = false;
        updateBulkActionsBar();
      };
    });
  }

  // ========================================
  // Server Detail Modal
  // ========================================

  function showServerDetailModal(server) {
    currentServer = server;
    const modal = document.getElementById('server-detail-modal');
    if (!modal) return;

    // Populate header
    document.getElementById('modal-server-avatar').textContent = getInitials(server.name);
    document.getElementById('modal-server-name').textContent = server.name;
    document.getElementById('modal-server-description').textContent = server.description || 'No description';
    
    const statusEl = document.getElementById('modal-server-status');
    const isLocked = server.isLocked || server.locked;
    statusEl.textContent = isLocked ? 'Locked' : 'Active';
    statusEl.className = `badge badge-${isLocked ? 'danger' : 'success'}`;
    
    document.getElementById('modal-server-visibility').textContent = server.isPublic ? 'Public' : 'Private';

    // Quick stats
    document.getElementById('modal-member-count').textContent = AdminUtils?.formatNumber?.(server.memberCount || 0);
    document.getElementById('modal-channel-count').textContent = server.channelCount || 0;
    document.getElementById('modal-role-count').textContent = server.roleCount || 0;
    document.getElementById('modal-report-count').textContent = '0'; // Will be updated

    // Details
    document.getElementById('modal-server-id').textContent = '#' + server.id;
    document.getElementById('modal-created-at').textContent = formatDateTime(server.createdAt);
    document.getElementById('modal-last-activity').textContent = formatDateTime(server.lastActivityAt || server.updatedAt);
    document.getElementById('modal-max-members').textContent = AdminUtils?.formatNumber?.(server.maxMembers || 100000);

    // Owner
    const ownerAvatar = document.getElementById('modal-owner-avatar');
    ownerAvatar.src = server.ownerAvatarUrl || '/images/default-avatar.png';
    ownerAvatar.onerror = () => ownerAvatar.src = '/images/default-avatar.png';
    document.getElementById('modal-owner-name').textContent = server.ownerUsername || '--';
    document.getElementById('modal-owner-email').textContent = server.ownerEmail || '--';

    // Lock info
    const lockSection = document.getElementById('lock-info-section');
    if (isLocked) {
      lockSection.style.display = 'block';
      document.getElementById('modal-locked-at').textContent = formatDateTime(server.lockedAt);
      document.getElementById('modal-lock-reason').textContent = server.lockReason || 'No reason provided';
    } else {
      lockSection.style.display = 'none';
    }

    // Update lock action panel
    updateLockActionPanel(isLocked);

    // Reset to overview tab
    switchModalTab('overview');

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Load reports count
    loadServerReportsCount(server.id);
  }

  function updateLockActionPanel(isLocked) {
    const titleEl = document.getElementById('lock-action-title');
    const descEl = document.getElementById('lock-action-desc');
    const btnTextEl = document.getElementById('btn-lock-text');
    const btn = document.getElementById('btn-toggle-lock');
    const reasonInput = document.getElementById('lock-reason-input');

    if (isLocked) {
      titleEl.textContent = 'Unlock Server';
      descEl.textContent = 'Unlocking the server will allow all members to access it again.';
      btnTextEl.textContent = 'Unlock Server';
      btn.className = 'admin-btn admin-btn-success';
      if (reasonInput) reasonInput.parentElement.style.display = 'none';
    } else {
      titleEl.textContent = 'Lock Server';
      descEl.textContent = 'Locking a server will prevent all members from accessing it. The server will be hidden from public listings.';
      btnTextEl.textContent = 'Lock Server';
      btn.className = 'admin-btn admin-btn-warning';
      if (reasonInput) reasonInput.parentElement.style.display = 'block';
    }
  }

  async function loadServerReportsCount(serverId) {
    try {
      const response = await AdminUtils.api.get(`${API.serverReports(serverId)}?page=0&size=1`);
      const count = response?.totalElements || 0;
      document.getElementById('modal-report-count').textContent = count;
      
      const badge = document.getElementById('tab-reports-count');
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    } catch (error) {
      console.error('[AdminServers] Failed to load reports count:', error);
    }
  }

  // ========================================
  // Modal Tabs
  // ========================================

  function initModalTabs() {
    document.querySelectorAll('#server-modal-tabs .admin-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        switchModalTab(this.dataset.tab);
      });
    });
  }

  function switchModalTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('#server-modal-tabs .admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('#server-detail-modal .admin-tab-content').forEach(c => {
      c.classList.toggle('active', c.dataset.tabContent === tabName);
    });

    // Load tab data if needed
    if (tabName === 'reports' && currentServer) {
      loadServerReports(currentServer.id);
    } else if (tabName === 'audit-log' && currentServer) {
      loadServerAuditLog(currentServer.id);
    }
  }

  async function loadServerReports(serverId) {
    const container = document.getElementById('server-reports-list');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-4"><div class="loading-spinner"></div></div>';

    try {
      const response = await AdminUtils.api.get(`${API.serverReports(serverId)}?page=0&size=10`);
      const reports = response?.content || [];

      if (reports.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <path d="M12 6v36"/>
              <path d="M12 8h26l-6 8 6 8H12"/>
            </svg>
            <p>No reports for this server</p>
          </div>
        `;
        return;
      }

      container.innerHTML = reports.map(r => `
        <div class="report-item">
          <div class="report-header">
            <span class="badge badge-${getReportStatusClass(r.status)}">${r.status}</span>
            <span class="report-type">${r.type}</span>
          </div>
          <div class="report-content">${escapeHtml(r.reason || r.description || '--')}</div>
          <div class="report-meta">
            <span>By @${escapeHtml(r.reporterUsername)}</span>
            <span>${formatDate(r.createdAt)}</span>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('[AdminServers] Failed to load reports:', error);
      container.innerHTML = '<div class="text-center text-danger py-4">Failed to load reports</div>';
    }
  }

  async function loadServerAuditLog(serverId) {
    const container = document.getElementById('server-audit-log');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-4"><div class="loading-spinner"></div></div>';

    try {
      const response = await AdminUtils.api.get(`${API.serverAudit(serverId)}?page=0&size=20`);
      const logs = response?.content || [];

      if (logs.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <circle cx="24" cy="24" r="18"/>
              <path d="M24 14v10l6 6"/>
            </svg>
            <p>No audit log entries yet</p>
          </div>
        `;
        return;
      }

      container.innerHTML = logs.map(log => `
        <div class="audit-item">
          <div class="audit-icon audit-icon-${getAuditIconClass(log.actionType)}">
            ${getAuditIcon(log.actionType)}
          </div>
          <div class="audit-content">
            <div class="audit-text">${escapeHtml(log.details)}</div>
            <div class="audit-meta">
              <span>By @${escapeHtml(log.actorUsername)}</span>
              <span>${formatDateTime(log.createdAt)}</span>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('[AdminServers] Failed to load audit log:', error);
      container.innerHTML = '<div class="text-center text-danger py-4">Failed to load audit log</div>';
    }
  }

  // ========================================
  // Modal Actions
  // ========================================

  function initModalActions() {
    // Lock/Unlock toggle
    document.getElementById('btn-toggle-lock')?.addEventListener('click', async function() {
      if (!currentServer) return;
      
      const isLocked = currentServer.isLocked || currentServer.locked;
      
      if (isLocked) {
        if (await unlockServer(currentServer.id)) {
          currentServer.isLocked = false;
          updateLockActionPanel(false);
          document.getElementById('lock-info-section').style.display = 'none';
          const statusEl = document.getElementById('modal-server-status');
          statusEl.textContent = 'Active';
          statusEl.className = 'badge badge-success';
        }
      } else {
        const reason = document.getElementById('lock-reason-input')?.value?.trim();
        if (!reason) {
          AdminUtils?.showToast?.('Please enter a reason for locking', 'warning');
          return;
        }
        if (await lockServer(currentServer.id, reason)) {
          currentServer.isLocked = true;
          currentServer.lockReason = reason;
          currentServer.lockedAt = new Date().toISOString();
          updateLockActionPanel(true);
          document.getElementById('lock-info-section').style.display = 'block';
          document.getElementById('modal-locked-at').textContent = formatDateTime(currentServer.lockedAt);
          document.getElementById('modal-lock-reason').textContent = reason;
          const statusEl = document.getElementById('modal-server-status');
          statusEl.textContent = 'Locked';
          statusEl.className = 'badge badge-danger';
        }
      }
    });

    // Transfer ownership
    document.getElementById('btn-transfer-ownership')?.addEventListener('click', async function() {
      if (!currentServer) return;
      
      const newOwnerId = document.getElementById('transfer-user-id')?.value?.trim();
      const reason = document.getElementById('transfer-reason')?.value?.trim();
      
      if (!newOwnerId) {
        AdminUtils?.showToast?.('Please enter a user ID', 'warning');
        return;
      }
      
      if (!confirm(`Are you sure you want to transfer ownership of "${currentServer.name}" to user #${newOwnerId}?`)) {
        return;
      }
      
      if (await transferOwnership(currentServer.id, newOwnerId, reason)) {
        closeModal('server-detail-modal');
      }
    });

    // Delete server
    document.getElementById('btn-delete-server')?.addEventListener('click', function() {
      if (!currentServer) return;
      showConfirmDeleteModal(currentServer);
    });

    // View owner profile
    document.getElementById('btn-view-owner')?.addEventListener('click', function() {
      if (!currentServer?.ownerId) return;
      AdminUtils?.showToast?.('Navigate to user profile (TODO)', 'info');
    });
  }

  // ========================================
  // Quick Lock Modal
  // ========================================

  function showQuickLockModal(server) {
    const modal = document.getElementById('quick-lock-modal');
    if (!modal) return;

    currentServer = server;
    document.getElementById('quick-lock-avatar').textContent = getInitials(server.name);
    document.getElementById('quick-lock-server-name').textContent = server.name;
    document.getElementById('quick-lock-server-meta').textContent = `${server.memberCount || 0} members`;
    document.getElementById('quick-lock-reason').value = '';

    modal.style.display = 'flex';
  }

  // ========================================
  // Confirm Delete Modal
  // ========================================

  function showConfirmDeleteModal(server) {
    const modal = document.getElementById('confirm-delete-modal');
    if (!modal) return;

    currentServer = server;
    document.getElementById('confirm-delete-server-name').textContent = server.name;
    document.getElementById('confirm-delete-input').value = '';
    document.getElementById('btn-confirm-delete').disabled = true;

    // Enable button when name matches
    document.getElementById('confirm-delete-input').oninput = function() {
      document.getElementById('btn-confirm-delete').disabled = this.value !== server.name;
    };

    modal.style.display = 'flex';
  }

  // ========================================
  // Modal Management
  // ========================================

  function initModals() {
    // Close buttons
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.onclick = () => closeModal('server-detail-modal');
    });
    
    document.querySelectorAll('[data-action="close-quick-lock"]').forEach(btn => {
      btn.onclick = () => closeModal('quick-lock-modal');
    });
    
    document.querySelectorAll('[data-action="close-confirm-delete"]').forEach(btn => {
      btn.onclick = () => closeModal('confirm-delete-modal');
    });

    // Quick lock confirm
    document.getElementById('btn-confirm-quick-lock')?.addEventListener('click', async function() {
      if (!currentServer) return;
      
      const reason = document.getElementById('quick-lock-reason')?.value?.trim();
      if (!reason) {
        AdminUtils?.showToast?.('Please enter a reason', 'warning');
        return;
      }
      
      if (await lockServer(currentServer.id, reason)) {
        closeModal('quick-lock-modal');
      }
    });

    // Confirm delete
    document.getElementById('btn-confirm-delete')?.addEventListener('click', async function() {
      if (!currentServer) return;
      
      const reason = document.getElementById('delete-reason')?.value?.trim() || 'Admin deletion';
      
      if (await deleteServer(currentServer.id, reason)) {
        closeModal('confirm-delete-modal');
        closeModal('server-detail-modal');
      }
    });

    // Backdrop clicks
    ['server-detail-modal', 'quick-lock-modal', 'confirm-delete-modal'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', function(e) {
        if (e.target === this) closeModal(id);
      });
    });

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal('confirm-delete-modal');
        closeModal('quick-lock-modal');
        closeModal('server-detail-modal');
      }
    });
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      if (modalId === 'server-detail-modal') {
        currentServer = null;
        document.body.style.overflow = '';
      }
    }
  }

  // ========================================
  // Utility Functions
  // ========================================

  function getInitials(name) {
    if (!name) return '??';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getReportStatusClass(status) {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s === 'pending') return 'warning';
    if (s === 'resolved') return 'success';
    if (s === 'rejected') return 'ghost';
    return 'default';
  }

  function getAuditIconClass(actionType) {
    if (!actionType) return 'info';
    if (actionType.includes('DELETE')) return 'danger';
    if (actionType.includes('LOCK')) return 'warning';
    if (actionType.includes('UNLOCK')) return 'success';
    if (actionType.includes('TRANSFER')) return 'info';
    return 'info';
  }

  function getAuditIcon(actionType) {
    if (!actionType) return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/></svg>';
    
    if (actionType.includes('DELETE')) {
      return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>';
    }
    if (actionType.includes('LOCK')) {
      return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>';
    }
    if (actionType.includes('UNLOCK')) {
      return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M11 7V5a3 3 0 00-5-2"/></svg>';
    }
    if (actionType.includes('TRANSFER')) {
      return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M4 8h8M9 5l3 3-3 3"/></svg>';
    }
    
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>';
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: () => Promise.all([fetchStats(), fetchServers()]),
    closeModal
  };

})();

// Expose to window for router
window.AdminServers = AdminServers;
