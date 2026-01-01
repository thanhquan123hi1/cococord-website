<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!-- App Header - cho Dashboard, Chat, Friends -->
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${param.title != null ? param.title : 'CoCoCord App'}</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Custom CSS for App -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/app.css">
    
    <!-- User Profile & Presence System CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/user-panel.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/profile-modal.css">
    
</head>
<body class="app-layout">
    <!-- (User Control Panel is provided by decorators/app.jsp) -->
