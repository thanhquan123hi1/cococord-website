<%-- Audit Log Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="audit">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">Audit Log</h1>
            <p class="admin-page-subtitle">Track all admin actions and system events</p>
        </div>
        <div class="admin-page-header-actions">
            <button class="admin-btn admin-btn-ghost" id="exportAuditBtn">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M8 2v8m0 0l-3-3m3 3l3-3"/>
                    <path d="M2 10v4h12v-4"/>
                </svg>
                Export
            </button>
        </div>
    </div>

    <!-- Filters -->
    <div class="admin-card">
        <div class="admin-toolbar">
            <div class="admin-toolbar-left">
                <div class="admin-filter-group">
                    <select class="admin-select" id="filterAction">
                        <option value="">All Actions</option>
                        <option value="user_ban">User Banned</option>
                        <option value="user_unban">User Unbanned</option>
                        <option value="server_suspend">Server Suspended</option>
                        <option value="server_restore">Server Restored</option>
                        <option value="role_update">Role Updated</option>
                        <option value="settings_change">Settings Changed</option>
                        <option value="login">Login</option>
                        <option value="report_review">Report Reviewed</option>
                    </select>
                    <select class="admin-select" id="filterActor">
                        <option value="">All Actors</option>
                        <option value="admin@cococord.com">Admin</option>
                        <option value="moderator@cococord.com">Moderator</option>
                        <option value="system">System</option>
                    </select>
                    <input type="date" class="admin-input" id="dateFrom" style="width: 150px;">
                    <span style="color: var(--admin-text-muted);">to</span>
                    <input type="date" class="admin-input" id="dateTo" style="width: 150px;">
                </div>
            </div>
            <div class="admin-toolbar-right">
                <button class="admin-btn admin-btn-ghost" id="clearFiltersBtn">
                    Clear Filters
                </button>
                <div class="admin-search admin-search-inline">
                    <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="4"/>
                        <path d="M10 10l4 4"/>
                    </svg>
                    <input type="text" placeholder="Search logs..." id="searchAudit">
                </div>
            </div>
        </div>
    </div>

    <!-- Audit Log Timeline -->
    <div class="admin-card">
        <div class="admin-card-header">
            <h3 class="admin-card-title">Activity Timeline</h3>
            <span id="auditCount" class="admin-badge">Loading...</span>
        </div>
        <div class="admin-card-body">
            <div class="audit-timeline" id="auditTimeline">
                <!-- Content will be rendered by JS -->
                <div class="admin-skeleton-loading">
                    <div class="skeleton-row" style="flex-direction: column; gap: 12px;">
                        <div class="skeleton-card" style="height: 70px; width: 100%;"></div>
                        <div class="skeleton-card" style="height: 70px; width: 100%;"></div>
                        <div class="skeleton-card" style="height: 70px; width: 100%;"></div>
                        <div class="skeleton-card" style="height: 70px; width: 100%;"></div>
                        <div class="skeleton-card" style="height: 70px; width: 100%;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
