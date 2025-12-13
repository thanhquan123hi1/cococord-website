<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Statistics - CoCoCord Admin</title>
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
        
        .stat-card {
            background: linear-gradient(135deg, var(--darker-bg), var(--dark-bg));
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            transition: transform 0.2s;
        }
        
        .stat-card:hover { transform: translateY(-5px); }
        
        .stat-card .stat-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.8;
        }
        
        .stat-card .stat-value {
            font-size: 3rem;
            font-weight: bold;
        }
        
        .stat-card .stat-label {
            color: var(--text-secondary);
            font-size: 1rem;
        }
        
        .stat-card.primary .stat-icon, .stat-card.primary .stat-value { color: var(--accent); }
        .stat-card.success .stat-icon, .stat-card.success .stat-value { color: var(--success); }
        .stat-card.danger .stat-icon, .stat-card.danger .stat-value { color: var(--danger); }
        .stat-card.warning .stat-icon, .stat-card.warning .stat-value { color: var(--warning); }
        
        .card {
            background-color: var(--darker-bg);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
        }
        
        .progress {
            height: 25px;
            background-color: var(--dark-bg);
            border-radius: 8px;
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
            <li class="nav-item"><a class="nav-link active" href="/admin/stats"><i class="bi bi-graph-up"></i> Statistics</a></li>
            <li class="nav-item"><a class="nav-link" href="/admin/audit"><i class="bi bi-journal-text"></i> Audit Logs</a></li>
            <li class="nav-item mt-4"><a class="nav-link" href="/chat"><i class="bi bi-arrow-left"></i> Back to Chat</a></li>
        </ul>
    </nav>

    <main class="main-content">
        <h1 class="mb-4"><i class="bi bi-graph-up me-2"></i>System Statistics</h1>
        
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="stat-card primary">
                    <div class="stat-icon"><i class="bi bi-people-fill"></i></div>
                    <div class="stat-value" id="totalUsers">-</div>
                    <div class="stat-label">Total Users</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card success">
                    <div class="stat-icon"><i class="bi bi-circle-fill"></i></div>
                    <div class="stat-value" id="onlineUsers">-</div>
                    <div class="stat-label">Online Now</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card warning">
                    <div class="stat-icon"><i class="bi bi-hdd-stack-fill"></i></div>
                    <div class="stat-value" id="totalServers">-</div>
                    <div class="stat-label">Total Servers</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card danger">
                    <div class="stat-icon"><i class="bi bi-slash-circle-fill"></i></div>
                    <div class="stat-value" id="bannedUsers">-</div>
                    <div class="stat-label">Banned Users</div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header"><h5 class="mb-0">User Activity</h5></div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Active Users</span>
                                <span id="activePercent">-%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-success" id="activeBar" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Online Users</span>
                                <span id="onlinePercent">-%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-primary" id="onlineBar" style="width: 0%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>Banned Users</span>
                                <span id="bannedPercent">-%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-danger" id="bannedBar" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header"><h5 class="mb-0">Quick Actions</h5></div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <a href="/admin/users" class="btn btn-outline-primary">
                                <i class="bi bi-people me-2"></i>Manage Users
                            </a>
                            <a href="/admin/servers" class="btn btn-outline-primary">
                                <i class="bi bi-hdd-stack me-2"></i>Manage Servers
                            </a>
                            <button class="btn btn-outline-success" onclick="refreshStats()">
                                <i class="bi bi-arrow-clockwise me-2"></i>Refresh Statistics
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const token = localStorage.getItem('token');
        if (!token) window.location.href = '/login';

        async function loadStats() {
            const response = await fetch('/api/admin/stats', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            if (response.status === 403) {
                alert('Access denied');
                window.location.href = '/chat';
                return;
            }
            
            const stats = await response.json();
            
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('onlineUsers').textContent = stats.onlineUsers || 0;
            document.getElementById('totalServers').textContent = stats.totalServers || 0;
            document.getElementById('bannedUsers').textContent = stats.bannedUsers || 0;
            
            const total = stats.totalUsers || 1;
            const activePercent = ((stats.activeUsers || 0) / total * 100).toFixed(1);
            const onlinePercent = ((stats.onlineUsers || 0) / total * 100).toFixed(1);
            const bannedPercent = ((stats.bannedUsers || 0) / total * 100).toFixed(1);
            
            document.getElementById('activePercent').textContent = activePercent + '%';
            document.getElementById('activeBar').style.width = activePercent + '%';
            document.getElementById('onlinePercent').textContent = onlinePercent + '%';
            document.getElementById('onlineBar').style.width = onlinePercent + '%';
            document.getElementById('bannedPercent').textContent = bannedPercent + '%';
            document.getElementById('bannedBar').style.width = bannedPercent + '%';
        }

        function refreshStats() {
            loadStats();
        }

        document.addEventListener('DOMContentLoaded', loadStats);
    </script>
</body>
</html>
