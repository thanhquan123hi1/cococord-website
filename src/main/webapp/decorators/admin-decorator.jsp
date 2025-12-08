<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="decorator" uri="http://www.opensymphony.com/sitemesh/decorator" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><decorator:title default="Admin - CoCoCord"/></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- jQuery -->
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
    <!-- Custom Admin CSS -->
    <style>
        :root {
            --admin-primary: #1a1a2e;
            --admin-secondary: #16213e;
            --admin-accent: #0f3460;
            --admin-highlight: #e94560;
        }
        body {
            background-color: #f8f9fa;
        }
        .admin-sidebar {
            background: linear-gradient(180deg, var(--admin-primary) 0%, var(--admin-secondary) 100%);
            min-height: 100vh;
            width: 250px;
            position: fixed;
            left: 0;
            top: 0;
        }
        .admin-content {
            margin-left: 250px;
            padding: 20px;
        }
        .admin-nav-link {
            color: #fff;
            padding: 12px 20px;
            display: block;
            text-decoration: none;
            border-left: 3px solid transparent;
            transition: all 0.3s;
        }
        .admin-nav-link:hover, .admin-nav-link.active {
            background-color: var(--admin-accent);
            border-left-color: var(--admin-highlight);
            color: #fff;
        }
    </style>
    <decorator:head/>
</head>
<body>
    <!-- Admin Sidebar -->
    <div class="admin-sidebar">
        <div class="p-3 text-white text-center border-bottom border-secondary">
            <h4><i class="fas fa-shield-alt me-2"></i>Admin Panel</h4>
        </div>
        <nav class="mt-3">
            <a href="/admin" class="admin-nav-link"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a>
            <a href="/admin/users" class="admin-nav-link"><i class="fas fa-users me-2"></i>Users</a>
            <a href="/admin/servers" class="admin-nav-link"><i class="fas fa-server me-2"></i>Servers</a>
            <a href="/admin/reports" class="admin-nav-link"><i class="fas fa-flag me-2"></i>Reports</a>
            <a href="/admin/logs" class="admin-nav-link"><i class="fas fa-history me-2"></i>Audit Logs</a>
            <a href="/admin/settings" class="admin-nav-link"><i class="fas fa-cog me-2"></i>Settings</a>
            <hr class="text-secondary">
            <a href="/home" class="admin-nav-link"><i class="fas fa-arrow-left me-2"></i>Back to App</a>
        </nav>
    </div>

    <!-- Admin Content -->
    <div class="admin-content">
        <!-- Top Bar -->
        <div class="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
            <h5 class="mb-0"><decorator:title default="Dashboard"/></h5>
            <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-shield me-1"></i><span id="adminUsername">Admin</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#" id="adminLogout"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </div>
        </div>

        <!-- Main Content -->
        <decorator:body/>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Admin Script -->
    <script>
        $(document).ready(function() {
            const token = sessionStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }
            
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                $('#adminUsername').text(payload.sub || 'Admin');
            } catch(e) {}
            
            $('#adminLogout').on('click', function(e) {
                e.preventDefault();
                sessionStorage.removeItem('token');
                window.location.href = '/login';
            });

            // Highlight active nav
            const path = window.location.pathname;
            $('.admin-nav-link').each(function() {
                if ($(this).attr('href') === path) {
                    $(this).addClass('active');
                }
            });
        });
    </script>
</body>
</html>
