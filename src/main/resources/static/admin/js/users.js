/**
 * CoCoCord Admin - Users Page JavaScript
 * Handles user table, filters, search, and modal interactions
 */

const AdminUsers = (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let currentFilters = {
    search: '',
    status: '',
    role: ''
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminUsers] Initializing...');
    
    // Render users from mock data
    renderUsersTable();
    
    // Update total count
    updateTotalCount();
    
    // Setup event listeners
    initSearch();
    initFilters();
    initSelectAll();
    initActionButtons();
    initModal();
    
    console.log('[AdminUsers] Initialized');
  }

  // ========================================
  // Table Rendering
  // ========================================

  function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const users = MockData.users || [];
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No users found</td></tr>';
      return;
    }
    
    tbody.innerHTML = users.map(user => `
      <tr data-id="${user.id}">
        <td>
          <input type="checkbox" class="user-checkbox admin-checkbox" value="${user.id}">
        </td>
        <td>
          <div class="user-cell">
            <div class="user-avatar-sm" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--admin-primary);width:36px;height:36px;border-radius:50%;">
              ${getInitials(user.username)}
            </div>
            <div class="user-info">
              <span class="cell-user-name">${user.username}</span>
              <span class="cell-user-email">${user.email}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-${getStatusClass(user.status)}">${user.status}</span>
        </td>
        <td>${user.role || 'User'}</td>
        <td>${user.servers}</td>
        <td>${AdminUtils?.formatNumber?.(user.messages) || user.messages.toLocaleString()}</td>
        <td>${formatDate(user.createdAt)}</td>
        <td>
          <div class="action-buttons">
            <button class="admin-btn admin-btn-sm admin-btn-ghost" title="View Profile" data-action="view" data-id="${user.id}">
              <i class="fas fa-eye"></i>
            </button>
            ${user.status === 'banned' ? `
              <button class="admin-btn admin-btn-sm admin-btn-ghost" title="Unban User" data-action="unban" data-id="${user.id}">
                <i class="fas fa-user-check"></i>
              </button>
            ` : `
              <button class="admin-btn admin-btn-sm admin-btn-ghost admin-btn-danger-ghost" title="Ban User" data-action="ban" data-id="${user.id}">
                <i class="fas fa-user-slash"></i>
              </button>
            `}
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
    const searchInput = document.getElementById('searchUsers');
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
    const filterRole = document.getElementById('filterRole');
    const sortBy = document.getElementById('sortBy');
    
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        applyFilters();
      });
    }
    
    if (filterRole) {
      filterRole.addEventListener('change', (e) => {
        currentFilters.role = e.target.value;
        applyFilters();
      });
    }
    
    if (sortBy) {
      sortBy.addEventListener('change', applyFilters);
    }
  }

  function applyFilters() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr[data-id]');
    let visibleCount = 0;
    
    rows.forEach(row => {
      const name = row.querySelector('.cell-user-name')?.textContent.toLowerCase() || '';
      const email = row.querySelector('.cell-user-email')?.textContent.toLowerCase() || '';
      const rowStatus = row.querySelector('.badge')?.textContent.toLowerCase() || '';
      const rowRole = row.querySelectorAll('td')[3]?.textContent.toLowerCase() || '';
      
      let show = true;
      
      // Search filter
      if (currentFilters.search && !name.includes(currentFilters.search) && !email.includes(currentFilters.search)) {
        show = false;
      }
      
      // Status filter
      if (currentFilters.status && !rowStatus.includes(currentFilters.status)) {
        show = false;
      }
      
      // Role filter
      if (currentFilters.role && !rowRole.includes(currentFilters.role)) {
        show = false;
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
      count = MockData.users?.length || 0;
    }
    countEl.textContent = `${count} user${count !== 1 ? 's' : ''}`;
  }

  // ========================================
  // Select All
  // ========================================

  function initSelectAll() {
    const selectAll = document.getElementById('selectAll');
    if (!selectAll) return;
    
    selectAll.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.user-checkbox');
      checkboxes.forEach(cb => {
        if (cb.closest('tr').style.display !== 'none') {
          cb.checked = this.checked;
        }
      });
    });
  }

  // ========================================
  // Action Buttons
  // ========================================

  function initActionButtons() {
    // View Profile buttons
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.onclick = function() {
        const userId = this.dataset.id;
        const row = this.closest('tr');
        showUserModal(row, userId);
      };
    });
    
    // Ban buttons
    document.querySelectorAll('[data-action="ban"]').forEach(btn => {
      btn.onclick = function() {
        const userId = this.dataset.id;
        const row = this.closest('tr');
        const userName = row.querySelector('.cell-user-name')?.textContent;
        if (confirm(`Are you sure you want to ban ${userName}?`)) {
          console.log('Banning user:', userId);
          AdminUtils?.showToast?.(`${userName} has been banned`, 'warning');
        }
      };
    });
    
    // Unban buttons
    document.querySelectorAll('[data-action="unban"]').forEach(btn => {
      btn.onclick = function() {
        const userId = this.dataset.id;
        const row = this.closest('tr');
        const userName = row.querySelector('.cell-user-name')?.textContent;
        if (confirm(`Are you sure you want to unban ${userName}?`)) {
          console.log('Unbanning user:', userId);
          AdminUtils?.showToast?.(`${userName} has been unbanned`, 'success');
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
          renderUsersTable();
          AdminUtils?.showToast?.('Users list refreshed', 'info');
        }, 500);
      };
    }
    
    // Add User button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.onclick = function() {
        AdminUtils?.showToast?.('Add user feature coming soon', 'info');
      };
    }
  }

  // ========================================
  // Modal
  // ========================================

  function initModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeModal('userModal');
        }
      });
    }
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal('userModal');
      }
    });
  }

  function showUserModal(row, userId) {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    
    // Find user from mock data
    const user = MockData.users?.find(u => u.id == userId);
    
    if (user) {
      // Populate from mock data
      document.getElementById('modalAvatar').textContent = getInitials(user.username);
      document.getElementById('modalName').textContent = user.username;
      document.getElementById('modalEmail').textContent = user.email;
      document.getElementById('modalStatus').textContent = user.status;
      document.getElementById('modalStatus').className = `badge badge-${getStatusClass(user.status)}`;
      document.getElementById('modalRole').textContent = user.role || 'User';
      document.getElementById('modalServers').textContent = user.servers;
      document.getElementById('modalMessages').textContent = AdminUtils?.formatNumber?.(user.messages) || user.messages.toLocaleString();
      document.getElementById('modalJoined').textContent = formatDate(user.createdAt);
    } else {
      // Fallback: Extract data from row
      const name = row.querySelector('.cell-user-name')?.textContent || '';
      const email = row.querySelector('.cell-user-email')?.textContent || '';
      const status = row.querySelector('.badge')?.textContent || '';
      
      document.getElementById('modalAvatar').textContent = getInitials(name);
      document.getElementById('modalName').textContent = name;
      document.getElementById('modalEmail').textContent = email;
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
    if (statusLower.includes('banned')) return 'danger';
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
    refresh: renderUsersTable,
    closeModal
  };

})();

// Expose to window for router
window.AdminUsers = AdminUsers;

// Also keep closeModal global for modal onclick handlers
window.closeModal = AdminUsers.closeModal;
