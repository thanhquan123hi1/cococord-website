<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <title>CoCoCord - Kết nối mọi người, mọi lúc, mọi nơi</title>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero-section">
        <div class="container">
            <div class="row align-items-center min-vh-75">
                <div class="col-lg-6 mb-5 mb-lg-0">
                    <h1 class="display-3 fw-bold mb-4">
                        Kết nối <span class="text-primary">mọi người</span>,<br>
                        mọi lúc, mọi nơi
                    </h1>
                    <p class="lead text-muted mb-4">
                        CoCoCord là nền tảng chat realtime giúp bạn kết nối với bạn bè, 
                        gia đình và cộng đồng một cách dễ dàng và nhanh chóng.
                    </p>
                    <div class="d-flex gap-3">
                        <a href="/register" class="btn btn-primary btn-lg px-4">
                            <i class="bi bi-person-plus"></i> Bắt đầu ngay
                        </a>
                        <a href="/login" class="btn btn-outline-primary btn-lg px-4">
                            <i class="bi bi-box-arrow-in-right"></i> Đăng nhập
                        </a>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="hero-image text-center">
                        <i class="bi bi-chat-dots-fill text-primary" style="font-size: 20rem; opacity: 0.1;"></i>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features-section py-5 bg-light">
        <div class="container py-5">
            <div class="text-center mb-5">
                <h2 class="fw-bold">Tính năng nổi bật</h2>
                <p class="text-muted">Trải nghiệm chat tuyệt vời với các tính năng hiện đại</p>
            </div>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="feature-card text-center p-4 bg-white rounded shadow-sm h-100">
                        <div class="feature-icon mb-3">
                            <i class="bi bi-lightning-charge-fill text-primary" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="fw-bold">Chat Realtime</h5>
                        <p class="text-muted">
                            Trò chuyện tức thì với bạn bè. Tin nhắn được gửi và nhận ngay lập tức.
                        </p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card text-center p-4 bg-white rounded shadow-sm h-100">
                        <div class="feature-icon mb-3">
                            <i class="bi bi-people-fill text-primary" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="fw-bold">Server & Channel</h5>
                        <p class="text-muted">
                            Tạo và quản lý server riêng với nhiều channel cho các chủ đề khác nhau.
                        </p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card text-center p-4 bg-white rounded shadow-sm h-100">
                        <div class="feature-icon mb-3">
                            <i class="bi bi-shield-check-fill text-primary" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="fw-bold">Bảo mật cao</h5>
                        <p class="text-muted">
                            Dữ liệu được mã hóa và bảo vệ với JWT authentication.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section py-5">
        <div class="container py-5 text-center">
            <h2 class="fw-bold mb-4">Sẵn sàng bắt đầu?</h2>
            <p class="lead text-muted mb-4">
                Tham gia CoCoCord ngay hôm nay và kết nối với hàng triệu người dùng
            </p>
            <a href="/register" class="btn btn-primary btn-lg px-5">
                <i class="bi bi-person-plus"></i> Tạo tài khoản miễn phí
            </a>
        </div>
    </section>
</body>
</html>
