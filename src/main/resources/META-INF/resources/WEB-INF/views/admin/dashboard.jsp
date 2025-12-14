<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - CoCoCord</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        :root {
            --dark-bg: #1a1a2e;
            --darker-bg: #16213e;
            --accent: #5865f2;
            --accent-hover: #4752c4;
            --text-primary: #ffffff;
            --text-secondary: #b9bbbe;
            --danger: #ed4245;
            --success: #3ba55c;
            --warning: #faa61a;
        }
        
        body {
            background-color: var(--dark-bg);
            color: var(--text-primary);
            min-height: 100vh;
        }
        
        .sidebar {
            background-color: var(--darker-bg);
            min-height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            width: 250px;
            padding: 1rem;
        }
        
        .sidebar .nav-link {
            color: var(--text-secondary);
            border-radius: 8px;
            margin-bottom: 0.5rem;
            transition: all 0.2s;
        }
        
        .sidebar .nav-link:hover,
        .sidebar .nav-link.active {
            background-color: var(--accent);
            color: var(--text-primary);
        }
        
        .sidebar .nav-link i {
            margin-right: 0.5rem;
        }
        
        .main-content {
            margin-left: 250px;
            padding: 2rem;
        }
        
        .stat-card {
            background: linear-gradient(135deg, var(--darker-bg), var(--dark-bg));
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            transition: transform 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: var(--accent);
        }
        
        .stat-card .stat-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .stat-card.online .stat-value {
            color: var(--success);
        }
        
        .stat-card.banned .stat-value {
            color: var(--danger);
        }
        
        .stat-card.warning .stat-value {
            color: var(--warning);
        }
        
        .card {
            background-color: var(--darker-bg);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
        }
        
        .card-header {
            background-color: transparent;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .table {
            color: var(--text-primary);
        }
        
        .table thead th {
            border-color: rgba(255,255,255,0.1);
            color: var(--text-secondary);
        }
        
        .table tbody td {
            border-color: rgba(255,255,255,0.1);
        }
        
        .badge-role {
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
        }
        
        .badge-admin {
            background-color: var(--danger);
        }
        
        .badge-moderator {
            background-color: var(--warning);
        }
        
        .badge-user {
            background-color: var(--accent);
        }
        
        .btn-action {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
        }
        
        .brand-logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--text-primary);
            text-decoration: none;
            margin-bottom: 2rem;
            display: block;
        }
        
        .brand-logo span {
            color: var(--accent);
        }
        
        .loading-spinner {
            display: none;
            text-align: center;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <nav class="sidebar">
        <a href="/admin" class="brand-logo">
            <i class="bi bi-discord"></i> Coco<span>Cord</span>
        </a>
        
        <ul class="nav flex-column">
            <li class="nav-item">
                <a class="nav-link active" href="/admin">
                    <i class="bi bi-speedometer2"></i> Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/admin/users">
                    <i class="bi bi-people"></i> Users
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/admin/servers">
                    <i class="bi bi-hdd-stack"></i> Servers
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/admin/stats">
                    <i class="bi bi-graph-up"></i> Statistics
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/admin/audit">
                    <i class="bi bi-journal-text"></i> Audit Logs
                </a>
            </li>
            <li class="nav-item mt-4">
                <a class="nav-link" href="/">
                    <i class="bi bi-arrow-left"></i> Back to Home
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link text-danger" href="#" onclick="logout()">
                    <i class="bi bi-box-arrow-right"></i> Logout
                </a>
            </li>
        </ul>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
        <h1 class="mb-4">Dashboard Overview</h1>
        
        <!-- Stats Cards -->
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-value" id="totalUsers">-</div>
                    <div class="stat-label">Total Users</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card online">
                    <div class="stat-value" id="onlineUsers">-</div>
                    <div class="stat-label">Online Now</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-value" id="totalServers">-</div>
                    <div class="stat-label">Total Servers</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card banned">
                    <div class="stat-value" id="bannedUsers">-</div>
                    <div class="stat-label">Banned Users</div>
                </div>
            </div>
        </div>

        <!-- Recent Users Table -->
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-people me-2"></i>Recent Users</h5>
                <a href="/admin/users" class="btn btn-sm btn-outline-light">View All</a>
            </div>
            <div class="card-body">
                <div class="loading-spinner" id="usersLoading">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover" id="usersTable">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Recent Servers Table -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-hdd-stack me-2"></i>Recent Servers</h5>
                <a href="/admin/servers" class="btn btn-sm btn-outline-light">View All</a>
            </div>
            <div class="card-body">
                <div class="loading-spinner" id="serversLoading">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover" id="serversTable">
                        <thead>
                            <tr>
                                <th>Server</th>
                                <th>Owner</th>
                                <th>Members</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="serversTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = '/login';
        }

        async function fetchAPI(url, options = {}) {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            if (response.status === 401 || response.status === 403) {
                alert('Access denied. Admin privileges required.');
                window.location.href = '/';
                return null;
            }
            return response.json();
        }

        async function loadStats() {
            const stats = await fetchAPI('/api/admin/stats');
            if (stats) {
                document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
                document.getElementById('onlineUsers').textContent = stats.onlineUsers || 0;
                document.getElementById('totalServers').textContent = stats.totalServers || 0;
                document.getElementById('bannedUsers').textContent = stats.bannedUsers || 0;
            }
        }

        async function loadRecentUsers() {
            document.getElementById('usersLoading').style.display = 'block';
            const data = await fetchAPI('/api/admin/users?page=0&size=5');
            document.getElementById('usersLoading').style.display = 'none';
            
            if (data && data.content) {
                const tbody = document.getElementById('usersTableBody');
                tbody.innerHTML = data.content.map(user => `
                    <tr>
                        <td>
                            <strong>\${user.displayName || user.username}</strong>
                            <br><small class="text-muted">@\${user.username}</small>
                        </td>
                        <td>\${user.email}</td>
                        <td>
                            \${user.isBanned 
                                ? '<span class="badge bg-danger">Banned</span>' 
                                : '<span class="badge bg-success">Active</span>'}
                        </td>
                        <td>\${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary btn-action" onclick="viewUser(\${user.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            \${user.isBanned 
                                ? `<button class="btn btn-sm btn-outline-success btn-action" onclick="unbanUser(\${user.id})">
                                    <i class="bi bi-unlock"></i>
                                   </button>`
                                : `<button class="btn btn-sm btn-outline-danger btn-action" onclick="banUser(\${user.id})">
                                    <i class="bi bi-lock"></i>
                                   </button>`}
                        </td>
                    </tr>
                `).join('');
            }
        }

        async function loadRecentServers() {
            document.getElementById('serversLoading').style.display = 'block';
            const data = await fetchAPI('/api/admin/servers?page=0&size=5');
            document.getElementById('serversLoading').style.display = 'none';
            
            if (data && data.content) {
                const tbody = document.getElementById('serversTableBody');
                tbody.innerHTML = data.content.map(server => `
                    <tr>
                        <td>
                            <strong>\${server.name}</strong>
                            \${server.description ? `<br><small class="text-muted">\${server.description.substring(0, 50)}...</small>` : ''}
                        </td>
                        <td>@\${server.ownerUsername}</td>
                        <td>\${server.memberCount || 0}</td>
                        <td>\${new Date(server.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteServer(\${server.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        async function banUser(userId) {
            if (confirm('Are you sure you want to ban this user?')) {
                await fetchAPI(`/api/admin/users/\${userId}/ban`, { method: 'POST' });
                loadRecentUsers();
                loadStats();
            }
        }

        async function unbanUser(userId) {
            if (confirm('Are you sure you want to unban this user?')) {
                await fetchAPI(`/api/admin/users/\${userId}/unban`, { method: 'POST' });
                loadRecentUsers();
                loadStats();
            }
        }

        async function deleteServer(serverId) {
            if (confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
                await fetchAPI(`/api/admin/servers/\${serverId}`, { method: 'DELETE' });
                loadRecentServers();
                loadStats();
            }
        }

        function viewUser(userId) {
            window.location.href = `/admin/users?id=\${userId}`;
        }

        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadStats();
            loadRecentUsers();
            loadRecentServers();
        });
    </script>
</body>
</html>
