<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "Users"); %>

<title>User Management - CoCoCord Admin</title>

<div class="flex flex-col gap-6">
    <!-- Header Actions -->
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-semibold">User Management</h1>
            <p class="text-secondary">Manage all users on the platform</p>
        </div>
        <div class="flex gap-3">
            <button class="btn btn-secondary" id="exportBtn">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
                    <path d="M16 12v4H2v-4M9 2v10m0-10L5 6m4-4l4 4"/>
                </svg>
                Export
            </button>
            <button class="btn btn-primary" id="addUserBtn">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
                    <path d="M9 2v14M2 9h14"/>
                </svg>
                Add User
            </button>
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
                <input type="text" id="searchUsers" placeholder="Search users by name, email...">
            </div>
            <div class="filter-group">
                <label class="filter-label">Status:</label>
                <select class="filter-select" id="filterStatus">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Role:</label>
                <select class="filter-select" id="filterRole">
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="premium">Premium</option>
                    <option value="user">User</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Sort:</label>
                <select class="filter-select" id="sortBy">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Users Table -->
    <div class="admin-panel white">
        <div class="section-title">
            <div class="flex items-center gap-2">
                <h3>All Users</h3>
                <span class="badge badge-default" id="totalCount">8 users</span>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-sm" id="refreshBtn" title="Refresh">
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
                        <path d="M2 9a7 7 0 0112-5m2 5a7 7 0 01-12 5"/>
                        <path d="M14 4v3h-3M4 14v-3h3"/>
                    </svg>
                </button>
            </div>
        </div>

        <table class="table" id="usersTable" aria-label="Users list">
            <thead>
            <tr>
                <th>
                    <input type="checkbox" id="selectAll" class="checkbox">
                </th>
                <th>User</th>
                <th>Status</th>
                <th>Role</th>
                <th>Servers</th>
                <th>Messages</th>
                <th>Joined</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody id="usersTableBody">
            <tr>
                <td><input type="checkbox" class="checkbox user-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar">NV</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Nguyễn Văn A</span>
                            <span class="cell-user-email">nguyenvana@email.com</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-success">Active</span></td>
                <td>Admin</td>
                <td>12</td>
                <td>1,234</td>
                <td>Jan 15, 2024</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Profile">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Ban User">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M5 5l8 8"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox user-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar">TT</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Trần Thị B</span>
                            <span class="cell-user-email">tranthib@email.com</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-success">Active</span></td>
                <td>Moderator</td>
                <td>8</td>
                <td>856</td>
                <td>Jan 10, 2024</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Profile">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Ban User">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M5 5l8 8"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox user-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar">LM</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Lê Minh C</span>
                            <span class="cell-user-email">leminhc@email.com</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-success">Active</span></td>
                <td>Premium</td>
                <td>15</td>
                <td>2,105</td>
                <td>Dec 20, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Profile">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Ban User">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M5 5l8 8"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox user-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar">PH</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Phạm Hương D</span>
                            <span class="cell-user-email">phamhuongd@email.com</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-warning">Inactive</span></td>
                <td>User</td>
                <td>3</td>
                <td>45</td>
                <td>Nov 15, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Profile">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Ban User">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M5 5l8 8"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox user-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar">HV</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Hoàng Văn E</span>
                            <span class="cell-user-email">hoangvane@email.com</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-danger">Banned</span></td>
                <td>User</td>
                <td>0</td>
                <td>523</td>
                <td>Oct 20, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Profile">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                        <button class="btn btn-success btn-sm btn-icon" title="Unban User">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M5 9l3 3 5-5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="checkbox user-checkbox"></td>
                <td>
                    <div class="cell-user">
                        <div class="avatar">VT</div>
                        <div class="cell-user-info">
                            <span class="cell-user-name">Vũ Thảo F</span>
                            <span class="cell-user-email">vuthaof@email.com</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-success">Active</span></td>
                <td>Premium</td>
                <td>20</td>
                <td>4,521</td>
                <td>Sep 05, 2023</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm btn-icon" title="View Profile">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2l3 3-9 9H4v-3l9-9z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon text-danger" title="Ban User">
                            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="9" cy="9" r="7"/>
                                <path d="M5 5l8 8"/>
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
                Showing <strong>1-6</strong> of <strong>156</strong> users
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
                <button class="pagination-btn">26</button>
                <button class="pagination-btn">
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M7 4l5 5-5 5"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- User Modal (Hidden by default) -->
<div class="modal-overlay" id="userModal" style="display:none;">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title">User Details</h3>
            <button class="modal-close" onclick="closeModal('userModal')">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4l10 10M14 4L4 14"/>
                </svg>
            </button>
        </div>
        <div class="modal-body">
            <div class="user-profile-card">
                <div class="avatar-lg" id="modalAvatar">NV</div>
                <div class="user-profile-info">
                    <h4 id="modalName">Nguyễn Văn A</h4>
                    <p id="modalEmail">nguyenvana@email.com</p>
                    <div class="flex gap-2 mt-2">
                        <span class="badge badge-success" id="modalStatus">Active</span>
                        <span class="badge badge-default" id="modalRole">Admin</span>
                    </div>
                </div>
            </div>
            <div class="user-stats-grid">
                <div class="user-stat-item">
                    <div class="user-stat-value" id="modalServers">12</div>
                    <div class="user-stat-label">Servers</div>
                </div>
                <div class="user-stat-item">
                    <div class="user-stat-value" id="modalMessages">1,234</div>
                    <div class="user-stat-label">Messages</div>
                </div>
                <div class="user-stat-item">
                    <div class="user-stat-value" id="modalJoined">Jan 15</div>
                    <div class="user-stat-label">Joined</div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('userModal')">Close</button>
            <button class="btn btn-primary">Edit User</button>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/admin/js/mock-data.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/users.js"></script>
