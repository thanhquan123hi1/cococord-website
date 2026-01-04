<%-- Stats Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="stats">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">Statistics</h1>
            <p class="admin-page-subtitle">Platform analytics and metrics</p>
        </div>
        <div class="admin-page-header-actions">
            <select class="admin-select" id="stats-period">
                <option value="7d">Last 7 Days</option>
                <option value="30d" selected>Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
            </select>
            <button class="admin-btn admin-btn-ghost" data-action="export-stats">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M8 2v8m0 0l-3-3m3 3l3-3"/>
                    <path d="M2 10v4h12v-4"/>
                </svg>
                Export
            </button>
        </div>
    </div>

    <!-- Stats Overview -->
    <div class="admin-stats-row">
        <div class="admin-stat-card">
            <div class="stat-icon stat-icon-blue">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="10" cy="6" r="3"/>
                    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Active Users</div>
                <div class="stat-value">12,847</div>
                <div class="stat-change positive">
                    <span class="change-icon">↑</span>
                    +8.5% this month
                </div>
            </div>
        </div>

        <div class="admin-stat-card">
            <div class="stat-icon stat-icon-green">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 4h14c1 0 2 1 2 2v8c0 1-1 2-2 2H5l-4 3v-3c0-1 1-2 2-2"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Messages Sent</div>
                <div class="stat-value">2.4M</div>
                <div class="stat-change positive">
                    <span class="change-icon">↑</span>
                    +12.3% this month
                </div>
            </div>
        </div>

        <div class="admin-stat-card">
            <div class="stat-icon stat-icon-purple">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="14" height="5" rx="1"/>
                    <rect x="3" y="12" width="14" height="5" rx="1"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Servers Created</div>
                <div class="stat-value">456</div>
                <div class="stat-change negative">
                    <span class="change-icon">↓</span>
                    -2.1% this month
                </div>
            </div>
        </div>

        <div class="admin-stat-card">
            <div class="stat-icon stat-icon-orange">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M10 2l8 5v6c0 5-8 8-8 8s-8-3-8-8V7l8-5z"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Reports Handled</div>
                <div class="stat-value">89</div>
                <div class="stat-change">
                    Same as last month
                </div>
            </div>
        </div>
    </div>

    <!-- Charts Grid -->
    <div class="admin-grid admin-grid-2">
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">User Growth</h3>
            </div>
            <div class="admin-card-body">
                <div class="chart-placeholder">
                    <div class="chart-bars">
                        <div class="chart-bar" style="height: 40%"><span class="bar-label">Jan</span></div>
                        <div class="chart-bar" style="height: 55%"><span class="bar-label">Feb</span></div>
                        <div class="chart-bar" style="height: 50%"><span class="bar-label">Mar</span></div>
                        <div class="chart-bar" style="height: 70%"><span class="bar-label">Apr</span></div>
                        <div class="chart-bar" style="height: 85%"><span class="bar-label">May</span></div>
                        <div class="chart-bar" style="height: 75%"><span class="bar-label">Jun</span></div>
                        <div class="chart-bar" style="height: 90%"><span class="bar-label">Jul</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">Message Volume</h3>
            </div>
            <div class="admin-card-body">
                <div class="chart-placeholder">
                    <div class="chart-bars">
                        <div class="chart-bar" style="height: 60%"><span class="bar-label">Mon</span></div>
                        <div class="chart-bar" style="height: 80%"><span class="bar-label">Tue</span></div>
                        <div class="chart-bar" style="height: 75%"><span class="bar-label">Wed</span></div>
                        <div class="chart-bar" style="height: 90%"><span class="bar-label">Thu</span></div>
                        <div class="chart-bar" style="height: 85%"><span class="bar-label">Fri</span></div>
                        <div class="chart-bar" style="height: 50%"><span class="bar-label">Sat</span></div>
                        <div class="chart-bar" style="height: 45%"><span class="bar-label">Sun</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Top Servers Table -->
    <div class="admin-card">
        <div class="admin-card-header">
            <h3 class="admin-card-title">Top Servers by Activity</h3>
        </div>
        <div class="admin-card-body admin-card-body-table">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Server</th>
                        <th>Members</th>
                        <th>Messages</th>
                        <th>Activity</th>
                    </tr>
                </thead>
                <tbody id="topServersTable">
                    <!-- Content will be rendered by JS -->
                    <tr>
                        <td colspan="5" class="text-center">Loading...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
