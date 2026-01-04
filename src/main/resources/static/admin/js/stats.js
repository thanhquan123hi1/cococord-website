/**
 * CoCoCord Admin - Statistics Page JavaScript
 * Handles charts, data visualization, and stats interactions
 * Updated to use real API endpoints
 */

var AdminStats = window.AdminStats || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let currentTimeRange = '7d';
  let statsData = null;
  let isLoading = false;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    stats: '/api/admin/dashboard/stats',
    summary: '/api/admin/dashboard/summary',
    servers: '/api/admin/servers'
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminStats] Initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch stats from API
    fetchStats();
    
    console.log('[AdminStats] Initialized');
  }

  // ========================================
  // API Calls
  // ========================================

  async function fetchStats() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      const [statsResponse, serversResponse] = await Promise.all([
        AdminUtils.api.get(`${API.stats}?range=${currentTimeRange}`),
        AdminUtils.api.get(`${API.servers}?page=0&size=10&sort=memberCount,desc`)
      ]);
      
      statsData = statsResponse;
      
      updateStatsCards();
      renderTopServers(serversResponse);
    } catch (error) {
      console.error('[AdminStats] Failed to fetch stats:', error);
      AdminUtils?.showToast?.('Failed to load statistics', 'danger');
      // Fallback to mock data
      updateStatsCards();
      renderTopServersFromMock();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  // ========================================
  // Loading State
  // ========================================

  function showLoading(show) {
    const tbody = document.getElementById('topServersTable');
    if (!tbody) return;

    if (show) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <div class="loading-spinner"></div>
            <div class="mt-2 text-muted">Loading statistics...</div>
          </td>
        </tr>
      `;
    }
  }

  // ========================================
  // Stats Cards
  // ========================================

  function updateStatsCards() {
    // Use API data if available, otherwise use mock
    const kpis = statsData?.kpis || MockData.dashboard?.kpis || [];
    
    kpis.forEach(kpi => {
      const el = document.querySelector(`[data-stat="${kpi.id}"]`);
      if (el) {
        el.textContent = AdminUtils?.formatNumber?.(kpi.value) || kpi.value.toLocaleString();
      }
      
      const trendEl = document.querySelector(`[data-trend="${kpi.id}"]`);
      if (trendEl) {
        const prefix = kpi.trendDirection === 'up' ? '+' : '-';
        trendEl.textContent = `${prefix}${kpi.trend}%`;
        trendEl.className = `stat-trend ${kpi.trendDirection === 'up' ? 'trend-up' : 'trend-down'}`;
      }
    });

    // Update additional stats from API response
    if (statsData) {
      updateStatElement('totalUsers', statsData.totalUsers);
      updateStatElement('totalServers', statsData.totalServers);
      updateStatElement('totalMessages', statsData.totalMessages);
      updateStatElement('activeUsers', statsData.activeUsers);
      updateStatElement('newUsersToday', statsData.newUsersToday);
      updateStatElement('newServersToday', statsData.newServersToday);
    }
  }

  function updateStatElement(id, value) {
    const el = document.querySelector(`[data-stat="${id}"]`);
    if (el && value !== undefined) {
      el.textContent = AdminUtils?.formatNumber?.(value) || value.toLocaleString();
    }
  }

  // ========================================
  // Top Servers Table
  // ========================================

  function renderTopServers(response) {
    const tbody = document.getElementById('topServersTable');
    if (!tbody) return;
    
    let servers = [];
    if (response && response.content) {
      servers = response.content;
    } else if (Array.isArray(response)) {
      servers = response;
    }
    
    if (servers.length === 0) {
      renderTopServersFromMock();
      return;
    }
    
    // Sort by members if not already sorted
    servers = [...servers].sort((a, b) => 
      (b.memberCount || b.members || 0) - (a.memberCount || a.members || 0)
    ).slice(0, 10);
    
    renderServersTable(servers);
  }

  function renderTopServersFromMock() {
    const tbody = document.getElementById('topServersTable');
    if (!tbody) return;
    
    const servers = [...(MockData.servers || [])].sort((a, b) => b.members - a.members).slice(0, 10);
    renderServersTable(servers);
  }

  function renderServersTable(servers) {
    const tbody = document.getElementById('topServersTable');
    if (!tbody) return;
    
    if (servers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No data available</td></tr>';
      return;
    }
    
    const maxMembers = Math.max(...servers.map(s => s.memberCount || s.members || 0));
    
    tbody.innerHTML = servers.map((server, index) => {
      const members = server.memberCount || server.members || 0;
      const messages = server.totalMessages || Math.floor(Math.random() * 500000);
      const barHeight = maxMembers > 0 ? (members / maxMembers) * 100 : 0;
      
      return `
      <tr>
        <td>
          <span class="rank-badge rank-${index < 3 ? index + 1 : 'default'}">${index + 1}</span>
        </td>
        <td>
          <div class="user-cell">
            <div class="server-avatar" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--admin-primary);width:36px;height:36px;border-radius:8px;">
              ${getInitials(server.name)}
            </div>
            <div class="user-info">
              <span class="cell-user-name">${server.name}</span>
              <span class="cell-user-email">@${server.ownerUsername || server.owner || 'unknown'}</span>
            </div>
          </div>
        </td>
        <td>${AdminUtils?.formatNumber?.(members)}</td>
        <td>${AdminUtils?.formatNumber?.(messages)}</td>
        <td>
          <div class="mini-chart">
            <div class="mini-bar" style="height: ${barHeight}%"></div>
          </div>
        </td>
      </tr>
    `}).join('');
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Time range selector
    document.querySelectorAll('[data-range]').forEach(btn => {
      btn.addEventListener('click', handleTimeRangeChange);
    });
    
    // Export button
    const exportBtn = document.getElementById('exportStatsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExport);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', handleRefresh);
    }
  }

  function handleTimeRangeChange(e) {
    const btn = e.currentTarget;
    const range = btn.dataset.range;
    
    // Update active state
    document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentTimeRange = range;
    
    // Refresh data from API
    fetchStats();
    
    AdminUtils?.showToast?.(`Time range: ${range}`, 'info');
  }

  function handleExport() {
    if (!statsData) {
      AdminUtils?.showToast?.('No data to export', 'warning');
      return;
    }
    
    // Create JSON export
    const exportData = {
      exportedAt: new Date().toISOString(),
      timeRange: currentTimeRange,
      stats: statsData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `stats-${currentTimeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    AdminUtils?.showToast?.('Statistics exported', 'success');
  }

  async function handleRefresh() {
    const btn = document.getElementById('refreshStatsBtn');
    if (btn) {
      btn.classList.add('spinning');
    }
    
    await fetchStats();
    
    if (btn) {
      btn.classList.remove('spinning');
    }
    AdminUtils?.showToast?.('Stats refreshed', 'success');
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

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: fetchStats
  };

})();

// Expose to window for router
window.AdminStats = AdminStats;
