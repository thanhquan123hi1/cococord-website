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
        <div class="admin-stat-card admin-stat-card-sm clickable" data-filter-status="suspended">
            <div class="stat-icon stat-icon-orange">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="5" y="3" width="10" height="14" rx="1"/>
                    <path d="M8 7h4M8 10h4M8 13h2"/>
                    <path d="M15 5l2 2-2 2"/>
                </svg>
            </div>
            <div class="stat-content">
                <div class="stat-label">Suspended</div>
                <div class="stat-value text-danger" id="stat-suspended-servers">--</div>
            </div>
        </div>
    </div>

    <!-- Servers List (Search + Bulk Actions + Table) -->
    <div class="admin-card admin-servers-card">
        <div class="servers-card-header">
            <h2 class="servers-card-title">Servers</h2>
            <button class="servers-card-more" type="button" aria-label="More options">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                    <circle cx="8" cy="3" r="1" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="13" r="1" fill="currentColor" stroke="none" />
                </svg>
            </button>
        </div>
        <div class="admin-toolbar admin-servers-toolbar">
            <div class="admin-toolbar-left">
                <div class="admin-search admin-search-lg">
                    <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="4"/>
                        <path d="M10 10l4 4"/>
                    </svg>
                    <input type="text" placeholder="Search by server name, owner (@username), or ID..." id="server-search-input">
                </div>
            </div>
            <div class="admin-toolbar-right">
                <div class="admin-filter-group">
                    <select class="admin-select" id="filter-status">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="locked">Locked</option>
                        <option value="suspended">Suspended</option>
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
            <!-- Filter Results Count -->
            <div class="filter-results-info" id="filter-results-count" style="display: none;"></div>
            
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
<!-- CONTEXT MENU (Right Click) -->
<!-- ================================== -->
<div class="server-context-menu" id="server-context-menu" style="display: none;">
    <div class="context-menu-item" data-action="view-details">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/></svg>
        View Details
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" data-action="lock-server">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
        Lock Server
    </div>
    <div class="context-menu-item" data-action="unlock-server" style="display: none;">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M11 7V5a3 3 0 00-5-2"/></svg>
        Unlock Server
    </div>
    <div class="context-menu-item text-warning" data-action="suspend-server">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M6 6l4 4M10 6l-4 4"/></svg>
        Suspend Server
    </div>
    <div class="context-menu-item text-success" data-action="unsuspend-server" style="display: none;">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M6 8l2 2 4-4"/></svg>
        Unsuspend Server
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" data-action="view-audit">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
        View Audit Log
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item text-danger" data-action="delete-server">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
        Force Delete
    </div>
</div>

