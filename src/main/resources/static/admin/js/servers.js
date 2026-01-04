/**
 * CoCoCord Admin - Servers Page JavaScript
 * Handles server table, filters, search, view toggle and modal interactions
 * Updated to use real API endpoints
 */

var AdminServers = window.AdminServers || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let currentFilters = {
    search: '',
    status: '',
    size: ''
  };

  let currentView = 'list'; // 'list' or 'grid'
  let serversData = [];
  let pagination = {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  };
  let isLoading = false;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    servers: '/api/admin/servers',
    server: (id) => `/api/admin/servers/${id}`,
    lock: (id) => `/api/admin/servers/${id}/lock`,
    unlock: (id) => `/api/admin/servers/${id}/unlock`
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminServers] Initializing...');
    
    // Setup event listeners
    initSearch();
    initFilters();
    initSelectAll();
    initViewToggle();
    initModal();
    initPagination();
    
    // Fetch data from API
    fetchServers();
    
    console.log('[AdminServers] Initialized');
  }

  // ========================================
  // API Calls
  // ========================================

  async function fetchServers() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size
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
        console.warn('[AdminServers] API returned unexpected format, using mock data');
        serversData = MockData?.servers || [];
        pagination.totalElements = serversData.length;
        pagination.totalPages = 1;
      }
      
      renderServersTable();
      updateTotalCount();
      updatePaginationUI();
    } catch (error) {
      console.error('[AdminServers] Failed to fetch servers:', error);
      AdminUtils?.showToast?.('Failed to load servers', 'danger');
      // Fallback to mock data
      serversData = MockData?.servers || [];
      renderServersTable();
      updateTotalCount();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  async function lockServer(serverId, reason = '') {
    try {
      await AdminUtils.api.post(API.lock(serverId), { reason });
      AdminUtils?.showToast?.('Server locked successfully', 'warning');
      fetchServers();
    } catch (error) {
      console.error('[AdminServers] Failed to lock server:', error);
      AdminUtils?.showToast?.('Failed to lock server', 'danger');
    }
  }

  async function unlockServer(serverId) {
    try {
      await AdminUtils.api.post(API.unlock(serverId));
      AdminUtils?.showToast?.('Server unlocked successfully', 'success');
      fetchServers();
    } catch (error) {
      console.error('[AdminServers] Failed to unlock server:', error);
      AdminUtils?.showToast?.('Failed to unlock server', 'danger');
    }
  }

  async function deleteServer(serverId) {
    try {
      await AdminUtils.api.delete(API.server(serverId));
      AdminUtils?.showToast?.('Server deleted successfully', 'success');
      fetchServers();
    } catch (error) {
      console.error('[AdminServers] Failed to delete server:', error);
      AdminUtils?.showToast?.('Failed to delete server', 'danger');
    }
  }

  async function fetchServerDetails(serverId) {
    try {
      return await AdminUtils.api.get(API.server(serverId));
    } catch (error) {
      console.error('[AdminServers] Failed to fetch server details:', error);
      return null;
    }
  }

  // ========================================
  // Loading State
  // ========================================

  function showLoading(show) {
    const tbody = document.getElementById('serversTableBody');
    if (!tbody) return;

    if (show) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-8">
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
    const tbody = document.getElementById('serversTableBody');
    if (!tbody) return;
    
    const servers = getFilteredServers();
    
    if (servers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8">No servers found</td></tr>';
      return;
    }
    
    tbody.innerHTML = servers.map(server => {
      const isLocked = server.locked || server.isLocked || false;
      const status = isLocked ? 'Locked' : (server.status || 'Active');
      const statusClass = isLocked ? 'danger' : getStatusClass(status);
      
      return `
      <tr data-id="${server.id}">
        <td>
          <input type="checkbox" class="server-checkbox admin-checkbox" value="${server.id}">
        </td>
        <td>
          <div class="user-cell">
            <div class="server-avatar" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--admin-primary);width:42px;height:42px;border-radius:12px;">
              ${getInitials(server.name)}
            </div>
            <div class="user-info">
              <span class="cell-user-name">${server.name}</span>
              <span class="cell-user-email">${server.description || 'No description'}</span>
            </div>
          </div>
        </td>
        <td>@${server.ownerUsername || server.owner || 'unknown'}</td>
        <td>${AdminUtils?.formatNumber?.(server.memberCount || server.members || 0)}</td>
        <td>${server.channelCount || server.channels || 0}</td>
        <td>
          <span class="badge badge-${statusClass}">${status}</span>
        </td>
        <td>${AdminUtils?.formatDate?.(server.createdAt) || formatDate(server.createdAt)}</td>
        <td>
          <div class="action-buttons">
            <button class="admin-btn admin-btn-sm admin-btn-ghost" title="View Server" data-action="view" data-id="${server.id}">
              <i class="fas fa-eye"></i>
            </button>
            ${isLocked ? `
              <button class="admin-btn admin-btn-sm admin-btn-ghost admin-btn-success" title="Unlock" data-action="unlock" data-id="${server.id}">
                <i class="fas fa-unlock"></i>
              </button>
            ` : `
              <button class="admin-btn admin-btn-sm admin-btn-ghost" title="Lock" data-action="lock" data-id="${server.id}">
                <i class="fas fa-lock"></i>
              </button>
            `}
            <button class="admin-btn admin-btn-sm admin-btn-ghost admin-btn-danger-ghost" title="Delete" data-action="delete" data-id="${server.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `}).join('');
    
    // Attach action button listeners after render
    attachActionListeners();
  }

  function getFilteredServers() {
    let servers = [...serversData];
    
    // Apply client-side filters if using cached data
    if (currentFilters.status) {
      servers = servers.filter(s => {
        const isLocked = s.locked || s.isLocked;
        const status = isLocked ? 'locked' : (s.status || 'active').toLowerCase();
        return status.includes(currentFilters.status.toLowerCase());
      });
    }
    
    if (currentFilters.size) {
      servers = servers.filter(s => {
        const memberCount = s.memberCount || s.members || 0;
        switch (currentFilters.size) {
          case 'small': return memberCount < 100;
          case 'medium': return memberCount >= 100 && memberCount < 1000;
          case 'large': return memberCount >= 1000 && memberCount < 10000;
          case 'xlarge': return memberCount >= 10000;
          default: return true;
        }
      });
    }
    
    return servers;
  }

  // ========================================
  // Action Listeners
  // ========================================

  function attachActionListeners() {
    // View buttons
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.onclick = async function() {
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        showServerModal(server || { id: serverId });
      };
    });

    // Lock buttons
    document.querySelectorAll('[data-action="lock"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        const serverName = server?.name || 'this server';
        
        const reason = prompt(`Enter reason for locking "${serverName}":`);
        if (reason !== null) {
          lockServer(serverId, reason);
        }
      };
    });

    // Unlock buttons
    document.querySelectorAll('[data-action="unlock"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        const serverName = server?.name || 'this server';
        
        if (confirm(`Are you sure you want to unlock "${serverName}"?`)) {
          unlockServer(serverId);
        }
      };
    });

    // Delete buttons
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const server = serversData.find(s => s.id == serverId);
        const serverName = server?.name || 'this server';
        
        if (confirm(`WARNING: This action cannot be undone!\n\nAre you sure you want to permanently delete "${serverName}"?`)) {
          deleteServer(serverId);
        }
      };
    });

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = function() {
        this.classList.add('spinning');
        fetchServers().finally(() => {
          this.classList.remove('spinning');
          AdminUtils?.showToast?.('Servers list refreshed', 'info');
        });
      };
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.onclick = function() {
        AdminUtils?.showToast?.('Export feature coming soon', 'info');
      };
    }
  }

  // ========================================
  // Search & Filters
  // ========================================

  function initSearch() {
    const searchInput = document.getElementById('searchServers');
    if (!searchInput) return;
    
    let debounceTimer;
    searchInput.addEventListener('input', function(e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters.search = e.target.value.toLowerCase();
        pagination.page = 0; // Reset to first page
        fetchServers();
      }, 300);
    });
  }

  function initFilters() {
    const filterStatus = document.getElementById('filterStatus');
    const filterSize = document.getElementById('filterSize');
    const sortBy = document.getElementById('sortBy');
    
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        renderServersTable();
        updateTotalCount();
      });
    }
    
    if (filterSize) {
      filterSize.addEventListener('change', (e) => {
        currentFilters.size = e.target.value;
        renderServersTable();
        updateTotalCount();
      });
    }
    
    if (sortBy) {
      sortBy.addEventListener('change', () => {
        renderServersTable();
      });
    }
  }

  function updateTotalCount(count) {
    const countEl = document.getElementById('totalCount');
    if (!countEl) return;
    
    if (count === undefined) {
      const filtered = getFilteredServers();
      count = filtered.length;
    }
    countEl.textContent = `${count} server${count !== 1 ? 's' : ''}`;
  }

  // ========================================
  // Pagination
  // ========================================

  function initPagination() {
    const prevBtn = document.querySelector('[data-page="prev"]');
    const nextBtn = document.querySelector('[data-page="next"]');

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (pagination.page > 0) {
          pagination.page--;
          fetchServers();
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (pagination.page < pagination.totalPages - 1) {
          pagination.page++;
          fetchServers();
        }
      };
    }
  }

  function updatePaginationUI() {
    const pageInfo = document.querySelector('.page-info');
    const prevBtn = document.querySelector('[data-page="prev"]');
    const nextBtn = document.querySelector('[data-page="next"]');

    if (pageInfo) {
      const start = pagination.page * pagination.size + 1;
      const end = Math.min((pagination.page + 1) * pagination.size, pagination.totalElements);
      pageInfo.textContent = `${start}-${end} of ${pagination.totalElements}`;
    }

    if (prevBtn) {
      prevBtn.disabled = pagination.page === 0;
    }

    if (nextBtn) {
      nextBtn.disabled = pagination.page >= pagination.totalPages - 1;
    }
  }

  // ========================================
  // Select All
  // ========================================

  function initSelectAll() {
    const selectAll = document.getElementById('selectAll');
    if (!selectAll) return;
    
    selectAll.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.server-checkbox');
      checkboxes.forEach(cb => {
        if (cb.closest('tr').style.display !== 'none') {
          cb.checked = this.checked;
        }
      });
    });
  }

  // ========================================
  // View Toggle
  // ========================================

  function initViewToggle() {
    const gridBtn = document.getElementById('viewGrid');
    const listBtn = document.getElementById('viewList');
    
    if (gridBtn) {
      gridBtn.onclick = function() {
        gridBtn.classList.add('active');
        listBtn?.classList.remove('active');
        currentView = 'grid';
        AdminUtils?.showToast?.('Grid view - coming soon', 'info');
      };
    }
    
    if (listBtn) {
      listBtn.onclick = function() {
        listBtn.classList.add('active');
        gridBtn?.classList.remove('active');
        currentView = 'list';
      };
    }
  }

  // ========================================
  // Modal
  // ========================================

  function initModal() {
    const modal = document.getElementById('serverModal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeModal('serverModal');
        }
      });
    }
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal('serverModal');
      }
    });
  }

  async function showServerModal(serverData) {
    const modal = document.getElementById('serverModal');
    if (!modal) return;
    
    // Try to get detailed info from API
    let server = serverData;
    if (serverData.id) {
      const detailed = await fetchServerDetails(serverData.id);
      if (detailed) server = detailed;
    }
    
    // Populate modal
    const avatarEl = document.getElementById('modalAvatar');
    const nameEl = document.getElementById('modalName');
    const descEl = document.getElementById('modalDescription');
    const statusEl = document.getElementById('modalStatus');
    const membersEl = document.getElementById('modalMembers');
    const channelsEl = document.getElementById('modalChannels');
    const messagesEl = document.getElementById('modalMessages');
    const createdEl = document.getElementById('modalCreated');
    const ownerNameEl = document.getElementById('modalOwnerName');
    const ownerEmailEl = document.getElementById('modalOwnerEmail');
    
    if (avatarEl) avatarEl.textContent = getInitials(server.name);
    if (nameEl) nameEl.textContent = server.name || 'Unknown';
    if (descEl) descEl.textContent = server.description || 'No description';
    
    const isLocked = server.locked || server.isLocked;
    const status = isLocked ? 'Locked' : (server.status || 'Active');
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = `badge badge-${isLocked ? 'danger' : getStatusClass(status)}`;
    }
    
    if (membersEl) membersEl.textContent = AdminUtils?.formatNumber?.(server.memberCount || server.members || 0);
    if (channelsEl) channelsEl.textContent = server.channelCount || server.channels || 0;
    if (messagesEl) messagesEl.textContent = AdminUtils?.formatNumber?.(server.totalMessages || 0);
    if (createdEl) createdEl.textContent = AdminUtils?.formatDate?.(server.createdAt) || formatDate(server.createdAt);
    if (ownerNameEl) ownerNameEl.textContent = server.ownerUsername || server.owner || 'Unknown';
    if (ownerEmailEl) ownerEmailEl.textContent = `@${server.ownerUsername || server.owner || 'unknown'}`;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
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

  function getStatusClass(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('active')) return 'success';
    if (statusLower.includes('inactive')) return 'warning';
    if (statusLower.includes('suspended') || statusLower.includes('locked')) return 'danger';
    return 'default';
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

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: fetchServers,
    closeModal
  };

})();

// Expose to window for router
window.AdminServers = AdminServers;

// Also keep closeModal global for modal onclick handlers
window.closeModal = AdminServers.closeModal;
