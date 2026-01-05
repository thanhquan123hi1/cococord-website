<%-- Users Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="users">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">User Management</h1>
            <p class="admin-page-subtitle">Manage all registered users, permissions and account status</p>
        </div>
        <div class="admin-page-header-actions">
            <button class="admin-btn admin-btn-ghost" id="btn-refresh-users" title="Refresh">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 8A6 6 0 1 1 8 2"/>
                    <path d="M14 2v4h-4"/>
                </svg>
            </button>
            <button class="admin-btn admin-btn-ghost" id="btn-export-users">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M8 2v8m0 0l-3-3m3 3l3-3"/>
                    <path d="M2 10v4h12v-4"/>
                </svg>
                Export
            </button>
            <button class="admin-btn admin-btn-primary" id="btn-add-user">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v10M3 8h10"/>
                </svg>
                Add User
            </button>
        </div>
    </div>

    <!-- Stats Overview -->
    <div class="admin-stats-row">
        <div class="admin-stat-card admin-stat-card-sm clickable" data-filter-status="">
            <div class="stat-icon stat-icon-blue">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="10" cy="6" r="3"/>
                    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Total Users</div>
                <div class="stat-value" id="stat-total-users">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm clickable" data-filter-status="active">
            <div class="stat-icon stat-icon-green">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="10" cy="10" r="3"/>
                    <path d="M10 2v2m0 12v2M2 10h2m12 0h2"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Active Now</div>
                <div class="stat-value text-success" id="stat-active-users">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm clickable" data-filter-time="week">
            <div class="stat-icon stat-icon-purple">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M10 2L2 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-5z"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">New This Week</div>
                <div class="stat-value" id="stat-new-users">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm clickable" data-filter-status="banned">
            <div class="stat-icon stat-icon-red">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M5 15L15 5"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Banned</div>
                <div class="stat-value text-danger" id="stat-banned-users">--</div>
            </div>
        </div>
    </div>

    <!-- Users List (Search + Bulk Actions + Table) -->
    <div class="admin-card admin-users-card">
        <div class="admin-toolbar admin-users-toolbar">
            <div class="admin-toolbar-left">
                <div class="admin-search admin-search-lg">
                    <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="4"/>
                        <path d="M10 10l4 4"/>
                    </svg>
                    <input type="text" placeholder="Search by username, email, or ID..." id="user-search-input">
                </div>
            </div>
            <div class="admin-toolbar-right">
                <div class="admin-filter-group">
                    <select class="admin-select" id="filter-presence">
                        <option value="">Tất cả (Online/Offline)</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>
                    <select class="admin-select" id="filter-status">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="banned">Banned</option>
                        <option value="muted">Muted</option>
                    </select>
                    <select class="admin-select" id="filter-role">
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="USER">User</option>
                    </select>
                    <select class="admin-select" id="filter-time">
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    <select class="admin-select" id="sort-by">
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="username-asc">Username A-Z</option>
                        <option value="username-desc">Username Z-A</option>
                        <option value="lastLogin-desc">Last Active</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Bulk Actions Bar (hidden by default) -->
        <div class="admin-bulk-actions-bar" id="bulk-actions-bar" style="display: none;">
        <div class="bulk-info">
            <span id="selected-count">0</span> users selected
        </div>
        <div class="bulk-buttons">
            <button class="admin-btn admin-btn-sm admin-btn-ghost" data-bulk-action="ban">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/></svg>
                Ban Selected
            </button>
            <button class="admin-btn admin-btn-sm admin-btn-ghost" data-bulk-action="unban">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8l3 3 5-6"/></svg>
                Unban Selected
            </button>
            <button class="admin-btn admin-btn-sm admin-btn-ghost" data-bulk-action="role">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>
                Change Role
            </button>
            <button class="admin-btn admin-btn-sm admin-btn-ghost text-danger" data-bulk-action="delete">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
                Delete Selected
            </button>
        </div>
    </div>

        <!-- Users Table -->
        <div class="admin-card-body admin-card-body-table">
            <div class="admin-table-container">
                <table class="admin-table admin-table-hover" id="users-table">
                    <thead>
                        <tr>
                            <th class="th-checkbox" style="width: 40px;">
                                <input type="checkbox" id="select-all-users" class="admin-checkbox">
                            </th>
                            <th class="sortable" data-sort="id" style="width: 80px;">ID</th>
                            <th class="sortable" data-sort="username">User</th>
                            <th class="sortable" data-sort="role" style="width: 120px;">Role</th>
                            <th class="sortable" data-sort="status" style="width: 120px;">Tình trạng</th>
                            <th class="sortable" data-sort="createdAt" style="width: 120px;">Joined</th>
                            <th class="sortable" data-sort="lastLogin" style="width: 140px;">Last Login</th>
                            <th style="width: 140px;">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        <!-- Loading skeleton -->
                        <tr class="skeleton-row">
                            <td colspan="8">
                                <div class="skeleton-loading">
                                    <div class="skeleton-line"></div>
                                    <div class="skeleton-line"></div>
                                    <div class="skeleton-line"></div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <div class="admin-card-footer">
            <div class="admin-pagination">
                <div class="pagination-info" id="realtime-filter-summary">
                    Hiển thị <span id="realtime-visible-count">0</span> / <span id="realtime-total-count">0</span> người dùng
                    • Online: <span id="realtime-online-count">0</span>
                    • Offline: <span id="realtime-offline-count">0</span>
                </div>
                <div class="pagination-info">
                    Showing <span id="pagination-from">0</span>-<span id="pagination-to">0</span> 
                    of <span id="pagination-total">0</span> users
                </div>
                <div class="pagination-controls" id="pagination-controls">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- USER DETAIL/EDIT MODAL (Redesigned) -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="user-detail-modal" style="display: none;">
    <div class="admin-modal admin-modal-lg glass-modal">
        <div class="admin-modal-header">
            <h3 class="admin-modal-title">
                <span id="modal-title-text">User Details</span>
            </h3>
            <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-modal">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4l8 8M12 4l-8 8"/>
                </svg>
            </button>
        </div>
        <div class="admin-modal-body">
            <!-- User Profile Header - Horizontal Layout -->
            <div class="user-profile-header">
                <div class="user-avatar-section">
                    <img class="user-avatar-large" id="modal-avatar" src="" alt="User Avatar">
                </div>
                <div class="user-info-section">
                    <h3>
                        <span id="modal-username">Username</span>
                        <span class="admin-status-badge" id="modal-status-badge">Active</span>
                    </h3>
                    <p id="modal-email" style="color: var(--admin-muted); margin: 0;">email@example.com</p>
                    <div class="user-meta-row">
                        <div class="user-meta-item">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                                <path d="M8 2L2 5v5c0 4 6 6 6 6s6-2 6-6V5l-6-3z"/>
                            </svg>
                            Role: <span id="modal-role-text">USER</span>
                        </div>
                        <div class="user-meta-item">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                                <rect x="2" y="3" width="12" height="10" rx="1"/><path d="M2 6l6 4 6-4"/>
                            </svg>
                            <span id="modal-email-verified-icon">✓ Verified</span>
                        </div>
                        <div class="user-meta-item">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                                <circle cx="8" cy="8" r="6"/><path d="M8 4v4l2 2"/>
                            </svg>
                            Joined: <span id="modal-join-date">--</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs (3 tabs: Overview, Audit Log, Moderation) -->
            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="overview">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                        <circle cx="8" cy="5" r="3"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
                    </svg>
                    Overview
                </button>
                <button class="admin-tab" data-tab="audit-log">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                        <path d="M2 3h12M2 6h12M2 9h8M2 12h6"/>
                    </svg>
                    Audit Log
                </button>
                <button class="admin-tab" data-tab="moderation">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                        <path d="M8 2L2 5v5c0 4 6 6 6 6s6-2 6-6V5l-6-3z"/>
                    </svg>
                    Moderation
                </button>
            </div>

            <!-- Tab Content: Overview -->
            <div class="admin-tab-content active" data-tab-content="overview">
                <div class="user-details-section">
                    <h4>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                            <circle cx="8" cy="5" r="3"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
                        </svg>
                        Account Information
                    </h4>
                    <div class="user-details-grid">
                    <div class="detail-item">
                        <label>User ID</label>
                        <span id="modal-user-id">--</span>
                    </div>
                    <div class="detail-item">
                        <label>Display Name</label>
                        <span id="modal-display-name">--</span>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <span id="modal-user-email">--</span>
                    </div>
                    <div class="detail-item">
                        <label>Role</label>
                        <span id="modal-user-role">--</span>
                    </div>
                    <div class="detail-item">
                        <label>Account Status</label>
                        <span id="modal-account-status">--</span>
                    </div>
                    <div class="detail-item">
                        <label>Email Verified</label>
                        <span id="modal-email-verified">--</span>
                    </div>
                    <div class="detail-item">
                        <label>2FA Enabled</label>
                        <span id="modal-2fa-status">--</span>
                    </div>
                    <div class="detail-item">
                        <label>Created At</label>
                        <span id="modal-created-at">--</span>
                    </div>
                    <div class="detail-item">
                        <label>Last Login</label>
                        <span id="modal-last-login">--</span>
                    </div>
                    <div class="detail-item">
                        <label>Servers Joined</label>
                        <span id="modal-servers-count">--</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>Bio</label>
                        <span id="modal-user-bio">--</span>
                    </div>
                    </div>
                </div>
                
                <!-- Role Change Section in Overview -->
                <div class="role-selector-section">
                    <h4>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                            <path d="M8 2L2 5v5c0 4 6 6 6 6s6-2 6-6V5l-6-3z"/>
                        </svg>
                        Change User Role
                    </h4>
                    <div class="role-selector">
                        <label class="role-option">
                            <input type="radio" name="user-role" value="USER">
                            <div class="role-card">
                                <div class="role-icon user">👤</div>
                                <span class="role-name">User</span>
                                <span class="role-description">Standard permissions</span>
                            </div>
                        </label>
                        <label class="role-option">
                            <input type="radio" name="user-role" value="MODERATOR">
                            <div class="role-card">
                                <div class="role-icon moderator">🛡️</div>
                                <span class="role-name">Moderator</span>
                                <span class="role-description">Moderate content</span>
                            </div>
                        </label>
                        <label class="role-option">
                            <input type="radio" name="user-role" value="ADMIN">
                            <div class="role-card">
                                <div class="role-icon admin">⭐</div>
                                <span class="role-name">Admin</span>
                                <span class="role-description">Full access</span>
                            </div>
                        </label>
                    </div>
                    <div class="quick-actions">
                        <button class="admin-btn admin-btn-primary" id="btn-save-role">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                                <path d="M13 3L6 13l-3-4"/>
                            </svg>
                            Save Role
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tab Content: Audit Log -->
            <div class="admin-tab-content" data-tab-content="audit-log">
                <!-- Audit Summary Box -->
                <div class="audit-summary-box">
                    <div class="audit-summary-item">
                        <div class="audit-summary-value" id="audit-servers-created">0</div>
                        <div class="audit-summary-label">Servers Created</div>
                    </div>
                    <div class="audit-summary-item">
                        <div class="audit-summary-value" id="audit-servers-joined">0</div>
                        <div class="audit-summary-label">Servers Joined</div>
                    </div>
                    <div class="audit-summary-item">
                        <div class="audit-summary-value" id="audit-messages-sent">0</div>
                        <div class="audit-summary-label">Messages Sent</div>
                    </div>
                    <div class="audit-summary-item audit-summary-item-danger">
                        <div class="audit-summary-value" id="audit-bans-received">0</div>
                        <div class="audit-summary-label">Bans Received</div>
                    </div>
                </div>
                
                <!-- Activity Filters -->
                <div class="activity-filters">
                    <select class="admin-select admin-select-sm" id="audit-type-filter">
                        <option value="">All Activities</option>
                        <option value="server">Server Activity</option>
                        <option value="membership">Membership</option>
                        <option value="moderation">Moderation</option>
                        <option value="role">Role Changes</option>
                        <option value="security">Security</option>
                    </select>
                </div>
                
                <!-- Activity Timeline -->
                <div class="audit-timeline" id="audit-timeline">
                    <div class="audit-item">
                        <div class="audit-icon audit-icon-info">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                        </div>
                        <div class="audit-content">
                            <div class="audit-text">Loading audit log...</div>
                            <div class="audit-time">--</div>
                        </div>
                    </div>
                </div>
                <button class="admin-btn admin-btn-ghost admin-btn-block" id="load-more-audit">Load More</button>
            </div>

            <!-- Tab Content: Moderation -->
            <div class="admin-tab-content" data-tab-content="moderation">
                <!-- Current Ban Status (shown when user is banned) -->
                <div class="current-ban-info" id="current-ban-info" style="display: none;">
                    <div class="ban-info-header">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
                            <circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/>
                        </svg>
                        <span>User is currently banned</span>
                    </div>
                    <div class="ban-info-details">
                        <div class="ban-detail-row">
                            <label>Ban Type:</label>
                            <span id="current-ban-type">Permanent</span>
                        </div>
                        <div class="ban-detail-row">
                            <label>Banned At:</label>
                            <span id="current-ban-date">--</span>
                        </div>
                        <div class="ban-detail-row" id="current-ban-until-row">
                            <label>Banned Until:</label>
                            <span id="current-ban-until">--</span>
                        </div>
                        <div class="ban-detail-row">
                            <label>Reason:</label>
                            <span id="current-ban-reason">--</span>
                        </div>
                        <div class="ban-detail-row">
                            <label>Banned By:</label>
                            <span id="current-ban-by">--</span>
                        </div>
                    </div>
                    <div class="ban-info-actions">
                        <button class="admin-btn admin-btn-success" id="btn-unban-user-mod">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8l3 3 5-6"/></svg>
                            Unban User
                        </button>
                        <button class="admin-btn admin-btn-warning" id="btn-extend-ban">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3v5l3 3"/><circle cx="8" cy="8" r="6"/></svg>
                            Extend Ban
                        </button>
                    </div>
                </div>
                
                <!-- Ban Panel (shown when user is not banned, or extend ban) -->
                <div class="moderation-ban-panel" id="moderation-ban-panel">
                    <h4 class="moderation-section-title" id="ban-panel-title">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
                            <circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/>
                        </svg>
                        Ban User
                    </h4>
                    
                    <!-- Ban Type Radio -->
                    <div class="form-group">
                        <label class="form-label required">Ban Type</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="ban-type-mod" value="permanent" checked>
                                <span class="radio-label">
                                    <strong>Permanent</strong>
                                    <small>User will be banned indefinitely</small>
                                </span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="ban-type-mod" value="temporary">
                                <span class="radio-label">
                                    <strong>Temporary</strong>
                                    <small>User will be banned for a specific duration</small>
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Duration Selector (shown only for temporary) -->
                    <div class="form-group" id="ban-duration-group-mod" style="display: none;">
                        <label class="form-label required">Duration</label>
                        <div class="duration-selector">
                            <select class="admin-select" id="ban-duration-mod">
                                <option value="1h">1 Hour</option>
                                <option value="6h">6 Hours</option>
                                <option value="24h">24 Hours</option>
                                <option value="3d">3 Days</option>
                                <option value="7d">7 Days</option>
                                <option value="14d">14 Days</option>
                                <option value="30d">30 Days</option>
                                <option value="custom">Custom...</option>
                            </select>
                            <div class="custom-duration" id="custom-duration-mod" style="display: none;">
                                <input type="number" class="admin-input" id="ban-custom-value-mod" min="1" value="1">
                                <select class="admin-select" id="ban-custom-unit-mod">
                                    <option value="hours">Hours</option>
                                    <option value="days" selected>Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ban Reason (Required) -->
                    <div class="form-group">
                        <label class="form-label required">Reason (shown to user)</label>
                        <textarea class="admin-input" id="ban-reason-mod" rows="3" 
                            placeholder="Enter the reason for this ban. This will be shown to the user..." required></textarea>
                        <small class="form-hint">This reason will be displayed to the user when they try to access the platform.</small>
                    </div>
                    
                    <!-- Admin Note (Optional) -->
                    <div class="form-group">
                        <label class="form-label">Admin Note (internal only)</label>
                        <textarea class="admin-input" id="ban-admin-note-mod" rows="2" 
                            placeholder="Optional internal note visible only to admins..."></textarea>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="moderation-actions">
                        <button class="admin-btn admin-btn-danger" id="btn-apply-ban-mod">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/></svg>
                            Apply Ban
                        </button>
                    </div>
                </div>
                
                <!-- Danger Zone -->
                <div class="moderation-danger-zone">
                    <h4 class="moderation-section-title danger">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
                            <path d="M8 1L1 14h14L8 1zM8 5v4M8 11v1"/>
                        </svg>
                        Danger Zone
                    </h4>
                    <p class="danger-warning">These actions are irreversible. Please be careful.</p>
                    <div class="danger-actions">
                        <button class="admin-btn admin-btn-ghost" id="btn-reset-password-mod">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8a6 6 0 1 1 6 6"/><path d="M2 12V8h4"/></svg>
                            Force Password Reset
                        </button>
                        <button class="admin-btn admin-btn-danger-outline" id="btn-delete-user-mod">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
                            Delete User
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-modal">Close</button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- QUICK BAN MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="quick-ban-modal" style="display: none;">
    <div class="admin-modal admin-modal-md glass-modal">
        <div class="admin-modal-header">
            <h3 class="admin-modal-title">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18" style="margin-right: 8px; vertical-align: -3px;">
                    <circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/>
                </svg>
                Ban User
            </h3>
            <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-quick-ban">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4l8 8M12 4l-8 8"/>
                </svg>
            </button>
        </div>
        <div class="admin-modal-body">
            <!-- User Preview -->
            <div class="quick-ban-user-preview">
                <div class="user-avatar-md" id="quick-ban-avatar">
                    <span id="quick-ban-avatar-initials">??</span>
                </div>
                <div class="quick-ban-user-info">
                    <span class="quick-ban-username" id="quick-ban-username">Username</span>
                    <span class="quick-ban-email" id="quick-ban-email">email@example.com</span>
                </div>
            </div>
            
            <!-- Ban Type Radio -->
            <div class="form-group">
                <label class="form-label required">Ban Type</label>
                <div class="radio-group-inline">
                    <label class="radio-pill">
                        <input type="radio" name="quick-ban-type" value="permanent" checked>
                        <span>Permanent</span>
                    </label>
                    <label class="radio-pill">
                        <input type="radio" name="quick-ban-type" value="temporary">
                        <span>Temporary</span>
                    </label>
                </div>
            </div>
            
            <!-- Duration Selector (shown only for temporary) -->
            <div class="form-group" id="quick-ban-duration-group" style="display: none;">
                <label class="form-label required">Duration</label>
                <select class="admin-select" id="quick-ban-duration">
                    <option value="1h">1 Hour</option>
                    <option value="6h">6 Hours</option>
                    <option value="24h">24 Hours</option>
                    <option value="3d">3 Days</option>
                    <option value="7d" selected>7 Days</option>
                    <option value="14d">14 Days</option>
                    <option value="30d">30 Days</option>
                </select>
            </div>

            <!-- Admin Note (Optional) -->
            <div class="form-group">
                <label class="form-label">Ghi chú ban <span class="optional-tag">(optional)</span></label>
                <textarea class="admin-input" id="quick-ban-admin-note" rows="2" 
                    placeholder="Ghi chú nội bộ (chỉ admin thấy)..."></textarea>
            </div>
        </div>
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-quick-ban">Cancel</button>
            <button class="admin-btn admin-btn-danger" id="btn-confirm-quick-ban">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/></svg>
                Ban User
            </button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- ACTIVE NOW MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="active-now-modal" style="display: none;">
    <div class="admin-modal admin-modal-md glass-modal">
        <div class="admin-modal-header">
            <h3 class="admin-modal-title">Active Now</h3>
            <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-active-now">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4l8 8M12 4l-8 8"/>
                </svg>
            </button>
        </div>
        <div class="admin-modal-body">
            <div class="admin-search" style="margin-bottom: 12px;">
                <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="7" cy="7" r="4"/>
                    <path d="M10 10l4 4"/>
                </svg>
                <input type="text" placeholder="Tìm theo tên hoặc email" aria-label="Search online users" id="active-now-search-input">
            </div>
            <div id="active-now-list" class="active-now-list">
                <!-- Populated by JS -->
            </div>
        </div>
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-active-now">Close</button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- ADD USER MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop" id="add-user-modal" style="display: none;">
    <div class="admin-modal">
        <div class="admin-modal-header">
            <h3 class="admin-modal-title">Add New User</h3>
            <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-add-modal">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            </button>
        </div>
        <div class="admin-modal-body">
            <form id="add-user-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Username <span class="required">*</span></label>
                        <input type="text" class="admin-input" id="new-username" required>
                    </div>
                    <div class="form-group">
                        <label>Email <span class="required">*</span></label>
                        <input type="email" class="admin-input" id="new-email" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Password <span class="required">*</span></label>
                        <input type="password" class="admin-input" id="new-password" required>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select class="admin-select" id="new-role">
                            <option value="USER">User</option>
                            <option value="MODERATOR">Moderator</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="new-email-verified">
                        Mark email as verified
                    </label>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="new-send-welcome">
                        Send welcome email
                    </label>
                </div>
            </form>
        </div>
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-add-modal">Cancel</button>
            <button class="admin-btn admin-btn-primary" id="btn-create-user">Create User</button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- BULK ROLE CHANGE MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop" id="bulk-role-modal" style="display: none;">
    <div class="admin-modal admin-modal-sm">
        <div class="admin-modal-header">
            <h3 class="admin-modal-title">Change Role for Selected Users</h3>
            <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-bulk-role-modal">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            </button>
        </div>
        <div class="admin-modal-body">
            <p><span id="bulk-role-count">0</span> users will be affected.</p>
            <div class="form-group">
                <label>New Role</label>
                <select class="admin-select" id="bulk-new-role">
                    <option value="USER">User</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>
        </div>
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-bulk-role-modal">Cancel</button>
            <button class="admin-btn admin-btn-primary" id="btn-apply-bulk-role">Apply Changes</button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- DELETE CONFIRMATION MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop" id="delete-confirm-modal" style="display: none;">
    <div class="admin-modal admin-modal-sm">
        <div class="admin-modal-header">
            <h3 class="admin-modal-title">Confirm Delete</h3>
            <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-delete-modal">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            </button>
        </div>
        <div class="admin-modal-body">
            <p class="text-danger">This action cannot be undone!</p>
            <p>Are you sure you want to delete <strong id="delete-confirm-username">this user</strong>?</p>
            <p>All their data including messages, servers, and settings will be permanently removed.</p>
        </div>
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-delete-modal">Cancel</button>
            <button class="admin-btn admin-btn-danger" id="btn-confirm-delete">Delete User</button>
        </div>
    </div>
</div>
