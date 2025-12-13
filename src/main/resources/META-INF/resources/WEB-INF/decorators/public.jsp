<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="org.sitemesh.content.Content" %>
<%
    Content sitemeshContent = (Content) request.getAttribute(Content.class.getName());
%>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title><%
        if (sitemeshContent != null && sitemeshContent.getExtractedProperties().getChild("title").hasValue()) {
            out.print(sitemeshContent.getExtractedProperties().getChild("title").getValue());
        } else {
            out.print("CoCoCord - Connect & Chat");
        }
    %></title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/public.css">
    
    <%
        if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("head").writeValueTo(out);
        }
    %>
</head>
<body>
    <!-- Header for Public Pages -->
    <header class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="${pageContext.request.contextPath}/">
                <i class="bi bi-chat-dots-fill text-primary me-2" style="font-size: 2rem;"></i>
                <span class="fw-bold fs-4">CoCoCord</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="${pageContext.request.contextPath}/">
                            <i class="bi bi-house-door"></i> Trang chủ
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="${pageContext.request.contextPath}/login">
                            <i class="bi bi-box-arrow-in-right"></i> Đăng nhập
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="btn btn-primary ms-2" href="${pageContext.request.contextPath}/register">
                            <i class="bi bi-person-plus"></i> Đăng ký
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </header>

    <!-- Alert Container -->
    <div class="container mt-3">
        <div id="alert-container"></div>
    </div>

    <!-- Main Content -->
    <main>
        <%
            if (sitemeshContent != null) {
                sitemeshContent.getExtractedProperties().getChild("body").writeValueTo(out);
            }
        %>
    </main>

    <!-- Footer for Public Pages -->
    <footer class="footer bg-light mt-auto py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-4 mb-3">
                    <h5 class="fw-bold">
                        <i class="bi bi-chat-dots-fill text-primary"></i> CoCoCord
                    </h5>
                    <p class="text-muted">Kết nối mọi người, mọi lúc, mọi nơi. Chat realtime với bạn bè và cộng đồng.</p>
                </div>
                <div class="col-md-4 mb-3">
                    <h6 class="fw-bold">Liên kết nhanh</h6>
                    <ul class="list-unstyled">
                        <li><a href="${pageContext.request.contextPath}/" class="text-decoration-none text-muted">Trang chủ</a></li>
                        <li><a href="${pageContext.request.contextPath}/login" class="text-decoration-none text-muted">Đăng nhập</a></li>
                        <li><a href="${pageContext.request.contextPath}/register" class="text-decoration-none text-muted">Đăng ký</a></li>
                    </ul>
                </div>
                <div class="col-md-4 mb-3">
                    <h6 class="fw-bold">Hỗ trợ</h6>
                    <ul class="list-unstyled">
                        <li><a href="#" class="text-decoration-none text-muted">Trung tâm trợ giúp</a></li>
                        <li><a href="#" class="text-decoration-none text-muted">Điều khoản sử dụng</a></li>
                        <li><a href="#" class="text-decoration-none text-muted">Chính sách bảo mật</a></li>
                    </ul>
                </div>
            </div>
            <hr>
            <div class="text-center text-muted">
                <p class="mb-0">&copy; 2025 CoCoCord. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS for Public Pages -->
    <script src="${pageContext.request.contextPath}/js/public.js"></script>

    <%
        if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("page.script").writeValueTo(out);
        }
    %>
</body>
</html>
