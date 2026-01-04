<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "Overview"); %>

<title>Dashboard Overview - CoCoCord Admin</title>

<div class="admin-grid-main">
    <!-- Left: Main Dashboard Content -->
    <div class="flex flex-col gap-6">
        <!-- KPI Cards -->
        <div class="cards-4">
            <div class="stat-card">
                <div class="label">Total Users</div>
                <div class="value">40,689</div>
                <div class="delta up">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                    </svg>
                    <span>+8.5% vs last month</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="label">Total Servers</div>
                <div class="value">10,293</div>
                <div class="delta up">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                    </svg>
                    <span>+1.3% vs last month</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="label">Messages Today</div>
                <div class="value">89,000</div>
                <div class="delta down">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 3v6m0 0l3-3m-3 3L3 6"/>
                    </svg>
                    <span>-4.3% vs yesterday</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="label">Active Voice Calls</div>
                <div class="value">2,040</div>
                <div class="delta up">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                    </svg>
                    <span>+1.8% vs last hour</span>
                </div>
            </div>
        </div>

        <!-- Main Chart -->
        <div class="admin-panel">
            <div class="section-title">
                <div class="chart-tabs">
                    <button class="chart-tab active">Total Users</button>
                    <button class="chart-tab">Total Servers</button>
                    <button class="chart-tab">Messages</button>
                </div>
                <div class="chart-legend">
                    <div class="chart-legend-item">
                        <span class="chart-legend-dot primary"></span>
                        <span>This Year</span>
                    </div>
                    <div class="chart-legend-item">
                        <span class="chart-legend-dot accent"></span>
                        <span>Last Year</span>
                    </div>
                </div>
            </div>
            <div class="chart-container">
                <div class="chart-placeholder">
                    <span>Chart.js sẽ được tích hợp ở Phase 2</span>
                </div>
            </div>
        </div>

        <!-- Two Column Charts -->
        <div class="admin-grid admin-grid-2">
            <div class="admin-panel">
                <div class="section-title">
                    <h3>Server Growth</h3>
                    <span class="badge badge-default">Weekly</span>
                </div>
                <div class="chart-placeholder" style="height: 200px;">Bar chart placeholder</div>
            </div>
            <div class="admin-panel">
                <div class="section-title">
                    <h3>User Distribution</h3>
                    <span class="badge badge-default">By Role</span>
                </div>
                <div class="chart-placeholder" style="height: 200px;">Donut chart placeholder</div>
            </div>
        </div>

        <!-- Recent Users Table -->
        <div class="admin-panel white">
            <div class="section-title">
                <h3>Recent Users</h3>
                <a href="${pageContext.request.contextPath}/admin/users" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <table class="table" aria-label="Recent users">
                <thead>
                <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>
                        <div class="cell-user">
                            <div class="avatar">NV</div>
                            <div class="cell-user-info">
                                <span class="cell-user-name">Nguyễn Văn A</span>
                                <span class="cell-user-email">nguyenvana@email.com</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>User</td>
                    <td>Jan 15, 2024</td>
                    <td>
                        <button class="btn btn-ghost btn-sm btn-icon" title="View">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="cell-user">
                            <div class="avatar">TT</div>
                            <div class="cell-user-info">
                                <span class="cell-user-name">Trần Thị B</span>
                                <span class="cell-user-email">tranthib@email.com</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>Premium</td>
                    <td>Jan 10, 2024</td>
                    <td>
                        <button class="btn btn-ghost btn-sm btn-icon" title="View">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="cell-user">
                            <div class="avatar">LM</div>
                            <div class="cell-user-info">
                                <span class="cell-user-name">Lê Minh C</span>
                                <span class="cell-user-email">leminhc@email.com</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge badge-warning">Inactive</span></td>
                    <td>User</td>
                    <td>Dec 20, 2023</td>
                    <td>
                        <button class="btn btn-ghost btn-sm btn-icon" title="View">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="cell-user">
                            <div class="avatar">PH</div>
                            <div class="cell-user-info">
                                <span class="cell-user-name">Phạm Hương D</span>
                                <span class="cell-user-email">phamhuongd@email.com</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge badge-danger">Banned</span></td>
                    <td>User</td>
                    <td>Nov 05, 2023</td>
                    <td>
                        <button class="btn btn-ghost btn-sm btn-icon" title="View">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Right: Activity & Top Servers Panel -->
    <div class="flex flex-col gap-6">
        <!-- Recent Activity -->
        <div class="admin-panel white">
            <div class="section-title">
                <h3>Recent Activity</h3>
                <span class="badge badge-info">5</span>
            </div>
            <div class="activity-list">
                <div class="activity-item">
                    <div class="avatar">PT</div>
                    <div class="activity-content">
                        <div class="activity-text">
                            <strong>Phan Thị A</strong> created a new server <strong>Vietnam Gamers</strong>
                        </div>
                        <div class="activity-time">2 minutes ago</div>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="avatar">NV</div>
                    <div class="activity-content">
                        <div class="activity-text">
                            <strong>Nguyễn Văn B</strong> reported a user <strong>spammer123</strong>
                        </div>
                        <div class="activity-time">15 minutes ago</div>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="avatar">TM</div>
                    <div class="activity-content">
                        <div class="activity-text">
                            <strong>Trần Minh C</strong> updated server settings for <strong>Tech Talk VN</strong>
                        </div>
                        <div class="activity-time">32 minutes ago</div>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="avatar">LH</div>
                    <div class="activity-content">
                        <div class="activity-text">
                            <strong>Lê Hương D</strong> joined the platform
                        </div>
                        <div class="activity-time">1 hour ago</div>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="avatar">
                        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px;">
                            <circle cx="9" cy="9" r="7"/>
                            <path d="M9 5v4l2 2"/>
                        </svg>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">
                            <strong>System</strong> completed daily backup
                        </div>
                        <div class="activity-time">3 hours ago</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Servers -->
        <div class="admin-panel white">
            <div class="section-title">
                <h3>Top Servers</h3>
                <a href="${pageContext.request.contextPath}/admin/servers" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="list">
                <div class="list-item">
                    <div class="avatar">VG</div>
                    <div class="meta">
                        <div class="name">Vietnam Gamers</div>
                        <div class="sub">15,420 members</div>
                    </div>
                    <span class="badge badge-success">+12.5%</span>
                </div>
                <div class="list-item">
                    <div class="avatar">TT</div>
                    <div class="meta">
                        <div class="name">Tech Talk VN</div>
                        <div class="sub">8,930 members</div>
                    </div>
                    <span class="badge badge-success">+8.2%</span>
                </div>
                <div class="list-item">
                    <div class="avatar">ML</div>
                    <div class="meta">
                        <div class="name">Music Lovers</div>
                        <div class="sub">7,210 members</div>
                    </div>
                    <span class="badge badge-success">+5.1%</span>
                </div>
                <div class="list-item">
                    <div class="avatar">SG</div>
                    <div class="meta">
                        <div class="name">Study Group</div>
                        <div class="sub">5,890 members</div>
                    </div>
                    <span class="badge badge-success">+15.3%</span>
                </div>
                <div class="list-item">
                    <div class="avatar">AF</div>
                    <div class="meta">
                        <div class="name">Anime Fans VN</div>
                        <div class="sub">4,520 members</div>
                    </div>
                    <span class="badge badge-success">+3.7%</span>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/admin/js/mock-data.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/dashboard.js"></script>
