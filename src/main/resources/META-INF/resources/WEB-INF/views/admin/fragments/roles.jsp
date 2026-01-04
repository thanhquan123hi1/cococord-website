<%-- Roles & Permissions Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="roles">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">Roles & Permissions</h1>
            <p class="admin-page-subtitle">Manage admin roles and access levels</p>
        </div>
        <div class="admin-page-header-actions">
            <button class="admin-btn admin-btn-primary" data-action="add-role">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v10M3 8h10"/>
                </svg>
                Add Role
            </button>
        </div>
    </div>

    <!-- Stats Overview -->
    <div class="admin-stats-row">
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Total Roles</div>
                <div class="stat-value" data-stat="totalRoles">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Admins</div>
                <div class="stat-value" data-stat="totalAdmins">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Moderators</div>
                <div class="stat-value" data-stat="totalModerators">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Permission Groups</div>
                <div class="stat-value" data-stat="permissionGroups">--</div>
            </div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="page-tabs">
        <button class="page-tab active" data-tab="roles">
            Roles
        </button>
        <button class="page-tab" data-tab="permissions">
            Permissions Matrix
        </button>
    </div>

    <!-- Roles Tab Content -->
    <div class="tab-content active" data-tab-content="roles">
        <div class="admin-roles-grid" id="roles-list">
            <!-- Populated by JS -->
        </div>
    </div>

    <!-- Permissions Matrix Tab Content -->
    <div class="tab-content hidden" data-tab-content="permissions">
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">Permissions Matrix</h3>
                <p class="admin-card-subtitle">Overview of all role permissions</p>
            </div>
            <div class="admin-card-body">
                <div class="permissions-layout">
                    <!-- Permissions Groups -->
                    <div class="permissions-groups" id="permissions-groups">
                        <!-- Populated by JS -->
                    </div>

                    <!-- Permissions Table -->
                    <div class="permissions-table-wrapper">
                        <table class="permissions-table" id="permissions-matrix">
                            <thead>
                                <tr>
                                    <th class="permission-name-col">Permission</th>
                                    <!-- Role columns populated by JS -->
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Role Editor Modal Template -->
<template id="role-editor-modal-template">
    <div class="admin-modal-backdrop" data-modal="role-editor">
        <div class="admin-modal admin-modal-lg">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">Edit Role</h3>
                <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-modal">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4l8 8M12 4l-8 8"/>
                    </svg>
                </button>
            </div>
            <div class="admin-modal-body">
                <form class="admin-form" id="role-editor-form">
                    <!-- Role Info -->
                    <div class="admin-form-section">
                        <h4 class="admin-form-section-title">Role Information</h4>
                        <div class="admin-form-row">
                            <div class="admin-form-group">
                                <label class="admin-label">Role Name</label>
                                <input type="text" class="admin-input" name="roleName" placeholder="e.g., Content Moderator">
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-label">Role Color</label>
                                <div class="color-picker-wrapper">
                                    <input type="color" class="admin-color-input" name="roleColor" value="#5865F2">
                                    <input type="text" class="admin-input" name="roleColorHex" value="#5865F2" maxlength="7">
                                </div>
                            </div>
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-label">Description</label>
                            <textarea class="admin-textarea" name="roleDescription" rows="2" placeholder="Brief description of this role..."></textarea>
                        </div>
                    </div>

                    <!-- Permissions -->
                    <div class="admin-form-section">
                        <h4 class="admin-form-section-title">Permissions</h4>
                        <div class="permissions-checklist" id="role-permissions-checklist">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                </form>
            </div>
            <div class="admin-modal-footer">
                <button class="admin-btn admin-btn-danger-ghost" data-action="delete-role">Delete Role</button>
                <div class="admin-modal-footer-right">
                    <button class="admin-btn admin-btn-ghost" data-action="close-modal">Cancel</button>
                    <button class="admin-btn admin-btn-primary" data-action="save-role">Save Changes</button>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- Add Role Modal Template -->
<template id="add-role-modal-template">
    <div class="admin-modal-backdrop" data-modal="add-role">
        <div class="admin-modal">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">Create New Role</h3>
                <button class="admin-btn admin-btn-icon admin-modal-close" data-action="close-modal">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4l8 8M12 4l-8 8"/>
                    </svg>
                </button>
            </div>
            <div class="admin-modal-body">
                <form class="admin-form" id="add-role-form">
                    <div class="admin-form-group">
                        <label class="admin-label">Role Name</label>
                        <input type="text" class="admin-input" name="roleName" placeholder="e.g., Content Moderator" required>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">Role Color</label>
                        <div class="color-picker-wrapper">
                            <input type="color" class="admin-color-input" name="roleColor" value="#5865F2">
                            <input type="text" class="admin-input" name="roleColorHex" value="#5865F2" maxlength="7">
                        </div>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">Base Template</label>
                        <select class="admin-select" name="baseTemplate">
                            <option value="">Start from scratch</option>
                            <option value="admin">Copy from Admin</option>
                            <option value="moderator">Copy from Moderator</option>
                            <option value="member">Copy from Member</option>
                        </select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">Description</label>
                        <textarea class="admin-textarea" name="roleDescription" rows="2" placeholder="Brief description of this role..."></textarea>
                    </div>
                </form>
            </div>
            <div class="admin-modal-footer">
                <button class="admin-btn admin-btn-ghost" data-action="close-modal">Cancel</button>
                <button class="admin-btn admin-btn-primary" data-action="create-role">Create Role</button>
            </div>
        </div>
    </div>
</template>
