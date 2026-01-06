<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "Servers"); %>

<title>Server Management - CoCoCord Admin</title>
<link rel="stylesheet" href="${pageContext.request.contextPath}/admin/css/servers.css">
<link rel="stylesheet" href="${pageContext.request.contextPath}/admin/css/server-detail-modal.css">

<div class="flex flex-col gap-6">
    <!-- Header Actions -->
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-semibold">Server Management</h1>
            <p class="text-secondary">Manage all servers on the platform</p>
        </div>
        <div class="flex gap-3">
            <button class="btn btn-secondary" id="exportBtn">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
                    <path d="M16 12v4H2v-4M9 2v10m0-10L5 6m4-4l4 4"/>
                </svg>
                Export
            </button>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="cards-4">
        <div class="stat-card">
            <div class="label">Total Servers</div>
            <div class="value">10,293</div>
            <div class="delta up">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                </svg>
                <span>+1.3% this month</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="label">Active Servers</div>
            <div class="value">9,870</div>
            <div class="delta up">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                </svg>
                <span>+2.1% this month</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="label">Inactive Servers</div>
            <div class="value">398</div>
            <div class="delta down">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 3v6m0 0l3-3m-3 3L3 6"/>
                </svg>
                <span>-15.2% this month</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="label">New Today</div>
            <div class="value">25</div>
            <div class="delta up">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9V3m0 0L3 6m3-3l3 3"/>
                </svg>
                <span>+5 vs yesterday</span>
            </div>
        </div>
    </div>

    <!-- Filters & Search -->
    <div class="admin-panel white">
        <div class="flex flex-wrap gap-4 items-center">
            <div class="search-box" style="flex:1;min-width:250px;">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="8" cy="8" r="5"/>
                    <path d="M12 12l4 4"/>
                </svg>
                <input type="text" id="searchServers" placeholder="Search servers by name, owner...">
            </div>
            <div class="filter-group">
                <label class="filter-label">Status:</label>
                <select class="filter-select" id="filterStatus">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Size:</label>
                <select class="filter-select" id="filterSize">
                    <option value="">All Sizes</option>
                    <option value="small">Small (< 100)</option>
                    <option value="medium">Medium (100-1K)</option>
                    <option value="large">Large (1K-10K)</option>
                    <option value="xlarge">XLarge (> 10K)</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Sort:</label>
                <select class="filter-select" id="sortBy">
                    <option value="members-desc">Most Members</option>
                    <option value="members-asc">Least Members</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Servers Table -->
    <div class="admin-panel white">
        <div class="section-title">
            <div class="flex items-center gap-2">
                <h3>All Servers</h3>
                <span class="badge badge-default" id="totalCount">8 servers</span>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-sm" id="viewGrid" title="Grid View">
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
                        <rect x="2" y="2" width="5" height="5" rx="1"/>
                        <rect x="11" y="2" width="5" height="5" rx="1"/>
                        <rect x="2" y="11" width="5" height="5" rx="1"/>
                        <rect x="11" y="11" width="5" height="5" rx="1"/>
                    </svg>
                </button>
                <button class="btn btn-ghost btn-sm active" id="viewList" title="List View">
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
                        <path d="M2 4h14M2 9h14M2 14h14"/>
                    </svg>
                </button>
                <button class="btn btn-ghost btn-sm" id="refreshBtn" title="Refresh">
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
                        <path d="M2 9a7 7 0 0112-5m2 5a7 7 0 01-12 5"/>
                        <path d="M14 4v3h-3M4 14v-3h3"/>
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- Bulk Actions Bar -->
        <div class="bulk-actions-bar" id="bulk-actions-bar">
            <div class="bulk-info">
                <span class="bulk-count"><span id="selected-count">0</span> servers selected</span>
            </div>
            <div class="bulk-actions">
                <button class="bulk-btn primary" data-bulk-action="lock">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
                    Lock Selected
                </button>
                <button class="bulk-btn primary" data-bulk-action="unlock">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M11 7V5a3 3 0 00-5-2"/></svg>
                    Unlock Selected
                </button>
                <button class="bulk-btn danger" data-bulk-action="delete">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
                    Delete Selected
                </button>
            </div>
        </div>
        <table class="table figma-table" id="serversTable" aria-label="Servers list">
            <thead>
            <tr>
                <th style="width: 40px;">
                    <input type="checkbox" id="selectAll" class="checkbox">
                </th>
                <th style="width: 70px;">ID</th>
                <th>Server</th>
                <th>Owner</th>
                <th style="width: 100px;">Members</th>
                <th style="width: 90px;">Channels</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 120px;">Created</th>
                <th style="width: 130px;">Last Activity</th>
                <th style="width: 120px;">Actions</th>
            </tr>
            </thead>
            <tbody id="serversTableBody">
            <!-- Content populated by JavaScript -->
            <tr>
                <td colspan="10" class="text-center py-8">
                    <div class="loading-spinner"></div>
                    <p class="text-muted mt-2">Loading servers...</p>
                </td>
            </tr>
            </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination">
            <div class="pagination-info">
                Showing <strong>1-6</strong> of <strong>423</strong> servers
            </div>
            <div class="pagination-buttons">
                <button class="pagination-btn" disabled>
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M11 4L6 9l5 5"/>
                    </svg>
                </button>
                <button class="pagination-btn active">1</button>
                <button class="pagination-btn">2</button>
                <button class="pagination-btn">3</button>
                <span class="pagination-ellipsis">...</span>
                <button class="pagination-btn">71</button>
                <button class="pagination-btn">
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M7 4l5 5-5 5"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Server Detail Modal -->
<div class="modal-overlay" id="serverModal" style="display:none;">
    <div class="modal modal-lg">
        <div class="modal-header">
            <h3 class="modal-title">Server Details</h3>
            <button class="modal-close" onclick="closeModal('serverModal')">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4l10 10M14 4L4 14"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <div class="server-detail-header">
                <div class="avatar-lg server-avatar" id="modalAvatar">VG</div>
                <div class="server-detail-info">
                    <h4 id="modalName">Vietnam Gamers</h4>
                    <p id="modalDescription">Gaming community for Vietnamese</p>
                    <div class="flex gap-2 mt-2">
                        <span class="badge badge-success" id="modalStatus">Active</span>
                    </div>
                </div>
            </div>
            <div class="server-stats-grid">
                <div class="server-stat-item">
                    <div class="server-stat-value" id="modalMembers">15,420</div>
                    <div class="server-stat-label">Members</div>
                </div>
                <div class="server-stat-item">
                    <div class="server-stat-value" id="modalChannels">45</div>
                    <div class="server-stat-label">Channels</div>
                </div>
                <div class="server-stat-item">
                    <div class="server-stat-value" id="modalMessages">1.2M</div>
                    <div class="server-stat-label">Messages</div>
                </div>
                <div class="server-stat-item">
                    <div class="server-stat-value" id="modalCreated">Mar 15</div>
                    <div class="server-stat-label">Created</div>
                </div>
            </div>
            <div class="server-owner-info">
                <h5>Owner</h5>
                <div class="cell-user">
                    <div class="avatar">NV</div>
                    <div class="cell-user-info">
                        <span class="cell-user-name" id="modalOwnerName">Nguyễn Văn A</span>
                        <span class="cell-user-email" id="modalOwnerEmail">@nguyenvana</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('serverModal')">Close</button>
            <button class="btn btn-warning">Suspend Server</button>
            <button class="btn btn-primary">Edit Server</button>
        </div>
    </div>
