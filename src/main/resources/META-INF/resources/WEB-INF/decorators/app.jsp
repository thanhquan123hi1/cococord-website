<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="org.sitemesh.content.Content" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
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
    <!-- Channel panel CSS (used for global User Control Panel styling) -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/channel-panel.css">
    <!-- Preload /app home assets to avoid flash + missing handlers on PJAX navigation -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/app-home.css">
    
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
        <aside class="server-bar" id="mainServerSidebar" aria-label="Servers">
            <!-- Home Button (go to Friends/DM) -->
            <a class="server-item home-btn<c:if test="${empty param.serverId}"> active</c:if>" 
               href="${pageContext.request.contextPath}/app" 
               title="Tin nhắn trực tiếp" id="homeBtn">
                <i class="bi bi-discord"></i>
            </a>
            <div class="server-divider"></div>
            
            <!-- Scrollable Server List - Rendered from GlobalDataControllerAdvice -->
            <div class="server-list-wrapper">
                <div class="server-list" id="globalServerList">
                    <c:forEach var="server" items="${servers}">
                        <a class="server-item<c:if test="${server.id == param.serverId}"> active</c:if>" 
                           href="${pageContext.request.contextPath}/chat?serverId=${server.id}" 
                           title="${server.name}"
                           data-server-id="${server.id}">
                            <c:choose>
                                <c:when test="${not empty server.iconUrl}">
                                    <img src="${server.iconUrl}" alt="${server.name}" />
                                </c:when>
                                <c:otherwise>
                                    <span class="server-initial">${server.name.substring(0,1).toUpperCase()}</span>
                                </c:otherwise>
                            </c:choose>
                        </a>
                    </c:forEach>
                </div>
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

        <!-- Global User Control Panel (persistent across pages) -->
        <div class="global-user-control-panel" aria-label="User Control Panel">
            <div class="user-area" id="userPanel">
                <div class="user-info" id="userInfoBtn" role="button" tabindex="0">
                    <div class="user-avatar" id="ucpAvatar">
                        <span class="status-indicator online" id="ucpStatusIndicator"></span>
                    </div>
                    <div class="user-details">
                        <div class="user-name" id="ucpName">User</div>
                        <div class="user-status" id="ucpStatus">Trực tuyến</div>
                    </div>
                </div>
                <div class="user-controls" aria-label="Controls">
                    <button class="control-btn" id="micBtn" title="Tắt/Bật Mic">
                        <i class="bi bi-mic"></i>
                    </button>
                    <button class="control-btn" id="deafenBtn" title="Tắt/Bật Tai nghe">
                        <i class="bi bi-headphones"></i>
                    </button>
                    <button class="control-btn" id="settingsBtn" title="Cài đặt người dùng">
                        <i class="bi bi-gear"></i>
                    </button>
                </div>

                <!-- User Dropdown Menu -->
                <div class="user-dropdown" id="userDropdown" style="display:none;">
                    <a href="${pageContext.request.contextPath}/profile" class="dropdown-item">
                        <i class="bi bi-person"></i> Hồ sơ của tôi
                    </a>
                    <a href="${pageContext.request.contextPath}/profile" class="dropdown-item">
                        <i class="bi bi-gear"></i> Cài đặt
                    </a>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item status-item" data-status="ONLINE">
                        <i class="bi bi-circle-fill online"></i> Trực tuyến
                    </div>
                    <div class="dropdown-item status-item" data-status="IDLE">
                        <i class="bi bi-moon-fill idle"></i> Vắng mặt
                    </div>
                    <div class="dropdown-item status-item" data-status="DO_NOT_DISTURB">
                        <i class="bi bi-dash-circle-fill dnd"></i> Không làm phiền
                    </div>
                    <div class="dropdown-item status-item" data-status="INVISIBLE">
                        <i class="bi bi-circle offline"></i> Ẩn
                    </div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item text-danger" id="logoutBtnUser">
                        <i class="bi bi-box-arrow-right"></i> Đăng xuất
                    </div>
                </div>
            </div>
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
    
    <!-- Prevent scroll restoration jump -->
    <script>
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        // Prevent any initial scroll
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    </script>
    
    <!-- SockJS & STOMP for WebSocket -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
    
    <!-- Custom JS for App -->
    <script src="${pageContext.request.contextPath}/js/auth.js"></script>
    <script src="${pageContext.request.contextPath}/js/app.js"></script>
    <!-- /app home logic (safe: guarded by #cococordHome presence) -->
    <script src="${pageContext.request.contextPath}/js/app-home.js"></script>

    <%
        if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("page.script").writeValueTo(out);
        }
    %>
</body>
</html>
