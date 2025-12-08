    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Auth Check Script -->
    <script>
        // Global auth functions
        window.CoCoCord = {
            getToken: function() {
                return sessionStorage.getItem('token');
            },
            isAuthenticated: function() {
                return !!this.getToken();
            },
            logout: function() {
                sessionStorage.removeItem('token');
                window.location.href = '/login';
            },
            getUsername: function() {
                const token = this.getToken();
                if (!token) return null;
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    return payload.sub;
                } catch(e) {
                    return null;
                }
            },
            authHeader: function() {
                return { 'Authorization': 'Bearer ' + this.getToken() };
            }
        };
    </script>
</body>
</html>