<%-- 
  Dashboard V2 Fragment - Redesigned based on CosaFin Elite Figma
  Pure HTML fragment, no <html>/<head>/<body>
  Content for Discord-like admin: Servers, Users, Channels, Reports, Audit Log
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page dashboard-v2" data-page="dashboard">
    
    <!-- Page Header -->
    <div class="dash-header">
        <div class="dash-header-left">
            <h1 class="dash-greeting">My Dashboard</h1>
            <p class="dash-subtitle">
                <span class="dash-live-indicator">
                    <span class="dash-live-dot"></span>
                    Live Data
                </span>
            </p>
        </div>
        <div class="dash-header-right">
            <span class="dash-user-greeting">Hi <span data-admin-username>Admin</span>!</span>
            <img class="dash-user-avatar" src="${pageContext.request.contextPath}/images/default-avatar.png" alt="Admin" data-admin-avatar>
        </div>
    </div>
    
    <!-- Navigation Tabs -->
    <div class="dash-nav-tabs">
        <button class="dash-nav-tab active" data-tab="all">All</button>
        <button class="dash-nav-tab" data-tab="servers">Servers</button>
        <button class="dash-nav-tab" data-tab="users">Users</button>
        <button class="dash-nav-tab" data-tab="reports">Reports</button>
    </div>
    
    <!-- Overview Stats Cards Row -->
    <div class="dash-overview-row">
        <!-- Views Card -->
        <div class="dash-overview-card" data-stat-type="views">
            <div class="dash-overview-header">
                <span class="dash-overview-title">Views</span>
                <div class="dash-overview-icon views">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </div>
            </div>
            <div class="dash-overview-value" data-stat="pageViews">7,265</div>
            <div class="dash-overview-change positive">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span data-stat="viewsChange">+11.02%</span>
            </div>
        </div>
        
        <!-- Visits Card -->
        <div class="dash-overview-card" data-stat-type="visits">
            <div class="dash-overview-header">
                <span class="dash-overview-title">Visits</span>
                <div class="dash-overview-icon visits">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                </div>
            </div>
            <div class="dash-overview-value" data-stat="visits">3,671</div>
            <div class="dash-overview-change negative">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2V10M6 10L2 6M6 10L10 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span data-stat="visitsChange">-0.03%</span>
            </div>
        </div>
        
        <!-- New Users Card -->
        <div class="dash-overview-card" data-stat-type="newUsers">
            <div class="dash-overview-header">
                <span class="dash-overview-title">New Users</span>
                <div class="dash-overview-icon new-users">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                        <path d="M19 8v6M22 11h-6"/>
                    </svg>
                </div>
            </div>
            <div class="dash-overview-value" data-stat="newUsers">156</div>
            <div class="dash-overview-change positive">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span data-stat="newUsersChange">+15.03%</span>
            </div>
        </div>
        
        <!-- Active Users Card -->
        <div class="dash-overview-card" data-stat-type="activeUsers">
            <div class="dash-overview-header">
                <span class="dash-overview-title">Active Users</span>
                <div class="dash-overview-icon active-users">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                </div>
            </div>
            <div class="dash-overview-value" data-stat="activeUsers24h">2,318</div>
            <div class="dash-overview-change positive">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span data-stat="activeUsersChange">+6.08%</span>
            </div>
        </div>
    </div>
    
    <!-- Main Grid -->
    <div class="dash-grid">
        
        <!-- Left Column -->
        <div class="dash-col-left">
            
            <!-- Activity Chart Card -->
            <div class="dash-card">
                <div class="dash-card-header">
                    <h3 class="dash-card-title">Server Activity</h3>
                    <button class="dash-view-all" data-admin-nav data-page="stats">
                        View all
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 10h10M10 5l5 5-5 5"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Bar Chart -->
                <div class="dash-chart">
                    <div class="dash-chart-y-axis">
                        <span>3.0k</span>
                        <span>2.5k</span>
                        <span>2.0k</span>
                        <span>1.5k</span>
                        <span>1.0k</span>
                        <span>0</span>
                    </div>
                    <div class="dash-chart-bars" id="dash-activity-chart">
                        <div class="dash-bar-wrapper">
                            <div class="dash-bar-tooltip">+280 users</div>
                            <div class="dash-bar" style="height: 63%;" data-value="1890"></div>
                            <span class="dash-bar-label">Mon</span>
                        </div>
                        <div class="dash-bar-wrapper">
                            <div class="dash-bar-tooltip">+150 users</div>
                            <div class="dash-bar" style="height: 42%;" data-value="1260"></div>
                            <span class="dash-bar-label">Tue</span>
                        </div>
                        <div class="dash-bar-wrapper">
                            <div class="dash-bar-tooltip">+320 users</div>
                            <div class="dash-bar" style="height: 56%;" data-value="1680"></div>
                            <span class="dash-bar-label">Wed</span>
                        </div>
                        <div class="dash-bar-wrapper">
                            <div class="dash-bar-tooltip">+190 users</div>
                            <div class="dash-bar" style="height: 50%;" data-value="1500"></div>
                            <span class="dash-bar-label">Thu</span>
                        </div>
                        <div class="dash-bar-wrapper">
                            <div class="dash-bar-tooltip">+450 users</div>
                            <div class="dash-bar highlight" style="height: 70%;" data-value="2100"></div>
                            <span class="dash-bar-label">Fri</span>
                        </div>
                        <div class="dash-bar-wrapper">
                            <div class="dash-bar-tooltip">+380 users</div>
                            <div class="dash-bar" style="height: 60%;" data-value="1800"></div>
                            <span class="dash-bar-label">Sat</span>
                        </div>
                        <div class="dash-bar-wrapper">
                            <div class="dash-bar-tooltip">+520 users</div>
                            <div class="dash-bar" style="height: 68%;" data-value="2040"></div>
                            <span class="dash-bar-label">Sun</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Bottom Row: Donut Chart + Stats -->
            <div class="dash-grid" style="grid-template-columns: 1fr 1.5fr;">
                
                <!-- Resource Distribution (Donut Chart) -->
                <div class="dash-card dash-card-sm">
                    <div class="dash-card-header">
                        <h3 class="dash-card-title">Resources</h3>
                        <button class="dash-view-all">
                            View all
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 10h10M10 5l5 5-5 5"/>
                            </svg>
                        </button>
                    </div>
                    <div class="dash-donut-wrapper">
                        <div class="dash-donut">
                            <svg class="dash-donut-svg" viewBox="0 0 120 120">
                                <circle class="dash-donut-circle dash-donut-bg" cx="60" cy="60" r="52"/>
                                <circle class="dash-donut-circle dash-donut-progress" cx="60" cy="60" r="52" 
                                        stroke-dasharray="252 327" data-progress="77"/>
                            </svg>
                            <div class="dash-donut-center" data-donut-value>77%</div>
                        </div>
                        <div class="dash-donut-legend">
                            <div class="dash-legend-item">
                                <span class="dash-legend-dot servers"></span>
                                <span>Servers</span>
                            </div>
                            <div class="dash-legend-item">
                                <span class="dash-legend-dot users"></span>
                                <span>Users</span>
                            </div>
                            <div class="dash-legend-item">
                                <span class="dash-legend-dot channels"></span>
                                <span>Channels</span>
                            </div>
                            <div class="dash-legend-item">
                                <span class="dash-legend-dot messages"></span>
                                <span>Messages</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stats: Active Users & Pending Reports -->
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="dash-card dash-card-sm">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="flex: 1;">
                                <div class="dash-stat-label">Active Users</div>
                                <div class="dash-stat-value" data-stat="activeUsers">4,585</div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; color: var(--dash-success);">
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M7.5 12V3M7.5 3L3 7.5M7.5 3L12 7.5"/>
                                </svg>
                            </div>
                            <div style="width: 1px; height: 60px; background: rgba(255,255,255,0.1);"></div>
                            <div class="dash-stat-desc" style="flex: 1.2;">
                                Monitor your active users regularly to track engagement and growth patterns.
                            </div>
                        </div>
                    </div>
                    
                    <div class="dash-card dash-card-sm">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="flex: 1;">
                                <div class="dash-stat-label">Pending Reports</div>
                                <div class="dash-stat-value" data-stat="pendingReports" style="color: var(--dash-warning);">23</div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; color: var(--dash-danger);">
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(180deg);">
                                    <path d="M7.5 12V3M7.5 3L3 7.5M7.5 3L12 7.5"/>
                                </svg>
                            </div>
                            <div style="width: 1px; height: 60px; background: rgba(255,255,255,0.1);"></div>
                            <div class="dash-stat-desc" style="flex: 1.2;">
                                Review pending reports daily to maintain community safety and trust.
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
            
        </div>
        
        <!-- Right Column -->
        <div class="dash-col-right">
            
            <!-- Summary Card (Credit Card Style) -->
            <div class="dash-card" style="padding: 24px;">
                <div class="dash-card-header">
                    <h3 class="dash-card-title">Platform Overview</h3>
                    <button class="dash-view-all" data-admin-nav data-page="stats">
                        View all
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 10h10M10 5l5 5-5 5"/>
                        </svg>
                    </button>
                </div>
                
                <div class="dash-summary-card">
                    <button class="dash-summary-add" title="Quick Action">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 4v12M4 10h12"/>
                        </svg>
                    </button>
                    <div class="dash-summary-content">
                        <div class="dash-summary-label">Total Servers</div>
                        <div class="dash-summary-value" data-stat="totalServers">12,456</div>
                        <div class="dash-summary-meta">
                            <span data-stat="activeServers">10,234 active</span>
                            <span>•</span>
                            <span data-stat="newServersToday">+128 today</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Activity (Transactions Style) -->
            <div class="dash-transactions-card">
                <div class="dash-transactions-header">
                    <h3 class="dash-transactions-title">Recent Activity</h3>
                    <button class="dash-view-all" data-admin-nav data-page="audit">
                        View all
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 10h10M10 5l5 5-5 5"/>
                        </svg>
                    </button>
                </div>
                
                <div class="dash-transactions-list" id="dash-recent-activity">
                    <!-- Server Created -->
                    <div class="dash-transaction-item" data-activity-type="server">
                        <div class="dash-transaction-icon server">
                            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="14" height="5" rx="1"/>
                                <rect x="3" y="12" width="14" height="5" rx="1"/>
                            </svg>
                        </div>
                        <div class="dash-transaction-info">
                            <div class="dash-transaction-name">New Server</div>
                            <div class="dash-transaction-detail">Gaming Community created</div>
                        </div>
                        <div class="dash-transaction-value positive">+1</div>
                    </div>
                    
                    <!-- User Joined -->
                    <div class="dash-transaction-item" data-activity-type="user">
                        <div class="dash-transaction-icon user">
                            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="10" cy="6" r="3"/>
                                <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                            </svg>
                        </div>
                        <div class="dash-transaction-info">
                            <div class="dash-transaction-name">User Registered</div>
                            <div class="dash-transaction-detail">john_doe@email.com</div>
                        </div>
                        <div class="dash-transaction-value positive">+1</div>
                    </div>
                    
                    <!-- Report Filed -->
                    <div class="dash-transaction-item" data-activity-type="report">
                        <div class="dash-transaction-icon report">
                            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M10 2L2 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-5z"/>
                                <path d="M10 10v4M10 6v2"/>
                            </svg>
                        </div>
                        <div class="dash-transaction-info">
                            <div class="dash-transaction-name">Report Filed</div>
                            <div class="dash-transaction-detail">Spam content reported</div>
                        </div>
                        <div class="dash-transaction-value warning">+1</div>
                    </div>
                    
                    <!-- Channel Created -->
                    <div class="dash-transaction-item" data-activity-type="channel">
                        <div class="dash-transaction-icon channel">
                            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M7 3v14M13 3v14M3 7h14M3 13h14"/>
                            </svg>
                        </div>
                        <div class="dash-transaction-info">
                            <div class="dash-transaction-name">Channel Created</div>
                            <div class="dash-transaction-detail">#general in Tech Hub</div>
                        </div>
                        <div class="dash-transaction-value positive">+1</div>
                    </div>
                    
                    <!-- Audit Log Entry -->
                    <div class="dash-transaction-item" data-activity-type="audit">
                        <div class="dash-transaction-icon audit">
                            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M4 4h12v14H4z"/>
                                <path d="M7 8h6M7 11h6M7 14h4"/>
                            </svg>
                        </div>
                        <div class="dash-transaction-info">
                            <div class="dash-transaction-name">Admin Action</div>
                            <div class="dash-transaction-detail">User banned by moderator</div>
                        </div>
                        <div class="dash-transaction-value negative">-1</div>
                    </div>
                </div>
            </div>
            
        </div>
        
    </div>
    
</div>
