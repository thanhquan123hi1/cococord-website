<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="_csrf" content="${_csrf.token}"/>
    <meta name="_csrf_header" content="${_csrf.headerName}"/>
    <title>Admin Dashboard - CoCoCord</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { box-sizing: border-box; }
        body { 
            background-color: #1e1f22; 
            color: #dbdee1; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
        }
        .discord-bg-primary { background-color: #313338; }
        .discord-bg-secondary { background-color: #2b2d31; }
        .discord-bg-tertiary { background-color: #1e1f22; }
        .discord-text-primary { color: #f2f3f5; }
        .discord-text-secondary { color: #b5bac1; }
        .discord-text-muted { color: #949ba4; }
        .discord-brand { color: #5865f2; }
        .discord-brand-bg { background-color: #5865f2; }
        .discord-danger { color: #ed4245; }
        .discord-danger-bg { background-color: #ed4245; }
        .discord-success { color: #3ba55d; }
        .discord-success-bg { background-color: #3ba55d; }
        .discord-warning { color: #faa81a; }
        
        .sidebar {
            width: 240px;
            background-color: #2b2d31;
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            overflow-y: auto;
        }
        
        .main-content {
            margin-left: 240px;
            padding: 24px;
            min-height: 100vh;
        }
        
        .nav-item {
            padding: 10px 16px;
            margin: 2px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.15s;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .nav-item:hover {
            background-color: #35373c;
        }
        
        .nav-item.active {
            background-color: #404249;
            color: #fff;
        }
        
        .stat-card {
            background-color: #2b2d31;
            border-radius: 8px;
            padding: 20px;
            transition: transform 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .data-table th,
        .data-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #3f4147;
        }
        
        .data-table th {
            background-color: #2b2d31;
            color: #949ba4;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
        }
        
        .data-table tr:hover {
            background-color: #2e3035;
        }
        
        .btn-discord {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.15s, opacity 0.15s;
        }
        
        .btn-discord:hover {
            opacity: 0.9;
        }
        
        .btn-primary {
            background-color: #5865f2;
            color: white;
        }
        
        .btn-danger {
            background-color: #ed4245;
            color: white;
        }
        
        .btn-secondary {
            background-color: #4e5058;
            color: white;
        }
        
        .search-input {
            background-color: #1e1f22;
            border: none;
            border-radius: 4px;
            padding: 10px 16px;
            color: #dbdee1;
            width: 100%;
        }
        
        .search-input:focus {
            outline: none;
        }
        
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .badge-success { background-color: #248046; color: white; }
        .badge-warning { background-color: #d4a72c; color: black; }
        .badge-danger { background-color: #da373c; color: white; }
        .badge-info { background-color: #5865f2; color: white; }
        
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .modal-content {
            background-color: #313338;
            border-radius: 8px;
            width: 480px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-header {
            padding: 16px;
            border-bottom: 1px solid #3f4147;
        }
        
        .modal-body {
            padding: 16px;
        }
        
        .modal-footer {
            padding: 16px;
            border-top: 1px solid #3f4147;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
        
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #5865f2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background-color: #1a1b1e; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background-color: #2e2f34; }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <div class="sidebar">
        <div class="p-4 border-b border-gray-700">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full discord-brand-bg flex items-center justify-center">
                    <i class="fas fa-shield-alt text-white"></i>
                </div>
                <div>
                    <h1 class="text-lg font-bold discord-text-primary">Admin Panel</h1>
                    <p class="text-xs discord-text-muted">CoCoCord</p>
                </div>
            </div>
        </div>
        
        <nav class="py-2">
            <div class="nav-item active" onclick="showTab('dashboard')">
                <i class="fas fa-chart-line w-5"></i>
                <span>Dashboard</span>
            </div>
            <div class="nav-item" onclick="showTab('users')">
                <i class="fas fa-users w-5"></i>
                <span>Users</span>
            </div>
            <div class="nav-item" onclick="showTab('servers')">
                <i class="fas fa-server w-5"></i>
                <span>Servers</span>
            </div>
            <div class="nav-item" onclick="showTab('reports')">
                <i class="fas fa-flag w-5"></i>
                <span>Reports</span>
            </div>
            <div class="nav-item" onclick="showTab('audit')">
                <i class="fas fa-history w-5"></i>
                <span>Audit Logs</span>
            </div>
            <div class="nav-item" onclick="showTab('settings')">
                <i class="fas fa-cog w-5"></i>
                <span>Settings</span>
            </div>
        </nav>
        
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700" style="width: 240px;">
            <a href="/home" class="nav-item">
                <i class="fas fa-arrow-left w-5"></i>
                <span>Back to App</span>
            </a>
            <a href="/logout" class="nav-item discord-danger">
                <i class="fas fa-sign-out-alt w-5"></i>
                <span>Logout</span>
            </a>
        </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
        <!-- Dashboard Tab -->
        <div id="tab-dashboard" class="tab-content active">
            <h2 class="text-2xl font-bold mb-6 discord-text-primary">Dashboard Overview</h2>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="stat-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="discord-text-muted text-sm">Total Users</p>
                            <p class="text-3xl font-bold discord-text-primary" id="stat-total-users">0</p>
                        </div>
                        <div class="w-12 h-12 rounded-full discord-brand-bg flex items-center justify-center">
                            <i class="fas fa-users text-white text-lg"></i>
                        </div>
                    </div>
                    <p class="text-sm mt-2 discord-success">
                        <i class="fas fa-arrow-up"></i> <span id="stat-new-users">0</span> new today
                    </p>
                </div>
                
                <div class="stat-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="discord-text-muted text-sm">Active Users</p>
                            <p class="text-3xl font-bold discord-text-primary" id="stat-active-users">0</p>
                        </div>
                        <div class="w-12 h-12 rounded-full discord-success-bg flex items-center justify-center">
                            <i class="fas fa-user-check text-white text-lg"></i>
                        </div>
                    </div>
                    <p class="text-sm mt-2 discord-text-muted">
                        <span id="stat-online-users">0</span> online now
                    </p>
                </div>
                
                <div class="stat-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="discord-text-muted text-sm">Total Servers</p>
                            <p class="text-3xl font-bold discord-text-primary" id="stat-total-servers">0</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                            <i class="fas fa-server text-white text-lg"></i>
                        </div>
                    </div>
                    <p class="text-sm mt-2 discord-text-muted">
                        <span id="stat-public-servers">0</span> public servers
                    </p>
                </div>
                
                <div class="stat-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="discord-text-muted text-sm">Messages Today</p>
                            <p class="text-3xl font-bold discord-text-primary" id="stat-messages">0</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center">
                            <i class="fas fa-comments text-white text-lg"></i>
                        </div>
                    </div>
                    <p class="text-sm mt-2 discord-text-muted">
                        Across all channels
                    </p>
                </div>
            </div>
            
            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="stat-card">
                    <h3 class="text-lg font-semibold mb-4 discord-text-primary">User Growth</h3>
                    <canvas id="userGrowthChart" height="200"></canvas>
                </div>
                <div class="stat-card">
                    <h3 class="text-lg font-semibold mb-4 discord-text-primary">Activity Overview</h3>
                    <canvas id="activityChart" height="200"></canvas>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="stat-card">
                <h3 class="text-lg font-semibold mb-4 discord-text-primary">Recent Activity</h3>
                <div id="recent-activity" class="space-y-3">
                    <!-- Activity items will be loaded here -->
                </div>
            </div>
        </div>
        
        <!-- Users Tab -->
        <div id="tab-users" class="tab-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold discord-text-primary">User Management</h2>
                <div class="flex gap-3">
                    <input type="text" id="user-search" placeholder="Search users..." 
                           class="search-input w-64" onkeyup="searchUsers()">
                    <button class="btn-discord btn-primary" onclick="refreshUsers()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            
            <div class="stat-card overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        <!-- Users will be loaded here -->
                    </tbody>
                </table>
            </div>
            
            <div class="flex justify-between items-center mt-4">
                <p class="discord-text-muted">Showing <span id="users-showing">0</span> users</p>
                <div class="flex gap-2">
                    <button class="btn-discord btn-secondary" id="users-prev" onclick="loadUsers(currentUserPage - 1)">
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <button class="btn-discord btn-secondary" id="users-next" onclick="loadUsers(currentUserPage + 1)">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Servers Tab -->
        <div id="tab-servers" class="tab-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold discord-text-primary">Server Management</h2>
                <div class="flex gap-3">
                    <input type="text" id="server-search" placeholder="Search servers..." 
                           class="search-input w-64" onkeyup="searchServers()">
                    <button class="btn-discord btn-primary" onclick="refreshServers()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            
            <div class="stat-card overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Server</th>
                            <th>Owner</th>
                            <th>Members</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="servers-table-body">
                        <!-- Servers will be loaded here -->
                    </tbody>
                </table>
            </div>
            
            <div class="flex justify-between items-center mt-4">
                <p class="discord-text-muted">Showing <span id="servers-showing">0</span> servers</p>
                <div class="flex gap-2">
                    <button class="btn-discord btn-secondary" id="servers-prev" onclick="loadServers(currentServerPage - 1)">
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <button class="btn-discord btn-secondary" id="servers-next" onclick="loadServers(currentServerPage + 1)">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Reports Tab -->
        <div id="tab-reports" class="tab-content">
            <h2 class="text-2xl font-bold mb-6 discord-text-primary">Reports</h2>
            
            <div class="stat-card">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold discord-text-primary">Pending Reports</h3>
                    <span class="badge badge-warning" id="pending-reports-count">0</span>
                </div>
                
                <div id="reports-list" class="space-y-4">
                    <div class="text-center py-8 discord-text-muted">
                        <i class="fas fa-check-circle text-4xl mb-2"></i>
                        <p>No pending reports</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Audit Logs Tab -->
        <div id="tab-audit" class="tab-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold discord-text-primary">Audit Logs</h2>
                <div class="flex gap-3">
                    <select class="search-input w-48" id="audit-filter" onchange="loadAuditLogs()">
                        <option value="">All Actions</option>
                        <option value="USER_LOGIN">User Login</option>
                        <option value="USER_REGISTER">User Register</option>
                        <option value="USER_BAN">User Ban</option>
                        <option value="SERVER_CREATE">Server Create</option>
                        <option value="SERVER_DELETE">Server Delete</option>
                    </select>
                    <button class="btn-discord btn-primary" onclick="loadAuditLogs()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            
            <div class="stat-card overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Action</th>
                            <th>User</th>
                            <th>Target</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody id="audit-table-body">
                        <!-- Audit logs will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Settings Tab -->
        <div id="tab-settings" class="tab-content">
            <h2 class="text-2xl font-bold mb-6 discord-text-primary">System Settings</h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="stat-card">
                    <h3 class="text-lg font-semibold mb-4 discord-text-primary">General Settings</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm discord-text-secondary mb-2">Site Name</label>
                            <input type="text" class="search-input" value="CoCoCord">
                        </div>
                        <div>
                            <label class="block text-sm discord-text-secondary mb-2">Max File Size (MB)</label>
                            <input type="number" class="search-input" value="25">
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="discord-text-secondary">Enable Registration</span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="discord-text-secondary">Maintenance Mode</span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    </div>
                    
                    <button class="btn-discord btn-primary mt-4">Save Settings</button>
                </div>
                
                <div class="stat-card">
                    <h3 class="text-lg font-semibold mb-4 discord-text-primary">System Status</h3>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-gray-700">
                            <span class="discord-text-secondary">Database</span>
                            <span class="badge badge-success">Connected</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-700">
                            <span class="discord-text-secondary">MongoDB</span>
                            <span class="badge badge-success">Connected</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-700">
                            <span class="discord-text-secondary">WebSocket</span>
                            <span class="badge badge-success">Active</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-700">
                            <span class="discord-text-secondary">Email Service</span>
                            <span class="badge badge-warning">Not Configured</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="discord-text-secondary">File Storage</span>
                            <span class="badge badge-success">Available</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Ban User Modal -->
    <div id="ban-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="text-lg font-semibold discord-text-primary">Ban User</h3>
            </div>
            <div class="modal-body">
                <p class="discord-text-secondary mb-4">Are you sure you want to ban <strong id="ban-username"></strong>?</p>
                <div>
                    <label class="block text-sm discord-text-secondary mb-2">Reason</label>
                    <textarea id="ban-reason" class="search-input w-full h-24" placeholder="Enter ban reason..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-discord btn-secondary" onclick="closeBanModal()">Cancel</button>
                <button class="btn-discord btn-danger" onclick="confirmBan()">Ban User</button>
            </div>
        </div>
    </div>
    
    <!-- Delete Server Modal -->
    <div id="delete-server-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="text-lg font-semibold discord-text-primary">Delete Server</h3>
            </div>
            <div class="modal-body">
                <p class="discord-text-secondary mb-4">Are you sure you want to delete <strong id="delete-server-name"></strong>?</p>
                <p class="discord-danger text-sm">This action cannot be undone. All channels, messages, and data will be permanently deleted.</p>
            </div>
            <div class="modal-footer">
                <button class="btn-discord btn-secondary" onclick="closeDeleteServerModal()">Cancel</button>
                <button class="btn-discord btn-danger" onclick="confirmDeleteServer()">Delete Server</button>
            </div>
        </div>
    </div>

    <script>
        var token = localStorage.getItem('token');
        var currentUserPage = 0;
        var currentServerPage = 0;
        var selectedUserId = null;
        var selectedServerId = null;
        
        // Check authentication
        if (!token) {
            window.location.href = '/login';
        }
        
        // Tab navigation
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(function(tab) {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.nav-item').forEach(function(item) {
                item.classList.remove('active');
            });
            
            document.getElementById('tab-' + tabName).classList.add('active');
            event.currentTarget.classList.add('active');
            
            // Load data for the tab
            if (tabName === 'users') loadUsers(0);
            if (tabName === 'servers') loadServers(0);
            if (tabName === 'audit') loadAuditLogs();
        }
        
        // Load dashboard stats
        function loadDashboardStats() {
            $.ajax({
                url: '/api/admin/stats',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function(data) {
                    $('#stat-total-users').text(data.totalUsers || 0);
                    $('#stat-active-users').text(data.activeUsers || 0);
                    $('#stat-new-users').text(data.newUsersToday || 0);
                    $('#stat-total-servers').text(data.totalServers || 0);
                    $('#stat-messages').text(data.messagesToday || 0);
                },
                error: function(xhr) {
                    console.error('Failed to load stats:', xhr);
                }
            });
        }
        
        // Load users
        function loadUsers(page) {
            if (page < 0) return;
            currentUserPage = page;
            
            $.ajax({
                url: '/api/admin/users?page=' + page + '&size=10',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function(data) {
                    var tbody = $('#users-table-body');
                    tbody.empty();
                    
                    var users = data.content || data;
                    users.forEach(function(user) {
                        var statusBadge = user.status === 'ACTIVE' 
                            ? '<span class="badge badge-success">Active</span>'
                            : user.status === 'BANNED'
                            ? '<span class="badge badge-danger">Banned</span>'
                            : '<span class="badge badge-warning">Pending</span>';
                        
                        var initial = user.username ? user.username.charAt(0).toUpperCase() : '?';
                        var joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
                        
                        tbody.append(
                            '<tr>' +
                            '<td>' +
                            '    <div class="flex items-center gap-3">' +
                            '        <div class="avatar">' + initial + '</div>' +
                            '        <div>' +
                            '            <p class="font-medium discord-text-primary">' + user.username + '</p>' +
                            '            <p class="text-sm discord-text-muted">ID: ' + user.id + '</p>' +
                            '        </div>' +
                            '    </div>' +
                            '</td>' +
                            '<td class="discord-text-secondary">' + user.email + '</td>' +
                            '<td>' + statusBadge + '</td>' +
                            '<td class="discord-text-muted">' + joinDate + '</td>' +
                            '<td>' +
                            '    <button class="btn-discord btn-secondary mr-2" onclick="viewUser(' + user.id + ')">' +
                            '        <i class="fas fa-eye"></i>' +
                            '    </button>' +
                            (user.status !== 'BANNED' 
                                ? '    <button class="btn-discord btn-danger" onclick="openBanModal(' + user.id + ', \'' + user.username + '\')">' +
                                  '        <i class="fas fa-ban"></i>' +
                                  '    </button>'
                                : '    <button class="btn-discord btn-success" onclick="unbanUser(' + user.id + ')">' +
                                  '        <i class="fas fa-check"></i>' +
                                  '    </button>') +
                            '</td>' +
                            '</tr>'
                        );
                    });
                    
                    $('#users-showing').text(users.length);
                    $('#users-prev').prop('disabled', page === 0);
                    $('#users-next').prop('disabled', !data.hasNext);
                },
                error: function(xhr) {
                    console.error('Failed to load users:', xhr);
                }
            });
        }
        
        // Load servers
        function loadServers(page) {
            if (page < 0) return;
            currentServerPage = page;
            
            $.ajax({
                url: '/api/admin/servers?page=' + page + '&size=10',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function(data) {
                    var tbody = $('#servers-table-body');
                    tbody.empty();
                    
                    var servers = data.content || data;
                    servers.forEach(function(server) {
                        var initial = server.name ? server.name.charAt(0).toUpperCase() : '?';
                        var createDate = server.createdAt ? new Date(server.createdAt).toLocaleDateString() : 'N/A';
                        
                        tbody.append(
                            '<tr>' +
                            '<td>' +
                            '    <div class="flex items-center gap-3">' +
                            '        <div class="avatar" style="background-color: #' + Math.floor(Math.random()*16777215).toString(16) + '">' + initial + '</div>' +
                            '        <div>' +
                            '            <p class="font-medium discord-text-primary">' + server.name + '</p>' +
                            '            <p class="text-sm discord-text-muted">ID: ' + server.id + '</p>' +
                            '        </div>' +
                            '    </div>' +
                            '</td>' +
                            '<td class="discord-text-secondary">' + (server.ownerUsername || 'Unknown') + '</td>' +
                            '<td class="discord-text-secondary">' + (server.memberCount || 0) + ' members</td>' +
                            '<td class="discord-text-muted">' + createDate + '</td>' +
                            '<td>' +
                            '    <button class="btn-discord btn-secondary mr-2" onclick="viewServer(' + server.id + ')">' +
                            '        <i class="fas fa-eye"></i>' +
                            '    </button>' +
                            '    <button class="btn-discord btn-danger" onclick="openDeleteServerModal(' + server.id + ', \'' + server.name + '\')">' +
                            '        <i class="fas fa-trash"></i>' +
                            '    </button>' +
                            '</td>' +
                            '</tr>'
                        );
                    });
                    
                    $('#servers-showing').text(servers.length);
                    $('#servers-prev').prop('disabled', page === 0);
                    $('#servers-next').prop('disabled', !data.hasNext);
                },
                error: function(xhr) {
                    console.error('Failed to load servers:', xhr);
                }
            });
        }
        
        // Load audit logs
        function loadAuditLogs() {
            var filter = $('#audit-filter').val();
            var url = '/api/admin/audit-logs?size=50';
            if (filter) url += '&action=' + filter;
            
            $.ajax({
                url: url,
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function(data) {
                    var tbody = $('#audit-table-body');
                    tbody.empty();
                    
                    var logs = data.content || data;
                    if (logs.length === 0) {
                        tbody.append('<tr><td colspan="5" class="text-center discord-text-muted py-8">No audit logs found</td></tr>');
                        return;
                    }
                    
                    logs.forEach(function(log) {
                        var time = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A';
                        var actionBadge = '<span class="badge badge-info">' + log.action + '</span>';
                        
                        tbody.append(
                            '<tr>' +
                            '<td class="discord-text-muted">' + time + '</td>' +
                            '<td>' + actionBadge + '</td>' +
                            '<td class="discord-text-secondary">' + (log.username || 'System') + '</td>' +
                            '<td class="discord-text-secondary">' + (log.targetName || '-') + '</td>' +
                            '<td class="discord-text-muted">' + (log.details || '-') + '</td>' +
                            '</tr>'
                        );
                    });
                },
                error: function(xhr) {
                    console.error('Failed to load audit logs:', xhr);
                }
            });
        }
        
        // User search
        var userSearchTimeout;
        function searchUsers() {
            clearTimeout(userSearchTimeout);
            userSearchTimeout = setTimeout(function() {
                var query = $('#user-search').val();
                if (query.length < 2) {
                    loadUsers(0);
                    return;
                }
                
                $.ajax({
                    url: '/api/admin/users/search?q=' + encodeURIComponent(query),
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token },
                    success: function(data) {
                        // Same rendering as loadUsers
                        loadUsers(0);
                    }
                });
            }, 300);
        }
        
        function refreshUsers() {
            $('#user-search').val('');
            loadUsers(0);
        }
        
        // Server search  
        var serverSearchTimeout;
        function searchServers() {
            clearTimeout(serverSearchTimeout);
            serverSearchTimeout = setTimeout(function() {
                var query = $('#server-search').val();
                if (query.length < 2) {
                    loadServers(0);
                    return;
                }
                
                $.ajax({
                    url: '/api/admin/servers/search?q=' + encodeURIComponent(query),
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token },
                    success: function(data) {
                        loadServers(0);
                    }
                });
            }, 300);
        }
        
        function refreshServers() {
            $('#server-search').val('');
            loadServers(0);
        }
        
        // Ban modal
        function openBanModal(userId, username) {
            selectedUserId = userId;
            $('#ban-username').text(username);
            $('#ban-reason').val('');
            $('#ban-modal').css('display', 'flex');
        }
        
        function closeBanModal() {
            $('#ban-modal').hide();
            selectedUserId = null;
        }
        
        function confirmBan() {
            var reason = $('#ban-reason').val();
            
            $.ajax({
                url: '/api/admin/users/' + selectedUserId + '/ban',
                method: 'POST',
                headers: { 
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ reason: reason }),
                success: function() {
                    closeBanModal();
                    loadUsers(currentUserPage);
                    alert('User has been banned');
                },
                error: function(xhr) {
                    alert('Failed to ban user: ' + xhr.responseText);
                }
            });
        }
        
        function unbanUser(userId) {
            if (!confirm('Are you sure you want to unban this user?')) return;
            
            $.ajax({
                url: '/api/admin/users/' + userId + '/unban',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function() {
                    loadUsers(currentUserPage);
                    alert('User has been unbanned');
                },
                error: function(xhr) {
                    alert('Failed to unban user: ' + xhr.responseText);
                }
            });
        }
        
        // Delete server modal
        function openDeleteServerModal(serverId, serverName) {
            selectedServerId = serverId;
            $('#delete-server-name').text(serverName);
            $('#delete-server-modal').css('display', 'flex');
        }
        
        function closeDeleteServerModal() {
            $('#delete-server-modal').hide();
            selectedServerId = null;
        }
        
        function confirmDeleteServer() {
            $.ajax({
                url: '/api/admin/servers/' + selectedServerId,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function() {
                    closeDeleteServerModal();
                    loadServers(currentServerPage);
                    alert('Server has been deleted');
                },
                error: function(xhr) {
                    alert('Failed to delete server: ' + xhr.responseText);
                }
            });
        }
        
        function viewUser(userId) {
            alert('View user details: ' + userId);
        }
        
        function viewServer(serverId) {
            alert('View server details: ' + serverId);
        }
        
        // Initialize charts
        function initCharts() {
            // User Growth Chart
            var ctx1 = document.getElementById('userGrowthChart').getContext('2d');
            new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'New Users',
                        data: [12, 19, 15, 25, 22, 30, 28],
                        borderColor: '#5865f2',
                        backgroundColor: 'rgba(88, 101, 242, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: '#3f4147' },
                            ticks: { color: '#949ba4' }
                        },
                        x: { 
                            grid: { color: '#3f4147' },
                            ticks: { color: '#949ba4' }
                        }
                    }
                }
            });
            
            // Activity Chart
            var ctx2 = document.getElementById('activityChart').getContext('2d');
            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Messages', 'Voice', 'Uploads', 'Reactions'],
                    datasets: [{
                        data: [45, 25, 15, 15],
                        backgroundColor: ['#5865f2', '#3ba55d', '#faa81a', '#ed4245']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: { color: '#949ba4' }
                        }
                    }
                }
            });
        }
        
        // Load recent activity
        function loadRecentActivity() {
            var activities = [
                { icon: 'fa-user-plus', color: '#3ba55d', text: 'New user registered: testuser123', time: '2 minutes ago' },
                { icon: 'fa-server', color: '#5865f2', text: 'New server created: Gaming Hub', time: '15 minutes ago' },
                { icon: 'fa-ban', color: '#ed4245', text: 'User banned: spammer99', time: '1 hour ago' },
                { icon: 'fa-flag', color: '#faa81a', text: 'New report submitted', time: '2 hours ago' }
            ];
            
            var container = $('#recent-activity');
            container.empty();
            
            activities.forEach(function(activity) {
                container.append(
                    '<div class="flex items-center gap-4 p-3 rounded hover:bg-gray-800">' +
                    '    <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: ' + activity.color + '20">' +
                    '        <i class="fas ' + activity.icon + '" style="color: ' + activity.color + '"></i>' +
                    '    </div>' +
                    '    <div class="flex-1">' +
                    '        <p class="discord-text-primary">' + activity.text + '</p>' +
                    '        <p class="text-sm discord-text-muted">' + activity.time + '</p>' +
                    '    </div>' +
                    '</div>'
                );
            });
        }
        
        // Initialize
        $(document).ready(function() {
            loadDashboardStats();
            initCharts();
            loadRecentActivity();
        });
    </script>
</body>
</html>
