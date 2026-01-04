/**
 * CoCoCord Admin - Audit Log Page JavaScript
 * Handles audit log display, filtering, and interactions
 */

const AdminAudit = (function() {
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

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminAudit] Initializing...');
    
    // Generate mock audit logs
    generateMockAuditLogs();
    
    // Render audit logs
    renderAuditLogs();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('[AdminAudit] Initialized');
  }

  // ========================================
  // Mock Data Generation
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
        action: action,
        target: targets[Math.floor(Math.random() * targets.length)],
        timestamp: date.toISOString(),
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        details: `Action performed on ${date.toLocaleDateString()}`
      });
    }
    
    // Sort by timestamp desc
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
    
    container.innerHTML = filtered.map(log => `
      <div class="audit-item" data-id="${log.id}">
        <div class="audit-icon ${getActionClass(log.action.type)}">
          <i class="${log.action.icon}"></i>
        </div>
        <div class="audit-content">
          <div class="audit-header">
            <span class="audit-action">${log.action.label}</span>
            ${log.target ? `<span class="audit-target">${log.target}</span>` : ''}
          </div>
          <div class="audit-meta">
            <span class="audit-actor">
              <i class="fas fa-user"></i> ${log.actor}
            </span>
            <span class="audit-time">
              <i class="fas fa-clock"></i> ${formatTimestamp(log.timestamp)}
            </span>
            <span class="audit-ip">
              <i class="fas fa-globe"></i> ${log.ip}
            </span>
          </div>
        </div>
        <button class="admin-btn admin-btn-sm admin-btn-ghost" data-action="details" data-id="${log.id}">
          <i class="fas fa-ellipsis-h"></i>
        </button>
      </div>
    `).join('');
    
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

  function applyFilters() {
    return auditLogs.filter(log => {
      // Search filter
      if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        if (!log.actor.toLowerCase().includes(search) &&
            !log.action.label.toLowerCase().includes(search) &&
            !(log.target || '').toLowerCase().includes(search)) {
          return false;
        }
      }
      
      // Actor filter
      if (currentFilters.actor && log.actor !== currentFilters.actor) {
        return false;
      }
      
      // Action filter
      if (currentFilters.action && log.action.type !== currentFilters.action) {
        return false;
      }
      
      // Date range filter
      if (currentFilters.dateFrom) {
        const logDate = new Date(log.timestamp);
        const fromDate = new Date(currentFilters.dateFrom);
        if (logDate < fromDate) return false;
      }
      
      if (currentFilters.dateTo) {
        const logDate = new Date(log.timestamp);
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
      searchInput.addEventListener('input', AdminUtils?.debounce?.(function(e) {
        currentFilters.search = e.target.value;
        renderAuditLogs();
      }, 300) || function(e) {
        currentFilters.search = e.target.value;
        renderAuditLogs();
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
    AdminUtils?.showToast?.('Export feature coming soon', 'info');
  }

  function showLogDetails(logId) {
    const log = auditLogs.find(l => l.id == logId);
    if (!log) return;
    
    AdminUtils?.showToast?.(`Log #${logId}: ${log.action.label}`, 'info');
  }

  // ========================================
  // Utility Functions
  // ========================================

  function getActionClass(actionType) {
    const classes = {
      'user_ban': 'audit-icon-danger',
      'user_unban': 'audit-icon-success',
      'server_suspend': 'audit-icon-warning',
      'server_restore': 'audit-icon-success',
      'role_update': 'audit-icon-info',
      'settings_change': 'audit-icon-info',
      'login': 'audit-icon-default',
      'report_review': 'audit-icon-warning'
    };
    return classes[actionType] || 'audit-icon-default';
  }

  function formatTimestamp(isoString) {
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
    refresh: () => {
      generateMockAuditLogs();
      renderAuditLogs();
    }
  };

})();

// Expose to window for router
window.AdminAudit = AdminAudit;
