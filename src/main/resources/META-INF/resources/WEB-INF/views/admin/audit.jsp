<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Logs - CoCoCord Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        :root {
            --dark-bg: #1a1a2e;
            --darker-bg: #16213e;
            --accent: #5865f2;
            --text-primary: #ffffff;
            --text-secondary: #b9bbbe;
            --success: #3ba55c;
            --danger: #ed4245;
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
        }
        
        .sidebar .nav-link:hover, .sidebar .nav-link.active {
            background-color: var(--accent);
            color: var(--text-primary);
        }
        
        .sidebar .nav-link i { margin-right: 0.5rem; }
        
        .main-content {
            margin-left: 250px;
            padding: 2rem;
        }
        
        .brand-logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--text-primary);
            text-decoration: none;
            margin-bottom: 2rem;
            display: block;
        }
        
        .brand-logo span { color: var(--accent); }
        
        .card {
            background-color: var(--darker-bg);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
        }
        
        .log-entry {
            padding: 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            transition: background 0.2s;
        }
        
        .log-entry:hover {
            background-color: rgba(255,255,255,0.05);
        }
        
        .log-entry:last-child {
            border-bottom: none;
        }
        
        .log-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }
        
        .log-icon.info { background-color: rgba(88, 101, 242, 0.2); color: var(--accent); }
        .log-icon.success { background-color: rgba(59, 165, 92, 0.2); color: var(--success); }
        .log-icon.warning { background-color: rgba(250, 166, 26, 0.2); color: var(--warning); }
        .log-icon.danger { background-color: rgba(237, 66, 69, 0.2); color: var(--danger); }
        
        .log-time {
            color: var(--text-secondary);
            font-size: 0.85rem;
        }
        
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-secondary);
        }
        
        .empty-state i {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <nav class="sidebar">
        <a href="/admin" class="brand-logo"><i class="bi bi-discord"></i> Coco<span>Cord</span></a>
        <ul class="nav flex-column">
            <li class="nav-item"><a class="nav-link" href="/admin"><i class="bi bi-speedometer2"></i> Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" href="/admin/users"><i class="bi bi-people"></i> Users</a></li>
            <li class="nav-item"><a class="nav-link" href="/admin/servers"><i class="bi bi-hdd-stack"></i> Servers</a></li>
            <li class="nav-item"><a class="nav-link" href="/admin/stats"><i class="bi bi-graph-up"></i> Statistics</a></li>
            <li class="nav-item"><a class="nav-link active" href="/admin/audit"><i class="bi bi-journal-text"></i> Audit Logs</a></li>
            <li class="nav-item mt-4"><a class="nav-link" href="/"><i class="bi bi-arrow-left"></i> Back to Home</a></li>
        </ul>
    </nav>

    <main class="main-content">
        <h1 class="mb-4"><i class="bi bi-journal-text me-2"></i>Audit Logs</h1>
        
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Recent Activity</h5>
                <button class="btn btn-sm btn-outline-light" onclick="refreshLogs()">
                    <i class="bi bi-arrow-clockwise"></i> Refresh
                </button>
            </div>
            <div class="card-body p-0" id="logsContainer">
                <div class="empty-state">
                    <i class="bi bi-journal-x"></i>
                    <h4>Audit Logs Coming Soon</h4>
                    <p>This feature will track admin actions like:</p>
                    <ul class="list-unstyled">
                        <li><i class="bi bi-check text-success"></i> User bans/unbans</li>
                        <li><i class="bi bi-check text-success"></i> Role changes</li>
                        <li><i class="bi bi-check text-success"></i> Server deletions</li>
                        <li><i class="bi bi-check text-success"></i> System configuration changes</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Sample Log Entries (Demo)</h5>
            </div>
            <div class="card-body p-0">
                <div class="log-entry d-flex align-items-center">
                    <div class="log-icon danger me-3"><i class="bi bi-lock"></i></div>
                    <div class="flex-grow-1">
                        <strong>User Banned</strong>
                        <div class="text-muted">admin banned user "spammer123"</div>
                    </div>
                    <div class="log-time">2 minutes ago</div>
                </div>
                <div class="log-entry d-flex align-items-center">
                    <div class="log-icon success me-3"><i class="bi bi-unlock"></i></div>
                    <div class="flex-grow-1">
                        <strong>User Unbanned</strong>
                        <div class="text-muted">admin unbanned user "reformed_user"</div>
                    </div>
                    <div class="log-time">15 minutes ago</div>
                </div>
                <div class="log-entry d-flex align-items-center">
                    <div class="log-icon warning me-3"><i class="bi bi-person-gear"></i></div>
                    <div class="flex-grow-1">
                        <strong>Role Changed</strong>
                        <div class="text-muted">admin changed "moderator1" role to MODERATOR</div>
                    </div>
                    <div class="log-time">1 hour ago</div>
                </div>
                <div class="log-entry d-flex align-items-center">
                    <div class="log-icon danger me-3"><i class="bi bi-trash"></i></div>
                    <div class="flex-grow-1">
                        <strong>Server Deleted</strong>
                        <div class="text-muted">admin deleted server "Spam Server"</div>
                    </div>
                    <div class="log-time">3 hours ago</div>
                </div>
                <div class="log-entry d-flex align-items-center">
                    <div class="log-icon info me-3"><i class="bi bi-box-arrow-in-right"></i></div>
                    <div class="flex-grow-1">
                        <strong>Admin Login</strong>
                        <div class="text-muted">admin logged in from 192.168.1.1</div>
                    </div>
                    <div class="log-time">5 hours ago</div>
                </div>
            </div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const token = localStorage.getItem('token');
        if (!token) window.location.href = '/login';

        function refreshLogs() {
            // TODO: Implement when audit log API is ready
            alert('Audit logs will be available in a future update');
        }
    </script>
</body>
</html>
