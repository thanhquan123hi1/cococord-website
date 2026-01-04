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
                            <th class="sortable" data-sort="status" style="width: 100px;">Status</th>
                            <th class="sortable" data-sort="createdAt" style="width: 120px;">Joined</th>
                            <th class="sortable" data-sort="lastLogin" style="width: 140px;">Last Login</th>
                            <th class="th-actions" style="width: 180px;">Actions</th>
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
<!-- USER DETAIL/EDIT MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop" id="user-detail-modal" style="display: none;">
    <div class="admin-modal admin-modal-lg">
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
            <!-- User Profile Header -->
            <div class="user-profile-header">
                <div class="user-avatar-lg" id="modal-avatar">
                    <span id="modal-avatar-initials">??</span>
                </div>
                <div class="user-profile-info">
                    <h2 id="modal-username">Username</h2>
                    <p id="modal-email">email@example.com</p>
                    <div class="user-badges">
                        <span class="badge" id="modal-role-badge">USER</span>
                        <span class="badge" id="modal-status-badge">Active</span>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="overview">Overview</button>
                <button class="admin-tab" data-tab="activity">Activity Log</button>
                <button class="admin-tab" data-tab="permissions">Permissions</button>
                <button class="admin-tab" data-tab="actions">Actions</button>
            </div>

            <!-- Tab Content: Overview -->
            <div class="admin-tab-content active" data-tab-content="overview">
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

            <!-- Tab Content: Activity Log -->
            <div class="admin-tab-content" data-tab-content="activity">
                <div class="activity-log-container">
                    <div class="activity-filters">
                        <select class="admin-select admin-select-sm" id="activity-type-filter">
                            <option value="">All Activities</option>
                            <option value="login">Login/Logout</option>
                            <option value="message">Messages</option>
                            <option value="server">Server Actions</option>
                            <option value="report">Reports/Violations</option>
                            <option value="admin">Admin Actions</option>
                        </select>
                    </div>
                    <div class="activity-timeline" id="activity-timeline">
                        <div class="activity-item">
                            <div class="activity-icon activity-icon-info">
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                            </div>
                            <div class="activity-content">
                                <div class="activity-text">Loading activity log...</div>
                                <div class="activity-time">--</div>
                            </div>
                        </div>
                    </div>
                    <button class="admin-btn admin-btn-ghost admin-btn-block" id="load-more-activity">Load More</button>
                </div>
            </div>

            <!-- Tab Content: Permissions -->
            <div class="admin-tab-content" data-tab-content="permissions">
                <div class="permissions-section">
                    <h4>Change User Role</h4>
                    <div class="role-selector">
                        <label class="role-option">
                            <input type="radio" name="user-role" value="USER">
                            <div class="role-card">
                                <div class="role-icon role-icon-user">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <circle cx="10" cy="6" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                                    </svg>
                                </div>
                                <div class="role-info">
                                    <span class="role-name">User</span>
                                    <span class="role-desc">Standard user permissions</span>
                                </div>
                            </div>
                        </label>
                        <label class="role-option">
                            <input type="radio" name="user-role" value="MODERATOR">
                            <div class="role-card">
                                <div class="role-icon role-icon-mod">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <path d="M10 2L2 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-5z"/>
                                    </svg>
                                </div>
                                <div class="role-info">
                                    <span class="role-name">Moderator</span>
                                    <span class="role-desc">Can moderate content & users</span>
                                </div>
                            </div>
                        </label>
                        <label class="role-option">
                            <input type="radio" name="user-role" value="ADMIN">
                            <div class="role-card">
                                <div class="role-icon role-icon-admin">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <path d="M10 2l2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z"/>
                                    </svg>
                                </div>
                                <div class="role-info">
                                    <span class="role-name">Admin</span>
                                    <span class="role-desc">Full system access</span>
                                </div>
                            </div>
                        </label>
                    </div>
                    <button class="admin-btn admin-btn-primary" id="btn-save-role">Save Role</button>
                </div>
            </div>

            <!-- Tab Content: Actions -->
            <div class="admin-tab-content" data-tab-content="actions">
                <div class="user-actions-grid">
                    <!-- Ban/Unban Section -->
                    <div class="action-card" id="ban-section">
                        <div class="action-card-header">
                            <h4>Ban User</h4>
                            <span class="badge badge-danger" id="ban-status-badge" style="display: none;">Currently Banned</span>
                        </div>
                        <div class="action-card-body">
                            <div class="form-group">
                                <label>Ban Duration</label>
                                <select class="admin-select" id="ban-duration">
                                    <option value="1h">1 Hour</option>
                                    <option value="24h">24 Hours</option>
                                    <option value="7d">7 Days</option>
                                    <option value="30d">30 Days</option>
                                    <option value="permanent">Permanent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Reason</label>
                                <textarea class="admin-input" id="ban-reason" rows="2" placeholder="Enter ban reason..."></textarea>
                            </div>
                            <div class="action-buttons">
                                <button class="admin-btn admin-btn-danger" id="btn-ban-user">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M4 12L12 4"/></svg>
                                    Ban User
                                </button>
                                <button class="admin-btn admin-btn-success" id="btn-unban-user" style="display: none;">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8l3 3 5-6"/></svg>
                                    Unban User
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Mute Section -->
                    <div class="action-card">
                        <div class="action-card-header">
                            <h4>Mute User</h4>
                            <span class="badge badge-warning" id="mute-status-badge" style="display: none;">Currently Muted</span>
                        </div>
                        <div class="action-card-body">
                            <div class="form-group">
                                <label>Mute Duration</label>
                                <select class="admin-select" id="mute-duration">
                                    <option value="15m">15 Minutes</option>
                                    <option value="1h">1 Hour</option>
                                    <option value="24h">24 Hours</option>
                                    <option value="7d">7 Days</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Reason</label>
                                <textarea class="admin-input" id="mute-reason" rows="2" placeholder="Enter mute reason..."></textarea>
                            </div>
                            <div class="action-buttons">
                                <button class="admin-btn admin-btn-warning" id="btn-mute-user">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 5v6h3l4 4V1L5 5H2z"/><path d="M14 5l-4 6M10 5l4 6"/></svg>
                                    Mute User
                                </button>
                                <button class="admin-btn admin-btn-ghost" id="btn-unmute-user" style="display: none;">
                                    Unmute User
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Disable Account Section -->
                    <div class="action-card">
                        <div class="action-card-header">
                            <h4>Disable Account</h4>
                        </div>
                        <div class="action-card-body">
                            <p class="action-desc">Temporarily disable this account. User won't be able to login but data is preserved.</p>
                            <div class="action-buttons">
                                <button class="admin-btn admin-btn-ghost" id="btn-disable-account">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 5l6 6M11 5l-6 6"/></svg>
                                    Disable Account
                                </button>
                                <button class="admin-btn admin-btn-ghost" id="btn-enable-account" style="display: none;">
                                    Enable Account
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Danger Zone -->
                    <div class="action-card action-card-danger">
                        <div class="action-card-header">
                            <h4>Danger Zone</h4>
                        </div>
                        <div class="action-card-body">
                            <p class="action-desc text-danger">These actions are irreversible. Please be careful.</p>
                            <div class="action-buttons">
                                <button class="admin-btn admin-btn-ghost" id="btn-reset-password">
                                    Force Password Reset
                                </button>
                                <button class="admin-btn admin-btn-danger-outline" id="btn-delete-user">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
                                    Delete User
                                </button>
                            </div>
                        </div>
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
