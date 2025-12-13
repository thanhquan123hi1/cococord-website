<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Management - CoCoCord Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        :root {
            --dark-bg: #1a1a2e;
            --darker-bg: #16213e;
            --accent: #5865f2;
            --text-primary: #ffffff;
            --text-secondary: #b9bbbe;
            --danger: #ed4245;
            --success: #3ba55c;
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
        
        .server-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
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
                <a class="nav-link" href="/admin/users">
                    <i class="bi bi-people"></i> Users
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link active" href="/admin/servers">
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
            <h1><i class="bi bi-hdd-stack me-2"></i>Server Management</h1>
        </div>
        
        <!-- Search -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-9">
                        <div class="input-group">
                            <span class="input-group-text bg-transparent border-secondary text-white">
                                <i class="bi bi-search"></i>
                            </span>
                            <input type="text" class="form-control search-box" id="searchInput" 
                                   placeholder="Search by server name...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-primary w-100" onclick="loadServers()">
                            <i class="bi bi-search"></i> Search
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Servers Table -->
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Server</th>
                                <th>Owner</th>
                                <th>Members</th>
                                <th>Channels</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="serversTableBody">
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

        async function loadServers(page = 0) {
            currentPage = page;
            const search = document.getElementById('searchInput').value;
            let url = `/api/admin/servers?page=\${page}&size=\${pageSize}`;
            if (search) {
                url += `&search=\${encodeURIComponent(search)}`;
            }
            
            const data = await fetchAPI(url);
            
            if (data && data.content) {
                renderServers(data.content);
                renderPagination(data.totalPages, page);
            }
        }

        function renderServers(servers) {
            const tbody = document.getElementById('serversTableBody');
            tbody.innerHTML = servers.map(server => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="server-icon me-2">
                                \${server.iconUrl 
                                    ? `<img src="\${server.iconUrl}" width="40" height="40" style="border-radius:12px">` 
                                    : server.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <strong>\${server.name}</strong>
                                \${server.description 
                                    ? `<br><small class="text-muted">\${server.description.substring(0, 50)}\${server.description.length > 50 ? '...' : ''}</small>` 
                                    : ''}
                            </div>
                        </div>
                    </td>
                    <td>@\${server.ownerUsername}</td>
                    <td><span class="badge bg-primary">\${server.memberCount || 0}</span></td>
                    <td><span class="badge bg-secondary">\${server.channelCount || 0}</span></td>
                    <td>\${server.createdAt ? new Date(server.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewServer(\${server.id})" title="View">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteServer(\${server.id}, '\${server.name}')" title="Delete">
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
            
            html += `<li class="page-item \${currentPage === 0 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="loadServers(\${currentPage - 1})">Previous</a>
                     </li>`;
            
            for (let i = 0; i < totalPages; i++) {
                if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    html += `<li class="page-item \${i === currentPage ? 'active' : ''}">
                                <a class="page-link" href="#" onclick="loadServers(\${i})">\${i + 1}</a>
                             </li>`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                }
            }
            
            html += `<li class="page-item \${currentPage >= totalPages - 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="loadServers(\${currentPage + 1})">Next</a>
                     </li>`;
            
            pagination.innerHTML = html;
        }

        async function deleteServer(serverId, serverName) {
            if (confirm(`Are you sure you want to DELETE server "\${serverName}"? This will delete ALL channels and messages. This action CANNOT be undone!`)) {
                await fetchAPI(`/api/admin/servers/\${serverId}`, { method: 'DELETE' });
                loadServers(currentPage);
            }
        }

        function viewServer(serverId) {
            // Could open a modal with server details
            alert('Server details view coming soon for server ID: ' + serverId);
        }

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadServers();
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            loadServers();
        });
    </script>
</body>
</html>
