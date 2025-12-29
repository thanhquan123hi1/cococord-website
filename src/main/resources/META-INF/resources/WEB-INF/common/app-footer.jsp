<%@ page contentType="text/html;charset=UTF-8" language="java" %>
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
    <script src="${pageContext.request.contextPath}/js/user-settings-modal.js"></script>
    
    <script>
        // Initialize User Profile & Presence System
        document.addEventListener('DOMContentLoaded', function() {
            if (window.UserPanel) {
                UserPanel.init();
            }
        });
    </script>
</body>
</html>
