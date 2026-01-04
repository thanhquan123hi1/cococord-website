/**
 * CoCoCord Admin - Statistics Page JavaScript
 * Handles charts, data visualization, and stats interactions
 */

const AdminStats = (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let currentTimeRange = '7d';

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminStats] Initializing...');
    
    // Update stats cards
    updateStatsCards();
    
    // Render top servers table
    renderTopServers();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('[AdminStats] Initialized');
  }

  // ========================================
  // Stats Cards
  // ========================================

  function updateStatsCards() {
    const stats = MockData.dashboard?.kpis || [];
    
    stats.forEach(kpi => {
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
  }

  // ========================================
  // Top Servers Table
  // ========================================

  function renderTopServers() {
    const tbody = document.getElementById('topServersTable');
    if (!tbody) return;
    
    // Sort servers by members descending
    const servers = [...(MockData.servers || [])].sort((a, b) => b.members - a.members).slice(0, 10);
    
    if (servers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No data available</td></tr>';
      return;
    }
    
    tbody.innerHTML = servers.map((server, index) => `
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
              <span class="cell-user-email">@${server.owner || 'unknown'}</span>
            </div>
          </div>
        </td>
        <td>${AdminUtils?.formatNumber?.(server.members) || server.members.toLocaleString()}</td>
        <td>${AdminUtils?.formatNumber?.(server.totalMessages || Math.floor(Math.random() * 500000))}</td>
        <td>
          <div class="mini-chart">
            <div class="mini-bar" style="height: ${Math.min(100, (server.members / 50000) * 100)}%"></div>
          </div>
        </td>
      </tr>
    `).join('');
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
    
    // Refresh data
    updateStatsCards();
    renderTopServers();
    
    AdminUtils?.showToast?.(`Time range: ${range}`, 'info');
  }

  function handleExport() {
    AdminUtils?.showToast?.('Export feature coming soon', 'info');
  }

  function handleRefresh() {
    const btn = document.getElementById('refreshStatsBtn');
    if (btn) {
      btn.classList.add('spinning');
      setTimeout(() => {
        btn.classList.remove('spinning');
        updateStatsCards();
        renderTopServers();
        AdminUtils?.showToast?.('Stats refreshed', 'success');
      }, 500);
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

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: () => {
      updateStatsCards();
      renderTopServers();
    }
  };

})();

// Expose to window for router
window.AdminStats = AdminStats;
