<%-- Dashboard Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="dashboard">
    <!-- Page Header -->
    <div class="admin-page-header">
        <h1 class="admin-page-title">Dashboard Overview</h1>
        <p class="admin-page-subtitle">Welcome back, Admin! Here's what's happening today.</p>
    </div>

    <!-- Stats Cards Row -->
    <div class="admin-stats-row">
        <div class="admin-stat-card">
            <div class="stat-icon stat-icon-blue">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="10" cy="6" r="3"/>
                    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Total Users</div>
                <div class="stat-value" data-stat="totalUsers">--</div>
                <div class="stat-change positive">
                    <span class="change-icon">↑</span>
                    <span data-stat="usersGrowth">+0%</span> this week
                </div>
            </div>
        </div>

        <div class="admin-stat-card">
            <div class="stat-icon stat-icon-green">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="14" height="5" rx="1"/>
                    <rect x="3" y="12" width="14" height="5" rx="1"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Active Servers</div>
                <div class="stat-value" data-stat="totalServers">--</div>
                <div class="stat-change positive">
                    <span class="change-icon">↑</span>
                    <span data-stat="serversGrowth">+0%</span> this week
                </div>
            </div>
        </div>

        <div class="admin-stat-card">
            <div class="stat-icon stat-icon-purple">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 4h14c1 0 2 1 2 2v8c0 1-1 2-2 2H5l-4 3v-3c0-1 1-2 2-2"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Messages Today</div>
                <div class="stat-value" data-stat="messagesToday">--</div>
                <div class="stat-change positive">
                    <span class="change-icon">↑</span>
                    <span data-stat="messagesGrowth">+0%</span> vs yesterday
                </div>
            </div>
        </div>

        <div class="admin-stat-card">
            <div class="stat-icon stat-icon-orange">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M10 2L2 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-5z"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Pending Reports</div>
                <div class="stat-value" data-stat="pendingReports">--</div>
                <div class="stat-change warning">
                    <span data-stat="reportsInfo">Needs review</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div class="admin-grid admin-grid-2">
        <!-- Recent Activity -->
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">Recent Activity</h3>
                <button class="admin-btn admin-btn-sm admin-btn-ghost" type="button">View All</button>
            </div>
            <div class="admin-card-body">
                <div class="activity-list" id="dashboard-activity">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">Quick Actions</h3>
            </div>
            <div class="admin-card-body">
                <div class="quick-actions-grid">
                    <button class="quick-action-btn" data-action="create-user">
                        <span class="quick-action-icon">👤</span>
                        <span>Add User</span>
                    </button>
                    <button class="quick-action-btn" data-action="view-reports">
                        <span class="quick-action-icon">🛡️</span>
                        <span>View Reports</span>
                    </button>
                    <button class="quick-action-btn" data-action="send-announcement">
                        <span class="quick-action-icon">📢</span>
                        <span>Announcement</span>
                    </button>
                    <button class="quick-action-btn" data-action="system-settings">
                        <span class="quick-action-icon">⚙️</span>
                        <span>Settings</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Server Activity Chart -->
    <div class="admin-card">
        <div class="admin-card-header">
            <h3 class="admin-card-title">Server Activity (7 Days)</h3>
            <div class="admin-card-actions">
                <button class="admin-btn admin-btn-sm admin-btn-ghost active" data-chart-range="7d">7D</button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost" data-chart-range="30d">30D</button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost" data-chart-range="90d">90D</button>
            </div>
        </div>
        <div class="admin-card-body">
            <div class="chart-placeholder" id="dashboard-chart">
                <div class="chart-bars">
                    <div class="chart-bar" style="height: 60%"><span class="bar-label">Mon</span></div>
                    <div class="chart-bar" style="height: 80%"><span class="bar-label">Tue</span></div>
                    <div class="chart-bar" style="height: 45%"><span class="bar-label">Wed</span></div>
                    <div class="chart-bar" style="height: 90%"><span class="bar-label">Thu</span></div>
                    <div class="chart-bar" style="height: 70%"><span class="bar-label">Fri</span></div>
                    <div class="chart-bar" style="height: 55%"><span class="bar-label">Sat</span></div>
                    <div class="chart-bar" style="height: 40%"><span class="bar-label">Sun</span></div>
                </div>
            </div>
        </div>
    </div>

    <!-- New Users Table -->
    <div class="admin-card">
        <div class="admin-card-header">
            <h3 class="admin-card-title">New Users</h3>
            <button class="admin-btn admin-btn-sm admin-btn-primary" data-admin-nav data-page="users">
                View All Users
            </button>
        </div>
        <div class="admin-card-body">
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="dashboard-new-users">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
