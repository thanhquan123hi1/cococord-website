<%-- Servers Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="servers">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">Server Management</h1>
            <p class="admin-page-subtitle">Monitor and manage all servers</p>
        </div>
        <div class="admin-page-header-actions">
            <button class="admin-btn admin-btn-ghost" id="btn-refresh-servers" title="Refresh">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 8A6 6 0 1 1 8 2"/>
                    <path d="M14 2v4h-4"/>
                </svg>
            </button>
            <button class="admin-btn admin-btn-ghost" id="btn-export-servers">
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
        <div class="admin-stat-card admin-stat-card-sm clickable" data-filter-status="">
            <div class="stat-icon stat-icon-blue">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="14" height="14" rx="2"/>
                    <path d="M7 8h6M7 12h4"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Total Servers</div>
                <div class="stat-value" id="stat-total-servers">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm clickable" data-filter-status="active">
            <div class="stat-icon stat-icon-green">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M10 2L2 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-5z"/>
                    <path d="M7 10l2 2 4-4"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Active Servers</div>
                <div class="stat-value text-success" id="stat-active-servers">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm clickable" data-stat-type="members">
            <div class="stat-icon stat-icon-purple">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="7" cy="7" r="3"/>
                    <circle cx="13" cy="7" r="3"/>
                    <path d="M2 17c0-3 2-5 5-5 1.5 0 2.8.5 3.8 1.3"/>
                    <path d="M18 17c0-3-2-5-5-5-.8 0-1.5.2-2.2.5"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Total Members</div>
                <div class="stat-value" id="stat-total-members">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm clickable" data-filter-status="flagged">
            <div class="stat-icon stat-icon-red">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 2v16"/>
                    <path d="M4 3h11l-3 4 3 4H4"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Flagged</div>
                <div class="stat-value text-warning" id="stat-flagged-servers">--</div>
            </div>
        </div>
    </div>

    <!-- Servers List (Search + Bulk Actions + Table) -->
    <div class="admin-card admin-servers-card">
        <div class="admin-toolbar admin-servers-toolbar">
            <div class="admin-toolbar-left">
                <div class="admin-search admin-search-lg">
                    <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="4"/>
                        <path d="M10 10l4 4"/>
                    </svg>
                    <input type="text" placeholder="Search by server name, owner, or ID..." id="server-search-input">
                </div>
            </div>
            <div class="admin-toolbar-right">
                <div class="admin-filter-group">
                    <select class="admin-select" id="filter-status">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="locked">Locked</option>
                    </select>
                    <select class="admin-select" id="filter-size">
                        <option value="">All Sizes</option>
                        <option value="small">Small (&lt; 100)</option>
                        <option value="medium">Medium (100-1000)</option>
                        <option value="large">Large (&gt; 1000)</option>
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
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="memberCount-desc">Most Members</option>
                        <option value="memberCount-asc">Least Members</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Bulk Actions Bar (hidden by default) -->
        <div class="admin-bulk-actions-bar" id="bulk-actions-bar" style="display: none;">
            <div class="bulk-info">
                <span id="selected-count">0</span> servers selected
            </div>
            <div class="bulk-buttons">
                <button class="admin-btn admin-btn-sm admin-btn-ghost" data-bulk-action="lock">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
                    Lock Selected
                </button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost" data-bulk-action="unlock">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M11 7V5a3 3 0 00-5-2"/></svg>
                    Unlock Selected
                </button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost text-danger" data-bulk-action="delete">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
                    Delete Selected
                </button>
            </div>
        </div>

        <!-- Servers Table -->
        <div class="admin-card-body admin-card-body-table">
            <div class="admin-table-container">
                <table class="admin-table admin-table-hover" id="servers-table">
                    <thead>
                        <tr>
                            <th class="th-checkbox" style="width: 40px;">
                                <input type="checkbox" id="select-all-servers" class="admin-checkbox">
                            </th>
                            <th class="sortable" data-sort="id" style="width: 80px;">ID</th>
                            <th class="sortable" data-sort="name">Server</th>
                            <th class="sortable" data-sort="owner" style="width: 140px;">Owner</th>
                            <th class="sortable" data-sort="memberCount" style="width: 100px;">Members</th>
                            <th class="sortable" data-sort="channelCount" style="width: 100px;">Channels</th>
                            <th class="sortable" data-sort="status" style="width: 100px;">Status</th>
                            <th class="sortable" data-sort="createdAt" style="width: 120px;">Created</th>
                            <th class="sortable" data-sort="lastActivity" style="width: 120px;">Last Activity</th>
                            <th style="width: 120px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="servers-table-body">
                        <!-- Loading skeleton -->
                        <tr class="skeleton-row">
                            <td colspan="10">
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
                    Showing <span id="pagination-showing">0</span> of <span id="pagination-total">0</span> servers
                </div>
                <div class="pagination-controls">
                    <button class="admin-btn admin-btn-sm admin-btn-ghost" id="btn-prev-page" disabled>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 4L6 8l4 4"/></svg>
                    </button>
                    <div class="pagination-pages" id="pagination-pages"></div>
                    <button class="admin-btn admin-btn-sm admin-btn-ghost" id="btn-next-page">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 4l4 4-4 4"/></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- SERVER DETAIL MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="server-detail-modal" style="display: none;">
    <div class="admin-modal admin-modal-lg glass-modal server-detail-modal">
        <div class="admin-modal-header">
            <div class="modal-header-content">
                <div class="server-header-info">
                    <div class="server-avatar" id="modal-server-avatar">??</div>
                    <div class="server-header-text">
                        <h3 class="admin-modal-title" id="modal-server-name">Server Name</h3>
                        <p class="server-description" id="modal-server-description">Server description...</p>
                    </div>
                </div>
                <div class="server-header-badges">
                    <span class="badge" id="modal-server-status">Active</span>
                    <span class="badge badge-ghost" id="modal-server-visibility">Public</span>
                </div>
            </div>
            <button class="admin-modal-close" data-action="close-modal">&times;</button>
        </div>
        
        <!-- Modal Tabs -->
        <div class="admin-modal-tabs" id="server-modal-tabs">
            <button class="admin-tab active" data-tab="overview">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <rect x="2" y="2" width="12" height="12" rx="2"/>
                    <path d="M5 6h6M5 10h4"/>
                </svg>
                Overview
            </button>
            <button class="admin-tab" data-tab="reports">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <path d="M4 2v12"/>
                    <path d="M4 3h9l-2 3 2 3H4"/>
                </svg>
                Reports
                <span class="tab-badge" id="tab-reports-count" style="display: none;">0</span>
            </button>
            <button class="admin-tab" data-tab="audit-log">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <circle cx="8" cy="8" r="6"/>
                    <path d="M8 5v3l2 2"/>
                </svg>
                Audit Log
            </button>
            <button class="admin-tab" data-tab="actions">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <circle cx="8" cy="8" r="1"/>
                    <circle cx="8" cy="3" r="1"/>
                    <circle cx="8" cy="13" r="1"/>
                </svg>
                Admin Actions
            </button>
        </div>
        
        <div class="admin-modal-body">
            <!-- Tab Content: Overview -->
            <div class="admin-tab-content active" data-tab-content="overview">
                <!-- Quick Stats Grid -->
                <div class="server-quick-stats">
                    <div class="quick-stat-card">
                        <div class="quick-stat-icon stat-icon-blue">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="10" cy="6" r="3"/>
                                <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                            </svg>
                        </div>
                        <div class="quick-stat-content">
                            <div class="quick-stat-value" id="modal-member-count">0</div>
                            <div class="quick-stat-label">Members</div>
                        </div>
                    </div>
                    <div class="quick-stat-card">
                        <div class="quick-stat-icon stat-icon-purple">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M3 5h14M3 10h14M3 15h14"/>
                            </svg>
                        </div>
                        <div class="quick-stat-content">
                            <div class="quick-stat-value" id="modal-channel-count">0</div>
                            <div class="quick-stat-label">Channels</div>
                        </div>
                    </div>
                    <div class="quick-stat-card">
                        <div class="quick-stat-icon stat-icon-green">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="10" cy="10" r="7"/>
                                <path d="M10 6v4l3 2"/>
                            </svg>
                        </div>
                        <div class="quick-stat-content">
                            <div class="quick-stat-value" id="modal-role-count">0</div>
                            <div class="quick-stat-label">Roles</div>
                        </div>
                    </div>
                    <div class="quick-stat-card">
                        <div class="quick-stat-icon stat-icon-orange">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M4 2v12"/>
                                <path d="M4 3h10l-2 3 2 3H4"/>
                            </svg>
                        </div>
                        <div class="quick-stat-content">
                            <div class="quick-stat-value" id="modal-report-count">0</div>
                            <div class="quick-stat-label">Reports</div>
                        </div>
                    </div>
                </div>
                
                <!-- Server Details Section -->
                <div class="server-details-section">
                    <h4 class="section-title">Server Information</h4>
                    <div class="details-grid">
                        <div class="detail-row">
                            <span class="detail-label">Server ID</span>
                            <span class="detail-value" id="modal-server-id">--</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Created</span>
                            <span class="detail-value" id="modal-created-at">--</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Last Activity</span>
                            <span class="detail-value" id="modal-last-activity">--</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Max Members</span>
                            <span class="detail-value" id="modal-max-members">--</span>
                        </div>
                    </div>
                </div>
                
                <!-- Owner Section -->
                <div class="server-details-section">
                    <h4 class="section-title">Server Owner</h4>
                    <div class="owner-card">
                        <img class="owner-avatar" id="modal-owner-avatar" src="" alt="Owner">
                        <div class="owner-info">
                            <div class="owner-name" id="modal-owner-name">--</div>
                            <div class="owner-email" id="modal-owner-email">--</div>
                        </div>
                        <button class="admin-btn admin-btn-sm admin-btn-ghost" id="btn-view-owner">
                            View Profile
                        </button>
                    </div>
                </div>
                
                <!-- Lock Info (shown when locked) -->
                <div class="server-details-section lock-info-section" id="lock-info-section" style="display: none;">
                    <h4 class="section-title text-danger">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                            <rect x="3" y="7" width="10" height="7" rx="1"/>
                            <path d="M5 7V5a3 3 0 016 0v2"/>
                        </svg>
                        Server is Locked
                    </h4>
                    <div class="lock-details">
                        <div class="detail-row">
                            <span class="detail-label">Locked At</span>
                            <span class="detail-value" id="modal-locked-at">--</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Reason</span>
                            <span class="detail-value" id="modal-lock-reason">--</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tab Content: Reports -->
            <div class="admin-tab-content" data-tab-content="reports">
                <div class="reports-list" id="server-reports-list">
                    <div class="empty-state">
                        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                            <path d="M12 6v36"/>
                            <path d="M12 8h26l-6 8 6 8H12"/>
                        </svg>
                        <p>No reports for this server</p>
                    </div>
                </div>
                <button class="admin-btn admin-btn-ghost admin-btn-block" id="load-more-reports" style="display: none;">
                    Load More Reports
                </button>
            </div>
            
            <!-- Tab Content: Audit Log -->
            <div class="admin-tab-content" data-tab-content="audit-log">
                <div class="audit-timeline" id="server-audit-log">
                    <div class="empty-state">
                        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                            <circle cx="24" cy="24" r="18"/>
                            <path d="M24 14v10l6 6"/>
                        </svg>
                        <p>No audit log entries yet</p>
                    </div>
                </div>
                <button class="admin-btn admin-btn-ghost admin-btn-block" id="load-more-audit" style="display: none;">
                    Load More
                </button>
            </div>
            
            <!-- Tab Content: Admin Actions -->
            <div class="admin-tab-content" data-tab-content="actions">
                <!-- Server Lock/Unlock -->
                <div class="action-panel" id="lock-action-panel">
                    <h4 class="action-title">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
                            <rect x="3" y="7" width="10" height="7" rx="1"/>
                            <path d="M5 7V5a3 3 0 016 0v2"/>
                        </svg>
                        <span id="lock-action-title">Lock Server</span>
                    </h4>
                    <p class="action-description" id="lock-action-desc">
                        Locking a server will prevent all members from accessing it. The server will be hidden from public listings.
                    </p>
                    <div class="form-group">
                        <label class="form-label">Reason</label>
                        <textarea class="admin-input" id="lock-reason-input" rows="2" placeholder="Enter reason for locking..."></textarea>
                    </div>
                    <div class="action-buttons">
                        <button class="admin-btn admin-btn-warning" id="btn-toggle-lock">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
                            <span id="btn-lock-text">Lock Server</span>
                        </button>
                    </div>
                </div>
                
                <!-- Transfer Ownership -->
                <div class="action-panel">
                    <h4 class="action-title">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
                            <circle cx="5" cy="6" r="2"/>
                            <path d="M2 12c0-2 1.5-3 3-3"/>
                            <circle cx="11" cy="6" r="2"/>
                            <path d="M14 12c0-2-1.5-3-3-3"/>
                            <path d="M7 8h2M8 7v2"/>
                        </svg>
                        Transfer Ownership
                    </h4>
                    <p class="action-description">Transfer server ownership to another user. The current owner will become a regular member.</p>
                    <div class="form-group">
                        <label class="form-label required">New Owner (User ID)</label>
                        <input type="number" class="admin-input" id="transfer-user-id" placeholder="Enter user ID...">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reason</label>
                        <textarea class="admin-input" id="transfer-reason" rows="2" placeholder="Enter reason for transfer..."></textarea>
                    </div>
                    <div class="action-buttons">
                        <button class="admin-btn admin-btn-primary" id="btn-transfer-ownership">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h8M9 5l3 3-3 3"/></svg>
                            Transfer Ownership
                        </button>
                    </div>
                </div>
                
                <!-- Danger Zone -->
                <div class="action-panel danger-zone">
                    <h4 class="action-title text-danger">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
                            <path d="M8 1L1 14h14L8 1zM8 5v4M8 11v1"/>
                        </svg>
                        Danger Zone
                    </h4>
                    <p class="action-description text-danger">These actions are irreversible. Please be careful.</p>
                    <div class="form-group">
                        <label class="form-label required">Reason for Deletion</label>
                        <textarea class="admin-input" id="delete-reason" rows="2" placeholder="Enter reason for deletion..."></textarea>
                    </div>
                    <div class="action-buttons">
                        <button class="admin-btn admin-btn-danger" id="btn-delete-server">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
                            Force Delete Server
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
<!-- QUICK LOCK MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="quick-lock-modal" style="display: none;">
    <div class="admin-modal admin-modal-sm glass-modal">
        <div class="admin-modal-header">
            <h3 class="admin-modal-title">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18" style="margin-right: 8px; vertical-align: -3px;">
                    <rect x="3" y="7" width="10" height="7" rx="1"/>
                    <path d="M5 7V5a3 3 0 016 0v2"/>
                </svg>
                <span id="quick-lock-title">Lock Server</span>
            </h3>
            <button class="admin-modal-close" data-action="close-quick-lock">&times;</button>
        </div>
        <div class="admin-modal-body">
            <div class="quick-lock-server-info">
                <div class="server-avatar" id="quick-lock-avatar">??</div>
                <div>
                    <div class="server-name" id="quick-lock-server-name">Server Name</div>
                    <div class="server-meta" id="quick-lock-server-meta">0 members</div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label required">Reason</label>
                <textarea class="admin-input" id="quick-lock-reason" rows="3" 
                    placeholder="Enter the reason for locking this server..." required></textarea>
                <small class="form-hint">This reason will be logged in the audit log.</small>
            </div>
        </div>
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-quick-lock">Cancel</button>
            <button class="admin-btn admin-btn-warning" id="btn-confirm-quick-lock">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
                Lock Server
            </button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- CONFIRM DELETE MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="confirm-delete-modal" style="display: none;">
    <div class="admin-modal admin-modal-sm glass-modal">
        <div class="admin-modal-header">
            <h3 class="admin-modal-title text-danger">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18" style="margin-right: 8px; vertical-align: -3px;">
                    <path d="M8 1L1 14h14L8 1zM8 5v4M8 11v1"/>
                </svg>
                Confirm Deletion
            </h3>
            <button class="admin-modal-close" data-action="close-confirm-delete">&times;</button>
        </div>
        <div class="admin-modal-body">
            <p class="confirm-message">
                Are you sure you want to permanently delete <strong id="confirm-delete-server-name">this server</strong>?
            </p>
            <div class="warning-box">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
                    <path d="M8 1L1 14h14L8 1zM8 5v4M8 11v1"/>
                </svg>
                <div>
                    <strong>This action cannot be undone.</strong>
                    <p>All channels, messages, roles, and member data will be permanently deleted.</p>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label required">Type the server name to confirm</label>
                <input type="text" class="admin-input" id="confirm-delete-input" placeholder="Enter server name...">
            </div>
        </div>
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-confirm-delete">Cancel</button>
            <button class="admin-btn admin-btn-danger" id="btn-confirm-delete" disabled>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
                Delete Permanently
            </button>
        </div>
    </div>
</div>
