<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "Tổng quan"); %>

<title>Tổng quan - CoCoCord Admin</title>

<div class="admin-grid-main">
    <!-- Left: Main Dashboard Content -->
    <div class="flex flex-col gap-6">
        <!-- KPI Cards -->
        <div class="cards-4">
            <div class="stat-card" id="kpi-total-messages">
                <div class="label">Tổng số tin nhắn</div>
                <div class="value" data-stat="totalMessages">--</div>
                <div class="delta up">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                    </svg>
                    <span data-stat="messagesGrowth">+0% so với tuần trước</span>
                </div>
            </div>
            <div class="stat-card" id="kpi-total-users">
                <div class="label">Tổng số người dùng</div>
                <div class="value" data-stat="totalUsers">--</div>
                <div class="delta up">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                    </svg>
                    <span data-stat="usersGrowth">+0% so với tuần trước</span>
                </div>
            </div>
            <div class="stat-card" id="kpi-new-users">
                <div class="label">Người dùng mới (7 ngày)</div>
                <div class="value" data-stat="newUsersLast7Days">--</div>
                <div class="delta up">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                    </svg>
                    <span data-stat="newUsersGrowth">+0% so với 7 ngày trước</span>
                </div>
            </div>
            <div class="stat-card" id="kpi-online-users">
                <div class="label">Người dùng đang online</div>
                <div class="value" data-stat="onlineUsers">--</div>
                <div class="delta up">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                    </svg>
                    <span data-stat="activeUsersPercent">0% tổng số người dùng</span>
                </div>
            </div>
        </div>

        <!-- Server Activity Chart -->
        <div class="admin-panel" id="server-activity-panel">
            <div class="section-title">
                <h3>Hoạt động Server (7 ngày gần nhất)</h3>
                <div class="chart-legend">
                    <div class="chart-legend-item">
                        <span class="chart-legend-dot primary"></span>
                        <span>Tin nhắn</span>
                    </div>
                    <div class="chart-legend-item">
                        <span class="chart-legend-dot accent"></span>
                        <span>Người dùng mới</span>
                    </div>
                </div>
            </div>
            <div class="chart-container" style="height: 280px;">
                <canvas id="serverActivityChart"></canvas>
            </div>
        </div>

        <!-- Two Column Charts -->
        <div class="admin-grid admin-grid-2">
            <!-- Platform Overview -->
            <div class="admin-panel" id="platform-overview-panel">
                <div class="section-title">
                    <h3>Tổng quan nền tảng</h3>
                    <span class="badge badge-default">Realtime</span>
                </div>
                <div class="platform-stats">
                    <div class="platform-stat-item">
                        <div class="platform-stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <div class="platform-stat-info">
                            <span class="platform-stat-value" data-stat="totalChannels">--</span>
                            <span class="platform-stat-label">Tổng số kênh</span>
                        </div>
                    </div>
                    <div class="platform-stat-item">
                        <div class="platform-stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                        </div>
                        <div class="platform-stat-info">
                            <span class="platform-stat-value" data-stat="totalServers">--</span>
                            <span class="platform-stat-label">Tổng số Server</span>
                        </div>
                    </div>
                    <div class="platform-stat-item">
                        <div class="platform-stat-icon success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        </div>
                        <div class="platform-stat-info">
                            <span class="platform-stat-value" data-stat="activeServers">--</span>
                            <span class="platform-stat-label">Server hoạt động</span>
                        </div>
                    </div>
                    <div class="platform-stat-item">
                        <div class="platform-stat-icon warning">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <div class="platform-stat-info">
                            <span class="platform-stat-value" data-stat="lockedServers">--</span>
                            <span class="platform-stat-label">Server bị khóa</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Resources -->
            <div class="admin-panel" id="resources-panel">
                <div class="section-title">
                    <h3>Tài nguyên hệ thống</h3>
                    <span class="badge badge-default">Hôm nay</span>
                </div>
                <div class="resource-stats">
                    <div class="resource-item">
                        <div class="resource-header">
                            <span class="resource-label">Người dùng bị cấm</span>
                            <span class="resource-value" data-stat="bannedUsers">--</span>
                        </div>
                        <div class="resource-bar">
                            <div class="resource-bar-fill danger" data-stat="bannedUsersPercent" style="width: 5%;"></div>
                        </div>
                    </div>
                    <div class="resource-item">
                        <div class="resource-header">
                            <span class="resource-label">Server tạm ngưng</span>
                            <span class="resource-value" data-stat="suspendedServers">--</span>
                        </div>
                        <div class="resource-bar">
                            <div class="resource-bar-fill warning" data-stat="suspendedServersPercent" style="width: 3%;"></div>
                        </div>
                    </div>
                    <div class="resource-item">
                        <div class="resource-header">
                            <span class="resource-label">Server mới hôm nay</span>
                            <span class="resource-value" data-stat="newServersToday">--</span>
                        </div>
                        <div class="resource-bar">
                            <div class="resource-bar-fill success" data-stat="newServersTodayPercent" style="width: 10%;"></div>
                        </div>
                    </div>
                    <div class="resource-item">
                        <div class="resource-header">
                            <span class="resource-label">Hoạt động 24h</span>
                            <span class="resource-value" data-stat="activeUsers24h">--</span>
                        </div>
                        <div class="resource-bar">
                            <div class="resource-bar-fill primary" data-stat="activeUsers24hPercent" style="width: 65%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- New Users Per Day Chart -->
        <div class="admin-panel white" id="new-users-chart-panel">
            <div class="section-title">
                <h3>Người dùng mới theo ngày</h3>
                <div class="chart-period-selector">
                    <button class="btn btn-ghost btn-sm active" data-period="7">7 ngày</button>
                    <button class="btn btn-ghost btn-sm" data-period="14">14 ngày</button>
                    <button class="btn btn-ghost btn-sm" data-period="30">30 ngày</button>
                </div>
            </div>
            <div class="chart-container" style="height: 250px;">
                <canvas id="newUsersChart"></canvas>
            </div>
            <div class="chart-summary">
                <div class="chart-summary-item">
                    <span class="chart-summary-value" id="totalNewUsers">--</span>
                    <span class="chart-summary-label">Tổng người dùng mới</span>
                </div>
                <div class="chart-summary-item">
                    <span class="chart-summary-value" id="avgNewUsers">--</span>
                    <span class="chart-summary-label">Trung bình/ngày</span>
                </div>
                <div class="chart-summary-item">
                    <span class="chart-summary-value" id="peakNewUsers">--</span>
                    <span class="chart-summary-label">Cao nhất</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Right: Activity & Pending Reports Panel -->
    <div class="flex flex-col gap-6">
        <!-- Recent Activity -->
        <div class="admin-panel white" id="recent-activity-panel">
            <div class="section-title">
                <h3>Hoạt động gần đây</h3>
                <span class="badge badge-info" data-stat="activityCount">0</span>
            </div>
            <div class="activity-list" id="activity-list">
                <!-- Activity items will be loaded dynamically -->
                <div class="activity-loading">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
            <div class="activity-footer">
                <a href="${pageContext.request.contextPath}/admin/audit" class="btn btn-ghost btn-sm">Xem tất cả</a>
            </div>
        </div>

        <!-- Platform Overview -->
        <div class="admin-panel white" id="platform-overview-panel">
            <div class="section-title">
                <h3>Tổng quan nền tảng</h3>
                <span class="badge badge-default">Realtime</span>
            </div>
            <div class="platform-stats">
                <div class="platform-stat-item">
                    <div class="platform-stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <div class="platform-stat-info">
                        <span class="platform-stat-value" data-stat="totalChannels">--</span>
                        <span class="platform-stat-label">Tổng số kênh</span>
                    </div>
                </div>
                <div class="platform-stat-item">
                    <div class="platform-stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                    </div>
                    <div class="platform-stat-info">
                        <span class="platform-stat-value" data-stat="totalServers">--</span>
                        <span class="platform-stat-label">Tổng số Server</span>
                    </div>
                </div>
                <div class="platform-stat-item">
                    <div class="platform-stat-icon success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div class="platform-stat-info">
                        <span class="platform-stat-value" data-stat="activeServers">--</span>
                        <span class="platform-stat-label">Server hoạt động</span>
                    </div>
                </div>
                <div class="platform-stat-item">
                    <div class="platform-stat-icon warning">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <div class="platform-stat-info">
                        <span class="platform-stat-value" data-stat="suspendedServers">--</span>
                        <span class="platform-stat-label">Server bị khóa</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Servers -->
        <div class="admin-panel white" id="top-servers-panel">
            <div class="section-title">
                <h3>Server hàng đầu</h3>
                <span class="badge badge-info" data-stat="topServersCount">0</span>
            </div>
            <div class="servers-list" id="top-servers-list">
                <!-- Top servers will be loaded dynamically -->
                <div class="servers-loading">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
            <div class="servers-footer">
                <a href="${pageContext.request.contextPath}/admin#servers" class="btn btn-ghost btn-sm">Xem tất cả</a>
            </div>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/admin/js/dashboard-v2.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/new-users-chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    if (window.DashboardV2) {
        DashboardV2.init();
    }
});
</script>
