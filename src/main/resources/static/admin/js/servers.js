/**
 * CoCoCord Admin - Servers Page JavaScript
 * Horizontal layout modal, Context Menu, Action Modals
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
  let contextMenuServer = null;
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
    suspend: (id) => `/api/admin/servers/${id}/suspend`,
    unsuspend: (id) => `/api/admin/servers/${id}/unsuspend`,
    transfer: (id) => `/api/admin/servers/${id}/transfer`,
    serverAudit: (id) => `/api/admin/servers/${id}/audit-log`,
    serverReports: (id) => `/api/admin/servers/${id}/reports`
  };

  // ========================================
  // Confirmation Modal
  // ========================================

  function showConfirmationModal(options) {
    const { title, message, confirmText, confirmClass, isDangerous, onConfirm } = options;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('confirmation-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = 'confirmation-modal';
    modal.className = 'admin-modal-backdrop glass-backdrop';
    modal.style.display = 'flex';
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
          <button class="admin-btn admin-btn-ghost" id="confirmation-cancel">Cancel</button>
          <button class="admin-btn ${confirmClass || 'admin-btn-primary'}" id="confirmation-confirm">
            ${escapeHtml(confirmText || 'Confirm')}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Event handlers
    const closeConfirmationModal = () => {
      modal.remove();
      document.body.style.overflow = '';
    };
    
    modal.querySelector('#confirmation-cancel').addEventListener('click', closeConfirmationModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeConfirmationModal();
    });
    
    modal.querySelector('#confirmation-confirm').addEventListener('click', () => {
      closeConfirmationModal();
      if (typeof onConfirm === 'function') onConfirm();
    });
    
    // Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeConfirmationModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

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
    initModals();
    initContextMenu();
    initActionModals();
    initPagination();
    initStatCardClicks();
    initWebSocket();
    
    // Fetch initial data
    fetchStats();
    fetchServers();
    
    console.log('[AdminServers] Initialized');
  }

  // ========================================
  // WebSocket for Realtime Updates
  // ========================================

  function initWebSocket() {
    if (!AdminUtils?.websocket) {
      console.warn('[AdminServers] WebSocket not available');
      return;
    }

    AdminUtils.websocket.connect(() => {
      AdminUtils.websocket.subscribe('/topic/admin.servers', handleServerEvent);
    });
  }

  function handleServerEvent(event) {
    console.log('[AdminServers] Received event:', event.type, event);
    
    switch (event.type) {
      case 'SERVER_CREATED':
        handleServerCreated(event.server);
        break;
      case 'SERVER_UPDATED':
      case 'SERVER_LOCKED':
      case 'SERVER_UNLOCKED':
      case 'SERVER_SUSPENDED':
      case 'SERVER_UNSUSPENDED':
        handleServerUpdated(event.server);
        break;
      case 'SERVER_DELETED':
        handleServerDeleted(event.serverId);
        break;
      default:
        console.log('[AdminServers] Unknown event type:', event.type);
    }
  }

  function handleServerCreated(server) {
    // Add new server to the beginning of the list
    serversData.unshift(server);
    pagination.totalElements++;
    
    renderServersTable();
    updatePaginationUI();
    fetchStats();
    
    AdminUtils?.showToast?.(`New server created: ${server.name}`, 'info');
  }

  function handleServerUpdated(server) {
    // Update server in list
    const index = serversData.findIndex(s => s.id === server.id);
    if (index !== -1) {
      serversData[index] = server;
      renderServersTable();
      fetchStats();
      
      // Update detail modal if this server is currently shown
      if (currentServer && currentServer.id === server.id) {
        showServerDetailModal(server);
      }
    }
  }

  function handleServerDeleted(serverId) {
    // Remove server from list
    const index = serversData.findIndex(s => s.id === serverId);
    if (index !== -1) {
      const serverName = serversData[index].name;
      serversData.splice(index, 1);
      pagination.totalElements--;
      
      renderServersTable();
      updatePaginationUI();
      fetchStats();
      
      // Close detail modal if this server was shown
      if (currentServer && currentServer.id === serverId) {
        closeModal('server-detail-modal');
      }
    }
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
        updateStatCard('stat-suspended-servers', stats.suspendedServers);
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
    
    tbody.innerHTML = servers.map((server, index) => {
      const isLocked = server.isLocked || server.locked || false;
      const isSuspended = server.isSuspended || server.suspended || false;
      const status = isSuspended ? 'Suspended' : (isLocked ? 'Locked' : 'Active');
      const statusClass = isSuspended ? 'suspended' : (isLocked ? 'locked' : 'in-progress');
      
      return `
      <tr data-id="${server.id}" class="server-row figma-row" data-server='${JSON.stringify(server).replace(/'/g, "\\'")}'>
        <td>
          <input type="checkbox" class="server-checkbox admin-checkbox" value="${server.id}" onclick="event.stopPropagation();">
        </td>
        <td class="text-muted">#${server.id}</td>
        <td>
          <div class="user-cell">
            <div class="figma-avatar">${getInitials(server.name)}</div>
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
          <span class="figma-badge ${statusClass}">${status}</span>
        </td>
        <td>${formatDate(server.createdAt)}</td>
        <td>${formatDate(server.lastActivityAt || server.updatedAt)}</td>
        <td>
          <div class="action-buttons">
            <button class="admin-btn admin-btn-sm admin-btn-ghost" title="View Details" data-action="view" data-id="${server.id}">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/></svg>
            </button>
            ${isSuspended ? `
              <button class="admin-btn admin-btn-sm admin-btn-ghost text-success" title="Unsuspend" data-action="unsuspend" data-id="${server.id}">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M1 8h14M8 1v14"/></svg>
              </button>
            ` : isLocked ? `
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
    
    // Apply client-side search (including owner)
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      servers = servers.filter(s => {
        const name = (s.name || '').toLowerCase();
        const owner = (s.ownerUsername || '').toLowerCase();
        const id = String(s.id || '');
        return name.includes(searchLower) || owner.includes(searchLower) || id.includes(searchLower);
      });
    }
    
    // Apply client-side filters
    if (currentFilters.status) {
      servers = servers.filter(s => {
        const isLocked = s.isLocked || s.locked;
        const isSuspended = s.isSuspended || s.suspended;
        if (currentFilters.status === 'locked') return isLocked && !isSuspended;
        if (currentFilters.status === 'suspended') return isSuspended;
        if (currentFilters.status === 'active') return !isLocked && !isSuspended;
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
    // Right-click for context menu (removed row click for detail modal)
    document.querySelectorAll('.server-row').forEach(row => {
      // Right-click for context menu
      row.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const server = JSON.parse(this.dataset.server);
        if (server) showContextMenu(e, server);
      });
    });

    // View buttons
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (server) showServerDetailModal(server);
      };
    });

    // Lock buttons - with confirmation modal
    document.querySelectorAll('[data-action="lock"]').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (server) {
          showConfirmationModal({
            title: 'Lock Server',
            message: `Are you sure you want to lock "${server.name}"? Members will not be able to access this server.`,
            confirmText: 'Lock Server',
            confirmClass: 'admin-btn-warning',
            onConfirm: () => showLockModal(server)
          });
        }
      };
    });

    // Unlock buttons - with confirmation modal
    document.querySelectorAll('[data-action="unlock"]').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (server) {
          showConfirmationModal({
            title: 'Unlock Server',
            message: `Are you sure you want to unlock "${server.name}"? Members will be able to access this server again.`,
            confirmText: 'Unlock Server',
            confirmClass: 'admin-btn-success',
            onConfirm: async () => await unlockServer(serverId)
          });
        }
      };
    });

    // Unsuspend buttons - with confirmation modal
    document.querySelectorAll('[data-action="unsuspend"]').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (server) {
          showConfirmationModal({
            title: 'Unsuspend Server',
            message: `Are you sure you want to unsuspend "${server.name}"? The server will become active again.`,
            confirmText: 'Unsuspend Server',
            confirmClass: 'admin-btn-success',
            onConfirm: async () => await unsuspendServer(serverId)
          });
        }
      };
    });

    // Delete buttons - with confirmation modal
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        if (server) {
          showConfirmationModal({
            title: 'Delete Server',
            message: `Are you sure you want to delete "${server.name}"? This action cannot be undone.`,
            confirmText: 'Delete Server',
            confirmClass: 'admin-btn-danger',
            isDangerous: true,
            onConfirm: () => showDeleteModal(server)
          });
        }
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
  // Context Menu
  // ========================================

  function initContextMenu() {
    // Hide context menu on any click outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.server-context-menu')) {
        hideContextMenu();
      }
    });

    // Hide on scroll
    document.addEventListener('scroll', hideContextMenu, true);

    // Hide on escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') hideContextMenu();
    });

    // Context menu item clicks - using data-action selectors
    const contextMenu = document.getElementById('server-context-menu');
    if (!contextMenu) return;

    // View Details
    contextMenu.querySelector('[data-action="view-details"]')?.addEventListener('click', function() {
      if (contextMenuServer) showServerDetailModal(contextMenuServer);
      hideContextMenu();
    });

    // Lock Server - show confirmation modal
    contextMenu.querySelector('[data-action="lock-server"]')?.addEventListener('click', function() {
      if (contextMenuServer) {
        showConfirmationModal({
          title: 'Lock Server',
          message: `Are you sure you want to lock "${contextMenuServer.name}"? Members will not be able to access this server.`,
          confirmText: 'Lock Server',
          confirmClass: 'admin-btn-warning',
          onConfirm: () => showLockModal(contextMenuServer)
        });
      }
      hideContextMenu();
    });

    // Unlock Server - show confirmation modal
    contextMenu.querySelector('[data-action="unlock-server"]')?.addEventListener('click', function() {
      if (contextMenuServer) {
        showConfirmationModal({
          title: 'Unlock Server',
          message: `Are you sure you want to unlock "${contextMenuServer.name}"? Members will be able to access this server again.`,
          confirmText: 'Unlock Server',
          confirmClass: 'admin-btn-success',
          onConfirm: async () => {
            await unlockServer(contextMenuServer.id);
          }
        });
      }
      hideContextMenu();
    });

    // Suspend Server - show confirmation modal
    contextMenu.querySelector('[data-action="suspend-server"]')?.addEventListener('click', function() {
      if (contextMenuServer) {
        showConfirmationModal({
          title: 'Suspend Server',
          message: `Are you sure you want to suspend "${contextMenuServer.name}"? The server will be temporarily disabled.`,
          confirmText: 'Suspend Server',
          confirmClass: 'admin-btn-warning',
          onConfirm: () => showSuspendModal(contextMenuServer)
        });
      }
      hideContextMenu();
    });

    // Unsuspend Server - show confirmation modal
    contextMenu.querySelector('[data-action="unsuspend-server"]')?.addEventListener('click', function() {
      if (contextMenuServer) {
        showConfirmationModal({
          title: 'Unsuspend Server',
          message: `Are you sure you want to unsuspend "${contextMenuServer.name}"? The server will become active again.`,
          confirmText: 'Unsuspend Server',
          confirmClass: 'admin-btn-success',
          onConfirm: async () => {
            await unsuspendServer(contextMenuServer.id);
          }
        });
      }
      hideContextMenu();
    });

    // View Audit Log
    contextMenu.querySelector('[data-action="view-audit"]')?.addEventListener('click', function() {
      if (contextMenuServer) {
        showServerDetailModal(contextMenuServer);
        setTimeout(() => switchModalTab('audit-log'), 100);
      }
      hideContextMenu();
    });

    // Force Delete - show confirmation modal
    contextMenu.querySelector('[data-action="delete-server"]')?.addEventListener('click', function() {
      if (contextMenuServer) {
        showConfirmationModal({
          title: 'Force Delete Server',
          message: `Are you sure you want to permanently delete "${contextMenuServer.name}"? This action cannot be undone and all data will be lost.`,
          confirmText: 'Delete Server',
          confirmClass: 'admin-btn-danger',
          isDangerous: true,
          onConfirm: () => showDeleteModal(contextMenuServer)
        });
      }
      hideContextMenu();
    });
  }

  function showContextMenu(e, server) {
    contextMenuServer = server;
    const menu = document.getElementById('server-context-menu');
    if (!menu) return;

    const isLocked = server.isLocked || server.locked || false;
    const isSuspended = server.isSuspended || server.suspended || false;

    // Show/hide lock/unlock options using data-action
    const lockItem = menu.querySelector('[data-action="lock-server"]');
    const unlockItem = menu.querySelector('[data-action="unlock-server"]');
    
    // Can't lock a suspended server (already more restricted)
    if (lockItem) {
      if (isSuspended) {
        lockItem.style.display = 'none';
      } else {
        lockItem.style.display = isLocked ? 'none' : 'flex';
      }
    }
    if (unlockItem) {
      // Can't unlock a suspended server via unlock (need to unsuspend first)
      if (isSuspended) {
        unlockItem.style.display = 'none';
      } else {
        unlockItem.style.display = isLocked ? 'flex' : 'none';
      }
    }

    // Show/hide suspend/unsuspend options
    const suspendItem = menu.querySelector('[data-action="suspend-server"]');
    const unsuspendItem = menu.querySelector('[data-action="unsuspend-server"]');
    if (suspendItem) suspendItem.style.display = isSuspended ? 'none' : 'flex';
    if (unsuspendItem) unsuspendItem.style.display = isSuspended ? 'flex' : 'none';

    // Position menu
    const menuWidth = 200;
    const menuHeight = 250;
    let x = e.clientX;
    let y = e.clientY;

    // Keep menu in viewport
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
  }

  function hideContextMenu() {
    const menu = document.getElementById('server-context-menu');
    if (menu) menu.style.display = 'none';
    contextMenuServer = null;
  }

  // ========================================
  // Server Actions
  // ========================================

  async function lockServer(serverId, reason) {
    if (!reason || !reason.trim()) {
      AdminUtils?.showToast?.('Reason is required', 'warning');
      return false;
    }
    
    try {
      const params = new URLSearchParams();
      params.append('reason', reason.trim());
      
      await AdminUtils.api.post(`${API.lock(serverId)}?${params}`);
      AdminUtils?.showToast?.('Server locked successfully', 'warning');
      // Stats will update via WebSocket
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to lock server:', error);
      AdminUtils?.showToast?.('Failed to lock server: ' + error.message, 'danger');
      return false;
    }
  }

  async function unlockServer(serverId) {
    try {
      await AdminUtils.api.post(API.unlock(serverId));
      AdminUtils?.showToast?.('Server unlocked successfully', 'success');
      // Stats will update via WebSocket
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to unlock server:', error);
      AdminUtils?.showToast?.('Failed to unlock server: ' + error.message, 'danger');
      return false;
    }
  }

  async function deleteServer(serverId, reason) {
    if (!reason || !reason.trim()) {
      AdminUtils?.showToast?.('Reason is required', 'warning');
      return false;
    }
    
    try {
      const params = new URLSearchParams();
      params.append('reason', reason.trim());
      
      await AdminUtils.api.delete(`${API.server(serverId)}?${params}`);
      AdminUtils?.showToast?.('Server deleted successfully', 'success');
      // Stats will update via WebSocket
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to delete server:', error);
      AdminUtils?.showToast?.('Failed to delete server: ' + error.message, 'danger');
      return false;
    }
  }

  async function transferOwnership(serverId, newOwnerId, reason) {
    if (!newOwnerId) {
      AdminUtils?.showToast?.('New owner ID is required', 'warning');
      return false;
    }
    if (!reason || !reason.trim()) {
      AdminUtils?.showToast?.('Reason is required', 'warning');
      return false;
    }
    
    try {
      const params = new URLSearchParams({ newOwnerId });
      params.append('reason', reason.trim());
      
      await AdminUtils.api.post(`${API.transfer(serverId)}?${params}`);
      AdminUtils?.showToast?.('Ownership transferred successfully', 'success');
      await fetchServers();
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to transfer ownership:', error);
      AdminUtils?.showToast?.('Failed to transfer ownership: ' + error.message, 'danger');
      return false;
    }
  }

  async function suspendServer(serverId, reason, duration) {
    if (!reason || !reason.trim()) {
      AdminUtils?.showToast?.('Reason is required', 'warning');
      return false;
    }
    
    try {
      const params = new URLSearchParams();
      params.append('reason', reason.trim());
      if (duration && duration !== 'permanent') {
        params.append('duration', duration);
      }
      
      await AdminUtils.api.post(`${API.suspend(serverId)}?${params}`);
      AdminUtils?.showToast?.('Server suspended successfully', 'warning');
      // Stats will update via WebSocket
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to suspend server:', error);
      AdminUtils?.showToast?.('Failed to suspend server: ' + error.message, 'danger');
      return false;
    }
  }

  async function unsuspendServer(serverId) {
    try {
      await AdminUtils.api.post(API.unsuspend(serverId));
      AdminUtils?.showToast?.('Server unsuspended successfully', 'success');
      // Stats will update via WebSocket
      return true;
    } catch (error) {
      console.error('[AdminServers] Failed to unsuspend server:', error);
      AdminUtils?.showToast?.('Failed to unsuspend server: ' + error.message, 'danger');
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
        // Apply client-side filtering first for instant results
        renderServersTable();
        updatePaginationUI();
        // Then fetch from server for fresh data
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
    const filterCountEl = document.getElementById('filter-results-count');

    if (showingEl) {
      const start = pagination.page * pagination.size + 1;
      const end = Math.min((pagination.page + 1) * pagination.size, pagination.totalElements);
      showingEl.textContent = pagination.totalElements > 0 ? `${start}-${end}` : '0';
    }

    if (totalEl) {
      totalEl.textContent = filtered.length;
    }
    
    // Update filter results count
    if (filterCountEl) {
      const hasFilters = currentFilters.search || currentFilters.status || currentFilters.size || currentFilters.time;
      if (hasFilters) {
        filterCountEl.style.display = 'block';
        filterCountEl.textContent = `${filtered.length} server${filtered.length !== 1 ? 's' : ''} found after filtering`;
      } else {
        filterCountEl.style.display = 'none';
      }
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
    
    if (bar) {
      bar.classList.toggle('visible', selected.length > 0);
    }
    if (countEl) countEl.textContent = selected.length;
  }

  function getSelectedServerIds() {
    return Array.from(document.querySelectorAll('.server-checkbox:checked')).map(cb => cb.value);
  }

  function initBulkActions() {
    // Bulk Lock button
    document.querySelector('[data-bulk-action="lock"]')?.addEventListener('click', function() {
      const selected = getSelectedServerIds();
      if (selected.length === 0) return;
      showBulkLockModal(selected.length);
    });

    // Bulk Unlock button
    document.querySelector('[data-bulk-action="unlock"]')?.addEventListener('click', function() {
      const selected = getSelectedServerIds();
      if (selected.length === 0) return;
      showBulkUnlockModal(selected.length);
    });

    // Bulk Delete button
    document.querySelector('[data-bulk-action="delete"]')?.addEventListener('click', function() {
      const selected = getSelectedServerIds();
      if (selected.length === 0) return;
      showBulkDeleteModal(selected.length);
    });

    // Bulk Lock Modal handlers
    document.querySelector('[data-action="close-bulk-lock-modal"]')?.addEventListener('click', hideBulkLockModal);
    document.getElementById('btn-confirm-bulk-lock')?.addEventListener('click', async function() {
      const selected = getSelectedServerIds();
      const reason = document.getElementById('bulk-lock-reason')?.value?.trim();
      
      if (!reason) {
        AdminUtils?.showToast?.('Please enter a reason for locking', 'warning');
        return;
      }
      
      this.disabled = true;
      this.innerHTML = '<span class="loading-spinner-sm"></span> Locking...';
      
      for (const id of selected) {
        await lockServer(id, reason);
      }
      
      hideBulkLockModal();
      clearBulkSelection();
      AdminUtils?.showToast?.(`${selected.length} servers locked successfully`, 'success');
    });

    // Bulk Unlock Modal handlers
    document.querySelector('[data-action="close-bulk-unlock-modal"]')?.addEventListener('click', hideBulkUnlockModal);
    document.getElementById('btn-confirm-bulk-unlock')?.addEventListener('click', async function() {
      const selected = getSelectedServerIds();
      
      this.disabled = true;
      this.innerHTML = '<span class="loading-spinner-sm"></span> Unlocking...';
      
      for (const id of selected) {
        await unlockServer(id);
      }
      
      hideBulkUnlockModal();
      clearBulkSelection();
      AdminUtils?.showToast?.(`${selected.length} servers unlocked successfully`, 'success');
    });

    // Bulk Delete Modal handlers
    document.querySelector('[data-action="close-bulk-delete-modal"]')?.addEventListener('click', hideBulkDeleteModal);
    
    // Enable/disable bulk delete button based on confirmation input
    document.getElementById('confirm-bulk-delete-input')?.addEventListener('input', function() {
      const confirmBtn = document.getElementById('btn-confirm-bulk-delete');
      if (confirmBtn) {
        confirmBtn.disabled = this.value !== 'DELETE';
      }
    });
    
    document.getElementById('btn-confirm-bulk-delete')?.addEventListener('click', async function() {
      const selected = getSelectedServerIds();
      const reason = document.getElementById('bulk-delete-reason')?.value?.trim();
      
      this.disabled = true;
      this.innerHTML = '<span class="loading-spinner-sm"></span> Deleting...';
      
      for (const id of selected) {
        await deleteServer(id, reason);
      }
      
      hideBulkDeleteModal();
      clearBulkSelection();
      AdminUtils?.showToast?.(`${selected.length} servers deleted permanently`, 'success');
    });
  }

  function clearBulkSelection() {
    document.querySelectorAll('.server-checkbox:checked').forEach(cb => cb.checked = false);
    const selectAll = document.getElementById('select-all-servers');
    if (selectAll) selectAll.checked = false;
    updateBulkActionsBar();
  }

  // Bulk Lock Modal
  function showBulkLockModal(count) {
    const modal = document.getElementById('bulk-lock-modal');
    if (!modal) return;
    document.getElementById('bulk-lock-count').textContent = count;
    document.getElementById('bulk-lock-reason').value = '';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Reset button state
    const btn = document.getElementById('btn-confirm-bulk-lock');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Lock Selected Servers';
    }
  }

  function hideBulkLockModal() {
    const modal = document.getElementById('bulk-lock-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Bulk Unlock Modal
  function showBulkUnlockModal(count) {
    const modal = document.getElementById('bulk-unlock-modal');
    if (!modal) return;
    document.getElementById('bulk-unlock-count').textContent = count;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Reset button state
    const btn = document.getElementById('btn-confirm-bulk-unlock');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Unlock Selected Servers';
    }
  }

  function hideBulkUnlockModal() {
    const modal = document.getElementById('bulk-unlock-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Bulk Delete Modal
  function showBulkDeleteModal(count) {
    const modal = document.getElementById('bulk-delete-modal');
    if (!modal) return;
    document.getElementById('bulk-delete-count').textContent = count;
    document.getElementById('confirm-bulk-delete-input').value = '';
    document.getElementById('bulk-delete-reason').value = '';
    document.getElementById('btn-confirm-bulk-delete').disabled = true;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Reset button state
    const btn = document.getElementById('btn-confirm-bulk-delete');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Delete Selected Servers';
    }
  }

  function hideBulkDeleteModal() {
    const modal = document.getElementById('bulk-delete-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ========================================
  // Server Detail Modal (Horizontal Layout)
  // ========================================

  function showServerDetailModal(server) {
    currentServer = server;
    const modal = document.getElementById('server-detail-modal');
    if (!modal) return;

    const isLocked = server.isLocked || server.locked || false;
    const isSuspended = server.isSuspended || server.suspended || false;

    // Sidebar - Server Profile
    const avatarEl = document.getElementById('detail-server-avatar');
    if (avatarEl) avatarEl.textContent = getInitials(server.name);
    
    document.getElementById('detail-server-name')?.textContent && 
      (document.getElementById('detail-server-name').textContent = server.name);
    document.getElementById('detail-server-desc')?.textContent &&
      (document.getElementById('detail-server-desc').textContent = server.description || 'Server description...');

    // Server Badges - Figma style
    const badgesEl = document.getElementById('detail-server-badges');
    if (badgesEl) {
      let badgesHtml = '';
      if (isSuspended) {
        badgesHtml += '<span class="figma-badge suspended">Suspended</span>';
      } else if (isLocked) {
        badgesHtml += '<span class="figma-badge locked">Locked</span>';
      } else {
        badgesHtml += '<span class="figma-badge in-progress">Active</span>';
      }
      badgesHtml += server.isPublic ? '<span class="figma-badge complete">Public</span>' : '<span class="figma-badge rejected">Private</span>';
      badgesEl.innerHTML = badgesHtml;
    }

    // Sidebar Stats
    document.getElementById('detail-member-count')?.textContent &&
      (document.getElementById('detail-member-count').textContent = AdminUtils?.formatNumber?.(server.memberCount || 0));
    document.getElementById('detail-channel-count')?.textContent &&
      (document.getElementById('detail-channel-count').textContent = server.channelCount || 0);
    document.getElementById('detail-role-count')?.textContent &&
      (document.getElementById('detail-role-count').textContent = server.roleCount || 0);
    document.getElementById('detail-report-count')?.textContent &&
      (document.getElementById('detail-report-count').textContent = '0');

    // Overview Tab - Server Info
    document.getElementById('detail-server-id')?.textContent &&
      (document.getElementById('detail-server-id').textContent = server.id);
    document.getElementById('detail-created-at')?.textContent &&
      (document.getElementById('detail-created-at').textContent = formatDateTime(server.createdAt));
    document.getElementById('detail-last-activity')?.textContent &&
      (document.getElementById('detail-last-activity').textContent = formatDateTime(server.lastActivityAt || server.updatedAt) || '--');
    document.getElementById('detail-max-members')?.textContent &&
      (document.getElementById('detail-max-members').textContent = AdminUtils?.formatNumber?.(server.maxMembers || 100000) || '--');
    document.getElementById('detail-message-volume')?.textContent &&
      (document.getElementById('detail-message-volume').textContent = '--');
    document.getElementById('detail-boost-level')?.textContent &&
      (document.getElementById('detail-boost-level').textContent = 'Level ' + (server.boostLevel || 0));

    // Owner Info - Figma style
    const ownerAvatarEl = document.getElementById('detail-owner-avatar');
    if (ownerAvatarEl && server.ownerAvatarUrl) {
      ownerAvatarEl.innerHTML = `<img src="${server.ownerAvatarUrl}" alt="Owner" onerror="this.parentElement.innerHTML = '${getInitials(server.ownerUsername || 'Owner')}'">`;
    } else if (ownerAvatarEl) {
      ownerAvatarEl.innerHTML = getInitials(server.ownerUsername || 'Owner');
    }
    document.getElementById('detail-owner-name')?.textContent &&
      (document.getElementById('detail-owner-name').textContent = server.ownerUsername || 'Owner');
    document.getElementById('detail-owner-email')?.textContent &&
      (document.getElementById('detail-owner-email').textContent = server.ownerEmail || '--');

    // Reports summary
    const totalReportsEl = document.getElementById('detail-total-reports');
    const reportsStatusEl = document.getElementById('detail-reports-status');
    if (totalReportsEl) totalReportsEl.textContent = '0';
    if (reportsStatusEl) reportsStatusEl.textContent = 'No Reports';

    // Lock Info Section
    const lockInfoSection = document.getElementById('detail-lock-info');
    if (lockInfoSection) {
      if (isLocked) {
        lockInfoSection.style.display = 'block';
        document.getElementById('detail-locked-at')?.textContent &&
          (document.getElementById('detail-locked-at').textContent = formatDateTime(server.lockedAt) || '--');
        document.getElementById('detail-lock-reason')?.textContent &&
          (document.getElementById('detail-lock-reason').textContent = server.lockReason || 'No reason provided');
      } else {
        lockInfoSection.style.display = 'none';
      }
    }

    // Suspend Info Section
    const suspendInfoSection = document.getElementById('detail-suspend-info');
    if (suspendInfoSection) {
      if (isSuspended) {
        suspendInfoSection.style.display = 'block';
        document.getElementById('detail-suspended-at')?.textContent &&
          (document.getElementById('detail-suspended-at').textContent = formatDateTime(server.suspendedAt) || '--');
        document.getElementById('detail-suspend-reason')?.textContent &&
          (document.getElementById('detail-suspend-reason').textContent = server.suspendReason || 'No reason provided');
      } else {
        suspendInfoSection.style.display = 'none';
      }
    }

    // Reset to overview tab
    switchModalTab('overview');

    // Update action panels based on server state
    updateLockActionPanel(isLocked, isSuspended);
    updateSuspendActionPanel(isSuspended);

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Load additional data
    loadServerReportsCount(server.id);
  }

  function updateLockActionPanel(isLocked, isSuspended) {
    const titleEl = document.getElementById('lock-action-title');
    const descEl = document.getElementById('lock-action-desc');
    const btnTextEl = document.getElementById('btn-lock-text');
    const btn = document.getElementById('btn-open-lock-modal');
    const card = document.getElementById('lock-action-card');

    // If suspended, hide the lock action card entirely (suspend is stronger than lock)
    if (card) {
      card.style.display = isSuspended ? 'none' : 'flex';
    }

    if (isLocked && !isSuspended) {
      if (titleEl) titleEl.textContent = 'Unlock Server';
      if (descEl) descEl.textContent = 'Unlocking the server will allow all members to access it again.';
      if (btnTextEl) btnTextEl.textContent = 'Unlock';
      if (btn) btn.className = 'admin-btn admin-btn-success action-card-btn';
    } else {
      if (titleEl) titleEl.textContent = 'Lock Server';
      if (descEl) descEl.textContent = 'Locking a server will prevent all members from accessing it. The server will be hidden from public listings.';
      if (btnTextEl) btnTextEl.textContent = 'Lock';
      if (btn) btn.className = 'admin-btn admin-btn-warning action-card-btn';
    }
  }

  function updateSuspendActionPanel(isSuspended) {
    const titleEl = document.getElementById('suspend-action-title');
    const descEl = document.getElementById('suspend-action-desc');
    const btnTextEl = document.getElementById('btn-suspend-text');
    const btn = document.getElementById('btn-open-suspend-modal');

    if (isSuspended) {
      if (titleEl) titleEl.textContent = 'Unsuspend Server';
      if (descEl) descEl.textContent = 'Unsuspending will restore the server to active state.';
      if (btnTextEl) btnTextEl.textContent = 'Unsuspend';
      if (btn) btn.className = 'admin-btn admin-btn-success action-card-btn';
    } else {
      if (titleEl) titleEl.textContent = 'Suspend Server';
      if (descEl) descEl.textContent = 'Temporarily disable this server with an expiry time.';
      if (btnTextEl) btnTextEl.textContent = 'Suspend';
      if (btn) btn.className = 'admin-btn admin-btn-warning action-card-btn';
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
    document.querySelectorAll('#server-modal-tabs .tab-btn').forEach(tab => {
      tab.addEventListener('click', function() {
        switchModalTab(this.dataset.tab);
      });
    });
  }

  function switchModalTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('#server-modal-tabs .tab-btn').forEach(t => {
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
  // Modal Tab Data Loading
  // ========================================  // ========================================
  // Action Modals (Lock, Suspend, Transfer, Delete)
  // ========================================

  function initActionModals() {
    // Lock Modal
    document.getElementById('btn-confirm-lock')?.addEventListener('click', async function() {
      if (!currentServer) return;
      const reason = document.getElementById('lock-reason')?.value?.trim();
      if (!reason) {
        AdminUtils?.showToast?.('Please enter a reason for locking this server', 'warning');
        document.getElementById('lock-reason')?.focus();
        return;
      }
      
      this.disabled = true;
      this.innerHTML = '<span class="loading-spinner-sm"></span> Locking...';
      
      if (await lockServer(currentServer.id, reason)) {
        closeModal('lock-modal');
        closeModal('server-detail-modal');
      }
      
      this.disabled = false;
      this.textContent = 'Lock Server';
    });

    // Suspend Modal
    document.getElementById('btn-confirm-suspend')?.addEventListener('click', async function() {
      if (!currentServer) return;
      const reason = document.getElementById('suspend-reason')?.value?.trim();
      const duration = document.getElementById('suspend-duration')?.value || 'permanent';
      
      if (!reason) {
        AdminUtils?.showToast?.('Please enter a reason for suspending this server', 'warning');
        document.getElementById('suspend-reason')?.focus();
        return;
      }
      
      this.disabled = true;
      this.innerHTML = '<span class="loading-spinner-sm"></span> Suspending...';
      
      if (await suspendServer(currentServer.id, reason, duration)) {
        closeModal('suspend-modal');
        closeModal('server-detail-modal');
      }
      
      this.disabled = false;
      this.textContent = 'Suspend Server';
    });

    // Transfer Modal
    document.getElementById('btn-confirm-transfer')?.addEventListener('click', async function() {
      if (!currentServer) return;
      const newOwnerId = document.getElementById('transfer-user-id')?.value?.trim();
      const reason = document.getElementById('transfer-reason')?.value?.trim();
      
      if (!newOwnerId) {
        AdminUtils?.showToast?.('Please enter a user ID', 'warning');
        document.getElementById('transfer-user-id')?.focus();
        return;
      }
      
      if (!reason) {
        AdminUtils?.showToast?.('Please enter a reason for the transfer', 'warning');
        document.getElementById('transfer-reason')?.focus();
        return;
      }
      
      this.disabled = true;
      this.innerHTML = '<span class="loading-spinner-sm"></span> Transferring...';
      
      if (await transferOwnership(currentServer.id, newOwnerId, reason)) {
        closeModal('transfer-modal');
        closeModal('server-detail-modal');
      }
      
      this.disabled = false;
      this.textContent = 'Transfer Ownership';
    });

    // Delete Modal
    document.getElementById('confirm-delete-input')?.addEventListener('input', function() {
      const btn = document.getElementById('btn-confirm-delete');
      if (btn && currentServer) {
        btn.disabled = this.value !== currentServer.name;
      }
    });

    document.getElementById('btn-confirm-delete')?.addEventListener('click', async function() {
      if (!currentServer || this.disabled) return;
      const reason = document.getElementById('delete-reason')?.value?.trim();
      
      if (!reason) {
        AdminUtils?.showToast?.('Please enter a reason for deleting this server', 'warning');
        document.getElementById('delete-reason')?.focus();
        return;
      }
      
      this.disabled = true;
      this.innerHTML = '<span class="loading-spinner-sm"></span> Deleting...';
      
      if (await deleteServer(currentServer.id, reason)) {
        closeModal('delete-modal');
        closeModal('server-detail-modal');
      }
      
      this.disabled = false;
      this.textContent = 'Delete Server';
    });

    // Close buttons for action modals
    document.querySelectorAll('[data-action="close-lock-modal"]').forEach(btn => {
      btn.onclick = () => closeModal('lock-modal');
    });
    document.querySelectorAll('[data-action="close-suspend-modal"]').forEach(btn => {
      btn.onclick = () => closeModal('suspend-modal');
    });
    document.querySelectorAll('[data-action="close-transfer-modal"]').forEach(btn => {
      btn.onclick = () => closeModal('transfer-modal');
    });
    document.querySelectorAll('[data-action="close-delete-modal"]').forEach(btn => {
      btn.onclick = () => closeModal('delete-modal');
    });

    // Action card buttons in Admin Actions tab
    document.getElementById('btn-open-lock-modal')?.addEventListener('click', async function() {
      if (!currentServer) return;
      const isLocked = currentServer.isLocked || currentServer.locked || false;
      
      if (isLocked) {
        // Server is locked, perform unlock directly
        showConfirmationModal({
          title: 'Unlock Server',
          message: `Are you sure you want to unlock "${currentServer.name}"? Members will be able to access this server again.`,
          confirmText: 'Unlock Server',
          confirmClass: 'admin-btn-success',
          onConfirm: async () => {
            if (await unlockServer(currentServer.id)) {
              closeModal('server-detail-modal');
            }
          }
        });
      } else {
        // Server is not locked, show lock modal
        showLockModal(currentServer);
      }
    });
    document.getElementById('btn-open-suspend-modal')?.addEventListener('click', async function() {
      if (!currentServer) return;
      const isSuspended = currentServer.isSuspended || currentServer.suspended || false;
      
      if (isSuspended) {
        // Server is suspended, perform unsuspend directly
        showConfirmationModal({
          title: 'Unsuspend Server',
          message: `Are you sure you want to unsuspend "${currentServer.name}"? The server will become active again.`,
          confirmText: 'Unsuspend Server',
          confirmClass: 'admin-btn-success',
          onConfirm: async () => {
            if (await unsuspendServer(currentServer.id)) {
              closeModal('server-detail-modal');
            }
          }
        });
      } else {
        // Server is not suspended, show suspend modal
        showSuspendModal(currentServer);
      }
    });
    document.getElementById('btn-open-transfer-modal')?.addEventListener('click', function() {
      if (currentServer) showTransferModal(currentServer);
    });
    document.getElementById('btn-open-delete-modal')?.addEventListener('click', function() {
      if (currentServer) showDeleteModal(currentServer);
    });
  }

  function showLockModal(server) {
    currentServer = server;
    const modal = document.getElementById('lock-modal');
    if (!modal) return;

    // Update modal content
    const avatarEl = document.getElementById('lock-avatar');
    if (avatarEl) avatarEl.textContent = getInitials(server.name);
    
    document.getElementById('lock-server-name')?.textContent &&
      (document.getElementById('lock-server-name').textContent = server.name);
    
    const metaEl = document.getElementById('lock-server-meta');
    if (metaEl) metaEl.textContent = `${AdminUtils?.formatNumber?.(server.memberCount || 0)} members`;
    
    // Reset form
    document.getElementById('lock-reason').value = '';
    
    // Reset button state
    const btn = document.getElementById('btn-confirm-lock');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Lock Server';
    }

    modal.style.display = 'flex';
  }

  function showSuspendModal(server) {
    currentServer = server;
    const modal = document.getElementById('suspend-modal');
    if (!modal) return;

    // Update modal content
    const avatarEl = document.getElementById('suspend-avatar');
    if (avatarEl) avatarEl.textContent = getInitials(server.name);
    
    document.getElementById('suspend-server-name')?.textContent &&
      (document.getElementById('suspend-server-name').textContent = server.name);
    
    const metaEl = document.getElementById('suspend-server-meta');
    if (metaEl) metaEl.textContent = `${AdminUtils?.formatNumber?.(server.memberCount || 0)} members`;
    
    // Reset form
    document.getElementById('suspend-reason').value = '';
    document.getElementById('suspend-duration').value = '7';
    
    // Reset button state
    const btn = document.getElementById('btn-confirm-suspend');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Suspend Server';
    }

    modal.style.display = 'flex';
  }

  function showTransferModal(server) {
    currentServer = server;
    const modal = document.getElementById('transfer-modal');
    if (!modal) return;

    // Update modal content
    const avatarEl = document.getElementById('transfer-avatar');
    if (avatarEl) avatarEl.textContent = getInitials(server.name);
    
    document.getElementById('transfer-server-name')?.textContent &&
      (document.getElementById('transfer-server-name').textContent = server.name);
    
    // Update current owner info
    const currentOwnerEl = document.getElementById('transfer-current-owner');
    if (currentOwnerEl) currentOwnerEl.textContent = server.ownerUsername || '--';
    
    const metaEl = document.getElementById('transfer-server-meta');
    if (metaEl) metaEl.textContent = `${AdminUtils?.formatNumber?.(server.memberCount || 0)} members`;
    
    // Reset form
    const userIdInput = document.getElementById('transfer-user-id');
    if (userIdInput) userIdInput.value = '';
    const reasonInput = document.getElementById('transfer-reason');
    if (reasonInput) reasonInput.value = '';
    
    // Reset button state
    const btn = document.getElementById('btn-confirm-transfer');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Transfer Ownership';
    }

    modal.style.display = 'flex';
  }

  function showDeleteModal(server) {
    currentServer = server;
    const modal = document.getElementById('delete-modal');
    if (!modal) return;

    // Update modal content
    const avatarEl = document.getElementById('delete-avatar');
    if (avatarEl) avatarEl.textContent = getInitials(server.name);
    
    document.getElementById('delete-server-name')?.textContent &&
      (document.getElementById('delete-server-name').textContent = server.name);
    
    // Update the confirmation label with server name
    const confirmLabel = document.getElementById('confirm-delete-server-name-label');
    if (confirmLabel) confirmLabel.textContent = server.name;
    
    const metaEl = document.getElementById('delete-server-meta');
    if (metaEl) metaEl.textContent = `${AdminUtils?.formatNumber?.(server.memberCount || 0)} members`;
    
    // Reset form
    const confirmInput = document.getElementById('confirm-delete-input');
    if (confirmInput) confirmInput.value = '';
    const reasonInput = document.getElementById('delete-reason');
    if (reasonInput) reasonInput.value = '';
    
    // Reset button state
    const btn = document.getElementById('btn-confirm-delete');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Delete Server';
    }

    modal.style.display = 'flex';
  }

  // ========================================
  // Confirm Delete Modal (Legacy - kept for compatibility)
  // ========================================

  function showConfirmDeleteModal(server) {
    showDeleteModal(server);
  }

  function showQuickLockModal(server) {
    showLockModal(server);
  }

  // ========================================
  // Modal Management
  // ========================================

  function initModals() {
    // Close button for detail modal
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.onclick = () => closeModal('server-detail-modal');
    });

    // All modals including bulk action modals
    const allModals = ['server-detail-modal', 'lock-modal', 'suspend-modal', 'transfer-modal', 'delete-modal', 'bulk-lock-modal', 'bulk-unlock-modal', 'bulk-delete-modal'];
    
    // Backdrop clicks - close on clicking outside modal content
    allModals.forEach(id => {
      document.getElementById(id)?.addEventListener('click', function(e) {
        if (e.target === this) closeModal(id);
      });
    });

    // Escape key closes all modals
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        allModals.forEach(id => closeModal(id));
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
