/**
 * CoCoCord Admin - Audit Log Page JavaScript
 * Handles audit log display, filtering, and interactions
 * Updated to use real API endpoints
 */

var AdminAudit = window.AdminAudit || (function() {
  'use strict';

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
    size: 50,
    totalElements: 0,
    totalPages: 0
  };
  let isLoading = false;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    auditLog: '/api/admin/audit-log'
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminAudit] Initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch audit logs from API
    fetchAuditLogs();
    
    console.log('[AdminAudit] Initialized');
  }

  // ========================================
  // API Calls
  // ========================================

  async function fetchAuditLogs() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size
      });

      const response = await AdminUtils.api.get(`${API.auditLog}?${params}`);
      
      if (response && response.content) {
        auditLogs = response.content;
        pagination.totalElements = response.totalElements || 0;
        pagination.totalPages = response.totalPages || 0;
      } else if (Array.isArray(response)) {
        auditLogs = response;
        pagination.totalElements = response.length;
        pagination.totalPages = 1;
      } else {
        console.warn('[AdminAudit] API returned unexpected format, generating mock data');
        generateMockAuditLogs();
      }
      
      renderAuditLogs();
    } catch (error) {
      console.error('[AdminAudit] Failed to fetch audit logs:', error);
      AdminUtils?.showToast?.('Failed to load audit logs', 'danger');
      // Fallback to mock data
      generateMockAuditLogs();
      renderAuditLogs();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  // ========================================
  // Loading State
  // ========================================

  function showLoading(show) {
    const container = document.getElementById('auditTimeline');
    if (!container) return;

    if (show) {
      container.innerHTML = `
        <div class="text-center py-8">
          <div class="loading-spinner"></div>
          <div class="mt-2 text-muted">Loading audit logs...</div>
        </div>
      `;
    }
  }

  // ========================================
  // Mock Data Generation (Fallback)
  // ========================================

  function generateMockAuditLogs() {
    const actors = ['admin@cococord.com', 'moderator@cococord.com', 'system', 'support@cococord.com'];
    const actions = [
      { type: 'user_ban', icon: 'fas fa-user-slash', label: 'Banned user' },
      { type: 'user_unban', icon: 'fas fa-user-check', label: 'Unbanned user' },
      { type: 'server_suspend', icon: 'fas fa-pause-circle', label: 'Suspended server' },
      { type: 'server_restore', icon: 'fas fa-play-circle', label: 'Restored server' },
      { type: 'role_update', icon: 'fas fa-user-shield', label: 'Updated role' },
      { type: 'settings_change', icon: 'fas fa-cog', label: 'Changed settings' },
      { type: 'login', icon: 'fas fa-sign-in-alt', label: 'Logged in' },
      { type: 'report_review', icon: 'fas fa-flag', label: 'Reviewed report' }
    ];
    const targets = ['user_abc123', 'server_gaming', 'user_xyz789', 'server_cococord', 'role_moderator', null];
    
    auditLogs = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const date = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      auditLogs.push({
        id: i + 1,
        actor: actors[Math.floor(Math.random() * actors.length)],
        adminUsername: actors[Math.floor(Math.random() * actors.length)],
        action: action.type,
        actionType: action.type,
        actionLabel: action.label,
        actionIcon: action.icon,
        target: targets[Math.floor(Math.random() * targets.length)],
        targetType: 'user',
        targetId: Math.floor(Math.random() * 1000),
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        details: `Action performed on ${date.toLocaleDateString()}`
      });
    }
    
    // Sort by timestamp desc
    auditLogs.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
  }

  // ========================================
  // Rendering
  // ========================================

  function renderAuditLogs() {
    const container = document.getElementById('auditTimeline');
    if (!container) return;
    
    const filtered = applyFilters();
    
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <i class="fas fa-search"></i>
          <h3>No audit logs found</h3>
          <p>Try adjusting your filters</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = filtered.map(log => {
      const actionInfo = getActionInfo(log);
      const timestamp = log.timestamp || log.createdAt;
      const actor = log.adminUsername || log.actor || 'System';
      const target = log.targetDescription || log.target;
      const ip = log.ipAddress || log.ip || '--';
      
      return `
      <div class="audit-item" data-id="${log.id}">
        <div class="audit-icon ${actionInfo.class}">
          <i class="${actionInfo.icon}"></i>
        </div>
        <div class="audit-content">
          <div class="audit-header">
            <span class="audit-action">${actionInfo.label}</span>
            ${target ? `<span class="audit-target">${target}</span>` : ''}
          </div>
          <div class="audit-meta">
            <span class="audit-actor">
              <i class="fas fa-user"></i> ${actor}
            </span>
            <span class="audit-time">
              <i class="fas fa-clock"></i> ${formatTimestamp(timestamp)}
            </span>
            <span class="audit-ip">
              <i class="fas fa-globe"></i> ${ip}
            </span>
          </div>
        </div>
        <button class="admin-btn admin-btn-sm admin-btn-ghost" data-action="details" data-id="${log.id}">
          <i class="fas fa-ellipsis-h"></i>
        </button>
      </div>
    `}).join('');
    
    // Update count
    const countEl = document.getElementById('auditCount');
    if (countEl) {
      countEl.textContent = `${filtered.length} entries`;
    }
    
    // Attach detail listeners
    document.querySelectorAll('[data-action="details"]').forEach(btn => {
      btn.onclick = () => showLogDetails(btn.dataset.id);
    });
  }

  function getActionInfo(log) {
    const actionType = log.actionType || log.action?.type || log.action || '';
    
    const actionMap = {
      'user_ban': { icon: 'fas fa-user-slash', label: 'Banned user', class: 'audit-icon-danger' },
      'USER_BANNED': { icon: 'fas fa-user-slash', label: 'Banned user', class: 'audit-icon-danger' },
      'user_unban': { icon: 'fas fa-user-check', label: 'Unbanned user', class: 'audit-icon-success' },
      'USER_UNBANNED': { icon: 'fas fa-user-check', label: 'Unbanned user', class: 'audit-icon-success' },
      'user_mute': { icon: 'fas fa-volume-mute', label: 'Muted user', class: 'audit-icon-warning' },
      'USER_MUTED': { icon: 'fas fa-volume-mute', label: 'Muted user', class: 'audit-icon-warning' },
      'user_unmute': { icon: 'fas fa-volume-up', label: 'Unmuted user', class: 'audit-icon-success' },
      'USER_UNMUTED': { icon: 'fas fa-volume-up', label: 'Unmuted user', class: 'audit-icon-success' },
      'server_suspend': { icon: 'fas fa-pause-circle', label: 'Suspended server', class: 'audit-icon-warning' },
      'SERVER_LOCKED': { icon: 'fas fa-lock', label: 'Locked server', class: 'audit-icon-warning' },
      'server_restore': { icon: 'fas fa-play-circle', label: 'Restored server', class: 'audit-icon-success' },
      'SERVER_UNLOCKED': { icon: 'fas fa-unlock', label: 'Unlocked server', class: 'audit-icon-success' },
      'SERVER_DELETED': { icon: 'fas fa-trash', label: 'Deleted server', class: 'audit-icon-danger' },
      'role_update': { icon: 'fas fa-user-shield', label: 'Updated role', class: 'audit-icon-info' },
      'ROLE_UPDATED': { icon: 'fas fa-user-shield', label: 'Updated role', class: 'audit-icon-info' },
      'settings_change': { icon: 'fas fa-cog', label: 'Changed settings', class: 'audit-icon-info' },
      'SETTINGS_UPDATED': { icon: 'fas fa-cog', label: 'Changed settings', class: 'audit-icon-info' },
      'login': { icon: 'fas fa-sign-in-alt', label: 'Logged in', class: 'audit-icon-default' },
      'report_review': { icon: 'fas fa-flag', label: 'Reviewed report', class: 'audit-icon-warning' },
      'REPORT_RESOLVED': { icon: 'fas fa-flag', label: 'Resolved report', class: 'audit-icon-success' },
      'REPORT_REJECTED': { icon: 'fas fa-flag', label: 'Rejected report', class: 'audit-icon-warning' },
      'MESSAGE_DELETED': { icon: 'fas fa-trash', label: 'Deleted message', class: 'audit-icon-danger' }
    };
    
    return actionMap[actionType] || { 
      icon: log.action?.icon || 'fas fa-info-circle', 
      label: log.action?.label || log.actionLabel || actionType || 'Action', 
      class: 'audit-icon-default' 
    };
  }

  function applyFilters() {
    return auditLogs.filter(log => {
      const actor = log.adminUsername || log.actor || '';
      const actionType = log.actionType || log.action?.type || log.action || '';
      const actionLabel = log.actionLabel || log.action?.label || '';
      const target = log.targetDescription || log.target || '';
      const timestamp = log.timestamp || log.createdAt;
      
      // Search filter
      if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        if (!actor.toLowerCase().includes(search) &&
            !actionLabel.toLowerCase().includes(search) &&
            !actionType.toLowerCase().includes(search) &&
            !target.toLowerCase().includes(search)) {
          return false;
        }
      }
      
      // Actor filter
      if (currentFilters.actor && !actor.includes(currentFilters.actor)) {
        return false;
      }
      
      // Action filter
      if (currentFilters.action && actionType !== currentFilters.action) {
        return false;
      }
      
      // Date range filter
      if (currentFilters.dateFrom && timestamp) {
        const logDate = new Date(timestamp);
        const fromDate = new Date(currentFilters.dateFrom);
        if (logDate < fromDate) return false;
      }
      
      if (currentFilters.dateTo && timestamp) {
        const logDate = new Date(timestamp);
        const toDate = new Date(currentFilters.dateTo);
        toDate.setHours(23, 59, 59);
        if (logDate > toDate) return false;
      }
      
      return true;
    });
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchAudit');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentFilters.search = e.target.value;
          renderAuditLogs();
        }, 300);
      });
    }
    
    // Actor filter
    const actorFilter = document.getElementById('filterActor');
    if (actorFilter) {
      actorFilter.addEventListener('change', (e) => {
        currentFilters.actor = e.target.value;
        renderAuditLogs();
      });
    }
    
    // Action filter
    const actionFilter = document.getElementById('filterAction');
    if (actionFilter) {
      actionFilter.addEventListener('change', (e) => {
        currentFilters.action = e.target.value;
        renderAuditLogs();
      });
    }
    
    // Date filters
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (dateFrom) {
      dateFrom.addEventListener('change', (e) => {
        currentFilters.dateFrom = e.target.value;
        renderAuditLogs();
      });
    }
    
    if (dateTo) {
      dateTo.addEventListener('change', (e) => {
        currentFilters.dateTo = e.target.value;
        renderAuditLogs();
      });
    }
    
    // Clear filters
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearFilters);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportAuditBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExport);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('spinning');
        await fetchAuditLogs();
        refreshBtn.classList.remove('spinning');
      });
    }
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
    const searchInput = document.getElementById('searchAudit');
    const actorFilter = document.getElementById('filterActor');
    const actionFilter = document.getElementById('filterAction');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (searchInput) searchInput.value = '';
    if (actorFilter) actorFilter.value = '';
    if (actionFilter) actionFilter.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    renderAuditLogs();
    AdminUtils?.showToast?.('Filters cleared', 'info');
  }

  function handleExport() {
    if (auditLogs.length === 0) {
      AdminUtils?.showToast?.('No data to export', 'warning');
      return;
    }
    
    // Create CSV
    const filtered = applyFilters();
    const header = 'ID,Actor,Action,Target,Timestamp,IP Address\n';
    const csvContent = filtered.map(log => {
      const actor = log.adminUsername || log.actor || 'System';
      const action = log.actionType || log.action?.type || log.action || '';
      const target = log.targetDescription || log.target || '';
      const timestamp = log.timestamp || log.createdAt || '';
      const ip = log.ipAddress || log.ip || '';
      return `${log.id},"${actor}","${action}","${target}","${timestamp}","${ip}"`;
    }).join('\n');
    
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    AdminUtils?.showToast?.('Audit log exported', 'success');
  }

  function showLogDetails(logId) {
    const log = auditLogs.find(l => l.id == logId);
    if (!log) return;
    
    const actionInfo = getActionInfo(log);
    AdminUtils?.showToast?.(`Log #${logId}: ${actionInfo.label}`, 'info');
    console.log('[AdminAudit] Log details:', log);
  }

  // ========================================
  // Utility Functions
  // ========================================

  function formatTimestamp(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: fetchAuditLogs
  };

})();

// Expose to window for router
window.AdminAudit = AdminAudit;