</div>

<!-- Context Menu - Dark Theme -->
<div class="server-context-menu" id="server-context-menu" style="display:none;">
    <!-- Header with server name -->
    <div class="context-menu-header" id="ctx-header">
        <div class="context-menu-header-title" id="ctx-server-name">Server Name</div>
        <div class="context-menu-header-subtitle" id="ctx-server-id">ID: #0</div>
    </div>
    
    <div class="context-menu-item" id="ctx-view-details">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2"/><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/></svg>
        <span>View Details</span>
        <span class="context-menu-hint">Enter</span>
    </div>
    
    <div class="context-menu-divider"></div>
    
    <div class="context-menu-item warning" id="ctx-lock">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
        <span>Lock Server</span>
    </div>
    <div class="context-menu-item success" id="ctx-unlock" style="display:none;">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M11 7V5a3 3 0 00-5-2"/></svg>
        <span>Unlock Server</span>
    </div>
    
    <div class="context-menu-item warning" id="ctx-suspend">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 10v1"/></svg>
        <span>Suspend Server</span>
    </div>
    <div class="context-menu-item success" id="ctx-unsuspend" style="display:none;">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 8l2 2 4-4"/><circle cx="8" cy="8" r="6"/></svg>
        <span>Unsuspend Server</span>
    </div>
    
    <div class="context-menu-divider"></div>
    
    <div class="context-menu-item danger" id="ctx-delete">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
        <span>Force Delete</span>
        <span class="context-menu-hint">Del</span>
    </div>
    
    <div class="context-menu-divider"></div>
    
    <div class="context-menu-item" id="ctx-audit-log">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
        <span>View Audit Log</span>
    </div>
