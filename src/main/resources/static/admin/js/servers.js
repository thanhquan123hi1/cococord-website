/**
 * CoCoCord Admin - Servers Page JavaScript
 * Handles server table, filters, search, view toggle and modal interactions
 */

const AdminServers = (function() {
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

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminServers] Initializing...');
    
    // Render servers from mock data
    renderServersTable();
    
    // Update total count
    updateTotalCount();
    
    // Setup event listeners
    initSearch();
    initFilters();
    initSelectAll();
    initViewToggle();
    initActionButtons();
    initModal();
    
    console.log('[AdminServers] Initialized');
  }

  // ========================================
  // Table Rendering
  // ========================================

  function renderServersTable() {
    const tbody = document.getElementById('serversTableBody');
    if (!tbody) return;
    
    const servers = MockData.servers || [];
    
    if (servers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No servers found</td></tr>';
      return;
    }
    
    tbody.innerHTML = servers.map(server => `
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
        <td>@${server.owner || 'unknown'}</td>
        <td>${AdminUtils?.formatNumber?.(server.members) || server.members.toLocaleString()}</td>
        <td>${server.channels}</td>
        <td>
          <span class="badge badge-${getStatusClass(server.status)}">${server.status}</span>
        </td>
        <td>${formatDate(server.createdAt)}</td>
        <td>
          <div class="action-buttons">
            <button class="admin-btn admin-btn-sm admin-btn-ghost" title="View Server" data-action="view" data-id="${server.id}">
              <i class="fas fa-eye"></i>
            </button>
            ${server.status === 'suspended' ? `
              <button class="admin-btn admin-btn-sm admin-btn-ghost admin-btn-success" title="Restore" data-action="restore" data-id="${server.id}">
                <i class="fas fa-undo"></i>
              </button>
            ` : `
              <button class="admin-btn admin-btn-sm admin-btn-ghost" title="Suspend" data-action="suspend" data-id="${server.id}">
                <i class="fas fa-pause"></i>
              </button>
            `}
            <button class="admin-btn admin-btn-sm admin-btn-ghost admin-btn-danger-ghost" title="Delete" data-action="delete" data-id="${server.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Re-attach action button listeners after render
    initActionButtons();
  }

  // ========================================
  // Search & Filters
  // ========================================

  function initSearch() {
    const searchInput = document.getElementById('searchServers');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', AdminUtils?.debounce?.(function(e) {
      currentFilters.search = e.target.value.toLowerCase();
      applyFilters();
    }, 300) || function(e) {
      currentFilters.search = e.target.value.toLowerCase();
      applyFilters();
    });
  }

  function initFilters() {
    const filterStatus = document.getElementById('filterStatus');
    const filterSize = document.getElementById('filterSize');
    const sortBy = document.getElementById('sortBy');
    
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        applyFilters();
      });
    }
    
    if (filterSize) {
      filterSize.addEventListener('change', (e) => {
        currentFilters.size = e.target.value;
        applyFilters();
      });
    }
    
    if (sortBy) {
      sortBy.addEventListener('change', applyFilters);
    }
  }

  function applyFilters() {
    const tbody = document.getElementById('serversTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr[data-id]');
    let visibleCount = 0;
    
    rows.forEach(row => {
      const name = row.querySelector('.cell-user-name')?.textContent.toLowerCase() || '';
      const owner = row.querySelectorAll('td')[2]?.textContent.toLowerCase() || '';
      const desc = row.querySelector('.cell-user-email')?.textContent.toLowerCase() || '';
      const rowStatus = row.querySelector('.badge')?.textContent.toLowerCase() || '';
      const memberCount = parseInt(row.querySelectorAll('td')[3]?.textContent.replace(/,/g, '') || '0');
      
      let show = true;
      
      // Search filter
      if (currentFilters.search && 
          !name.includes(currentFilters.search) && 
          !owner.includes(currentFilters.search) && 
          !desc.includes(currentFilters.search)) {
        show = false;
      }
      
      // Status filter
      if (currentFilters.status && !rowStatus.includes(currentFilters.status)) {
        show = false;
      }
      
      // Size filter
      if (currentFilters.size && show) {
        switch (currentFilters.size) {
          case 'small':
            show = memberCount < 100;
            break;
          case 'medium':
            show = memberCount >= 100 && memberCount < 1000;
            break;
          case 'large':
            show = memberCount >= 1000 && memberCount < 10000;
            break;
          case 'xlarge':
            show = memberCount >= 10000;
            break;
        }
      }
      
      row.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    
    updateTotalCount(visibleCount);
  }

  function updateTotalCount(count) {
    const countEl = document.getElementById('totalCount');
    if (!countEl) return;
    
    if (count === undefined) {
      count = MockData.servers?.length || 0;
    }
    countEl.textContent = `${count} server${count !== 1 ? 's' : ''}`;
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
        // In full implementation, this would switch to grid view
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
  // Action Buttons
  // ========================================

  function initActionButtons() {
    // View Server buttons
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const row = this.closest('tr');
        showServerModal(row, serverId);
      };
    });
    
    // Suspend buttons
    document.querySelectorAll('[data-action="suspend"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const row = this.closest('tr');
        const serverName = row.querySelector('.cell-user-name')?.textContent;
        if (confirm(`Are you sure you want to suspend ${serverName}?`)) {
          console.log('Suspending server:', serverId);
          AdminUtils?.showToast?.(`${serverName} has been suspended`, 'warning');
        }
      };
    });
    
    // Restore buttons
    document.querySelectorAll('[data-action="restore"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const row = this.closest('tr');
        const serverName = row.querySelector('.cell-user-name')?.textContent;
        if (confirm(`Are you sure you want to restore ${serverName}?`)) {
          console.log('Restoring server:', serverId);
          AdminUtils?.showToast?.(`${serverName} has been restored`, 'success');
        }
      };
    });
    
    // Delete buttons
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.onclick = function() {
        const serverId = this.dataset.id;
        const row = this.closest('tr');
        const serverName = row.querySelector('.cell-user-name')?.textContent;
        if (confirm(`WARNING: This action cannot be undone!\n\nAre you sure you want to permanently delete ${serverName}?`)) {
          console.log('Deleting server:', serverId);
          AdminUtils?.showToast?.(`${serverName} has been deleted`, 'danger');
        }
      };
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = function() {
        this.classList.add('spinning');
        setTimeout(() => {
          this.classList.remove('spinning');
          renderServersTable();
          AdminUtils?.showToast?.('Servers list refreshed', 'info');
        }, 500);
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

  function showServerModal(row, serverId) {
    const modal = document.getElementById('serverModal');
    if (!modal) return;
    
    // Find server from mock data
    const server = MockData.servers?.find(s => s.id == serverId);
    
    if (server) {
      // Populate from mock data
      document.getElementById('modalAvatar').textContent = getInitials(server.name);
      document.getElementById('modalName').textContent = server.name;
      document.getElementById('modalDescription').textContent = server.description || 'No description';
      document.getElementById('modalStatus').textContent = server.status;
      document.getElementById('modalStatus').className = `badge badge-${getStatusClass(server.status)}`;
      document.getElementById('modalMembers').textContent = AdminUtils?.formatNumber?.(server.members) || server.members.toLocaleString();
      document.getElementById('modalChannels').textContent = server.channels;
      document.getElementById('modalMessages').textContent = AdminUtils?.formatNumber?.(server.totalMessages || 0) || '0';
      document.getElementById('modalCreated').textContent = formatDate(server.createdAt);
      document.getElementById('modalOwnerName').textContent = server.owner || 'Unknown';
      document.getElementById('modalOwnerEmail').textContent = `@${server.owner || 'unknown'}`;
    } else {
      // Fallback: Extract data from row
      const name = row.querySelector('.cell-user-name')?.textContent || '';
      const desc = row.querySelector('.cell-user-email')?.textContent || '';
      const status = row.querySelector('.badge')?.textContent || '';
      
      document.getElementById('modalAvatar').textContent = getInitials(name);
      document.getElementById('modalName').textContent = name;
      document.getElementById('modalDescription').textContent = desc;
      document.getElementById('modalStatus').textContent = status;
      document.getElementById('modalStatus').className = `badge badge-${getStatusClass(status)}`;
    }
    
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
    if (statusLower.includes('suspended')) return 'danger';
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
    refresh: renderServersTable,
    closeModal
  };

})();

// Expose to window for router
window.AdminServers = AdminServers;

// Also keep closeModal global for modal onclick handlers
window.closeModal = AdminServers.closeModal;
