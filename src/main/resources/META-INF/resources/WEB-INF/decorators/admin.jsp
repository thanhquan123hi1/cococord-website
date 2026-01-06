<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="vi" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>CoCoCord Admin</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Admin CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/admin/css/admin.css">

    <!-- Realtime (SockJS + STOMP) -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
</head>
<body class="admin-body">
<div class="admin-layout">
    <!-- ============================================
         SIDEBAR - Never reloads (SPA pattern)
         ============================================ -->
    <aside class="admin-sidebar" aria-label="Admin navigation">
        <!-- Brand -->
        <div class="admin-sidebar-logo admin-sidebar-logo--top" aria-label="CoCoCord">
            <span class="logo-icon">🎮</span>
            <span class="logo-text">CoCoCord</span>
        </div>

        <!-- Tabs: Favorites / Recently -->
        <div class="admin-sidebar-tabs">
            <button class="admin-sidebar-tab active">Favorites</button>
            <button class="admin-sidebar-tab">Recently</button>
        </div>

        <!-- Dashboards Section -->
        <div class="admin-nav-section">
            <div class="admin-nav-label">Dashboards</div>
            <ul class="admin-nav">
                <li>
                    <button data-admin-nav data-page="dashboard" class="is-active" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="6" height="6" rx="1"/>
                                <rect x="11" y="3" width="6" height="6" rx="1"/>
                                <rect x="3" y="11" width="6" height="6" rx="1"/>
                                <rect x="11" y="11" width="6" height="6" rx="1"/>
                            </svg>
                        </span>
                        <span>Overview</span>
                    </button>
                </li>
            </ul>
        </div>

        <!-- Pages Section -->
        <div class="admin-nav-section">
            <div class="admin-nav-label">Pages</div>
            <ul class="admin-nav">
                <li>
                    <button data-admin-nav data-page="users" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="10" cy="6" r="3"/>
                                <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                            </svg>
                        </span>
                        <span>Users</span>
                    </button>
                </li>
                <li>
                    <button data-admin-nav data-page="servers" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="14" height="5" rx="1"/>
                                <rect x="3" y="12" width="14" height="5" rx="1"/>
                                <circle cx="6" cy="5.5" r="1" fill="currentColor"/>
                                <circle cx="6" cy="14.5" r="1" fill="currentColor"/>
                            </svg>
                        </span>
                        <span>Servers</span>
                    </button>
                </li>
                <li>
                    <button data-admin-nav data-page="reports" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M10 2L2 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-5z"/>
                                <path d="M10 10v4M10 6v2"/>
                            </svg>
                        </span>
                        <span>Reports</span>
                    </button>
                </li>
                <li>
                    <button data-admin-nav data-page="messages" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M3 4h14c1 0 2 1 2 2v8c0 1-1 2-2 2H5l-4 3v-3c0-1 1-2 2-2"/>
                                <path d="M7 8h6M7 11h4"/>
                            </svg>
                        </span>
                        <span>Messages</span>
                    </button>
                </li>
                <li>
                    <button data-admin-nav data-page="roles" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M12 2a4 4 0 110 8 4 4 0 010-8z"/>
                                <path d="M6 8a3 3 0 110 6 3 3 0 010-6z"/>
                                <path d="M17 18c0-2.2-2.2-4-5-4-1.5 0-2.8.5-3.8 1.3"/>
                                <path d="M11 18c0-1.7-2.2-3-5-3s-5 1.3-5 3"/>
                            </svg>
                        </span>
                        <span>Roles</span>
                    </button>
                </li>
                <li>
                    <button data-admin-nav data-page="stats" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M3 17V9l4-2 4 4 6-8"/>
                                <path d="M17 3v4h-4"/>
                            </svg>
                        </span>
                        <span>Stats</span>
                    </button>
                </li>
                <li>
                    <button data-admin-nav data-page="audit" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M4 4h12v14H4z"/>
                                <path d="M7 8h6M7 11h6M7 14h4"/>
                            </svg>
                        </span>
                        <span>Audit Log</span>
                    </button>
                </li>
                <li>
                    <button data-admin-nav data-page="settings" type="button">
                        <span class="admin-nav-icon">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="10" cy="10" r="2"/>
                                <path d="M10 2v2m0 12v2M2 10h2m12 0h2m-3.5-5.5l-1.4 1.4m-5.2 5.2l-1.4 1.4m0-8l1.4 1.4m5.2 5.2l1.4 1.4"/>
                            </svg>
                        </span>
                        <span>Settings</span>
                    </button>
                </li>
            </ul>
        </div>

        <!-- Sidebar Footer with Logout -->
        <div class="admin-sidebar-footer">
            <button class="admin-logout-btn" type="button" data-admin-logout title="Logout">
                <span class="admin-nav-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 3H5a2 2 0 00-2 2v10a2 2 0 002 2h7"/>
                        <path d="M9 10h8"/>
                        <path d="M14 7l3 3-3 3"/>
                    </svg>
                </span>
                <span>Logout</span>
            </button>
        </div>

    </aside>

    <!-- ============================================
         MAIN CONTENT AREA - Only this part changes
         ============================================ -->
    <div class="admin-main">
        <!-- Header / Topbar - Never reloads -->
        <header class="admin-topbar" aria-label="Admin top bar">
            <nav class="admin-crumbs" aria-label="Breadcrumb">
                <a href="#">Dashboards</a>
                <span class="separator">/</span>
                <span class="current">Overview</span>
            </nav>

            <div class="admin-top-actions">
                <!-- Search -->
                <div class="admin-search" role="search">
                    <svg class="admin-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="4"/>
                        <path d="M10 10l4 4"/>
                    </svg>
                    <input type="text" placeholder="Search" aria-label="Search">
                    <span class="admin-search-shortcut">/</span>
                </div>

                <!-- Action Buttons -->
                <div class="admin-header-actions">
                    <!-- Theme Toggle -->
                    <button class="admin-btn admin-btn-icon" type="button" data-admin-theme-toggle title="Toggle theme">
                        <svg class="icon-sun" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="10" cy="10" r="4"/>
                            <path d="M10 2v2m0 12v2M2 10h2m12 0h2m-3.5-5.5l-1.4 1.4m-5.2 5.2l-1.4 1.4m0-8l1.4 1.4m5.2 5.2l1.4 1.4"/>
                        </svg>
                        <svg class="icon-moon hidden" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M17 10a7 7 0 11-7.5-6.97A5 5 0 0017 10z"/>
                        </svg>
                    </button>

                    <!-- Notifications -->
                    <button class="admin-btn admin-btn-icon admin-btn-notification" type="button" title="Notifications">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M10 2a6 6 0 016 6v3l2 2H2l2-2V8a6 6 0 016-6z"/>
                            <path d="M8 16a2 2 0 104 0"/>
                        </svg>
                        <span class="notification-badge">3</span>
                    </button>

                    <!-- Sidebar Toggle (for mobile) -->
                    <button class="admin-btn admin-btn-icon" type="button" data-admin-sidebar-toggle title="Toggle sidebar">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="2" y="3" width="16" height="14" rx="2"/>
                            <path d="M7 3v14"/>
                        </svg>
                    </button>
                </div>
            </div>
        </header>

        <!-- ============================================
             PAGE CONTENT - Fragment loaded here via JS
             ============================================ -->
        <main id="admin-content" class="admin-content">
            <!-- Content will be loaded dynamically by router.js -->
            <div class="admin-skeleton-loading">
                <div class="skeleton-row">
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                </div>
                <div class="skeleton-panel"></div>
            </div>
        </main>
    </div>
</div>

<!-- Admin JS - Load order matters -->
<script src="${pageContext.request.contextPath}/js/auth.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/mock-data.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/common.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/sidebar.js"></script>
<script src="${pageContext.request.contextPath}/admin/js/router.js"></script>

<!-- Page-specific modules - loaded once, activated by router -->
<script src="${pageContext.request.contextPath}/admin/js/dashboard.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/presence.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/users.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/user-detail-modal.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/server-detail-modal.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/server-action-modals.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/servers.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/reports.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/messages.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/roles.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/stats.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/audit.js" defer></script>
<script src="${pageContext.request.contextPath}/admin/js/settings.js" defer></script>
</body>
</html>