</div>

<!-- New Server Detail Modal (Horizontal) - Figma Style -->
<div class="admin-modal-backdrop" id="server-detail-modal" style="display:none;">
    <div class="admin-modal server-detail-horizontal">
        <button class="admin-modal-close" data-action="close-modal">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l10 10M13 3L3 13"/></svg>
        </button>
        
        <div class="server-detail-layout">
            <!-- Left Sidebar -->
            <div class="server-detail-sidebar">
                <div class="server-profile">
                    <div class="server-avatar-large" id="detail-server-avatar">??</div>
                    <h2 class="server-profile-name" id="detail-server-name">Server Name</h2>
                    <p class="server-profile-desc" id="detail-server-desc">Server description...</p>
                    <div class="server-badges" id="detail-server-badges">
                        <span class="figma-badge in-progress">Active</span>
                        <span class="figma-badge locked">Public</span>
                    </div>
                </div>
                
                <div class="server-sidebar-stats">
                    <div class="sidebar-stat">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></svg>
                        <span id="detail-member-count">0</span>
                        <span class="stat-label">MEMBERS</span>
                    </div>
                    <div class="sidebar-stat">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M2 8h12M2 12h8"/></svg>
                        <span id="detail-channel-count">0</span>
                        <span class="stat-label">CHANNELS</span>
                    </div>
                    <div class="sidebar-stat">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>
                        <span id="detail-role-count">0</span>
                        <span class="stat-label">ROLES</span>
                    </div>
                    <div class="sidebar-stat">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v8H4V6M2 6h12M6 6V4h4v2"/></svg>
                        <span id="detail-report-count">0</span>
                        <span class="stat-label">REPORTS</span>
                    </div>
                </div>
            </div>
            
            <!-- Right Content -->
            <div class="server-detail-content">
                <!-- Figma-style Tabs with Icons -->
                <div class="horizontal-tabs" id="server-modal-tabs">
                    <button class="tab-btn active" data-tab="overview">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12"/></svg>
                        Overview
                    </button>
                    <button class="tab-btn" data-tab="reports">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v8H4V6M2 6h12M6 6V4h4v2"/></svg>
                        Reports
                        <span class="tab-badge" id="tab-reports-count" style="display:none;">0</span>
                    </button>
                    <button class="tab-btn" data-tab="audit-log">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                        Audit Log
                    </button>
                    <button class="tab-btn" data-tab="actions">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="1"/><circle cx="8" cy="3" r="1"/><circle cx="8" cy="13" r="1"/></svg>
                        Admin Actions
                    </button>
                </div>
                
                <div class="server-tab-body">
                    <!-- Overview Tab -->
                    <div class="admin-tab-content active" data-tab-content="overview">
                        <div class="detail-section">
                            <h4 class="section-title">SERVER INFORMATION</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">SERVER ID</span>
                                    <span class="info-value" id="detail-server-id">--</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">CREATED</span>
                                    <span class="info-value" id="detail-created-at">--</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">LAST ACTIVITY</span>
                                    <span class="info-value" id="detail-last-activity">--</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">MAX MEMBERS</span>
                                    <span class="info-value" id="detail-max-members">--</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">MESSAGE VOLUME</span>
                                    <span class="info-value" id="detail-message-volume">--</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">SERVER BOOST</span>
                                    <span class="info-value" id="detail-boost-level">Level 0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4 class="section-title">SERVER OWNER</h4>
                            <div class="owner-card">
                                <div class="owner-avatar" id="detail-owner-avatar">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></svg>
                                </div>
                                <div class="owner-info">
                                    <span class="owner-name" id="detail-owner-name">Owner</span>
                                    <span class="owner-email" id="detail-owner-email">--</span>
                                </div>
                                <button class="btn btn-ghost btn-sm" id="btn-view-owner">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/></svg>
                                    View Profile
                                </button>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <div class="reports-summary">
                                <div class="reports-summary-left">
                                    <span class="reports-summary-count" id="detail-total-reports">0</span>
                                    <span class="reports-summary-label">Total Reports</span>
                                </div>
                                <span class="figma-badge rejected" id="detail-reports-status">No Reports</span>
                            </div>
                        </div>
                        
                        <div class="detail-section" id="detail-lock-info" style="display:none;">
                            <h4 class="section-title" style="color: #F59E0B;">LOCK INFORMATION</h4>
                            <div class="info-grid" style="grid-template-columns: repeat(2, 1fr);">
                                <div class="info-item" style="background: rgba(245, 158, 11, 0.05);">
                                    <span class="info-label">LOCKED AT</span>
                                    <span class="info-value" id="detail-locked-at">--</span>
                                </div>
                                <div class="info-item" style="background: rgba(245, 158, 11, 0.05);">
                                    <span class="info-label">REASON</span>
                                    <span class="info-value" id="detail-lock-reason">--</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section" id="detail-suspend-info" style="display:none;">
                            <h4 class="section-title" style="color: #EF4444;">SUSPENSION INFORMATION</h4>
                            <div class="info-grid" style="grid-template-columns: repeat(2, 1fr);">
                                <div class="info-item" style="background: rgba(239, 68, 68, 0.05);">
                                    <span class="info-label">SUSPENDED AT</span>
                                    <span class="info-value" id="detail-suspended-at">--</span>
                                </div>
                                <div class="info-item" style="background: rgba(239, 68, 68, 0.05);">
                                    <span class="info-label">REASON</span>
                                    <span class="info-value" id="detail-suspend-reason">--</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Audit Log Preview in Overview -->
                        <div class="detail-section">
                            <div class="empty-state" id="overview-audit-empty">
                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="24" cy="24" r="18"/><path d="M24 14v10l6 6"/>
                                </svg>
                                <p>No audit log entries yet</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Reports Tab -->
                    <div class="admin-tab-content" data-tab-content="reports">
                        <div id="server-reports-list" class="reports-list">
                            <div class="empty-state">
                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                                    <path d="M12 6v36"/><path d="M12 8h26l-6 8 6 8H12"/>
                                </svg>
                                <p>No reports for this server</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Audit Log Tab -->
                    <div class="admin-tab-content" data-tab-content="audit-log">
                        <div id="server-audit-log" class="audit-list">
                            <div class="empty-state">
                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                                    <circle cx="24" cy="24" r="18"/><path d="M24 14v10l6 6"/>
                                </svg>
                                <p>No audit log entries yet</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Admin Actions Tab -->
                    <div class="admin-tab-content" data-tab-content="actions">
                        <div class="admin-actions-grid">
                            <div class="action-card warning" id="btn-open-lock-modal">
                                <div class="action-card-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                </div>
                                <div class="action-card-content">
                                    <h4>Lock Server</h4>
                                    <p>Prevent all access temporarily</p>
                                </div>
                            </div>
                            
                            <div class="action-card orange" id="btn-open-suspend-modal">
                                <div class="action-card-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5M12 15v1"/></svg>
                                </div>
                                <div class="action-card-content">
                                    <h4>Suspend Server</h4>
                                    <p>Long-term suspension for violations</p>
                                </div>
                            </div>
                            
                            <div class="action-card blue" id="btn-open-transfer-modal">
                                <div class="action-card-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M14 5l7 7-7 7"/></svg>
                                </div>
                                <div class="action-card-content">
                                    <h4>Transfer Ownership</h4>
                                    <p>Assign new server owner</p>
                                </div>
                            </div>
                            
                            <div class="action-card danger" id="btn-open-delete-modal">
                                <div class="action-card-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M9 6V4h6v2"/></svg>
                                </div>
                                <div class="action-card-content">
                                    <h4>Force Delete</h4>
                                    <p>Permanently delete server</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Lock Modal -->
