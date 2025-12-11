<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Dashboard - CoCoCord</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="/dashboard">
                <i class="bi bi-chat-dots-fill"></i> CoCoCord
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="/dashboard">
                            <i class="bi bi-house-door"></i> Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/chat">
                            <i class="bi bi-chat-dots"></i> Chat
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/profile">
                            <i class="bi bi-person"></i> Profile
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="logout(); return false;">
                            <i class="bi bi-box-arrow-right"></i> Đăng xuất
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container mt-4">
        <div class="row">
            <div class="col-12">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h1 class="mb-4">
                            <i class="bi bi-speedometer2"></i> Dashboard
                        </h1>
                        <p class="lead">Chào mừng <strong id="user-display-name"></strong> đến với CoCoCord!</p>
                        
                        <div class="row mt-4">
                            <div class="col-md-4">
                                <div class="card bg-primary text-white">
                                    <div class="card-body">
                                        <h5 class="card-title">
                                            <i class="bi bi-server"></i> Servers
                                        </h5>
                                        <p class="card-text display-4">0</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-success text-white">
                                    <div class="card-body">
                                        <h5 class="card-title">
                                            <i class="bi bi-people"></i> Friends
                                        </h5>
                                        <p class="card-text display-4">0</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-info text-white">
                                    <div class="card-body">
                                        <h5 class="card-title">
                                            <i class="bi bi-chat"></i> Messages
                                        </h5>
                                        <p class="card-text display-4">0</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-4">
                            <h3>Quick Actions</h3>
                            <div class="d-grid gap-2 col-md-6">
                                <a href="/chat" class="btn btn-primary btn-lg">
                                    <i class="bi bi-chat-dots-fill"></i> Go to Chat
                                </a>
                            </div>
                        </div>

                        <div class="mt-4">
                            <h3>Thông tin tài khoản</h3>
                            <ul class="list-group">
                                <li class="list-group-item">
                                    <strong>Username:</strong> <span id="user-username"></span>
                                </li>
                                <li class="list-group-item">
                                    <strong>Email:</strong> <span id="user-email"></span>
                                </li>
                                <li class="list-group-item">
                                    <strong>User ID:</strong> <span id="user-id"></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS -->
    <script src="/js/auth.js"></script>
    
    <script>
        // Check if user is logged in, redirect to login if not
        if (!isLoggedIn()) {
            window.location.href = '/login';
        } else {
            // Display user information
            document.getElementById('user-display-name').textContent = localStorage.getItem('displayName') || 'User';
            document.getElementById('user-username').textContent = localStorage.getItem('username') || 'N/A';
            document.getElementById('user-email').textContent = localStorage.getItem('email') || 'N/A';
            document.getElementById('user-id').textContent = localStorage.getItem('userId') || 'N/A';
        }
    </script>
</body>
</html>
