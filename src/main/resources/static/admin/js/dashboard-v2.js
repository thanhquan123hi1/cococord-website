/**
 * CoCoCord Admin Dashboard V2 - JavaScript Module
 * Realtime updates via WebSocket, animations, data fetching
 */

var DashboardV2 = window.DashboardV2 || (function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  
  const CONFIG = {
    apiBase: '/api/admin',
    wsEndpoint: '/ws',
    refreshInterval: 30000, // 30 seconds
    animationDuration: 300
  };

  // State
  let stompClient = null;
  let isConnected = false;
  let refreshTimer = null;
  let currentTab = 'all';

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[DashboardV2] Initializing...');
    
    // Setup UI interactions
    setupNavTabs();
    setupViewAllButtons();
    setupQuickActions();
    
    // Initialize animations
    animateOnLoad();
    
    // Connect WebSocket for realtime updates
    connectWebSocket();
    
    // Fetch initial data
    fetchDashboardData();
    
    // Setup auto-refresh
    startAutoRefresh();
    
    // Initialize New Users Chart
    if (window.AdminNewUsersChart) {
      AdminNewUsersChart.init();
    }
    
    console.log('[DashboardV2] Initialized successfully');
  }

  // ========================================
  // WebSocket Connection
  // ========================================

  function connectWebSocket() {
    const token = getAuthToken();
    if (!token) {
      console.warn('[DashboardV2] No auth token, skipping WebSocket');
      return;
    }

    try {
      const socket = new SockJS(CONFIG.wsEndpoint);
      stompClient = Stomp.over(socket);
      stompClient.debug = null; // Disable debug logs

      stompClient.connect(
        { Authorization: `Bearer ${token}` },
        onConnected,
        onError
      );
    } catch (err) {
      console.error('[DashboardV2] WebSocket connection error:', err);
    }
  }

  function onConnected() {
    isConnected = true;
    console.log('[DashboardV2] WebSocket connected');
    updateLiveIndicator(true);

    // Subscribe to admin events
    stompClient.subscribe('/topic/admin/stats', onStatsUpdate);
    stompClient.subscribe('/topic/admin/activity', onActivityUpdate);
  }

  function onError(error) {
    isConnected = false;
    console.error('[DashboardV2] WebSocket error:', error);
    updateLiveIndicator(false);
    
    // Retry connection after 5 seconds
    setTimeout(connectWebSocket, 5000);
  }

  function onStatsUpdate(message) {
    try {
      const data = JSON.parse(message.body);
      updateStats(data);
    } catch (err) {
      console.error('[DashboardV2] Error parsing stats update:', err);
    }
  }

  function onActivityUpdate(message) {
    try {
      const data = JSON.parse(message.body);
      addActivityItem(data);
    } catch (err) {
      console.error('[DashboardV2] Error parsing activity update:', err);
    }
  }

  // ========================================
  // Data Fetching
  // ========================================

  function getAuthToken() {
    return localStorage.getItem('accessToken') || 
           document.cookie.match(/accessToken=([^;]+)/)?.[1] || 
           null;
  }

  async function fetchDashboardData() {
    const token = getAuthToken();
    if (!token) {
      console.warn('[DashboardV2] No auth token');
      return;
    }

    try {
      // Fetch overview stats (KPI cards) from new endpoint
      const overviewResponse = await fetch(`${CONFIG.apiBase}/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        console.log('[DashboardV2] Overview data received:', overviewData);
        updateOverviewKPIs(overviewData);
      } else {
        console.error('[DashboardV2] Overview API failed:', overviewResponse.status);
      }
      
      // Fetch summary data (platform overview, resources, charts)
      const summaryResponse = await fetch(`${CONFIG.apiBase}/dashboard/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (summaryResponse.ok) {
        const data = await summaryResponse.json();
        updateDashboardFromAPI(data);
      }

      // Fetch recent activity
      const activityResponse = await fetch(`${CONFIG.apiBase}/audit?page=0&size=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        updateRecentActivity(activityData);
      }
      
      // Fetch pending reports
      const reportsResponse = await fetch(`${CONFIG.apiBase}/reports?status=PENDING&page=0&size=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        updatePendingReports(reportsData);
      }
      
      // Fetch top servers
      const serversResponse = await fetch(`${CONFIG.apiBase}/servers?page=0&size=5&sort=memberCount,desc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (serversResponse.ok) {
        const serversData = await serversResponse.json();
        updateTopServers(serversData);
      }
    } catch (err) {
      console.error('[DashboardV2] Error fetching dashboard data:', err);
    }
  }
  
  function updateOverviewKPIs(data) {
    console.log('[DashboardV2] updateOverviewKPIs called with:', data);
    // Update all KPI cards with guaranteed non-null values
    const totalMessages = data.totalMessages ?? 0;
    const totalUsers = data.totalUsers ?? 0;
    const newUsersLast7Days = data.newUsersLast7Days ?? 0;
    const onlineUsers = data.onlineUsers ?? 0;
    
    console.log('[DashboardV2] Extracted values:', {
      totalMessages, totalUsers, newUsersLast7Days, onlineUsers
    });
    
    updateStatElement('totalMessages', formatNumber(totalMessages));
    updateStatElement('totalUsers', formatNumber(totalUsers));
    updateStatElement('newUsersLast7Days', formatNumber(newUsersLast7Days));
    updateStatElement('onlineUsers', formatNumber(onlineUsers));
    
    // Update growth indicators with safe values
    const growth = data.growth || {};
    const messagesGrowth = growth.messages ?? 0;
    const usersGrowth = growth.users ?? 0;
    const newUsersGrowth = growth.newUsers ?? 0;
    
    updateGrowthElement('messagesGrowth', messagesGrowth, 'so với tuần trước');
    updateGrowthElement('usersGrowth', usersGrowth, 'so với tuần trước');
    updateGrowthElement('newUsersGrowth', newUsersGrowth, 'so với 7 ngày trước');
    
    // Calculate and display active users percentage
    const activePercent = totalUsers > 0 
        ? Math.round((onlineUsers / totalUsers) * 100) 
        : 0;
    updateStatElement('activeUsersPercent', `${activePercent}% tổng số người dùng`);
  }

  function updateDashboardFromAPI(data) {
    // Platform Overview
    updateStatElement('totalChannels', formatNumber(data.totalChannels ?? 0));
    updateStatElement('totalServers', formatNumber(data.totalServers ?? 0));
    updateStatElement('activeServers', formatNumber(data.activeServers ?? 0));
    updateStatElement('lockedServers', formatNumber(data.lockedServers ?? 0));
    
    // Resources
    updateStatElement('bannedUsers', formatNumber(data.bannedUsers ?? 0));
    updateStatElement('suspendedServers', formatNumber(data.suspendedServers ?? 0));
    updateStatElement('newServersToday', formatNumber(data.newServersToday ?? 0));
    updateStatElement('activeUsers24h', formatNumber(data.activeUsers24h ?? 0));
    updateStatElement('pendingReports', data.pendingReports ?? 0);
    updateStatElement('activityCount', data.recentActivity?.length ?? 0);
    
    // Update percentage bars with safe calculations
    const totalUsers = data.totalUsers ?? 1; // Avoid division by zero
    const totalServers = data.totalServers ?? 1;
    
    updateResourceBar('bannedUsersPercent', data.bannedUsers ?? 0, totalUsers);
    updateResourceBar('suspendedServersPercent', data.suspendedServers ?? 0, totalServers);
    updateResourceBar('newServersTodayPercent', data.newServersToday ?? 0, totalServers, 20);
    updateResourceBar('activeUsers24hPercent', data.activeUsers24h ?? 0, totalUsers);
    
    // Update Server Activity Chart
    if (data.serverActivityChart && data.serverActivityChart.length > 0) {
      updateServerActivityChart(data.serverActivityChart);
    }
  }
  
  function updateGrowthElement(statKey, value, suffix) {
    const el = document.querySelector(`[data-stat="${statKey}"]`);
    if (el) {
      const sign = value >= 0 ? '+' : '';
      el.textContent = `${sign}${value.toFixed(1)}% ${suffix}`;
      
      // Update parent delta class
      const delta = el.closest('.delta');
      if (delta) {
        delta.classList.remove('up', 'down');
        delta.classList.add(value >= 0 ? 'up' : 'down');
        
        // Update SVG direction
        const svg = delta.querySelector('svg path');
        if (svg) {
          svg.setAttribute('d', value >= 0 
              ? 'M6 9V3m0 0L3 6m3-3l3 3' 
              : 'M6 3v6m0 0l3-3m-3 3L3 6');
        }
      }
    }
  }
  
  function updateResourceBar(statKey, value, total, maxPercent = 100) {
    const el = document.querySelector(`[data-stat="${statKey}"]`);
    if (el && total > 0) {
      let percent = Math.round((value / total) * 100);
      percent = Math.min(percent, maxPercent);
      percent = Math.max(percent, 1); // At least 1% for visibility
      el.style.width = `${percent}%`;
    }
  }
  
  function updateServerActivityChart(chartData) {
    const canvas = document.getElementById('serverActivityChart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    // Destroy existing chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const labels = chartData.map(d => d.dayLabel);
    const messagesData = chartData.map(d => d.messageCount);
    const userJoinsData = chartData.map(d => d.userJoins);
    
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tin nhắn',
            data: messagesData,
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 4
          },
          {
            label: 'Người dùng mới',
            data: userJoinsData,
            backgroundColor: 'rgba(236, 72, 153, 0.8)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              callback: function(value) {
                return formatCompactNumber(value);
              }
            }
          }
        }
      }
    });
  }
  
  function updateRecentActivity(data) {
    const container = document.getElementById('activity-list');
    if (!container) return;
    
    if (!data || !data.content || data.content.length === 0) {
      container.innerHTML = '<div class="no-data">Chưa có hoạt động nào</div>';
      return;
    }
    
    container.innerHTML = data.content.map(audit => createActivityItemFromAudit(audit)).join('');
  }
  
  function createActivityItemFromAudit(audit) {
    const actionText = formatActionTypeVi(audit.actionType);
    const timeAgo = formatTimeAgo(audit.createdAt);
    const initials = getInitials(audit.actor?.username || 'SYS');
    
    return `
      <div class="activity-item">
        <div class="avatar">${initials}</div>
        <div class="activity-content">
          <div class="activity-text">
            <strong>${escapeHtml(audit.actor?.username || 'Hệ thống')}</strong> 
            ${actionText}
            ${audit.targetName ? `<strong>${escapeHtml(audit.targetName)}</strong>` : ''}
          </div>
          <div class="activity-time">${timeAgo}</div>
        </div>
      </div>
    `;
  }
  
  function formatActionTypeVi(actionType) {
    const actionMap = {
      'USER_CREATED': 'đã tạo người dùng',
      'USER_UPDATED': 'đã cập nhật người dùng',
      'USER_BANNED': 'đã cấm người dùng',
      'USER_UNBANNED': 'đã gỡ cấm người dùng',
      'USER_DELETED': 'đã xóa người dùng',
      'USER_REGISTERED': 'đã đăng ký',
      'SERVER_CREATED': 'đã tạo server',
      'SERVER_UPDATED': 'đã cập nhật server',
      'SERVER_DELETED': 'đã xóa server',
      'SERVER_LOCKED': 'đã khóa server',
      'SERVER_UNLOCKED': 'đã mở khóa server',
      'REPORT_RESOLVED': 'đã xử lý báo cáo',
      'REPORT_DISMISSED': 'đã bỏ qua báo cáo',
      'SETTINGS_UPDATED': 'đã cập nhật cài đặt'
    };
    return actionMap[actionType] || 'đã thực hiện thao tác';
  }
  
  function updatePendingReports(data) {
    const container = document.getElementById('reports-list');
    if (!container) return;
    
    if (!data || !data.content || data.content.length === 0) {
      container.innerHTML = '<div class="no-data">Không có báo cáo đang chờ</div>';
      return;
    }
    
    container.innerHTML = data.content.map(report => `
      <div class="report-item">
        <div class="report-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="report-content">
          <div class="report-reason">${escapeHtml(report.reason || 'Không có lý do')}</div>
          <div class="report-meta">
            <span>Báo cáo bởi ${escapeHtml(report.reporter?.username || 'Ẩn danh')}</span>
            <span>${formatTimeAgo(report.createdAt)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  function updateTopServers(data) {
    const container = document.getElementById('top-servers-list');
    if (!container) return;
    
    if (!data || !data.content || data.content.length === 0) {
      container.innerHTML = '<div class="no-data">Chưa có server nào</div>';
      return;
    }
    
    container.innerHTML = data.content.map(server => `
      <div class="list-item">
        <div class="avatar">${getInitials(server.name)}</div>
        <div class="meta">
          <div class="name">${escapeHtml(server.name)}</div>
          <div class="sub">${formatNumber(server.memberCount || 0)} thành viên</div>
        </div>
        <span class="badge badge-${server.isLocked ? 'warning' : 'success'}">
          ${server.isLocked ? 'Bị khóa' : 'Hoạt động'}
        </span>
      </div>
    `).join('');
  }
  
  function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
  
  function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  }
  
  function formatCompactNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  }

  // ========================================
  // Overview Cards Update
  // ========================================

  function updateOverviewStats(data) {
    // Calculate percentage changes (these could come from API in the future)
    const changes = {
      pageViews: { value: data.messagesToday || 7265, change: '+11.02%' },
      visits: { value: data.totalUsers || 3671, change: '-0.03%' },
      newUsers: { value: calculateNewUsers(data), change: '+15.03%' },
      activeUsers24h: { value: data.activeUsers24h || 2318, change: '+6.08%' }
    };

    // Update Views card
    updateStatElement('pageViews', formatNumber(changes.pageViews.value));
    updateStatElement('viewsChange', changes.pageViews.change);
    updateChangeClass('viewsChange', changes.pageViews.change);

    // Update Visits card  
    updateStatElement('visits', formatNumber(changes.visits.value));
    updateStatElement('visitsChange', changes.visits.change);
    updateChangeClass('visitsChange', changes.visits.change);

    // Update New Users card
    updateStatElement('newUsers', formatNumber(changes.newUsers.value));
    updateStatElement('newUsersChange', changes.newUsers.change);
    updateChangeClass('newUsersChange', changes.newUsers.change);

    // Update Active Users card
    updateStatElement('activeUsers24h', formatNumber(changes.activeUsers24h.value));
    updateStatElement('activeUsersChange', changes.activeUsers24h.change);
    updateChangeClass('activeUsersChange', changes.activeUsers24h.change);

    // Also update legacy stats
    updateStats(data);
  }

  function calculateNewUsers(data) {
    // This could be a real calculation based on API data
    // For now use newUsersToday if available, or estimate
    return data.newUsersToday || Math.floor((data.activeUsers24h || 2318) * 0.067);
  }

  function updateStatElement(statKey, value) {
    const el = document.querySelector(`[data-stat="${statKey}"]`);
    console.log(`[DashboardV2] updateStatElement: ${statKey} = ${value}, element found:`, !!el);
    if (el && el.textContent !== value) {
      el.textContent = value;
      el.classList.add('dash-value-update');
      setTimeout(() => el.classList.remove('dash-value-update'), 500);
    }
  }

  function updateChangeClass(statKey, changeValue) {
    const el = document.querySelector(`[data-stat="${statKey}"]`);
    if (el) {
      const parent = el.closest('.dash-overview-change');
      if (parent) {
        parent.classList.remove('positive', 'negative');
        if (changeValue.startsWith('+')) {
          parent.classList.add('positive');
        } else if (changeValue.startsWith('-')) {
          parent.classList.add('negative');
        }
      }
    }
  }

  function updateSummaryCard(data) {
    updateStatElement('totalServers', formatNumber(data.totalServers || 0));
    updateStatElement('activeServers', `${formatNumber(data.activeServers || 0)} active`);
    updateStatElement('newServersToday', `+${data.newServersToday || 0} today`);
  }

  function updateChartFromStats(data) {
    if (!data || !data.messageStats) return;
    
    const bars = document.querySelectorAll('.dash-bar');
    const tooltips = document.querySelectorAll('.dash-bar-tooltip');
    const dailyCounts = data.messageStats.dailyCounts || [];
    
    // Find max value for scaling
    const maxValue = Math.max(...dailyCounts, 3000);
    
    dailyCounts.forEach((value, index) => {
      if (bars[index]) {
        const percentage = (value / maxValue) * 100;
        bars[index].style.height = `${Math.min(percentage, 100)}%`;
        bars[index].dataset.value = value;
        
        // Highlight the highest bar
        if (value === Math.max(...dailyCounts)) {
          bars[index].classList.add('highlight');
        } else {
          bars[index].classList.remove('highlight');
        }
      }
      if (tooltips[index]) {
        tooltips[index].textContent = `${formatNumber(value)} messages`;
      }
    });

    // Update Y-axis labels
    updateYAxisLabels(maxValue);
  }

  function updateYAxisLabels(maxValue) {
    const yAxis = document.querySelector('.dash-chart-y-axis');
    if (yAxis) {
      const labels = yAxis.querySelectorAll('span');
      const steps = [1, 0.83, 0.67, 0.5, 0.33, 0];
      labels.forEach((label, index) => {
        const value = Math.round(maxValue * steps[index]);
        label.textContent = formatCompactNumber(value);
      });
    }
  }

  function updateDonutChart(data) {
    if (!data) return;
    
    // Calculate resource distribution
    const totalUsers = data.userStats?.totalUsers || 0;
    const totalServers = data.serverStats?.totalServers || 0;
    const totalChannels = data.serverStats?.totalChannels || 0;
    const totalMessages = data.messageStats?.totalMessages || 0;
    
    const total = totalUsers + totalServers + totalChannels + (totalMessages / 1000);
    if (total === 0) return;
    
    const serverPercent = Math.round((totalServers / total) * 100);
    
    // Update donut progress
    const donutProgress = document.querySelector('.dash-donut-progress');
    const donutValue = document.querySelector('[data-donut-value]');
    
    if (donutProgress) {
      const circumference = 327; // 2 * PI * 52
      const offset = circumference - (serverPercent / 100 * circumference);
      donutProgress.setAttribute('stroke-dasharray', `${circumference - offset} ${circumference}`);
      donutProgress.dataset.progress = serverPercent;
    }
    
    if (donutValue) {
      donutValue.textContent = `${serverPercent}%`;
    }
  }

  function updateActivityFromAudit(data) {
    if (!data || !data.content) return;
    
    const container = document.getElementById('dash-recent-activity');
    if (!container) return;
    
    const activities = data.content.map(audit => ({
      type: mapAuditTypeToActivityType(audit.actionType),
      title: formatAuditTitle(audit),
      detail: audit.details || audit.targetId || '',
      change: audit.actionType?.includes('DELETE') ? -1 : 1
    }));
    
    container.innerHTML = activities.map(activity => createActivityItem(activity)).join('');
  }

  function mapAuditTypeToActivityType(actionType) {
    if (!actionType) return 'audit';
    if (actionType.includes('SERVER')) return 'server';
    if (actionType.includes('USER')) return 'user';
    if (actionType.includes('CHANNEL')) return 'channel';
    if (actionType.includes('REPORT')) return 'report';
    return 'audit';
  }

  function formatAuditTitle(audit) {
    const action = audit.actionType?.replace(/_/g, ' ').toLowerCase() || 'action';
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  function formatCompactNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  }

  // ========================================
  // UI Updates
  // ========================================

  function updateStats(data) {
    const statElements = {
      'totalUsers': data.totalUsers,
      'totalServers': data.totalServers,
      'activeServers': data.activeServers ? `${formatNumber(data.activeServers)} active` : null,
      'newServersToday': data.newServersToday ? `+${data.newServersToday} today` : null,
      'activeUsers': data.activeUsers,
      'pendingReports': data.pendingReports,
      'messagesToday': data.messagesToday
    };

    Object.entries(statElements).forEach(([key, value]) => {
      if (value === null) return;
      
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) {
        const formattedValue = typeof value === 'number' ? formatNumber(value) : value;
        if (el.textContent !== formattedValue) {
          el.textContent = formattedValue;
          el.classList.add('dash-value-update');
          setTimeout(() => el.classList.remove('dash-value-update'), 500);
        }
      }
    });
  }

  function updateChart(chartData) {
    if (!chartData) return;
    
    const bars = document.querySelectorAll('.dash-bar');
    const tooltips = document.querySelectorAll('.dash-bar-tooltip');
    
    chartData.forEach((value, index) => {
      if (bars[index]) {
        const percentage = (value / 3000) * 100;
        bars[index].style.height = `${Math.min(percentage, 100)}%`;
        bars[index].dataset.value = value;
      }
      if (tooltips[index]) {
        tooltips[index].textContent = `+${formatNumber(value)} users`;
      }
    });
  }

  function updateActivity(activities) {
    if (!activities || !activities.length) return;
    
    const container = document.getElementById('dash-recent-activity');
    if (!container) return;
    
    container.innerHTML = activities.map(activity => createActivityItem(activity)).join('');
  }

  function addActivityItem(activity) {
    const container = document.getElementById('dash-recent-activity');
    if (!container) return;
    
    const item = document.createElement('div');
    item.innerHTML = createActivityItem(activity);
    const newItem = item.firstElementChild;
    newItem.style.opacity = '0';
    newItem.style.transform = 'translateY(-10px)';
    
    container.insertBefore(newItem, container.firstChild);
    
    // Animate in
    requestAnimationFrame(() => {
      newItem.style.transition = 'all 0.3s ease';
      newItem.style.opacity = '1';
      newItem.style.transform = 'translateY(0)';
    });
    
    // Remove oldest if more than 5
    const items = container.querySelectorAll('.dash-transaction-item');
    if (items.length > 5) {
      const last = items[items.length - 1];
      last.style.opacity = '0';
      setTimeout(() => last.remove(), 300);
    }
  }

  function createActivityItem(activity) {
    const iconMap = {
      server: `<svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="14" height="5" rx="1"/>
                <rect x="3" y="12" width="14" height="5" rx="1"/>
              </svg>`,
      user: `<svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="10" cy="6" r="3"/>
              <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
            </svg>`,
      report: `<svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M10 2L2 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-5z"/>
                <path d="M10 10v4M10 6v2"/>
              </svg>`,
      channel: `<svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M7 3v14M13 3v14M3 7h14M3 13h14"/>
              </svg>`,
      audit: `<svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 4h12v14H4z"/>
              <path d="M7 8h6M7 11h6M7 14h4"/>
            </svg>`
    };

    const valueClass = activity.change > 0 ? 'positive' : activity.change < 0 ? 'negative' : 'warning';
    const valueText = activity.change > 0 ? `+${activity.change}` : activity.change;

    return `
      <div class="dash-transaction-item" data-activity-type="${activity.type}">
        <div class="dash-transaction-icon ${activity.type}">
          ${iconMap[activity.type] || iconMap.audit}
        </div>
        <div class="dash-transaction-info">
          <div class="dash-transaction-name">${escapeHtml(activity.title)}</div>
          <div class="dash-transaction-detail">${escapeHtml(activity.detail)}</div>
        </div>
        <div class="dash-transaction-value ${valueClass}">${valueText}</div>
      </div>
    `;
  }

  function updateLiveIndicator(isLive) {
    const indicator = document.querySelector('.dash-live-indicator');
    if (indicator) {
      indicator.style.color = isLive ? 'var(--dash-success)' : 'var(--dash-warning)';
      const dot = indicator.querySelector('.dash-live-dot');
      if (dot) {
        dot.style.background = isLive ? 'var(--dash-success)' : 'var(--dash-warning)';
        dot.style.animation = isLive ? 'dash-pulse 2s infinite' : 'none';
      }
    }
  }

  // ========================================
  // UI Interactions
  // ========================================

  function setupNavTabs() {
    const tabs = document.querySelectorAll('.dash-nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        filterContent(currentTab);
      });
    });
  }

  function filterContent(tab) {
    const activityItems = document.querySelectorAll('.dash-transaction-item');
    activityItems.forEach(item => {
      const type = item.dataset.activityType;
      const shouldShow = tab === 'all' || 
                         (tab === 'servers' && type === 'server') ||
                         (tab === 'users' && type === 'user') ||
                         (tab === 'reports' && type === 'report');
      
      item.style.display = shouldShow ? 'flex' : 'none';
    });
  }

  function setupViewAllButtons() {
    // View all buttons navigate using admin router
    document.querySelectorAll('.dash-view-all[data-admin-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = btn.dataset.page;
        if (page && typeof AdminRouter !== 'undefined') {
          AdminRouter.navigate(page);
        }
      });
    });
  }

  function setupQuickActions() {
    const summaryAddBtn = document.querySelector('.dash-summary-add');
    if (summaryAddBtn) {
      summaryAddBtn.addEventListener('click', () => {
        // Could open a quick action modal
        if (typeof AdminRouter !== 'undefined') {
          AdminRouter.navigate('servers');
        }
      });
    }
  }

  // ========================================
  // Animations
  // ========================================

  function animateOnLoad() {
    // Animate donut chart
    setTimeout(() => {
      const donutProgress = document.querySelector('.dash-donut-progress');
      if (donutProgress) {
        const progress = parseInt(donutProgress.dataset.progress) || 77;
        const circumference = 2 * Math.PI * 52; // r=52
        const dashArray = (progress / 100) * circumference;
        donutProgress.style.strokeDasharray = `${dashArray} ${circumference}`;
      }
    }, 500);
  }

  // ========================================
  // Auto Refresh
  // ========================================

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(fetchDashboardData, CONFIG.refreshInterval);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // ========================================
  // Utility Functions
  // ========================================

  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========================================
  // Cleanup
  // ========================================

  function destroy() {
    stopAutoRefresh();
    if (stompClient && isConnected) {
      stompClient.disconnect();
    }
    // Destroy New Users Chart
    if (window.AdminNewUsersChart) {
      AdminNewUsersChart.destroy();
    }
    console.log('[DashboardV2] Destroyed');
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init: init,
    destroy: destroy,
    refresh: fetchDashboardData,
    filterContent: filterContent
  };
})(); // Close IIFE

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Only init if we're on the dashboard page
  const dashboardPage = document.querySelector('.admin-page.dashboard-v2');
  if (dashboardPage) {
    DashboardV2.init();
  }
});

// Re-initialize when navigated to dashboard (SPA pattern)
document.addEventListener('admin:page-loaded', function(e) {
  if (e.detail && e.detail.page === 'dashboard') {
    DashboardV2.init();
  }
});
