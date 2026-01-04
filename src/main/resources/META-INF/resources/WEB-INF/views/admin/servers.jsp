<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "Servers"); %>

<title>Server Management - CoCoCord Admin</title>

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
                    <option value="inactive">Inactive</option>
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

        <table class="table" id="serversTable" aria-label="Servers list">
            <thead>
            <tr>
                <th>
                    <input type="checkbox" id="selectAll" class="checkbox">
                </th>
                <th>Server</th>
                <th>Owner</th>
                <th>Members</th>
                <th>Channels</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody id="serversTableBody">
            <tr>
                <td><input type="checkbox" class="checkbox server-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar server-avatar">VG</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Vietnam Gamers</span>
                            <span class="cell-user-email">Gaming community for Vietnamese</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="cell-user-name">@nguyenvana</div>
                </td>
                <td>
                    <span class="text-strong">15,420</span>
                </td>
                <td>45</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>Mar 15, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Server">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Settings">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M9 1v2m0 12v2M1 9h2m12 0h2m-2.7-5.3l-1.4 1.4M5.1 12.9l-1.4 1.4m0-10.6l1.4 1.4m7.8 7.8l1.4 1.4"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Suspend">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M9 5v4M9 12v1"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox server-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar server-avatar">TT</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Tech Talk VN</span>
                            <span class="cell-user-email">Technology discussions</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="cell-user-name">@tranthib</div>
                </td>
                <td>
                    <span class="text-strong">8,930</span>
                </td>
                <td>32</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>Apr 20, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Server">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Settings">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M9 1v2m0 12v2M1 9h2m12 0h2m-2.7-5.3l-1.4 1.4M5.1 12.9l-1.4 1.4m0-10.6l1.4 1.4m7.8 7.8l1.4 1.4"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Suspend">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M9 5v4M9 12v1"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox server-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar server-avatar">ML</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Music Lovers</span>
                            <span class="cell-user-email">Share and discover music</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="cell-user-name">@leminhc</div>
                </td>
                <td>
                    <span class="text-strong">7,210</span>
                </td>
                <td>28</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>May 10, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Server">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Settings">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M9 1v2m0 12v2M1 9h2m12 0h2m-2.7-5.3l-1.4 1.4M5.1 12.9l-1.4 1.4m0-10.6l1.4 1.4m7.8 7.8l1.4 1.4"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Suspend">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M9 5v4M9 12v1"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox server-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar server-avatar">SG</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Study Group</span>
                            <span class="cell-user-email">Educational community</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="cell-user-name">@phamhuongd</div>
                </td>
                <td>
                    <span class="text-strong">5,890</span>
                </td>
                <td>22</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>Jun 01, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Server">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Settings">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M9 1v2m0 12v2M1 9h2m12 0h2m-2.7-5.3l-1.4 1.4M5.1 12.9l-1.4 1.4m0-10.6l1.4 1.4m7.8 7.8l1.4 1.4"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Suspend">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M9 5v4M9 12v1"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox server-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar server-avatar">AF</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Anime Fans VN</span>
                            <span class="cell-user-email">Vietnamese anime community</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="cell-user-name">@hoangvane</div>
                </td>
                <td>
                    <span class="text-strong">4,520</span>
                </td>
                <td>35</td>
                <td><span class="badge badge-warning">Inactive</span></td>
                <td>Jul 15, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Server">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Settings">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M9 1v2m0 12v2M1 9h2m12 0h2m-2.7-5.3l-1.4 1.4M5.1 12.9l-1.4 1.4m0-10.6l1.4 1.4m7.8 7.8l1.4 1.4"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Suspend">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M9 5v4M9 12v1"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox server-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar server-avatar">SC</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Spam Community</span>
                            <span class="cell-user-email">Suspended for TOS violation</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="cell-user-name">@banned_user</div>
                </td>
                <td>
                    <span class="text-strong">523</span>
                </td>
                <td>12</td>
                <td><span class="badge badge-danger">Suspended</span></td>
                <td>Aug 20, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Server">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-success btn-sm btn-icon" title="Restore">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M5 9l3 3 5-5"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Delete">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M3 5h12M7 5V3h4v2m1 0v10a1 1 0 01-1 1H7a1 1 0 01-1-1V5"/>
                            </svg>
                        </button>
                    </div>
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

<script src="${pageContext.request.contextPath}/admin/js/mock-data.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/servers.js"></script>
