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
    role: ''
  };

  let pagination = {
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  };

  let usersData = [];
  let isLoading = false;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    users: '/api/admin/users',
    ban: (id) => `/api/admin/users/${id}/ban`,
    unban: (id) => `/api/admin/users/${id}/unban`,
    mute: (id) => `/api/admin/users/${id}/mute`,
    unmute: (id) => `/api/admin/users/${id}/unmute`,
    updateRole: (id) => `/api/admin/users/${id}/role`,
    deleteUser: (id) => `/api/admin/users/${id}`
  };

  // ========================================
  // Initialization
  // ========================================

  async function init() {
    console.log('[AdminUsers] Initializing...');
    
    // Fetch users from API
    try {
      await fetchUsers();
    } catch (error) {
      console.warn('[AdminUsers] API error, using mock data:', error.message);
      // Use mock data as fallback
      usersData = MockData?.users?.list || [];
      pagination.total = usersData.length;
      pagination.totalPages = 1;
    }
    
    // Render table
    renderUsersTable();
    
    // Update total count
    updateTotalCount();
    
    // Setup event listeners
    initSearch();
    initFilters();
    initSelectAll();
    initActionButtons();
    initModal();
    initPagination();
    
    console.log('[AdminUsers] Initialized');
  }

  // ========================================
  // Data Fetching
  // ========================================

  async function fetchUsers() {
    if (isLoading) return;
    isLoading = true;
    
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });
      
      if (currentFilters.search) {
        params.append('search', currentFilters.search);
      }
      
      const response = await AdminUtils.api.get(`${API.users}?${params}`);
      
      usersData = response.content || [];
      pagination.total = response.totalElements || 0;
      pagination.totalPages = response.totalPages || 0;
      
      return usersData;
    } catch (error) {
      console.error('[AdminUsers] Failed to fetch users:', error);
      AdminUtils.showToast('Failed to load users', 'error');
      usersData = [];
    } finally {
      isLoading = false;
    }
  }

  // ========================================
  // Table Rendering
  // ========================================

  function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (usersData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No users found</td></tr>';
      return;
    }
    
    tbody.innerHTML = usersData.map(user => `
      <tr data-id="${user.id}">
        <td>
          <input type="checkbox" class="user-checkbox admin-checkbox" value="${user.id}">
        </td>
        <td>
          <div class="user-cell">
            <div class="user-avatar-sm" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--admin-primary);width:36px;height:36px;border-radius:50%;">
              ${AdminUtils.getInitials(user.username)}
            </div>
            <div class="user-info">
              <span class="cell-user-name">${user.username}</span>
              <span class="cell-user-email">${user.email}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-${getStatusClass(user)}">${getStatusText(user)}</span>
        </td>
        <td>${user.role || 'User'}</td>
        <td>${user.serverCount || 0}</td>
        <td>${AdminUtils.formatNumber(user.messageCount || 0)}</td>
        <td>${AdminUtils.formatDate(user.createdAt)}</td>
        <td>
          <div class="action-buttons">
            <button class="admin-btn admin-btn-sm admin-btn-ghost" title="View Profile" data-action="view" data-id="${user.id}">
              <i class="fas fa-eye"></i>
            </button>
            ${user.isBanned ? `
              <button class="admin-btn admin-btn-sm admin-btn-ghost" title="Unban User" data-action="unban" data-id="${user.id}">
                <i class="fas fa-user-check"></i>
              </button>
            ` : `
              <button class="admin-btn admin-btn-sm admin-btn-ghost admin-btn-danger-ghost" title="Ban User" data-action="ban" data-id="${user.id}">
                <i class="fas fa-user-slash"></i>
              </button>
            `}
            <button class="admin-btn admin-btn-sm admin-btn-ghost" title="More Actions" data-action="more" data-id="${user.id}">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Re-attach action button listeners after render
    attachActionListeners();
  }

  function getStatusClass(user) {
    if (user.isBanned) return 'danger';
    if (user.isMuted) return 'warning';
    if (user.isActive) return 'success';
    return 'default';
  }

  function getStatusText(user) {
    if (user.isBanned) return 'Banned';
    if (user.isMuted) return 'Muted';
    if (user.isActive) return 'Active';
    return 'Inactive';
  }

  // ========================================
  // Search & Filters
  // ========================================

  function initSearch() {
    const searchInput = document.getElementById('searchUsers');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', AdminUtils.debounce(async function(e) {
      currentFilters.search = e.target.value;
      pagination.page = 0;
      await fetchUsers();
      renderUsersTable();
      updateTotalCount();
    }, 300));
  }

  function initFilters() {
    const filterStatus = document.getElementById('filterStatus');
    const filterRole = document.getElementById('filterRole');
    const sortBy = document.getElementById('sortBy');
    
    if (filterStatus) {
      filterStatus.addEventListener('change', async (e) => {
        currentFilters.status = e.target.value;
        applyClientFilters();
      });
    }
    
    if (filterRole) {
      filterRole.addEventListener('change', async (e) => {
        currentFilters.role = e.target.value;
        applyClientFilters();
      });
    }
    
    if (sortBy) {
      sortBy.addEventListener('change', async () => {
        await fetchUsers();
        renderUsersTable();
      });
    }
  }

  function applyClientFilters() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr[data-id]');
    let visibleCount = 0;
    
    rows.forEach(row => {
      const rowStatus = row.querySelector('.badge')?.textContent.toLowerCase() || '';
      const rowRole = row.querySelectorAll('td')[3]?.textContent.toLowerCase() || '';
      
      let show = true;
      
      // Status filter
      if (currentFilters.status && !rowStatus.includes(currentFilters.status.toLowerCase())) {
        show = false;
      }
      
      // Role filter
      if (currentFilters.role && !rowRole.includes(currentFilters.role.toLowerCase())) {
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
      count = pagination.total;
    }
    countEl.textContent = `${count} user${count !== 1 ? 's' : ''}`;
  }

  // ========================================
  // Pagination
  // ========================================

  function initPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', async () => {
        if (pagination.page > 0) {
          pagination.page--;
          await fetchUsers();
          renderUsersTable();
          updatePaginationUI();
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        if (pagination.page < pagination.totalPages - 1) {
          pagination.page++;
          await fetchUsers();
          renderUsersTable();
          updatePaginationUI();
        }
      });
    }
  }

  function updatePaginationUI() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = pagination.page === 0;
    if (nextBtn) nextBtn.disabled = pagination.page >= pagination.totalPages - 1;
    if (pageInfo) pageInfo.textContent = `Page ${pagination.page + 1} of ${pagination.totalPages}`;
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
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = async function() {
        this.classList.add('spinning');
        await fetchUsers();
        renderUsersTable();
        this.classList.remove('spinning');
        AdminUtils.showToast('Users list refreshed', 'success');
      };
    }
    
    // Add User button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.onclick = function() {
        AdminUtils.showToast('Add user feature coming soon', 'info');
      };
    }
  }

  function attachActionListeners() {
    // View Profile buttons
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.onclick = function() {
        const userId = this.dataset.id;
        const user = usersData.find(u => u.id == userId);
        if (user) showUserModal(user);
      };
    });
    
    // Ban buttons
    document.querySelectorAll('[data-action="ban"]').forEach(btn => {
      btn.onclick = async function() {
        const userId = this.dataset.id;
        const user = usersData.find(u => u.id == userId);
        
        if (confirm(`Are you sure you want to ban ${user?.username}?`)) {
          try {
            await AdminUtils.api.post(API.ban(userId));
            AdminUtils.showToast(`${user?.username} has been banned`, 'success');
            await fetchUsers();
            renderUsersTable();
          } catch (error) {
            AdminUtils.showToast('Failed to ban user: ' + error.message, 'error');
          }
        }
      };
    });
    
    // Unban buttons
    document.querySelectorAll('[data-action="unban"]').forEach(btn => {
      btn.onclick = async function() {
        const userId = this.dataset.id;
        const user = usersData.find(u => u.id == userId);
        
        if (confirm(`Are you sure you want to unban ${user?.username}?`)) {
          try {
            await AdminUtils.api.post(API.unban(userId));
            AdminUtils.showToast(`${user?.username} has been unbanned`, 'success');
            await fetchUsers();
            renderUsersTable();
          } catch (error) {
            AdminUtils.showToast('Failed to unban user: ' + error.message, 'error');
          }
        }
      };
    });
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

  function showUserModal(user) {
    const modal = document.getElementById('userModal');
    if (!modal || !user) return;
    
    // Populate modal with user data
    const setEl = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || '--';
    };
    
    setEl('modalAvatar', AdminUtils.getInitials(user.username));
    setEl('modalName', user.username);
    setEl('modalEmail', user.email);
    setEl('modalRole', user.role);
    setEl('modalServers', user.serverCount || 0);
    setEl('modalMessages', AdminUtils.formatNumber(user.messageCount || 0));
    setEl('modalJoined', AdminUtils.formatDate(user.createdAt, { year: true }));
    
    const statusEl = document.getElementById('modalStatus');
    if (statusEl) {
      statusEl.textContent = getStatusText(user);
      statusEl.className = `badge badge-${getStatusClass(user)}`;
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
  // Public API
  // ========================================

  return {
    init,
    refresh: async () => {
      await fetchUsers();
      renderUsersTable();
      updateTotalCount();
    },
    closeModal
  };

})();

// Expose to window for router
window.AdminUsers = AdminUsers;

// Also keep closeModal global for modal onclick handlers
window.closeModal = AdminUsers.closeModal;