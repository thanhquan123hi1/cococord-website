<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="decorator" uri="http://www.opensymphony.com/sitemesh/decorator" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><decorator:title default="CoCoCord"/></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- jQuery -->
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
    <!-- Custom CSS -->
    <style>
        :root {
            --discord-dark: #36393f;
            --discord-darker: #2f3136;
            --discord-darkest: #202225;
            --discord-light: #dcddde;
            --discord-brand: #5865f2;
        }
        body {
            background-color: var(--discord-dark);
            color: var(--discord-light);
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .sidebar {
            background-color: var(--discord-darker);
        }
        .server-list {
            background-color: var(--discord-darkest);
        }
    </style>
    <decorator:head/>
</head>
<body class="min-h-screen">
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: var(--discord-darkest);">
        <div class="container-fluid">
            <a class="navbar-brand" href="/home">
                <i class="fas fa-comments me-2"></i>CoCoCord
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item" id="authLinks">
                        <a class="nav-link" href="/login">Login</a>
                    </li>
                    <li class="nav-item" id="userMenu" style="display:none;">
                        <div class="dropdown">
                            <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-user me-1"></i><span id="currentUsername">User</span>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main>
        <decorator:body/>
    </main>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Auth Script -->
    <script>
        $(document).ready(function() {
            const token = sessionStorage.getItem('token');
            if (token) {
                $('#authLinks').hide();
                $('#userMenu').show();
                // Decode JWT to get username
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    $('#currentUsername').text(payload.sub || 'User');
                } catch(e) {}
            }
            
            $('#logoutBtn').on('click', function(e) {
                e.preventDefault();
                sessionStorage.removeItem('token');
                window.location.href = '/login';
            });
        });
    </script>
</body>
</html>
