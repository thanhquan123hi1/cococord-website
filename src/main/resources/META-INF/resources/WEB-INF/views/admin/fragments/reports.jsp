<%-- Reports Fragment - Pure HTML, no <html>/<head>/<body> --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="admin-page" data-page="reports">
    <!-- Page Header -->
    <div class="admin-page-header">
        <div class="admin-page-header-left">
            <h1 class="admin-page-title">Reports</h1>
            <p class="admin-page-subtitle">Review and handle user reports</p>
        </div>
        <div class="admin-page-header-actions">
            <button class="admin-btn admin-btn-ghost" data-action="export-reports">
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
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Total Reports</div>
                <div class="stat-value" data-stat="totalReports">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Pending</div>
                <div class="stat-value text-warning" data-stat="pendingReports">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Resolved Today</div>
                <div class="stat-value text-success" data-stat="resolvedToday">--</div>
            </div>
        </div>
        <div class="admin-stat-card admin-stat-card-sm">
            <div class="stat-content">
                <div class="stat-label">Avg. Response Time</div>
                <div class="stat-value" data-stat="avgResponseTime">--</div>
            </div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="page-tabs">
        <button class="page-tab active" data-tab="pending">
            Pending
            <span class="tab-badge" data-stat="pendingReports">0</span>
        </button>
        <button class="page-tab" data-tab="approved">
            Approved
        </button>
        <button class="page-tab" data-tab="rejected">
            Rejected
        </button>
        <button class="page-tab" data-tab="all">
            All Reports
        </button>
    </div>

    <!-- Filters & Search -->
    <div class="admin-card">
        <div class="admin-toolbar">
            <div class="admin-toolbar-left">
                <div class="admin-filter-group">
                    <select class="admin-select" id="report-type-filter">
                        <option value="">All Types</option>
                        <option value="spam">Spam</option>
                        <option value="harassment">Harassment</option>
                        <option value="inappropriate">Inappropriate Content</option>
                        <option value="scam">Scam/Phishing</option>
                        <option value="other">Other</option>
                    </select>
                    <select class="admin-select" id="report-priority-filter">
                        <option value="">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
            <div class="admin-toolbar-right">
                <div class="admin-search admin-search-inline">
                    <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="4"/>
                        <path d="M10 10l4 4"/>
                    </svg>
                    <input type="text" placeholder="Search reports..." id="report-search">
                </div>
            </div>
        </div>
    </div>

    <!-- Reports List -->
    <div class="admin-reports-list" id="reports-list">
        <!-- Populated by JS -->
    </div>

    <!-- Empty State (shown when no reports) -->
    <div class="admin-empty-state hidden" id="reports-empty">
        <div class="empty-icon">🎉</div>
        <h3>No pending reports</h3>
        <p>All reports have been handled. Great job!</p>
    </div>

    <!-- Pagination -->
    <div class="admin-pagination-container">
        <div class="admin-pagination">
            <span class="pagination-info">Showing <strong>1-10</strong> of <strong data-stat="totalReports">0</strong> reports</span>
            <div class="pagination-controls">
                <button class="admin-btn admin-btn-sm admin-btn-ghost" disabled>Previous</button>
                <button class="admin-btn admin-btn-sm admin-btn-primary">1</button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost">2</button>
                <button class="admin-btn admin-btn-sm admin-btn-ghost">Next</button>
            </div>
        </div>
    </div>
</div>

<!-- Report Detail Modal Template -->
<template id="report-detail-modal-template">
    <div class="admin-modal-backdrop" data-modal="report-detail">
        <div class="admin-modal admin-modal-lg">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">Report Details</h3>
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
                <button class="admin-btn admin-btn-danger" data-action="reject-report">Reject</button>
                <button class="admin-btn admin-btn-success" data-action="approve-report">Take Action</button>
            </div>
        </div>
    </div>
</template>
