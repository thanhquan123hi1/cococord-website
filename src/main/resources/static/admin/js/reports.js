/**
 * CoCoCord Admin - Reports Page JavaScript
 * Handles reports list, filtering, and moderation actions
 * Updated to use real API endpoints
 */

var AdminReports = window.AdminReports || (function() {
  'use strict';

  // State
  let currentTab = 'pending';
  let currentFilters = {
    type: '',
    priority: '',
    search: ''
  };
  let reportsData = [];
  let stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  let pagination = {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  };
  let isLoading = false;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    reports: '/api/admin/reports',
    report: (id) => `/api/admin/reports/${id}`,
    resolve: (id) => `/api/admin/reports/${id}/resolve`,
    reject: (id) => `/api/admin/reports/${id}/reject`
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminReports] Initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch reports from API
    fetchReports();
    
    console.log('[AdminReports] Initialized');
  }

  // ========================================
  // API Calls
  // ========================================

  async function fetchReports() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size
      });
      
      // Add status filter based on current tab
      if (currentTab !== 'all') {
        params.append('status', currentTab.toUpperCase());
      }

      const response = await AdminUtils.api.get(`${API.reports}?${params}`);
      
      if (response && response.content) {
        reportsData = response.content;
        pagination.totalElements = response.totalElements || 0;
        pagination.totalPages = response.totalPages || 0;
      } else if (Array.isArray(response)) {
        reportsData = response;
        pagination.totalElements = response.length;
        pagination.totalPages = 1;
      } else {
        console.warn('[AdminReports] API returned unexpected format, using mock data');
        reportsData = MockData?.reports?.list || [];
      }
      
      // Calculate stats from data
      calculateStats();
      updateStats();
      renderReportsList();
    } catch (error) {
      console.error('[AdminReports] Failed to fetch reports:', error);
      AdminUtils?.showToast?.('Failed to load reports', 'danger');
      // Fallback to mock data
      reportsData = MockData?.reports?.list || [];
      stats = MockData?.reports?.stats || { total: 0, pending: 0, approved: 0, rejected: 0 };
      updateStats();
      renderReportsList();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  async function resolveReport(reportId, action, note = '') {
    try {
      await AdminUtils.api.post(API.resolve(reportId), { action, note });
      AdminUtils?.showToast?.(`Report #${reportId} resolved`, 'success');
      fetchReports();
    } catch (error) {
      console.error('[AdminReports] Failed to resolve report:', error);
      AdminUtils?.showToast?.('Failed to resolve report', 'danger');
    }
  }

  async function rejectReportAPI(reportId, reason = '') {
    try {
      await AdminUtils.api.post(API.reject(reportId), { reason });
      AdminUtils?.showToast?.(`Report #${reportId} rejected`, 'warning');
      fetchReports();
    } catch (error) {
      console.error('[AdminReports] Failed to reject report:', error);
      AdminUtils?.showToast?.('Failed to reject report', 'danger');
    }
  }

  async function fetchReportDetails(reportId) {
    try {
      return await AdminUtils.api.get(API.report(reportId));
    } catch (error) {
      console.error('[AdminReports] Failed to fetch report details:', error);
      return null;
    }
  }

  // ========================================
  // Loading State
  // ========================================

  function showLoading(show) {
    const container = document.getElementById('reports-list');
    if (!container) return;

    if (show) {
      container.innerHTML = `
        <div class="text-center py-8">
          <div class="loading-spinner"></div>
          <div class="mt-2 text-muted">Loading reports...</div>
        </div>
      `;
    }
  }

  // ========================================
  // Stats Update
  // ========================================

  function calculateStats() {
    stats = {
      total: reportsData.length,
      pending: reportsData.filter(r => r.status === 'PENDING' || r.status === 'pending').length,
      approved: reportsData.filter(r => r.status === 'RESOLVED' || r.status === 'approved').length,
      rejected: reportsData.filter(r => r.status === 'REJECTED' || r.status === 'rejected').length
    };
  }

  function updateStats() {
    const statElements = {
      'totalReports': stats.total || pagination.totalElements,
      'pendingReports': stats.pending,
      'resolvedToday': stats.approved,
      'avgResponseTime': '2.5h' // TODO: Calculate from API
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
    console.log('[AdminReports] renderReportsList called, data count:', reportsData.length);
    const container = document.getElementById('reports-list');
    const emptyState = document.getElementById('reports-empty');
    if (!container) {
      console.error('[AdminReports] Container #reports-list not found!');
      return;
    }
    console.log('[AdminReports] Container found, rendering...');
    
    // Filter reports based on current filters (client-side additional filtering)
    let reports = reportsData.filter(report => {
      // Type filter
      if (currentFilters.type) {
        const reportType = (report.type || report.targetType || '').toLowerCase();
        if (!reportType.includes(currentFilters.type.toLowerCase())) return false;
      }
      
      // Priority filter
      if (currentFilters.priority && report.priority !== currentFilters.priority) return false;
      
      // Search filter
      if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        const searchFields = [
          report.reporterUsername || report.reporter,
          report.targetUsername || report.target,
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
      if (emptyState) {
        emptyState.classList.remove('hidden');
        emptyState.style.display = 'block';
      }
      return;
    }
    
    if (emptyState) {
      emptyState.classList.add('hidden');
      emptyState.style.display = 'none';
    }
    
    // Render reports
    container.innerHTML = reports.map(report => renderReportCard(report)).join('');
    
    // Attach event listeners to new elements
    attachReportCardListeners();
  }

  function renderReportCard(report) {
    const priority = (report.priority || 'low').toLowerCase();
    const priorityClass = {
      'high': 'priority-high',
      'medium': 'priority-medium',
      'low': 'priority-low'
    }[priority] || '';
    
    const status = (report.status || 'pending').toLowerCase();
    const statusBadge = {
      'pending': '<span class="admin-badge admin-badge-warning">Pending</span>',
      'resolved': '<span class="admin-badge admin-badge-success">Resolved</span>',
      'approved': '<span class="admin-badge admin-badge-success">Approved</span>',
      'rejected': '<span class="admin-badge admin-badge-danger">Rejected</span>'
    }[status] || '<span class="admin-badge admin-badge-warning">Pending</span>';
    
    const type = (report.type || 'message').toLowerCase();
    const typeIcon = {
      'user': '👤',
      'message': '💬',
      'server': '🖥️'
    }[type] || '📋';
    
    const timeAgo = AdminUtils?.timeAgo?.(report.createdAt) || formatTimeAgo(report.createdAt);
    
    const isPending = status === 'pending';
    
    return `
      <div class="admin-report-card ${priorityClass}" data-report-id="${report.id}">
        <div class="report-header">
          <div class="report-type">
            <span class="report-type-icon">${typeIcon}</span>
            <span class="report-type-label">${report.type || report.targetType || 'Report'}</span>
          </div>
          ${statusBadge}
        </div>
        
        <div class="report-body">
          <div class="report-target">
            <strong>${report.targetUsername || report.target || 'Unknown'}</strong>
            <span class="report-reason">${report.reason || 'No reason provided'}</span>
          </div>
          <p class="report-description">${report.description || 'No description'}</p>
          
          ${report.evidence && report.evidence.length > 0 ? `
            <div class="report-evidence">
              <span class="evidence-icon">📎</span>
              <span>${report.evidence.length} attachment${report.evidence.length > 1 ? 's' : ''}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="report-footer">
          <div class="report-meta">
            <span class="report-reporter">
              Reported by <strong>${report.reporterUsername || report.reporter || 'Anonymous'}</strong>
            </span>
            <span class="report-time">${timeAgo}</span>
          </div>
          
          ${isPending ? `
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
              <span>Resolved by ${report.resolvedByUsername || report.resolvedBy || 'Admin'}</span>
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

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        fetchReports().finally(() => {
          refreshBtn.classList.remove('spinning');
        });
      });
    }
  }

  function attachReportCardListeners() {
    // View report buttons
    document.querySelectorAll('[data-action="view-report"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
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
    pagination.page = 0; // Reset to first page
    fetchReports(); // Fetch with new status filter
  }

  // ========================================
  // Report Actions
  // ========================================

  async function openReportModal(reportId) {
    const report = reportsData.find(r => r.id == reportId);
    
    // Try to get detailed info
    const detailed = await fetchReportDetails(reportId);
    const displayReport = detailed || report;
    
    if (!displayReport) {
      AdminUtils?.showToast?.('Report not found', 'danger');
      return;
    }
    
    console.log('[AdminReports] Opening report modal:', displayReport);
    AdminUtils?.showToast?.(`Viewing report #${reportId}`, 'info');
    
    // TODO: Implement full modal display
  }

  async function approveReport(reportId) {
    const report = reportsData.find(r => r.id == reportId);
    if (!report) return;
    
    const action = prompt('Enter action taken (e.g., "User banned", "Warning issued"):');
    if (action === null) return;
    
    await resolveReport(reportId, action, 'Resolved by admin');
  }

  async function rejectReport(reportId) {
    const report = reportsData.find(r => r.id == reportId);
    if (!report) return;
    
    const reason = prompt('Enter rejection reason:') || 'No violation found';
    await rejectReportAPI(reportId, reason);
  }

  function handleExport() {
    console.log('[AdminReports] Exporting reports...');
    AdminUtils?.showToast?.('Export started...', 'info');
    
    // Create CSV from current data
    const csvContent = reportsData.map(r => 
      `${r.id},${r.type},${r.reporterUsername || r.reporter},${r.targetUsername || r.target},${r.status},${r.createdAt}`
    ).join('\n');
    
    const header = 'ID,Type,Reporter,Target,Status,Created At\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    AdminUtils?.showToast?.('Reports exported successfully!', 'success');
  }

  // ========================================
  // Utility Functions
  // ========================================

  function formatTimeAgo(dateStr) {
    if (!dateStr) return '--';
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
    refresh: fetchReports
  };

})();

// Expose to window for router
window.AdminReports = AdminReports;