<div class="admin-modal-backdrop" id="lock-modal" style="display:none;">
    <div class="admin-modal action-modal">
        <div class="action-modal-header warning">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <h3>Lock Server</h3>
            <p>You are about to lock <strong id="lock-server-name">Server</strong></p>
        </div>
        <div class="action-modal-body">
            <p class="warning-text">⚠️ Locking this server will prevent all members from accessing it. The server will be hidden from public listings.</p>
            <div class="form-group">
                <label class="form-label required">Reason for locking</label>
                <textarea id="lock-reason" class="form-textarea" rows="3" placeholder="Enter reason for locking this server..."></textarea>
            </div>
        </div>
        <div class="action-modal-footer">
            <button class="btn btn-secondary" data-action="close-lock-modal">Cancel</button>
            <button class="btn btn-warning" id="btn-confirm-lock">Lock Server</button>
        </div>
    </div>
</div>

<!-- Suspend Modal -->
<div class="admin-modal-backdrop" id="suspend-modal" style="display:none;">
    <div class="admin-modal action-modal">
        <div class="action-modal-header orange">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5M12 15v1"/></svg>
            </div>
            <h3>Suspend Server</h3>
            <p>You are about to suspend <strong id="suspend-server-name">Server</strong></p>
        </div>
        <div class="action-modal-body">
            <p class="warning-text">⚠️ Suspending a server is a serious action for policy violations. The server and all its content will be inaccessible to all users.</p>
            <div class="form-group">
                <label class="form-label required">Reason for suspension</label>
                <textarea id="suspend-reason" class="form-textarea" rows="3" placeholder="Describe the violation or reason..."></textarea>
            </div>
        </div>
        <div class="action-modal-footer">
            <button class="btn btn-secondary" data-action="close-suspend-modal">Cancel</button>
            <button class="btn btn-warning" id="btn-confirm-suspend">Suspend Server</button>
        </div>
    </div>