<!-- ================================== -->
<!-- SERVER DETAIL MODAL (Horizontal Layout) -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="server-detail-modal" style="display: none;">
    <div class="admin-modal admin-modal-xl glass-modal server-detail-modal server-detail-horizontal">
        <!-- Close Button -->
        <button class="admin-modal-close" data-action="close-modal">&times;</button>
        
        <div class="server-detail-layout">
            <!-- ====== LEFT SIDEBAR (30-35%) ====== -->
            <div class="server-detail-sidebar">
                <!-- Server Icon & Name -->
                <div class="server-profile">
                    <div class="server-avatar-large" id="modal-server-avatar">??</div>
                    <h2 class="server-profile-name" id="modal-server-name">Server Name</h2>
                    <p class="server-profile-desc" id="modal-server-description">Server description...</p>
                </div>
                
                <!-- Status Badges -->
                <div class="server-badges">
                    <div class="server-badge-item">
                        <span class="badge badge-lg" id="modal-server-status">Active</span>
                    </div>
                    <div class="server-badge-item">
                        <span class="badge badge-lg badge-ghost" id="modal-server-visibility">Public</span>
                    </div>
                    <div class="server-badge-item" id="risk-badge-item" style="display: none;">
                        <span class="badge badge-lg" id="modal-server-risk">Low Risk</span>
                    </div>
                </div>
                
                <!-- Quick Stats -->
                <div class="server-sidebar-stats">
                    <div class="sidebar-stat">
                        <div class="sidebar-stat-icon stat-icon-blue">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="10" cy="6" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                            </svg>
                        </div>
                        <div class="sidebar-stat-info">
                            <span class="sidebar-stat-value" id="modal-member-count">0</span>
                            <span class="sidebar-stat-label">Members</span>
                        </div>
                    </div>
                    <div class="sidebar-stat">
                        <div class="sidebar-stat-icon stat-icon-purple">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M3 5h14M3 10h14M3 15h14"/>
                            </svg>
                        </div>
                        <div class="sidebar-stat-info">
                            <span class="sidebar-stat-value" id="modal-channel-count">0</span>
                            <span class="sidebar-stat-label">Channels</span>
                        </div>
                    </div>
                    <div class="sidebar-stat">
                        <div class="sidebar-stat-icon stat-icon-green">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/>
                            </svg>
                        </div>
                        <div class="sidebar-stat-info">
                            <span class="sidebar-stat-value" id="modal-role-count">0</span>
                            <span class="sidebar-stat-label">Roles</span>
                        </div>
                    </div>
                    <div class="sidebar-stat">
                        <div class="sidebar-stat-icon stat-icon-orange">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M4 2v12"/><path d="M4 3h10l-2 3 2 3H4"/>
                            </svg>
                        </div>
                        <div class="sidebar-stat-info">
                            <span class="sidebar-stat-value" id="modal-report-count">0</span>
                            <span class="sidebar-stat-label">Reports</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ====== RIGHT CONTENT (65-70%) ====== -->
            <div class="server-detail-content">
                <!-- Tabs -->
                <div class="admin-modal-tabs horizontal-tabs" id="server-modal-tabs">
                    <button class="admin-tab active" data-tab="overview">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                            <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 10h4"/>
                        </svg>
                        Overview
                    </button>
                    <button class="admin-tab" data-tab="reports">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                            <path d="M4 2v12"/><path d="M4 3h9l-2 3 2 3H4"/>
                        </svg>
                        Reports
                        <span class="tab-badge" id="tab-reports-count" style="display: none;">0</span>
                    </button>
                    <button class="admin-tab" data-tab="audit-log">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                            <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
                        </svg>
                        Audit Log
                    </button>
                    <button class="admin-tab" data-tab="actions">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                            <circle cx="8" cy="8" r="1"/><circle cx="8" cy="3" r="1"/><circle cx="8" cy="13" r="1"/>
                        </svg>
                        Admin Actions
                    </button>
                </div>
                
                <div class="server-tab-body">
                    <!-- Tab Content: Overview -->
                    <div class="admin-tab-content active" data-tab-content="overview">
                        <!-- Server Details Section -->
                        <div class="server-details-section">
                            <h4 class="section-title">
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                                    <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 10h4"/>
                                </svg>
                                Server Information
                            </h4>
                            <div class="details-grid details-grid-3">
                                <div class="detail-card">
                                    <span class="detail-label">Server ID</span>
                                    <span class="detail-value" id="modal-server-id">--</span>
                                </div>
                                <div class="detail-card">
                                    <span class="detail-label">Created</span>
                                    <span class="detail-value" id="modal-created-at">--</span>
                                </div>
                                <div class="detail-card">
                                    <span class="detail-label">Last Activity</span>
                                    <span class="detail-value" id="modal-last-activity">--</span>
                                </div>
                                <div class="detail-card">
                                    <span class="detail-label">Max Members</span>
                                    <span class="detail-value" id="modal-max-members">--</span>
                                </div>
                                <div class="detail-card">
                                    <span class="detail-label">Message Volume</span>
                                    <span class="detail-value" id="modal-message-volume">--</span>
                                </div>
                                <div class="detail-card">
                                    <span class="detail-label">Server Boost</span>
                                    <span class="detail-value" id="modal-boost-level">Level 0</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Owner Section -->
                        <div class="server-details-section">
                            <h4 class="section-title">
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                                    <circle cx="8" cy="5" r="3"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
                                </svg>
                                Server Owner
                            </h4>
                            <div class="owner-card-horizontal">
                                <img class="owner-avatar" id="modal-owner-avatar" src="" alt="Owner">
                                <div class="owner-info">
                                    <div class="owner-name" id="modal-owner-name">--</div>
                                    <div class="owner-email" id="modal-owner-email">--</div>
                                </div>
                                <button class="admin-btn admin-btn-sm admin-btn-primary" id="btn-view-owner">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                                        <circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/>
                                    </svg>
                                    View Profile
                                </button>
                            </div>
                        </div>
                        
                        <!-- Lock Info (shown when locked) -->
                        <div class="server-details-section lock-info-section" id="lock-info-section" style="display: none;">
                            <h4 class="section-title text-danger">
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                                    <rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/>
                                </svg>
                                Server is Locked
                            </h4>
                            <div class="lock-details-card">
                                <div class="lock-detail-row">
                                    <span class="detail-label">Locked At</span>
                                    <span class="detail-value" id="modal-locked-at">--</span>
                                </div>
                                <div class="lock-detail-row">
                                    <span class="detail-label">Reason</span>
                                    <span class="detail-value lock-reason-text" id="modal-lock-reason">--</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tab Content: Reports -->
                    <div class="admin-tab-content" data-tab-content="reports">
                        <div class="reports-header">
                            <div class="reports-summary">
                                <span class="reports-summary-count" id="reports-total-count">0</span>
                                <span class="reports-summary-label">Total Reports</span>
                            </div>
                            <div class="reports-status-filter">
                                <span class="badge" id="reports-status-badge">No Reports</span>
                            </div>
                        </div>
                        <div class="reports-list" id="server-reports-list">
                            <div class="empty-state">
                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                                    <path d="M12 6v36"/><path d="M12 8h26l-6 8 6 8H12"/>
                                </svg>
                                <p>No reports for this server</p>
                            </div>
                        </div>
                        <button class="admin-btn admin-btn-ghost admin-btn-block" id="btn-go-reports" style="display: none;">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                                <path d="M4 8h8M9 5l3 3-3 3"/>
                            </svg>
                            Go to Reports Page
                        </button>
                    </div>
                    
                    <!-- Tab Content: Audit Log -->
                    <div class="admin-tab-content" data-tab-content="audit-log">
                        <div class="audit-timeline" id="server-audit-log">
                            <div class="empty-state">
                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                                    <circle cx="24" cy="24" r="18"/><path d="M24 14v10l6 6"/>
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
                        <div class="admin-actions-grid">
                            <!-- Lock/Unlock Action -->
                            <div class="action-card" id="lock-action-card">
                                <div class="action-card-icon action-icon-warning">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <rect x="4" y="9" width="12" height="9" rx="1.5"/><path d="M6 9V6a4 4 0 018 0v3"/>
                                    </svg>
                                </div>
                                <div class="action-card-content">
                                    <h4 class="action-card-title" id="lock-action-title">Lock Server</h4>
                                    <p class="action-card-desc" id="lock-action-desc">Prevent all members from accessing this server.</p>
                                </div>
                                <button class="admin-btn admin-btn-warning action-card-btn" id="btn-open-lock-modal">
                                    <span id="btn-lock-text">Lock</span>
                                </button>
                            </div>
                            
                            <!-- Suspend Action -->
                            <div class="action-card" id="suspend-action-card">
                                <div class="action-card-icon action-icon-orange">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <circle cx="10" cy="10" r="8"/><path d="M7 7l6 6M13 7l-6 6"/>
                                    </svg>
                                </div>
                                <div class="action-card-content">
                                    <h4 class="action-card-title" id="suspend-action-title">Suspend Server</h4>
                                    <p class="action-card-desc" id="suspend-action-desc">Temporarily disable this server with an expiry time.</p>
                                </div>
                                <button class="admin-btn admin-btn-warning action-card-btn" id="btn-open-suspend-modal">
                                    <span id="btn-suspend-text">Suspend</span>
                                </button>
                            </div>
                            
                            <!-- Transfer Ownership -->
                            <div class="action-card">
                                <div class="action-card-icon action-icon-blue">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <circle cx="6" cy="7" r="2.5"/><path d="M3 14c0-2.5 1.5-4 3-4"/>
                                        <circle cx="14" cy="7" r="2.5"/><path d="M17 14c0-2.5-1.5-4-3-4"/>
                                        <path d="M9 10h2M10 9v2"/>
                                    </svg>
                                </div>
                                <div class="action-card-content">
                                    <h4 class="action-card-title">Transfer Ownership</h4>
                                    <p class="action-card-desc">Transfer server ownership to another user.</p>
                                </div>
                                <button class="admin-btn admin-btn-primary action-card-btn" id="btn-open-transfer-modal">
                                    Transfer
                                </button>
                            </div>
                            
                            <!-- Delete Server (Danger) -->
                            <div class="action-card action-card-danger">
                                <div class="action-card-icon action-icon-danger">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <path d="M4 5h12M8 5V3h4v2M6 5v11h8V5"/>
                                    </svg>
                                </div>
                                <div class="action-card-content">
                                    <h4 class="action-card-title">Force Delete Server</h4>
                                    <p class="action-card-desc">Permanently delete this server and all data.</p>
                                </div>
                                <button class="admin-btn admin-btn-danger action-card-btn" id="btn-open-delete-modal">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- LOCK SERVER MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="quick-lock-modal" style="display: none;">
    <div class="admin-modal admin-modal-sm glass-modal action-modal">
        <div class="action-modal-header action-header-warning">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="5" y="11" width="14" height="10" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
            </div>
            <h3 class="action-modal-title" id="quick-lock-title">Lock Server</h3>
            <p class="action-modal-subtitle">This action will restrict all member access</p>
        </div>
        <button class="admin-modal-close" data-action="close-quick-lock">&times;</button>
        
        <div class="admin-modal-body">
            <div class="action-target-card">
                <div class="server-avatar" id="quick-lock-avatar">??</div>
                <div class="action-target-info">
                    <span class="action-target-name" id="quick-lock-server-name">Server Name</span>
                    <span class="action-target-meta" id="quick-lock-server-meta">0 members</span>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label required">Reason for locking</label>
                <textarea class="admin-input" id="quick-lock-reason" rows="3" 
                    placeholder="Explain why this server is being locked..." required></textarea>
                <small class="form-hint">This will be recorded in the audit log and shown to users.</small>
            </div>
        </div>
        
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-quick-lock">Cancel</button>
            <button class="admin-btn admin-btn-warning" id="btn-confirm-quick-lock">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/>
                </svg>
                Lock Server
            </button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- SUSPEND SERVER MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="suspend-modal" style="display: none;">
    <div class="admin-modal admin-modal-sm glass-modal action-modal">
        <div class="action-modal-header action-header-orange">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 8l8 8M16 8l-8 8"/>
                </svg>
            </div>
            <h3 class="action-modal-title">Suspend Server</h3>
            <p class="action-modal-subtitle">Temporarily disable this server</p>
        </div>
        <button class="admin-modal-close" data-action="close-suspend">&times;</button>
        
        <div class="admin-modal-body">
            <div class="action-target-card">
                <div class="server-avatar" id="suspend-avatar">??</div>
                <div class="action-target-info">
                    <span class="action-target-name" id="suspend-server-name">Server Name</span>
                    <span class="action-target-meta" id="suspend-server-meta">0 members</span>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label required">Suspension Duration</label>
                <select class="admin-select" id="suspend-duration">
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7" selected>7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="permanent">Permanent</option>
                </select>
                <small class="form-hint">Select how long the server will be suspended. Permanent suspension requires manual unsuspension.</small>
            </div>
            
            <div class="form-group">
                <label class="form-label required">Reason for suspension</label>
                <textarea class="admin-input" id="suspend-reason" rows="3" 
                    placeholder="Explain why this server is being suspended..." required></textarea>
            </div>
        </div>
        
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-suspend">Cancel</button>
            <button class="admin-btn admin-btn-warning" id="btn-confirm-suspend">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <circle cx="8" cy="8" r="6"/><path d="M6 6l4 4M10 6l-4 4"/>
                </svg>
                Suspend Server
            </button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- TRANSFER OWNERSHIP MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="transfer-modal" style="display: none;">
    <div class="admin-modal admin-modal-sm glass-modal action-modal">
        <div class="action-modal-header action-header-blue">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="7" cy="8" r="3"/>
                    <path d="M3 18c0-3 2-5 4-5"/>
                    <circle cx="17" cy="8" r="3"/>
                    <path d="M21 18c0-3-2-5-4-5"/>
                    <path d="M10 12h4M12 10v4"/>
                </svg>
            </div>
            <h3 class="action-modal-title">Transfer Ownership</h3>
            <p class="action-modal-subtitle">Reassign this server to a different owner</p>
        </div>
        <button class="admin-modal-close" data-action="close-transfer">&times;</button>
        
        <div class="admin-modal-body">
            <div class="action-target-card">
                <div class="server-avatar" id="transfer-avatar">??</div>
                <div class="action-target-info">
                    <span class="action-target-name" id="transfer-server-name">Server Name</span>
                    <span class="action-target-meta">Current owner: <span id="transfer-current-owner">--</span></span>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label required">New Owner (User ID)</label>
                <input type="number" class="admin-input" id="transfer-user-id" placeholder="Enter user ID...">
                <small class="form-hint">The current owner will become a regular member.</small>
            </div>
            
            <div class="form-group">
                <label class="form-label required">Reason for transfer</label>
                <textarea class="admin-input" id="transfer-reason" rows="3" 
                    placeholder="Explain why ownership is being transferred..." required></textarea>
            </div>
        </div>
        
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-transfer">Cancel</button>
            <button class="admin-btn admin-btn-primary" id="btn-confirm-transfer">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <path d="M4 8h8M9 5l3 3-3 3"/>
                </svg>
                Transfer Ownership
            </button>
        </div>
    </div>
