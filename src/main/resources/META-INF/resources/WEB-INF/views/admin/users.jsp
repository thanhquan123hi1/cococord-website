<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management - CoCoCord Admin</title>
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
            vertical-align: middle;
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
        
        .search-box {
            background-color: var(--dark-bg);
            border: 1px solid rgba(255,255,255,0.1);
            color: var(--text-primary);
            border-radius: 8px;
        }
        
        .search-box:focus {
            background-color: var(--dark-bg);
            border-color: var(--accent);
            color: var(--text-primary);
            box-shadow: none;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .pagination .page-link {
            background-color: var(--darker-bg);
            border-color: rgba(255,255,255,0.1);
            color: var(--text-primary);
        }
        
        .pagination .page-link:hover {
            background-color: var(--accent);
        }
        
        .pagination .page-item.active .page-link {
            background-color: var(--accent);
            border-color: var(--accent);
        }
        
        .role-select {
            background-color: var(--dark-bg);
            border: 1px solid rgba(255,255,255,0.1);
            color: var(--text-primary);
            border-radius: 4px;
            padding: 0.25rem 0.5rem;
        }
        
        .modal-content {
            background-color: var(--darker-bg);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .modal-header {
            border-bottom-color: rgba(255,255,255,0.1);
        }
        
        .modal-footer {
            border-top-color: rgba(255,255,255,0.1);
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
                <a class="nav-link" href="/admin">
                    <i class="bi bi-speedometer2"></i> Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="/admin/users">
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
                <a class="nav-link" href="/chat">
                    <i class="bi bi-arrow-left"></i> Back to Chat
                </a>
            </li>
        </ul>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1><i class="bi bi-people me-2"></i>User Management</h1>
        </div>
        
        <!-- Search & Filter -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text bg-transparent border-secondary text-white">
                                <i class="bi bi-search"></i>
                            </span>
                            <input type="text" class="form-control search-box" id="searchInput" 
                                   placeholder="Search by username or email...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select search-box" id="statusFilter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="banned">Banned</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-primary w-100" onclick="loadUsers()">
                            <i class="bi bi-funnel"></i> Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <nav>
                    <ul class="pagination justify-content-center" id="pagination">
                    </ul>
                </nav>
            </div>
        </div>
    </main>

    <!-- User Detail Modal -->
    <div class="modal fade" id="userModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">User Details</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" id="userModalBody">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const token = localStorage.getItem('token');
        let currentPage = 0;
        const pageSize = 15;
        
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
                window.location.href = '/chat';
                return null;
            }
            return response.json();
        }

        async function loadUsers(page = 0) {
            currentPage = page;
            const search = document.getElementById('searchInput').value;
            let url = `/api/admin/users?page=\${page}&size=\${pageSize}`;
            if (search) {
                url += `&search=\${encodeURIComponent(search)}`;
            }
            
            const data = await fetchAPI(url);
            
            if (data && data.content) {
                renderUsers(data.content);
                renderPagination(data.totalPages, page);
            }
        }

        function renderUsers(users) {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="user-avatar me-2">
                                \${user.avatarUrl 
                                    ? `<img src="\${user.avatarUrl}" width="40" height="40" style="border-radius:50%">` 
                                    : user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <strong>\${user.displayName || user.username}</strong>
                                <br><small class="text-muted">@\${user.username}</small>
                            </div>
                        </div>
                    </td>
                    <td>\${user.email}</td>
                    <td>
                        <select class="role-select" onchange="changeRole(\${user.id}, this.value)">
                            <option value="USER" \${!user.role || user.role === 'USER' ? 'selected' : ''}>User</option>
                            <option value="MODERATOR" \${user.role === 'MODERATOR' ? 'selected' : ''}>Moderator</option>
                            <option value="ADMIN" \${user.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td>
                        \${user.isBanned 
                            ? '<span class="badge bg-danger">Banned</span>' 
                            : user.isActive 
                                ? '<span class="badge bg-success">Active</span>'
                                : '<span class="badge bg-secondary">Inactive</span>'}
                    </td>
                    <td>\${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                    <td>\${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewUser(\${user.id})" title="View">
                                <i class="bi bi-eye"></i>
                            </button>
                            \${user.isBanned 
                                ? `<button class="btn btn-sm btn-outline-success" onclick="unbanUser(\${user.id})" title="Unban">
                                    <i class="bi bi-unlock"></i>
                                   </button>`
                                : `<button class="btn btn-sm btn-outline-warning" onclick="banUser(\${user.id})" title="Ban">
                                    <i class="bi bi-lock"></i>
                                   </button>`}
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(\${user.id})" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function renderPagination(totalPages, currentPage) {
            const pagination = document.getElementById('pagination');
            let html = '';
            
            // Previous
            html += `<li class="page-item \${currentPage === 0 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="loadUsers(\${currentPage - 1})">Previous</a>
                     </li>`;
            
            // Page numbers
            for (let i = 0; i < totalPages; i++) {
                if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    html += `<li class="page-item \${i === currentPage ? 'active' : ''}">
                                <a class="page-link" href="#" onclick="loadUsers(\${i})">\${i + 1}</a>
                             </li>`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                }
            }
            
            // Next
            html += `<li class="page-item \${currentPage >= totalPages - 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="loadUsers(\${currentPage + 1})">Next</a>
                     </li>`;
            
            pagination.innerHTML = html;
        }

        async function banUser(userId) {
            if (confirm('Are you sure you want to ban this user?')) {
                await fetchAPI(`/api/admin/users/\${userId}/ban`, { method: 'POST' });
                loadUsers(currentPage);
            }
        }

        async function unbanUser(userId) {
            if (confirm('Are you sure you want to unban this user?')) {
                await fetchAPI(`/api/admin/users/\${userId}/unban`, { method: 'POST' });
                loadUsers(currentPage);
            }
        }

        async function deleteUser(userId) {
            if (confirm('Are you sure you want to DELETE this user? This action CANNOT be undone!')) {
                await fetchAPI(`/api/admin/users/\${userId}`, { method: 'DELETE' });
                loadUsers(currentPage);
            }
        }

        async function changeRole(userId, role) {
            await fetchAPI(`/api/admin/users/\${userId}/role?role=\${role}`, { method: 'PUT' });
        }

        async function viewUser(userId) {
            // Show modal with user details
            const modal = new bootstrap.Modal(document.getElementById('userModal'));
            document.getElementById('userModalBody').innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
            modal.show();
            
            // For now just show placeholder
            document.getElementById('userModalBody').innerHTML = `
                <p>User ID: \${userId}</p>
                <p>Full user details coming soon...</p>
            `;
        }

        // Search on Enter key
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadUsers();
            }
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadUsers();
        });
    </script>
</body>
</html>
