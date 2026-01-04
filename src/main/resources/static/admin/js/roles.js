/**
 * CoCoCord Admin - Roles & Permissions Page JavaScript
 * Handles roles management and permissions matrix
 */

const AdminRoles = (function() {
  'use strict';

  // State
  let currentTab = 'roles';

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminRoles] Initializing...');
    
    // Update stats
    updateStats();
    
    // Render initial content
    renderContent();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('[AdminRoles] Initialized');
  }

  // ========================================
  // Stats Update
  // ========================================

  function updateStats() {
    const roles = MockData.roles.list;
    
    const statElements = {
      'totalRoles': roles.length,
      'totalAdmins': roles.find(r => r.name === 'Administrator')?.members || 0,
      'totalModerators': roles.find(r => r.name === 'Moderator')?.members || 0,
      'permissionGroups': MockData.roles.permissionGroups.length
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
    
    const roles = MockData.roles.list;
    
    container.innerHTML = roles.map(role => renderRoleCard(role)).join('');
    
    // Attach listeners
    attachRoleCardListeners();
  }

  function renderRoleCard(role) {
    const isAdmin = role.permissions.includes('all') || role.permissions.includes('administrator');
    
    return `
      <div class="admin-role-card" data-role-id="${role.id}">
        <div class="role-header">
          <div class="role-color-badge" style="background-color: ${role.color}"></div>
          <div class="role-info">
            <h4 class="role-name">${role.name}</h4>
            <span class="role-members">${formatNumber(role.members)} members</span>
          </div>
          ${isAdmin ? '<span class="admin-badge admin-badge-danger">Admin</span>' : ''}
        </div>
        
        <div class="role-permissions">
          <span class="permissions-label">Permissions:</span>
          <div class="permissions-preview">
            ${role.permissions.slice(0, 3).map(p => `
              <span class="permission-tag">${formatPermissionName(p)}</span>
            `).join('')}
            ${role.permissions.length > 3 ? `
              <span class="permission-tag permission-more">+${role.permissions.length - 3} more</span>
            ` : ''}
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
    
    const groups = MockData.roles.permissionGroups;
    const roles = MockData.roles.list;
    
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
            <div class="role-color-dot" style="background: ${role.color}"></div>
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
    
    const group = MockData.roles.permissionGroups.find(g => g.name === groupName);
    const roles = MockData.roles.list;
    
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
          const hasPermission = role.permissions.includes('all') || 
                               role.permissions.includes('administrator') ||
                               role.permissions.includes(perm.id);
          return `
            <td class="role-col">
              <label class="permission-checkbox-wrapper">
                <input type="checkbox" 
                       class="permission-checkbox" 
                       ${hasPermission ? 'checked' : ''} 
                       ${role.permissions.includes('all') ? 'disabled' : ''}
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
  }

  function attachRoleCardListeners() {
    // Edit role
    document.querySelectorAll('[data-action="edit-role"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        openEditRoleModal(id);
      });
    });
    
    // Delete role
    document.querySelectorAll('[data-action="delete-role"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
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

  function handlePermissionToggle(e) {
    const checkbox = e.target;
    const roleId = parseInt(checkbox.dataset.role);
    const permissionId = checkbox.dataset.permission;
    const isChecked = checkbox.checked;
    
    const role = MockData.roles.list.find(r => r.id === roleId);
    if (!role) return;
    
    // Update mock data
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
    
    AdminUtils?.showToast?.(
      `Permission ${isChecked ? 'granted to' : 'revoked from'} ${role.name}`,
      'info'
    );
  }

  // ========================================
  // Role Actions
  // ========================================

  function openAddRoleModal() {
    console.log('[AdminRoles] Opening add role modal');
    AdminUtils?.showToast?.('Add role modal (coming soon)', 'info');
  }

  function openEditRoleModal(roleId) {
    const role = MockData.roles.list.find(r => r.id === roleId);
    if (!role) return;
    
    console.log('[AdminRoles] Editing role:', role);
    AdminUtils?.showToast?.(`Editing role: ${role.name}`, 'info');
  }

  function confirmDeleteRole(roleId) {
    const role = MockData.roles.list.find(r => r.id === roleId);
    if (!role) return;
    
    if (confirm(`Are you sure you want to delete the "${role.name}" role? This will affect ${role.members} members.`)) {
      deleteRole(roleId);
    }
  }

  function deleteRole(roleId) {
    const index = MockData.roles.list.findIndex(r => r.id === roleId);
    if (index === -1) return;
    
    const roleName = MockData.roles.list[index].name;
    MockData.roles.list.splice(index, 1);
    
    updateStats();
    renderContent();
    
    AdminUtils?.showToast?.(`Role "${roleName}" deleted`, 'warning');
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
    refresh: renderContent
  };

})();

// Expose to window for router
window.AdminRoles = AdminRoles;