</div>

<!-- Transfer Modal -->
<div class="admin-modal-backdrop" id="transfer-modal" style="display:none;">
    <div class="admin-modal action-modal">
        <div class="action-modal-header blue">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M14 5l7 7-7 7"/></svg>
            </div>
            <h3>Transfer Ownership</h3>
            <p>Transfer ownership to a new user</p>
        </div>
        <div class="action-modal-body">
            <div class="action-target-card action-target-info">
                <div class="server-avatar" id="transfer-avatar">??</div>
                <div class="action-target-info">
                    <span class="action-target-name" id="transfer-server-name">Server Name</span>
                    <span class="action-target-meta" id="transfer-server-meta">0 members</span>
                </div>
            </div>
            <p class="info-text">💡 This will transfer all ownership rights to the new user. The current owner will become a regular member.</p>
            <div class="form-group">
                <label class="form-label required">New Owner User ID</label>
                <input type="text" id="transfer-user-id" class="form-input" placeholder="Enter user ID">
            </div>
            <div class="form-group">
                <label class="form-label required">Reason for transfer</label>
                <textarea id="transfer-reason" class="form-textarea" rows="2" placeholder="Reason for transfer..." required></textarea>
            </div>
        </div>
        <div class="action-modal-footer">
            <button class="btn btn-secondary" data-action="close-transfer-modal">Cancel</button>
            <button class="btn btn-primary" id="btn-confirm-transfer">Transfer Ownership</button>
        </div>
    </div>
</div>

