<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<title>Audit Log - CoCoCord Admin</title>

<link rel="stylesheet" href="/admin/css/audit.css">

<!-- Page Header -->
<div class="audit-page-header">
    <div class="audit-header-content">
        <div class="audit-header-text">
            <h1 class="audit-title">Audit Log</h1>
            <p class="audit-subtitle">Theo dõi toàn bộ hành động của quản trị viên và hệ thống</p>
        </div>
        <button class="btn-export" id="btnExport">
            <i class="fas fa-download"></i>
            Export
        </button>
    </div>
</div>

<!-- Filter Bar -->
<div class="audit-filter-bar">
    <div class="filter-row">
        <!-- Action Type Filter -->
        <div class="filter-item">
            <select class="filter-select" id="filterAction">
                <option value="">Tất cả hành động</option>
                <option value="user_ban">Cấm người dùng</option>
                <option value="user_unban">Gỡ cấm người dùng</option>
                <option value="server_suspend">Khóa máy chủ</option>
                <option value="server_restore">Mở khóa máy chủ</option>
                <option value="role_update">Cập nhật vai trò</option>
                <option value="settings_change">Thay đổi cài đặt</option>
                <option value="login">Đăng nhập</option>
                <option value="report_review">Xem xét báo cáo</option>
            </select>
        </div>

        <!-- Actor Filter -->
        <div class="filter-item">
            <select class="filter-select" id="filterActor">
                <option value="">Tất cả tác nhân</option>
                <option value="admin">Quản trị viên</option>
                <option value="moderator">Điều hành viên</option>
                <option value="system">Hệ thống</option>
            </select>
        </div>

        <!-- Date Range -->
        <div class="filter-item filter-date-group">
            <input type="date" class="filter-input" id="filterDateFrom" placeholder="Từ ngày">
            <span class="date-separator">→</span>
            <input type="date" class="filter-input" id="filterDateTo" placeholder="Đến ngày">
        </div>

        <!-- Search -->
        <div class="filter-item filter-search">
            <i class="fas fa-search search-icon"></i>
            <input type="text" class="filter-input" id="filterSearch" placeholder="Tìm kiếm nhật ký…">
        </div>

        <!-- Clear Filters -->
        <button class="btn-clear-filters" id="btnClearFilters" style="display: none;">
            Xóa bộ lọc
        </button>
    </div>
</div>

<!-- Stats Bar -->
<div class="audit-stats-bar">
    <div class="audit-stat-item">
        <div class="audit-stat-icon">
            <i class="fas fa-list"></i>
        </div>
        <div class="audit-stat-info">
            <div class="audit-stat-label">Tổng số nhật ký</div>
            <div class="audit-stat-value" id="totalAuditLogs">0</div>
        </div>
    </div>
    <div class="audit-stat-item">
        <div class="audit-stat-icon">
            <i class="fas fa-eye"></i>
        </div>
        <div class="audit-stat-info">
            <div class="audit-stat-label">Đang hiển thị</div>
            <div class="audit-stat-value" id="displayedAuditLogs">0</div>
        </div>
    </div>
</div>

<!-- Main Content - Audit Timeline -->
<div class="audit-timeline-container">
    <div id="auditTimeline" class="audit-timeline">
        <!-- Audit items will be rendered here by JavaScript -->
    </div>

    <!-- Pagination -->
    <div class="audit-pagination" id="auditPagination" style="display: none;">
        <button class="btn-pagination" id="btnPrevPage" disabled>
            <i class="fas fa-chevron-left"></i>
            Trang trước
        </button>
        <span class="pagination-info" id="paginationInfo">Trang 1 / 1</span>
        <button class="btn-pagination" id="btnNextPage" disabled>
            Trang sau
            <i class="fas fa-chevron-right"></i>
        </button>
    </div>
</div>

<!-- Audit Detail Modal -->
<div class="audit-modal" id="auditModal" style="display: none;">
    <div class="audit-modal-overlay" id="auditModalOverlay"></div>
    <div class="audit-modal-content">
        <div class="audit-modal-header">
            <h2 class="audit-modal-title">Chi tiết Audit Log</h2>
            <button class="audit-modal-close" id="btnCloseModal">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="audit-modal-body" id="auditModalBody">
            <!-- Modal content will be rendered here -->
        </div>
    </div>
</div>

<script src="/admin/js/audit.js"></script>
<script>
    // Initialize audit log page when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        if (window.AdminAudit) {
            AdminAudit.init();
        }
    });
</script>
