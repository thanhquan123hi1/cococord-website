/**
 * CoCoCord Admin - Reports Page JavaScript
 * Handles reports list, filtering, and moderation actions
 */

const AdminReports = (function() {
  'use strict';

  // State
  let currentTab = 'pending';
  let currentFilters = {
    type: '',
    priority: '',
    search: ''
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminReports] Initializing...');
    
    // Update stats
    updateStats();
    
    // Render reports list
    renderReportsList();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('[AdminReports] Initialized');
  }

  // ========================================
  // Stats Update
  // ========================================

  function updateStats() {
    const stats = MockData.reports.stats;
    
    // Update stat cards
    const statElements = {
      'totalReports': stats.total,
      'pendingReports': stats.pending,
      'resolvedToday': Math.floor(Math.random() * 20) + 5, // Simulated
      'avgResponseTime': '2.5h' // Simulated
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
  // Reports List Rendering
  // ========================================

  function renderReportsList() {
    const container = document.getElementById('reports-list');
    const emptyState = document.getElementById('reports-empty');
    if (!container) return;
    
    // Filter reports based on current tab and filters
    let reports = MockData.reports.list.filter(report => {
      // Tab filter
      if (currentTab === 'pending' && report.status !== 'pending') return false;
      if (currentTab === 'approved' && report.status !== 'approved') return false;
      if (currentTab === 'rejected' && report.status !== 'rejected') return false;
      
      // Type filter
      if (currentFilters.type && report.reason.toLowerCase() !== currentFilters.type) return false;
      
      // Priority filter
      if (currentFilters.priority && report.priority !== currentFilters.priority) return false;
      
      // Search filter
      if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        const searchFields = [
          report.reporter,
          report.target,
          report.description,
          report.reason
        ].join(' ').toLowerCase();
        if (!searchFields.includes(search)) return false;
      }
      
      return true;
    });
    
    // Show/hide empty state
    if (reports.length === 0) {
      container.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }
    
    emptyState?.classList.add('hidden');
    
    // Render reports
    container.innerHTML = reports.map(report => renderReportCard(report)).join('');
    
    // Attach event listeners to new elements
    attachReportCardListeners();
  }

  function renderReportCard(report) {
    const priorityClass = {
      'high': 'priority-high',
      'medium': 'priority-medium',
      'low': 'priority-low'
    }[report.priority] || '';
    
    const statusBadge = {
      'pending': '<span class="admin-badge admin-badge-warning">Pending</span>',
      'approved': '<span class="admin-badge admin-badge-success">Approved</span>',
      'rejected': '<span class="admin-badge admin-badge-danger">Rejected</span>'
    }[report.status] || '';
    
    const typeIcon = {
      'user': '👤',
      'message': '💬',
      'server': '🖥️'
    }[report.type] || '📋';
    
    const timeAgo = AdminUtils?.timeAgo?.(report.createdAt) || formatTimeAgo(report.createdAt);
    
    return `
      <div class="admin-report-card ${priorityClass}" data-report-id="${report.id}">
        <div class="report-header">
          <div class="report-type">
            <span class="report-type-icon">${typeIcon}</span>
            <span class="report-type-label">${report.targetType}</span>
          </div>
          ${statusBadge}
        </div>
        
        <div class="report-body">
          <div class="report-target">
            <strong>${report.target}</strong>
            <span class="report-reason">${report.reason}</span>
          </div>
          <p class="report-description">${report.description}</p>
          
          ${report.evidence.length > 0 ? `
            <div class="report-evidence">
              <span class="evidence-icon">📎</span>
              <span>${report.evidence.length} attachment${report.evidence.length > 1 ? 's' : ''}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="report-footer">
          <div class="report-meta">
            <span class="report-reporter">
              Reported by <strong>${report.reporter}</strong>
            </span>
            <span class="report-time">${timeAgo}</span>
          </div>
          
          ${report.status === 'pending' ? `
            <div class="report-actions">
              <button class="admin-btn admin-btn-sm admin-btn-ghost" data-action="view-report" data-id="${report.id}">
                View
              </button>
              <button class="admin-btn admin-btn-sm admin-btn-danger-ghost" data-action="reject-report" data-id="${report.id}">
                Reject
              </button>
              <button class="admin-btn admin-btn-sm admin-btn-success" data-action="approve-report" data-id="${report.id}">
                Take Action
              </button>
            </div>
          ` : `
            <div class="report-resolved">
              <span>Resolved by ${report.resolvedBy}</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.page-tab[data-tab]').forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });
    
    // Filters
    const typeFilter = document.getElementById('report-type-filter');
    const priorityFilter = document.getElementById('report-priority-filter');
    const searchInput = document.getElementById('report-search');
    
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        currentFilters.type = e.target.value;
        renderReportsList();
      });
    }
    
    if (priorityFilter) {
      priorityFilter.addEventListener('change', (e) => {
        currentFilters.priority = e.target.value;
        renderReportsList();
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        currentFilters.search = e.target.value;
        renderReportsList();
      }, 300));
    }
    
    // Export button
    const exportBtn = document.querySelector('[data-action="export-reports"]');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExport);
    }
  }

  function attachReportCardListeners() {
    // View report buttons
    document.querySelectorAll('[data-action="view-report"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        openReportModal(id);
      });
    });
    
    // Approve report buttons
    document.querySelectorAll('[data-action="approve-report"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        approveReport(id);
      });
    });
    
    // Reject report buttons
    document.querySelectorAll('[data-action="reject-report"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        rejectReport(id);
      });
    });
  }

  function handleTabClick(e) {
    const tab = e.currentTarget;
    const tabId = tab.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    currentTab = tabId;
    renderReportsList();
  }

  // ========================================
  // Report Actions
  // ========================================

  function openReportModal(reportId) {
    const report = MockData.reports.list.find(r => r.id === parseInt(reportId));
    if (!report) return;
    
    // For now, just log - modal implementation can be added
    console.log('[AdminReports] Opening report modal:', report);
    AdminUtils?.showToast?.(`Viewing report #${reportId}`, 'info');
  }

  function approveReport(reportId) {
    const report = MockData.reports.list.find(r => r.id === parseInt(reportId));
    if (!report) return;
    
    // Update mock data (in real app, this would be an API call)
    report.status = 'approved';
    report.resolvedAt = new Date().toISOString();
    report.resolvedBy = 'Admin';
    
    // Update stats
    MockData.reports.stats.pending--;
    MockData.reports.stats.approved++;
    
    // Re-render
    updateStats();
    renderReportsList();
    
    AdminUtils?.showToast?.(`Report #${reportId} approved`, 'success');
  }

  function rejectReport(reportId) {
    const report = MockData.reports.list.find(r => r.id === parseInt(reportId));
    if (!report) return;
    
    // Update mock data
    report.status = 'rejected';
    report.resolvedAt = new Date().toISOString();
    report.resolvedBy = 'Admin';
    report.rejectReason = 'No violation found';
    
    // Update stats
    MockData.reports.stats.pending--;
    MockData.reports.stats.rejected++;
    
    // Re-render
    updateStats();
    renderReportsList();
    
    AdminUtils?.showToast?.(`Report #${reportId} rejected`, 'warning');
  }

  function handleExport() {
    console.log('[AdminReports] Exporting reports...');
    AdminUtils?.showToast?.('Export started...', 'info');
    
    // Simulate export delay
    setTimeout(() => {
      AdminUtils?.showToast?.('Reports exported successfully!', 'success');
    }, 1500);
  }

  // ========================================
  // Utility Functions
  // ========================================

  function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('vi-VN');
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: renderReportsList
  };

})();

// Expose to window for router
window.AdminReports = AdminReports;