</div>

<!-- ================================== -->
<!-- CONFIRM DELETE MODAL -->
<!-- ================================== -->
<div class="admin-modal-backdrop glass-backdrop" id="confirm-delete-modal" style="display: none;">
    <div class="admin-modal admin-modal-sm glass-modal action-modal">
        <div class="action-modal-header action-header-danger">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2L2 20h20L12 2z"/>
                    <path d="M12 9v4M12 17v.01"/>
                </svg>
            </div>
            <h3 class="action-modal-title">Delete Server</h3>
            <p class="action-modal-subtitle">This action is permanent and cannot be undone</p>
        </div>
        <button class="admin-modal-close" data-action="close-confirm-delete">&times;</button>
        
        <div class="admin-modal-body">
            <div class="action-target-card action-target-danger">
                <div class="server-avatar" id="delete-avatar">??</div>
                <div class="action-target-info">
                    <span class="action-target-name" id="delete-server-name">Server Name</span>
                    <span class="action-target-meta" id="delete-server-meta">0 members · 0 channels</span>
                </div>
            </div>
            
            <div class="warning-box warning-box-danger">
                <div class="warning-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M10 2L2 17h16L10 2zM10 7v4M10 13v.01"/>
                    </svg>
                </div>
                <div class="warning-content">
                    <strong>This will permanently delete:</strong>
                    <ul>
                        <li>All channels and messages</li>
                        <li>All roles and permissions</li>
                        <li>All member data and history</li>
                    </ul>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label required">Reason for deletion</label>
                <textarea class="admin-input" id="delete-reason" rows="2" 
                    placeholder="Enter reason for deletion..." required></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label required">Type <strong id="confirm-delete-server-name-label">server name</strong> to confirm</label>
                <input type="text" class="admin-input" id="confirm-delete-input" placeholder="Enter server name...">
            </div>
        </div>
        
        <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-ghost" data-action="close-confirm-delete">Cancel</button>
            <button class="admin-btn admin-btn-danger" id="btn-confirm-delete" disabled>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/>
                </svg>
                Delete Permanently
            </button>
        </div>
    </div>
</div>
