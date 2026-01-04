/**
 * CoCoCord Admin - Roles & Permissions Page JavaScript
 * Handles roles management and permissions matrix
 * Updated to use real API endpoints
 */

var AdminRoles = window.AdminRoles || (function() {
  'use strict';

  // State
  let currentTab = 'roles';
  let rolesData = [];
  let isLoading = false;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    roles: '/api/admin/roles',
    role: (id) => `/api/admin/roles/${id}`
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminRoles] Initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch roles from API
    fetchRoles();
    
    console.log('[AdminRoles] Initialized');
  }

  // ========================================
  // API Calls
  // ========================================

  async function fetchRoles() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      const response = await AdminUtils.api.get(API.roles);
      
      if (Array.isArray(response)) {
        rolesData = response;
      } else if (response && response.content) {
        rolesData = response.content;
      } else {
        console.warn('[AdminRoles] API returned unexpected format, using mock data');
        rolesData = MockData?.roles?.list || [];
      }
      
      updateStats();
      renderContent();
    } catch (error) {
      console.error('[AdminRoles] Failed to fetch roles:', error);
      AdminUtils?.showToast?.('Failed to load roles', 'danger');
      // Fallback to mock data
      rolesData = MockData?.roles?.list || [];
      updateStats();
      renderContent();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  async function createRole(roleData) {
    try {
      await AdminUtils.api.post(API.roles, roleData);
      AdminUtils?.showToast?.('Role created successfully', 'success');
      fetchRoles();
    } catch (error) {
      console.error('[AdminRoles] Failed to create role:', error);
      AdminUtils?.showToast?.('Failed to create role', 'danger');
    }
  }

  async function updateRole(roleId, roleData) {
    try {
      await AdminUtils.api.put(API.role(roleId), roleData);
      AdminUtils?.showToast?.('Role updated successfully', 'success');
      fetchRoles();
    } catch (error) {
      console.error('[AdminRoles] Failed to update role:', error);
      AdminUtils?.showToast?.('Failed to update role', 'danger');
    }
  }

  async function deleteRoleAPI(roleId) {
    try {
      await AdminUtils.api.delete(API.role(roleId));
      AdminUtils?.showToast?.('Role deleted successfully', 'warning');
      fetchRoles();
    } catch (error) {
      console.error('[AdminRoles] Failed to delete role:', error);
      AdminUtils?.showToast?.('Failed to delete role', 'danger');
    }
  }

  // ========================================
  // Loading State
  // ========================================

  function showLoading(show) {
    const container = document.getElementById('roles-list');
    if (!container) return;

    if (show) {
      container.innerHTML = `
        <div class="text-center py-8">
          <div class="loading-spinner"></div>
          <div class="mt-2 text-muted">Loading roles...</div>
        </div>
      `;
    }
  }

  // ========================================
  // Stats Update
  // ========================================

  function updateStats() {
    const roles = rolesData.length > 0 ? rolesData : MockData?.roles?.list || [];
    
    const adminRole = roles.find(r => r.name === 'Administrator' || r.name === 'Admin');
    const modRole = roles.find(r => r.name === 'Moderator' || r.name === 'Mod');
    
    const statElements = {
      'totalRoles': roles.length,
      'totalAdmins': adminRole?.members || adminRole?.memberCount || 0,
      'totalModerators': modRole?.members || modRole?.memberCount || 0,
      'permissionGroups': MockData?.roles?.permissionGroups?.length || 5
    };
    
    Object.entries(statElements).forEach(([key, value]) => {
      const elements = document.querySelectorAll(`[data-stat="${key}"]`);
      elements.forEach(el => {
        el.textContent = typeof value === 'number' 
          ? AdminUtils?.formatNumber?.(value) || value.toLocaleString()
          : value;
      });
    });
  }

  // ========================================
  // Content Rendering
  // ========================================

  function renderContent() {
    switch (currentTab) {
      case 'roles':
        renderRolesList();
        break;
      case 'permissions':
        renderPermissionsMatrix();
        break;
    }
  }

  function renderRolesList() {
    const container = document.getElementById('roles-list');
    if (!container) return;
    
    const roles = rolesData.length > 0 ? rolesData : MockData?.roles?.list || [];
    
    if (roles.length === 0) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <i class="fas fa-user-shield"></i>
          <h3>No roles found</h3>
          <p>Create your first role to get started</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = roles.map(role => renderRoleCard(role)).join('');
    
    // Attach listeners
    attachRoleCardListeners();
  }

  function renderRoleCard(role) {
    const permissions = role.permissions || [];
    const isAdmin = permissions.includes('all') || permissions.includes('administrator') || role.name === 'Administrator';
    const color = role.color || '#7c3aed';
    const memberCount = role.members || role.memberCount || 0;
    
    return `
      <div class="admin-role-card" data-role-id="${role.id}">
        <div class="role-header">
          <div class="role-color-badge" style="background-color: ${color}"></div>
          <div class="role-info">
            <h4 class="role-name">${role.name}</h4>
            <span class="role-members">${formatNumber(memberCount)} members</span>
          </div>
          ${isAdmin ? '<span class="admin-badge admin-badge-danger">Admin</span>' : ''}
        </div>
        
        <div class="role-permissions">
          <span class="permissions-label">Permissions:</span>
          <div class="permissions-preview">
            ${permissions.slice(0, 3).map(p => `
              <span class="permission-tag">${formatPermissionName(p)}</span>
            `).join('')}
            ${permissions.length > 3 ? `
              <span class="permission-tag permission-more">+${permissions.length - 3} more</span>
            ` : ''}
            ${permissions.length === 0 ? '<span class="permission-tag">No permissions</span>' : ''}
          </div>
        </div>
        
        <div class="role-actions">
          <button class="admin-btn admin-btn-sm admin-btn-ghost" data-action="edit-role" data-id="${role.id}">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z"/>
            </svg>
            Edit
          </button>
          ${!isAdmin ? `
            <button class="admin-btn admin-btn-sm admin-btn-danger-ghost" data-action="delete-role" data-id="${role.id}">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4"/>
              </svg>
              Delete
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderPermissionsMatrix() {
    const groupsContainer = document.getElementById('permissions-groups');
    const matrixTable = document.getElementById('permissions-matrix');
    
    if (!groupsContainer || !matrixTable) return;
    
    const groups = MockData?.roles?.permissionGroups || [];
    const roles = rolesData.length > 0 ? rolesData : MockData?.roles?.list || [];
    
    if (groups.length === 0) {
      groupsContainer.innerHTML = '<p class="text-muted">No permission groups defined</p>';
      return;
    }
    
    // Render permission groups navigation
    groupsContainer.innerHTML = groups.map((group, index) => `
      <button class="permission-group-btn ${index === 0 ? 'active' : ''}" data-group="${group.name}">
        <span class="group-icon">${getGroupIcon(group.icon)}</span>
        <span class="group-name">${group.name}</span>
      </button>
    `).join('');
    
    // Render matrix header with roles
    const thead = matrixTable.querySelector('thead tr');
    thead.innerHTML = `
      <th class="permission-name-col">Permission</th>
      ${roles.map(role => `
        <th class="role-col">
          <div class="role-header-cell">
            <div class="role-color-dot" style="background: ${role.color || '#7c3aed'}"></div>
            <span>${role.name}</span>
          </div>
        </th>
      `).join('')}
    `;
    
    // Render matrix body with all permissions (first group by default)
    renderPermissionsForGroup(groups[0].name);
    
    // Attach group button listeners
    groupsContainer.querySelectorAll('.permission-group-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        groupsContainer.querySelectorAll('.permission-group-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPermissionsForGroup(btn.dataset.group);
      });
    });
  }

  function renderPermissionsForGroup(groupName) {
    const matrixTable = document.getElementById('permissions-matrix');
    const tbody = matrixTable.querySelector('tbody');
    if (!tbody) return;
    
    const groups = MockData?.roles?.permissionGroups || [];
    const group = groups.find(g => g.name === groupName);
    const roles = rolesData.length > 0 ? rolesData : MockData?.roles?.list || [];
    
    if (!group) return;
    
    tbody.innerHTML = group.permissions.map(perm => `
      <tr data-permission="${perm.id}">
        <td class="permission-name-col">
          <div class="permission-info">
            <span class="permission-label">${perm.label}</span>
            <span class="permission-desc">${perm.desc}</span>
          </div>
        </td>
        ${roles.map(role => {
          const rolePerms = role.permissions || [];
          const hasPermission = rolePerms.includes('all') || 
                               rolePerms.includes('administrator') ||
                               rolePerms.includes(perm.id);
          const isAdminRole = rolePerms.includes('all');
          return `
            <td class="role-col">
              <label class="permission-checkbox-wrapper">
                <input type="checkbox" 
                       class="permission-checkbox" 
                       ${hasPermission ? 'checked' : ''} 
                       ${isAdminRole ? 'disabled' : ''}
                       data-role="${role.id}"
                       data-permission="${perm.id}">
                <span class="checkmark ${hasPermission ? 'checked' : ''}">
                  ${hasPermission ? '✓' : ''}
                </span>
              </label>
            </td>
          `;
        }).join('')}
      </tr>
    `).join('');
    
    // Attach checkbox listeners
    tbody.querySelectorAll('.permission-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', handlePermissionToggle);
    });
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.page-tab[data-tab]').forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });
    
    // Add role button
    const addRoleBtn = document.querySelector('[data-action="add-role"]');
    if (addRoleBtn) {
      addRoleBtn.addEventListener('click', openAddRoleModal);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('spinning');
        await fetchRoles();
        refreshBtn.classList.remove('spinning');
      });
    }
  }

  function attachRoleCardListeners() {
    // Edit role
    document.querySelectorAll('[data-action="edit-role"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openEditRoleModal(id);
      });
    });
    
    // Delete role
    document.querySelectorAll('[data-action="delete-role"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        confirmDeleteRole(id);
      });
    });
  }

  function handleTabClick(e) {
    const tab = e.currentTarget;
    const tabId = tab.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('hidden', content.dataset.tabContent !== tabId);
      content.classList.toggle('active', content.dataset.tabContent === tabId);
    });
    
    currentTab = tabId;
    renderContent();
  }

  async function handlePermissionToggle(e) {
    const checkbox = e.target;
    const roleId = checkbox.dataset.role;
    const permissionId = checkbox.dataset.permission;
    const isChecked = checkbox.checked;
    
    const role = rolesData.find(r => r.id == roleId);
    if (!role) return;
    
    // Update local data
    if (!role.permissions) role.permissions = [];
    
    if (isChecked) {
      if (!role.permissions.includes(permissionId)) {
        role.permissions.push(permissionId);
      }
    } else {
      const index = role.permissions.indexOf(permissionId);
      if (index > -1) {
        role.permissions.splice(index, 1);
      }
    }
    
    // Update checkmark visual
    const checkmark = checkbox.nextElementSibling;
    if (checkmark) {
      checkmark.classList.toggle('checked', isChecked);
      checkmark.textContent = isChecked ? '✓' : '';
    }
    
    // Try to update via API
    try {
      await updateRole(roleId, { permissions: role.permissions });
    } catch (error) {
      // Revert on failure
      if (isChecked) {
        role.permissions = role.permissions.filter(p => p !== permissionId);
      } else {
        role.permissions.push(permissionId);
      }
      checkbox.checked = !isChecked;
      if (checkmark) {
        checkmark.classList.toggle('checked', !isChecked);
        checkmark.textContent = !isChecked ? '✓' : '';
      }
    }
    
    AdminUtils?.showToast?.(
      `Permission ${isChecked ? 'granted to' : 'revoked from'} ${role.name}`,
      'info'
    );
  }

  // ========================================
  // Role Actions
  // ========================================

  function openAddRoleModal() {
    const roleName = prompt('Enter new role name:');
    if (!roleName) return;
    
    const roleColor = prompt('Enter role color (hex, e.g., #7c3aed):') || '#7c3aed';
    
    createRole({
      name: roleName,
      color: roleColor,
      permissions: []
    });
  }

  function openEditRoleModal(roleId) {
    const role = rolesData.find(r => r.id == roleId);
    if (!role) return;
    
    const newName = prompt('Enter new role name:', role.name);
    if (!newName) return;
    
    const newColor = prompt('Enter new role color (hex):', role.color || '#7c3aed');
    
    updateRole(roleId, {
      name: newName,
      color: newColor || role.color,
      permissions: role.permissions
    });
  }

  function confirmDeleteRole(roleId) {
    const role = rolesData.find(r => r.id == roleId);
    if (!role) return;
    
    const memberCount = role.members || role.memberCount || 0;
    if (confirm(`Are you sure you want to delete the "${role.name}" role? This will affect ${memberCount} members.`)) {
      deleteRoleAPI(roleId);
    }
  }

  // ========================================
  // Utility Functions
  // ========================================

  function formatNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function formatPermissionName(permId) {
    if (permId === 'all') return 'All Permissions';
    return permId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  function getGroupIcon(iconName) {
    const icons = {
      'settings': '⚙️',
      'users': '👥',
      'message': '💬',
      'voice': '🎤',
      'shield': '🛡️'
    };
    return icons[iconName] || '📋';
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: fetchRoles
  };

})();

// Expose to window for router
window.AdminRoles = AdminRoles;
