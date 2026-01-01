<%-- filepath: src/main/resources/META-INF/resources/WEB-INF/common/app-footer.jsp --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>

    <!-- User Panel Container (if not already present in page layout) -->
    <div id="userPanel" class="user-panel" style="display: none;"></div>
    
    <!-- User Settings Modal Container -->
    <div id="userSettingsModalContainer"></div>
    
    <!-- User Profile Modal Container -->
    <div id="userProfileModalContainer"></div>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- SockJS & STOMP for WebSocket -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
    
    <!-- Custom JS for App -->
    <script src="${pageContext.request.contextPath}/js/auth.js"></script>
    <script src="${pageContext.request.contextPath}/js/app.js"></script>
    
    <!-- User Profile & Presence System JS -->
    <script src="${pageContext.request.contextPath}/js/status-picker.js"></script>
    <script src="${pageContext.request.contextPath}/js/user-panel.js"></script>
    <script src="${pageContext.request.contextPath}/js/user-profile-modal.js"></script>
    
    <script>
        // Initialize User Profile & Presence System
        document.addEventListener('DOMContentLoaded', function() {
            // Check if we have a valid token before initializing
            const token = localStorage.getItem('accessToken');
            if (!token) {
                console.log('No access token, skipping UserPanel initialization');
                return;
            }
            
            // Initialize UserPanel if it exists
            if (window.UserPanel) {
                // Delay to ensure all modals are loaded
                setTimeout(function() {
                    UserPanel.init();
                }, 200);
            }
        });
    </script>
</body>
</html>