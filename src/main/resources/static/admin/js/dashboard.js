/**
 * CoCoCord Admin - Dashboard Page JavaScript
 * Handles stats, activity list, and dashboard interactions
 */

const AdminDashboard = (function() {
  'use strict';

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminDashboard] Initializing...');
    
    // Update stats from mock data
    updateStats();
    
    // Render recent activity
    renderActivity();
    
    // Render new users table
    renderNewUsers();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('[AdminDashboard] Initialized');
  }

  // ========================================
  // Stats Update
  // ========================================

  function updateStats() {
    const kpis = MockData.dashboard.kpis;
    
    // Map KPI data to stat elements
    const statMapping = {
      'total_users': 'totalUsers',
      'total_servers': 'totalServers',
      'messages_today': 'messagesToday',
      'active_calls': 'pendingReports'
    };
    
    kpis.forEach(kpi => {
      const statKey = statMapping[kpi.id];
      if (!statKey) return;
      
      const elements = document.querySelectorAll(`[data-stat="${statKey}"]`);
      elements.forEach(el => {
        const formatted = AdminUtils?.formatNumber?.(kpi.value) || kpi.value.toLocaleString();
        animateValue(el, formatted);
      });
    });
    
    // Update growth percentages
    const usersKpi = kpis.find(k => k.id === 'total_users');
    if (usersKpi) {
      const growthEl = document.querySelector('[data-stat="usersGrowth"]');
      if (growthEl) {
        growthEl.textContent = `${usersKpi.trendDirection === 'up' ? '+' : '-'}${usersKpi.trend}%`;
      }
    }
  }

  function animateValue(element, finalValue) {
    element.textContent = finalValue;
  }

  // ========================================
  // Activity List
  // ========================================

  function renderActivity() {
    const container = document.getElementById('dashboard-activity');
    if (!container) return;
    
    const activities = MockData.dashboard.recentActivity || [];
    
    if (activities.length === 0) {
      container.innerHTML = '<div class="empty-activity">No recent activity</div>';
      return;
    }
    
    container.innerHTML = activities.slice(0, 5).map(activity => `
      <div class="activity-item">
        <div class="activity-avatar" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--admin-primary);">
          ${getInitials(activity.user)}
        </div>
        <div class="activity-content">
          <div class="activity-text">
            <strong>${activity.user}</strong> ${activity.action}
            ${activity.target ? `<span class="activity-target">${activity.target}</span>` : ''}
          </div>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }

  // ========================================
  // New Users Table
  // ========================================

  function renderNewUsers() {
    const tbody = document.getElementById('dashboard-new-users');
    if (!tbody) return;
    
    const users = MockData.users?.slice(0, 5) || [];
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No new users</td></tr>';
      return;
    }
    
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar-sm" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--admin-primary);width:32px;height:32px;border-radius:50%;">
              ${getInitials(user.username)}
            </div>
            <div class="user-info">
              <span class="user-name">${user.username}</span>
              <span class="user-email">${user.email}</span>
            </div>
          </div>
        </td>
        <td>${formatDate(user.createdAt)}</td>
        <td>
          <span class="admin-badge admin-badge-${user.status === 'active' ? 'success' : 'warning'}">
            ${user.status}
          </span>
        </td>
        <td>
          <button class="admin-btn admin-btn-sm admin-btn-ghost" data-action="view-user" data-id="${user.id}">
            View
          </button>
        </td>
      </tr>
    `).join('');
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Chart range buttons
    document.querySelectorAll('[data-chart-range]').forEach(btn => {
      btn.addEventListener('click', handleChartRangeChange);
    });
    
    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', handleQuickAction);
    });
    
    // View user buttons
    document.querySelectorAll('[data-action="view-user"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.dataset.id;
        AdminUtils?.showToast?.(`Viewing user #${userId}`, 'info');
      });
    });
  }

  function handleChartRangeChange(e) {
    const btn = e.currentTarget;
    const range = btn.dataset.chartRange;
    
    // Update active state
    document.querySelectorAll('[data-chart-range]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    console.log('[AdminDashboard] Chart range changed to:', range);
    AdminUtils?.showToast?.(`Chart range: ${range}`, 'info');
  }

  function handleQuickAction(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
      case 'create-user':
        AdminRouter?.navigateTo('users');
        break;
      case 'view-reports':
        AdminRouter?.navigateTo('reports');
        break;
      case 'send-announcement':
        AdminUtils?.showToast?.('Announcement feature coming soon', 'info');
        break;
      case 'system-settings':
        AdminRouter?.navigateTo('settings');
        break;
    }
  }

  // ========================================
  // Utility Functions
  // ========================================

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short'
    });
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: () => {
      updateStats();
      renderActivity();
      renderNewUsers();
    }
  };

})();

// Expose to window for router
window.AdminDashboard = AdminDashboard;