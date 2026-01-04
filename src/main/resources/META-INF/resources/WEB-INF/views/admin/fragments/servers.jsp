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
            <button class="admin-btn admin-btn-ghost" data-action="refresh-servers">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M2 8a6 6 0 0111.5-2.5M14 8a6 6 0 01-11.5 2.5"/>
                    <path d="M14 2v4h-4M2 14v-4h4"/>
                </svg>
                Refresh
            </button>
        </div>
    </div>

    <!-- Stats Overview -->
    <div class="admin-stats-row">
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Total Servers</div>
                <div class="stat-value" data-stat="totalServers">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Active Servers</div>
                <div class="stat-value text-success" data-stat="activeServers">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Total Members</div>
                <div class="stat-value" data-stat="totalMembers">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Flagged</div>
                <div class="stat-value text-warning" data-stat="flaggedServers">--</div>
            </div>
        </div>
    </div>

    <!-- Filters & Search -->
    <div class="admin-card">
        <div class="admin-toolbar">
            <div class="admin-toolbar-left">
                <div class="admin-filter-group">
                    <select class="admin-select" id="server-status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="flagged">Flagged</option>
                    </select>
                    <select class="admin-select" id="server-size-filter">
                        <option value="">All Sizes</option>
                        <option value="small">Small (&lt; 100)</option>
                        <option value="medium">Medium (100-1000)</option>
                        <option value="large">Large (&gt; 1000)</option>
                    </select>
                </div>
            </div>
            <div class="admin-toolbar-right">
                <div class="admin-search admin-search-inline">
                    <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="4"/>
                        <path d="M10 10l4 4"/>
                    </svg>
                    <input type="text" placeholder="Search servers..." id="server-search">
                </div>
                <div class="admin-view-toggle">
                    <button class="admin-btn admin-btn-icon active" data-view="grid" title="Grid view">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="2" y="2" width="5" height="5" rx="1"/>
                            <rect x="9" y="2" width="5" height="5" rx="1"/>
                            <rect x="2" y="9" width="5" height="5" rx="1"/>
                            <rect x="9" y="9" width="5" height="5" rx="1"/>
                        </svg>
                    </button>
                    <button class="admin-btn admin-btn-icon" data-view="list" title="List view">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M2 4h12M2 8h12M2 12h12"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Server Grid -->
    <div class="admin-server-grid" id="servers-grid">
        <!-- Populated by JS -->
    </div>

    <!-- Server Table (hidden by default, shown in list view) -->
    <div class="admin-card hidden" id="servers-table-container">
        <div class="admin-card-body admin-card-body-table">
            <div class="admin-table-container">
                <table class="admin-table admin-table-hover">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="name">Server <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="owner">Owner <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="members">Members <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="channels">Channels <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="status">Status <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="created">Created <span class="sort-icon">↕</span></th>
                            <th class="th-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="servers-table-body">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Pagination -->
    <div class="admin-pagination-container">
        <div class="admin-pagination">
            <span class="pagination-info">Showing <strong>1-12</strong> of <strong data-stat="totalServers">0</strong> servers</span>
            <div class="pagination-controls">
                <button class="admin-btn admin-btn-sm admin-btn-ghost" disabled>Previous</button>
                <button class="admin-btn admin-btn-sm admin-btn-primary">1</button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost">2</button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost">Next</button>
            </div>
        </div>
    </div>
</div>
