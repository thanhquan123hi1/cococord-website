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
            out.print("CoCoCord App");
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
    
    <!-- Custom CSS for App -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/app.css">
    
    <%
        if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("head").writeValueTo(out);
        }
    %>
</head>
<body class="app-layout">
    <!-- Global App Layout Wrapper -->
    <div class="app-layout-wrapper">
        <!-- Server Sidebar - Persistent across all pages -->
        <aside class="server-sidebar" id="mainServerSidebar" aria-label="Servers">
            <!-- Home Button (go to Friends/DM) -->
            <a class="server-item home-btn" href="${pageContext.request.contextPath}/friends" title="Tin nhắn trực tiếp" id="homeBtn">
                <i class="bi bi-discord"></i>
            </a>
            <div class="server-divider"></div>
            
            <!-- Scrollable Server List -->
            <div class="server-list-wrapper">
                <div class="server-list" id="globalServerList"></div>
            </div>
            
            <!-- Fixed Server Actions at Bottom -->
            <div class="server-actions-fixed">
                <div class="server-divider"></div>
                <div class="server-item add-server-btn" role="button" tabindex="0" title="Tạo Server" id="globalAddServerBtn">
                    <i class="bi bi-plus-lg"></i>
                </div>
                <div class="server-item discover-btn" role="button" tabindex="0" title="Khám phá Server" id="globalDiscoverBtn">
                    <i class="bi bi-compass"></i>
                </div>
            </div>
        </aside>
        
        <!-- Page Content (Changes based on route) -->
        <div class="page-content-area">
            <%
                if (sitemeshContent != null) {
                    sitemeshContent.getExtractedProperties().getChild("body").writeValueTo(out);
                }
            %>
        </div>
    </div>

    <!-- Global Modals -->
    <!-- Create Server Modal -->
    <div class="modal-overlay" id="globalCreateServerModal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Tạo Server mới</h3>
                <button class="modal-close" id="closeGlobalCreateServerModal">&times;</button>
            </div>
            <div class="modal-body">
                <p class="modal-desc">Server của bạn là nơi để bạn và bạn bè giao lưu. Hãy tạo server và bắt đầu trò chuyện.</p>
                <div class="form-group">
                    <label for="globalServerNameInput">TÊN SERVER</label>
                    <input type="text" id="globalServerNameInput" class="discord-input" placeholder="Server của bạn" />
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelGlobalCreateServer">Hủy</button>
                <button class="btn-primary" id="confirmGlobalCreateServer">Tạo</button>
            </div>
        </div>
    </div>
    
    <!-- Join Server Modal -->
    <div class="modal-overlay" id="globalJoinServerModal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Tham gia Server</h3>
                <button class="modal-close" id="closeGlobalJoinServerModal">&times;</button>
            </div>
            <div class="modal-body">
                <p class="modal-desc">Nhập mã mời để tham gia một server đã tồn tại.</p>
                <div class="form-group">
                    <label for="globalInviteCodeInput">MÃ MỜI</label>
                    <input type="text" id="globalInviteCodeInput" class="discord-input" placeholder="https://discord.gg/hTKzmak hoặc hTKzmak" />
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelGlobalJoinServer">Hủy</button>
                <button class="btn-primary" id="confirmGlobalJoinServer">Tham gia</button>
            </div>
        </div>
    </div>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- SockJS & STOMP for WebSocket -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
    
    <!-- Custom JS for App -->
    <script src="${pageContext.request.contextPath}/js/auth.js"></script>
    <script src="${pageContext.request.contextPath}/js/app.js"></script>

    <%
        if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("page.script").writeValueTo(out);
        }
    %>
</body>
</html>
