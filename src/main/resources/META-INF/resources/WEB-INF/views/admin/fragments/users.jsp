<%-- Users Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="users">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">User Management</h1>
            <p class="admin-page-subtitle">Manage all registered users</p>
        </div>
        <div class="admin-page-header-actions">
            <button class="admin-btn admin-btn-primary" data-action="add-user">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v10M3 8h10"/>
                </svg>
                Add User
            </button>
        </div>
    </div>

    <!-- Stats Overview -->
    <div class="admin-stats-row">
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Total Users</div>
                <div class="stat-value" data-stat="totalUsers">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Active Now</div>
                <div class="stat-value" data-stat="activeNow">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">New This Week</div>
                <div class="stat-value" data-stat="newThisWeek">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Banned</div>
                <div class="stat-value text-danger" data-stat="bannedUsers">--</div>
            </div>
        </div>
    </div>

    <!-- Filters & Search -->
    <div class="admin-card">
        <div class="admin-toolbar">
            <div class="admin-toolbar-left">
                <div class="admin-filter-group">
                    <select class="admin-select" id="user-status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="banned">Banned</option>
                    </select>
                    <select class="admin-select" id="user-role-filter">
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="member">Member</option>
                    </select>
                </div>
            </div>
            <div class="admin-toolbar-right">
                <div class="admin-search admin-search-inline">
                    <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="4"/>
                        <path d="M10 10l4 4"/>
                    </svg>
                    <input type="text" placeholder="Search users..." id="user-search">
                </div>
                <button class="admin-btn admin-btn-ghost" data-action="export-users">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M8 2v8m0 0l-3-3m3 3l3-3"/>
                        <path d="M2 10v4h12v-4"/>
                    </svg>
                    Export
                </button>
            </div>
        </div>
    </div>

    <!-- Users Table -->
    <div class="admin-card">
        <div class="admin-card-body admin-card-body-table">
            <div class="admin-table-container">
                <table class="admin-table admin-table-hover">
                    <thead>
                        <tr>
                            <th class="th-checkbox">
                                <input type="checkbox" id="select-all-users" class="admin-checkbox">
                            </th>
                            <th class="sortable" data-sort="username">User <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="email">Email <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="role">Role <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="status">Status <span class="sort-icon">↕</span></th>
                            <th class="sortable" data-sort="joined">Joined <span class="sort-icon">↕</span></th>
                            <th class="th-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <div class="admin-card-footer">
            <div class="admin-pagination">
                <span class="pagination-info">Showing <strong>1-10</strong> of <strong data-stat="totalUsers">0</strong> users</span>
                <div class="pagination-controls">
                    <button class="admin-btn admin-btn-sm admin-btn-ghost" disabled>Previous</button>
                    <button class="admin-btn admin-btn-sm admin-btn-primary">1</button>
                    <button class="admin-btn admin-btn-sm admin-btn-ghost">2</button>
                    <button class="admin-btn admin-btn-sm admin-btn-ghost">3</button>
                    <button class="admin-btn admin-btn-sm admin-btn-ghost">Next</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- User Detail Modal (hidden by default) -->
<template id="user-detail-modal-template">
    <div class="admin-modal-backdrop" data-modal="user-detail">
        <div class="admin-modal">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">User Details</h3>
                <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-modal">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4l8 8M12 4l-8 8"/>
                    </svg>
                </button>
            </div>
            <div class="admin-modal-body">
                <!-- Modal content filled by JS -->
            </div>
            <div class="admin-modal-footer">
                <button class="admin-btn admin-btn-ghost" data-action="close-modal">Cancel</button>
                <button class="admin-btn admin-btn-primary" data-action="save-user">Save Changes</button>
            </div>
        </div>
    </div>
</template>
