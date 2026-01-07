/**
 * CoCoCord Admin - Dashboard Page JavaScript
 * Handles stats, activity list, and dashboard interactions using real API
 */

var AdminDashboard = window.AdminDashboard || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let dashboardData = null;
  let isLoading = false;
  let refreshInterval = null;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    summary: '/api/admin/dashboard/summary',
    stats: '/api/admin/dashboard/stats',
    users: '/api/admin/users',
    recentAuditLogs: '/api/admin/audit-log/recent',
    topServers: '/api/admin/servers/top'
  };

  // ========================================
  // Initialization
  // ========================================

  async function init() {
    console.log('[AdminDashboard] Initializing...');
    
    // Show loading state
    showLoading();
    
    try {
      // Fetch dashboard data from API
      await fetchDashboardData();
    } catch (error) {
      console.warn('[AdminDashboard] API error, using mock data:', error.message);
      // Continue with mock data - don't fail the whole init
    }
    
    // Update UI (will use mock data if API failed)
    updateStats();
    renderActivity();
    renderTopServers();
    renderNewUsers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup auto-refresh (every 60 seconds)
    startAutoRefresh();
    
    console.log('[AdminDashboard] Initialized');
  }

  // ========================================
  // Data Fetching
  // ========================================

  async function fetchDashboardData() {
    isLoading = true;
    
    try {
      dashboardData = await AdminUtils.api.get(API.summary);
      return dashboardData;
    } catch (error) {
      console.error('[AdminDashboard] Failed to fetch data:', error);
      // Fallback to mock data if API fails
      dashboardData = getMockData();
      throw error;
    } finally {
      isLoading = false;
    }
  }

  function getMockData() {
    return {
      totalUsers: 0,
      totalServers: 0,
      activeUsers24h: 0,
      messagesToday: 0,
      pendingReports: 0,
      bannedUsers: 0,
      onlineUsers: 0,
      usersGrowth: 0,
      serversGrowth: 0,
      messagesGrowth: 0,
      recentActivity: [],
      userGrowthChart: [],
      serverGrowthChart: []
    };
  }

  // ========================================
  // Stats Update
  // ========================================

  function updateStats() {
    if (!dashboardData) return;
    
    // Update stat cards
    updateStatCard('totalUsers', dashboardData.totalUsers);
    updateStatCard('totalServers', dashboardData.totalServers);
    updateStatCard('messagesToday', dashboardData.messagesToday);
    updateStatCard('pendingReports', dashboardData.pendingReports);
    updateStatCard('activeUsers24h', dashboardData.activeUsers24h);
    updateStatCard('bannedUsers', dashboardData.bannedUsers);
    updateStatCard('onlineUsers', dashboardData.onlineUsers);
    
    // Update growth indicators
    updateGrowth('usersGrowth', dashboardData.usersGrowth);
    updateGrowth('serversGrowth', dashboardData.serversGrowth);
    updateGrowth('messagesGrowth', dashboardData.messagesGrowth);
  }

  function updateStatCard(key, value) {
    const elements = document.querySelectorAll(`[data-stat="${key}"]`);
    elements.forEach(el => {
      animateValue(el, AdminUtils.formatNumber(value || 0));
    });
  }

  function updateGrowth(key, value) {
    const el = document.querySelector(`[data-stat="${key}"]`);
    if (!el) return;
    
    const formatted = AdminUtils.formatPercentage(value || 0);
    el.textContent = formatted;
    el.className = `stat-trend ${(value || 0) >= 0 ? 'stat-trend-up' : 'stat-trend-down'}`;
  }

  function animateValue(element, finalValue) {
    element.textContent = finalValue;
  }

  // ========================================
  // Activity List
  // ========================================

  async function renderActivity() {
    const container = document.getElementById('activity-list');
    const badge = document.querySelector('[data-stat="activityCount"]');
    
    if (!container) return;
    
    try {
      // Fetch recent audit logs from API
      const auditLogs = await AdminUtils.api.get(`${API.recentAuditLogs}?limit=3`);
      
      // Update badge
      if (badge) {
        badge.textContent = auditLogs.length;
      }
      
      // Render
      if (auditLogs.length === 0) {
        container.innerHTML = '<div class="empty-activity">Không có hoạt động gần đây</div>';
        return;
      }
      
      container.innerHTML = auditLogs.map(log => {
        const actionMap = {
          'USER_BAN': 'đã cấm người dùng',
          'USER_UNBAN': 'đã bỏ cấm người dùng',
          'USER_DELETE': 'đã xóa người dùng',
          'SERVER_SUSPEND': 'đã tạm ngưng server',
          'SERVER_UNSUSPEND': 'đã kích hoạt lại server',
          'SERVER_DELETE': 'đã xóa server',
          'REPORT_RESOLVE': 'đã xử lý báo cáo',
          'MESSAGE_DELETE': 'đã xóa tin nhắn',
          'SETTINGS_UPDATE': 'đã cập nhật cài đặt'
        };
        
        const actionText = actionMap[log.actionType] || log.description;
        const userName = log.actorUsername || 'Hệ thống';
        const targetName = log.targetName || '';
        
        return `
          <div class="activity-item">
            <div class="activity-avatar" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--admin-primary);">
              ${AdminUtils.getInitials(userName)}
            </div>
            <div class="activity-content">
              <div class="activity-text">
                <strong>${userName}</strong> ${actionText}
                ${targetName ? `<span class="activity-target">${targetName}</span>` : ''}
              </div>
              <div class="activity-time">${AdminUtils.timeAgo(log.createdAt)}</div>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (error) {
      console.error('[AdminDashboard] Failed to load recent activity:', error);
      container.innerHTML = '<div class="empty-activity">Không thể tải hoạt động</div>';
      if (badge) badge.textContent = '0';
    }
  }

  // ========================================
  // Top Servers List
  // ========================================

  async function renderTopServers() {
    const container = document.getElementById('top-servers-list');
    const badge = document.querySelector('[data-stat="topServersCount"]');
    
    if (!container) return;
    
    try {
      // Fetch top servers from API
      const servers = await AdminUtils.api.get(`${API.topServers}?limit=3`);
      
      // Update badge
      if (badge) {
        badge.textContent = servers.length;
      }
      
      // Render
      if (servers.length === 0) {
        container.innerHTML = '<div class="empty-activity">Không có server nào</div>';
        return;
      }
      
      container.innerHTML = servers.map(server => {
        const memberCount = server.memberCount || 0;
        const serverName = server.name || 'Unknown Server';
        const ownerName = server.ownerUsername || 'Unknown';
        
        return `
          <div class="server-item">
            <div class="server-avatar">
              ${server.iconUrl ? 
                `<img src="${server.iconUrl}" alt="${serverName}">` : 
                `<div class="server-avatar-placeholder">${AdminUtils.getInitials(serverName)}</div>`
              }
            </div>
            <div class="server-info">
              <div class="server-name">${serverName}</div>
              <div class="server-meta">
                <span class="server-owner">Owner: ${ownerName}</span>
                <span class="server-members">${memberCount} thành viên</span>
              </div>
            </div>
            <button class="admin-btn admin-btn-sm admin-btn-ghost" onclick="AdminRouter?.navigateTo('servers')">
              View
            </button>
          </div>
        `;
      }).join('');
      
    } catch (error) {
      console.error('[AdminDashboard] Failed to load top servers:', error);
      container.innerHTML = '<div class="empty-activity">Không thể tải servers</div>';
      if (badge) badge.textContent = '0';
    }
  }

  // ========================================
  // New Users Table
  // ========================================

  async function renderNewUsers() {
    const tbody = document.getElementById('dashboard-new-users');
    if (!tbody) return;
    
    try {
      // Fetch recent users
      const response = await AdminUtils.api.get(`${API.users}?size=5&sortBy=createdAt&sortDir=desc`);
      const users = response.content || [];
      
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No new users</td></tr>';
        return;
      }
      
      tbody.innerHTML = users.map(user => `
        <tr>
          <td>
            <div class="user-cell">
              <div class="user-avatar-sm" style="background: var(--admin-surface-accent); display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--admin-primary);width:32px;height:32px;border-radius:50%;">
                ${AdminUtils.getInitials(user.username)}
              </div>
              <div class="user-info">
                <span class="user-name">${user.username}</span>
                <span class="user-email">${user.email}</span>
              </div>
            </div>
          </td>
          <td>${AdminUtils.formatDate(user.createdAt)}</td>
          <td>
            <span class="admin-badge admin-badge-${getStatusClass(user)}">
              ${getStatusText(user)}
            </span>
          </td>
          <td>
            <button class="admin-btn admin-btn-sm admin-btn-ghost" data-action="view-user" data-id="${user.id}">
              View
            </button>
          </td>
        </tr>
      `).join('');
      
      // Attach view buttons
      tbody.querySelectorAll('[data-action="view-user"]').forEach(btn => {
        btn.addEventListener('click', () => {
          AdminRouter?.navigateTo('users');
        });
      });
      
    } catch (error) {
      console.error('[AdminDashboard] Failed to load users:', error);
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Failed to load users</td></tr>';
    }
  }

  function getStatusClass(user) {
    if (user.isBanned) return 'danger';
    if (user.isActive) return 'success';
    return 'warning';
  }

  function getStatusText(user) {
    if (user.isBanned) return 'Banned';
    if (user.isActive) return 'Active';
    return 'Inactive';
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
    
    // Refresh button
    const refreshBtn = document.querySelector('[data-action="refresh-dashboard"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', refresh);
    }
  }

  function handleChartRangeChange(e) {
    const btn = e.currentTarget;
    const range = btn.dataset.chartRange;
    
    // Update active state
    document.querySelectorAll('[data-chart-range]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Fetch stats for new range
    fetchStatsForRange(range);
  }

  async function fetchStatsForRange(range) {
    try {
      const stats = await AdminUtils.api.get(`${API.stats}?period=${range}`);
      console.log('[AdminDashboard] Stats for', range, stats);
      // Update charts with new data
    } catch (error) {
      console.error('[AdminDashboard] Failed to fetch stats:', error);
    }
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
        AdminUtils.showToast('Announcement feature coming soon', 'info');
        break;
      case 'system-settings':
        AdminRouter?.navigateTo('settings');
        break;
    }
  }

  // ========================================
  // Auto Refresh
  // ========================================

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshInterval = setInterval(() => {
      refresh(true); // silent refresh
    }, 60000); // every 60 seconds
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  // ========================================
  // Loading & Error States
  // ========================================

  function showLoading() {
    const container = document.getElementById('admin-content');
    if (!container) return;
    
    // Add loading class to stat cards
    container.querySelectorAll('.admin-stat-card').forEach(card => {
      card.classList.add('loading');
    });
  }

  function hideLoading() {
    const container = document.getElementById('admin-content');
    if (!container) return;
    
    container.querySelectorAll('.admin-stat-card').forEach(card => {
      card.classList.remove('loading');
    });
  }

  function showError(message) {
    AdminUtils.showToast(message, 'error');
    hideLoading();
  }

  // ========================================
  // Public API
  // ========================================

  async function refresh(silent = false) {
    if (isLoading) return;
    
    if (!silent) {
      showLoading();
    }
    
    try {
      await fetchDashboardData();
      updateStats();
      renderActivity();
      await renderNewUsers();
      
      if (!silent) {
        AdminUtils.showToast('Dashboard refreshed', 'success');
      }
    } catch (error) {
      if (!silent) {
        showError('Failed to refresh dashboard');
      }
    } finally {
      hideLoading();
    }
  }

  function destroy() {
    stopAutoRefresh();
  }

  return {
    init,
    refresh: () => refresh(false),
    destroy
  };

})();

// Expose to window for router
window.AdminDashboard = AdminDashboard;