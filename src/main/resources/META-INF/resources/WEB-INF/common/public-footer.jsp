<%@ page contentType="text/html;charset=UTF-8" language="java" %>
    </main>
    <!-- Main Content End -->

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
                        <li><a href="/" class="text-decoration-none text-muted">Trang chủ</a></li>
                        <li><a href="/login" class="text-decoration-none text-muted">Đăng nhập</a></li>
                        <li><a href="/register" class="text-decoration-none text-muted">Đăng ký</a></li>
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
</body>
</html>
