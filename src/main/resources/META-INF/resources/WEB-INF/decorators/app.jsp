<%@ page contentType="text/html;charset=UTF-8" language="java" %>
    <%@ page import="org.sitemesh.content.Content" %>
        <%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
            <% Content sitemeshContent=(Content) request.getAttribute(Content.class.getName()); %>
                <!DOCTYPE html>
                <html lang="vi">

                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="ie=edge">
                    <title>
                        <% if (sitemeshContent !=null &&
                            sitemeshContent.getExtractedProperties().getChild("title").hasValue()) {
                            out.print(sitemeshContent.getExtractedProperties().getChild("title").getValue()); } else {
                            out.print("CoCoCord App"); } %>
                    </title>

                    <!-- Google Fonts -->
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link
                        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
                        rel="stylesheet">

                    <!-- Bootstrap 5 CSS -->
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                        rel="stylesheet">

                    <!-- Bootstrap Icons -->
                    <link rel="stylesheet"
                        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

                    <!-- Custom CSS for App -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/app.css">
                    <!-- Server Sidebar CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/server-sidebar.css?v=20260105a">
                    <!-- Channel panel CSS (used for global User Control Panel styling) -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/channel-panel.css">
                    <!-- User Panel CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/user-panel.css">
                    <!-- Settings Modal CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/settings-modal.css">
                    <!-- Quick Switcher CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/quick-switcher.css">
                    <!-- Inbox overlay CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/inbox.css?v=20260103a">
                    <!-- Toast Notification CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/toast.css?v=20260105a">
                    <!-- Skeleton Loading CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/skeleton.css?v=20260105a">
                    <!-- Preload /app home assets to avoid flash + missing handlers on PJAX navigation -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/app-home.css?v=20260106b">
                    <!-- Global Call Overlay CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/call-overlay.css?v=20260106b">
                    <!-- Chat Input (GIF/Sticker/Emoji) CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/chat-input.css">
                    <!-- Message Context Menu & Reactions CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/message-context-menu.css">
                    <!-- Forum Channel CSS -->
                    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/forum-channel.css">

                    <% if (sitemeshContent !=null) {
                        sitemeshContent.getExtractedProperties().getChild("head").writeValueTo(out); } %>
                </head>

                <body class="app-layout">
                    <!-- Global App Layout Wrapper -->
                    <div class="app-layout-wrapper">
                        <!-- Server Sidebar - Persistent across all pages -->
                        <aside class="server-bar" id="mainServerSidebar" aria-label="Servers">
                            <!-- Home Button (go to Friends/DM) -->
                            <a class="server-item home-btn<c:if test=" ${empty param.serverId}"> active</c:if>"
                                href="${pageContext.request.contextPath}/app"
                                title="Tin nhắn trực tiếp" id="homeBtn">
                                <i class="bi bi-discord"></i>
                            </a>
                            <div class="server-divider"></div>

                            <!-- Scrollable Server List - Rendered from GlobalDataControllerAdvice -->
                            <div class="server-list-wrapper">
                                <div class="server-list" id="globalServerList">
                                    <c:forEach var="server" items="${servers}">
                                        <a class="server-item<c:if test=" ${server.id==param.serverId}"> active</c:if>"
                                            href="${pageContext.request.contextPath}/chat?serverId=${server.id}"
                                            title="${server.name}"
                                            data-server-id="${server.id}">
                                            <c:choose>
                                                <c:when test="${not empty server.iconUrl}">
                                                    <img src="${server.iconUrl}" alt="${server.name}" />
                                                </c:when>
                                                <c:otherwise>
                                                    <span
                                                        class="server-initial">${server.name.substring(0,1).toUpperCase()}</span>
                                                </c:otherwise>
                                            </c:choose>
                                        </a>
                                    </c:forEach>

                                    <!-- Server Actions - Inside scrollable list like Discord -->
                                    <div class="server-divider" data-action-divider="true"></div>
                                    <div class="server-item add-server-btn" role="button" tabindex="0"
                                        title="Tạo Server" id="globalAddServerBtn" data-action-btn="add">
                                        <i class="bi bi-plus-lg"></i>
                                    </div>
                                    <div class="server-item discover-btn" role="button" tabindex="0"
                                        title="Khám phá Server" id="globalDiscoverBtn" data-action-btn="discover">
                                        <i class="bi bi-compass"></i>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <!-- Page Content (Changes based on route) -->
                        <div class="page-content-area">
                            <% if (sitemeshContent !=null) {
                                sitemeshContent.getExtractedProperties().getChild("body").writeValueTo(out); } %>
                        </div>

                        <!-- Global User Control Panel (persistent across pages) -->
                        <!-- Now fully managed by user-panel.js -->
                        <div class="global-user-control-panel" aria-label="User Control Panel">
                            <div class="user-area" id="userPanel">
                                <!-- Dynamic content rendered by user-panel.js -->
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
                                <p class="modal-desc">Server của bạn là nơi để bạn và bạn bè giao lưu. Hãy tạo server và
                                    bắt đầu trò chuyện.</p>
                                <div class="form-group">
                                    <label for="globalServerNameInput">TÊN SERVER</label>
                                    <input type="text" id="globalServerNameInput" class="discord-input"
                                        placeholder="Server của bạn" />
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
                                    <input type="text" id="globalInviteCodeInput" class="discord-input"
                                        placeholder="https://discord.gg/hTKzmak hoặc hTKzmak" />
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
                    <script src="${pageContext.request.contextPath}/js/auth.js?v=20260105_release"></script>

                    <!-- Toast Notification System (must load before other scripts) -->
                    <script src="${pageContext.request.contextPath}/js/toast.js?v=20260105a"></script>

                    <script src="${pageContext.request.contextPath}/js/app.js?v=20260105_release"></script>
                    <script src="${pageContext.request.contextPath}/js/app-home.js?v=20260106e"></script>
                    <script src="${pageContext.request.contextPath}/js/server-sidebar.js?v=20260105_release"></script>
                    <script src="${pageContext.request.contextPath}/js/chat.js?v=20260105_release"></script>
                    <script
                        src="${pageContext.request.contextPath}/js/chat-input-manager.js?v=20260105_release"></script>
                    <!-- Message Actions (reactions, context menu) -->
                    <script src="${pageContext.request.contextPath}/js/message-actions.js?v=20260107a"></script>
                    <!-- Forum Channel Manager -->
                    <script src="${pageContext.request.contextPath}/js/forum-channel.js?v=20260107a"></script>
                    <script src="${pageContext.request.contextPath}/js/user-panel.js?v=20260105_release"></script>
                    <script src="${pageContext.request.contextPath}/js/settings-modal.js?v=20260105_release"></script>
                    <!-- Quick Switcher Modal -->
                    <script src="${pageContext.request.contextPath}/js/quick-switcher.js?v=20260105_release"></script>
                    <!-- Notification system with global call subscription -->
                    <script src="${pageContext.request.contextPath}/js/notification.js?v=20260105_release"></script>
                    <!-- Server Invite Notification Manager -->
                    <script src="${pageContext.request.contextPath}/js/invite-notification.js?v=20260107a"></script>
                    <!-- Global Call Manager (WebRTC + Signaling) -->
                    <script src="${pageContext.request.contextPath}/js/call-manager.js?v=20260106k"></script>


                    <% if (sitemeshContent !=null) {
                        sitemeshContent.getExtractedProperties().getChild("page.script").writeValueTo(out); } %>
                </body>

                </html>