<!-- Delete Modal -->
<div class="admin-modal-backdrop" id="delete-modal" style="display:none;">
    <div class="admin-modal action-modal">
        <div class="action-modal-header danger">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M9 6V4h6v2"/></svg>
            </div>
            <h3>Delete Server</h3>
            <p>This action is permanent and cannot be undone</p>
        </div>
        <div class="action-modal-body">
            <div class="action-target-card action-target-danger">
                <div class="server-avatar" id="delete-avatar">??</div>
                <div class="action-target-info">
                    <span class="action-target-name" id="delete-server-name">Server Name</span>
                    <span class="action-target-meta" id="delete-server-meta">0 members</span>
                </div>
            </div>
            <p class="danger-text">🚨 <strong>This action is IRREVERSIBLE!</strong> All server data, channels, messages, and members will be permanently deleted.</p>
            <div class="form-group">
                <label class="form-label required">Reason for deletion</label>
                <textarea id="delete-reason" class="form-textarea" rows="2" placeholder="Reason for deletion..." required></textarea>
            </div>
            <div class="form-group">
                <label class="form-label required">Type the server name to confirm</label>
                <input type="text" id="confirm-delete-input" class="form-input" placeholder="Enter server name exactly">
            </div>
        </div>
        <div class="action-modal-footer">
            <button class="btn btn-secondary" data-action="close-delete-modal">Cancel</button>
            <button class="btn btn-danger" id="btn-confirm-delete" disabled>Delete Server</button>
        </div>
    </div>
</div>

<!-- Bulk Lock Modal -->
<div class="admin-modal-backdrop" id="bulk-lock-modal" style="display:none;">
    <div class="admin-modal action-modal">
        <div class="action-modal-header warning">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <h3>Lock Multiple Servers</h3>
            <p>You are about to lock <strong id="bulk-lock-count">0</strong> servers</p>
        </div>
        <div class="action-modal-body">
            <p class="warning-text">⚠️ Locking these servers will prevent all members from accessing them. The servers will be hidden from public listings.</p>
            <div class="form-group">
                <label class="form-label required">Reason for locking</label>
                <textarea id="bulk-lock-reason" class="form-textarea" rows="3" placeholder="Enter reason for locking these servers..."></textarea>
            </div>
        </div>
        <div class="action-modal-footer">
            <button class="btn btn-secondary" data-action="close-bulk-lock-modal">Cancel</button>
            <button class="btn btn-warning" id="btn-confirm-bulk-lock">Lock Selected Servers</button>
        </div>
    </div>
</div>

<!-- Bulk Unlock Modal -->
<div class="admin-modal-backdrop" id="bulk-unlock-modal" style="display:none;">
    <div class="admin-modal action-modal">
        <div class="action-modal-header success">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M17 11V7a5 5 0 00-8.5-3.5"/></svg>
            </div>
            <h3>Unlock Multiple Servers</h3>
            <p>You are about to unlock <strong id="bulk-unlock-count">0</strong> servers</p>
        </div>
        <div class="action-modal-body">
            <p class="info-text">✅ Unlocking these servers will restore access for all members. The servers will become visible in public listings again.</p>
        </div>
        <div class="action-modal-footer">
            <button class="btn btn-secondary" data-action="close-bulk-unlock-modal">Cancel</button>
            <button class="btn btn-success" id="btn-confirm-bulk-unlock">Unlock Selected Servers</button>
        </div>
    </div>
</div>

<!-- Bulk Delete Modal -->
<div class="admin-modal-backdrop" id="bulk-delete-modal" style="display:none;">
    <div class="admin-modal action-modal">
        <div class="action-modal-header danger">
            <div class="action-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M9 6V4h6v2"/></svg>
            </div>
            <h3>Delete Multiple Servers</h3>
            <p>You are about to delete <strong id="bulk-delete-count">0</strong> servers</p>
        </div>
        <div class="action-modal-body">
            <p class="danger-text">🚨 <strong>This action is IRREVERSIBLE!</strong> All server data, channels, messages, and members will be permanently deleted.</p>
            <div class="form-group">
                <label class="form-label required">Type "DELETE" to confirm</label>
                <input type="text" id="confirm-bulk-delete-input" class="form-input" placeholder="Type DELETE to confirm">
            </div>
            <div class="form-group">
                <label class="form-label">Reason (optional)</label>
                <textarea id="bulk-delete-reason" class="form-textarea" rows="2" placeholder="Reason for deletion..."></textarea>
            </div>
        </div>
        <div class="action-modal-footer">
            <button class="btn btn-secondary" data-action="close-bulk-delete-modal">Cancel</button>
            <button class="btn btn-danger" id="btn-confirm-bulk-delete" disabled>Delete Selected Servers</button>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/admin/js/mock-data.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/server-detail-modal.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/servers.js"></script>
