<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<title>CoCoCord - Nơi kết nối cộng đồng của bạn</title>

<head>
<style>
    /* Hero section background */
    .hero-section {
        background-color: #404eed;
        position: relative;
        overflow: hidden;
    }
    
    /* Decorative clouds/shapes */
    .hero-bg-image {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 100%;
        background-image: 
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%2323272a' fill-opacity='1' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: bottom;
        background-size: 100% auto;
    }
    
    /* Feature sections */
    .feature-section-light {
        background-color: #f6f6f6;
    }
    
    .feature-section-dark {
        background-color: #23272a;
    }
    
    /* CTA section */
    .cta-section {
        background-color: #f6f6f6;
        position: relative;
    }
    
    .cta-bg {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 200'%3E%3Cpath fill='%235865f2' d='M0,128L60,122.7C120,117,240,107,360,112C480,117,600,139,720,138.7C840,139,960,117,1080,112C1200,107,1320,117,1380,122.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: top;
        background-size: 100% auto;
    }
</style>
</head>

<!-- Hero Section -->
<section class="hero-section min-h-screen flex items-center justify-center pt-20 pb-40 px-6 relative">
    <div class="hero-bg-image"></div>
    
    <div class="relative z-10 max-w-4xl mx-auto text-center">
        <div class="animate-fade-in-up">
            <h1 class="discord-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-8 uppercase">
                Hãy tưởng tượng<br>một nơi...
            </h1>
        </div>
        
        <div class="animate-fade-in-up animation-delay-200">
            <p class="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                ...nơi bạn có thể thuộc về một câu lạc bộ sau giờ học, một nhóm game, hoặc một cộng đồng nghệ thuật toàn cầu. Nơi bạn và bạn bè có thể dành thời gian bên nhau. Một nơi giúp bạn dễ dàng trò chuyện hàng ngày và giao lưu thường xuyên hơn.
            </p>
        </div>
        
        <div class="animate-fade-in-up animation-delay-400">
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="${pageContext.request.contextPath}/register" class="w-full sm:w-auto px-8 py-4 bg-white text-dark-900 font-semibold rounded-full hover:shadow-xl hover:text-brand-blurple transition-all flex items-center justify-center gap-2 text-base">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Tải xuống cho Windows
                </a>
                <a href="${pageContext.request.contextPath}/login" class="w-full sm:w-auto px-8 py-4 bg-dark-800 text-white font-semibold rounded-full hover:bg-dark-700 transition-all text-base">
                    Mở CoCoCord trên trình duyệt
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Feature 1: Create an invite-only place -->
<section id="features" class="feature-section-light py-20 md:py-32 px-6">
    <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
            <!-- Image/Illustration -->
            <div class="order-2 lg:order-1 animate-slide-in-left">
                <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div class="bg-dark-700 p-4">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-3 h-3 rounded-full bg-brand-red"></div>
                            <div class="w-3 h-3 rounded-full bg-brand-yellow"></div>
                            <div class="w-3 h-3 rounded-full bg-brand-green"></div>
                        </div>
                        <div class="flex gap-3">
                            <!-- Servers sidebar -->
                            <div class="w-16 bg-dark-900 rounded-lg p-2 space-y-2">
                                <div class="w-12 h-12 rounded-2xl bg-brand-blurple flex items-center justify-center text-2xl">🎮</div>
                                <div class="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center text-white text-sm font-bold">GC</div>
                                <div class="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center text-xl">📚</div>
                                <div class="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-2xl text-dark-400">+</div>
                            </div>
                            <!-- Channels -->
                            <div class="flex-1 bg-dark-800 rounded-lg p-3">
                                <div class="text-dark-300 text-xs font-bold uppercase mb-2">Kênh văn bản</div>
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2 text-white bg-dark-600/50 rounded px-2 py-1.5 text-sm"># chào-mừng</div>
                                    <div class="flex items-center gap-2 text-dark-300 px-2 py-1.5 text-sm hover:bg-dark-600/30 rounded cursor-pointer"># tán-gẫu</div>
                                    <div class="flex items-center gap-2 text-dark-300 px-2 py-1.5 text-sm hover:bg-dark-600/30 rounded cursor-pointer"># game</div>
                                </div>
                                <div class="text-dark-300 text-xs font-bold uppercase mt-4 mb-2">Kênh thoại</div>
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2 text-dark-300 px-2 py-1.5 text-sm hover:bg-dark-600/30 rounded cursor-pointer">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                        Phòng chung
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Text content -->
            <div class="order-1 lg:order-2 animate-slide-in-right">
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-dark-900 mb-6 leading-tight">
                    Tạo một không gian<br>chỉ dành cho bạn bè
                </h2>
                <p class="text-lg text-dark-500 leading-relaxed">
                    Máy chủ CoCoCord được tổ chức thành các kênh theo chủ đề, nơi bạn có thể cộng tác, chia sẻ và chỉ đơn giản là nói về ngày của bạn mà không làm nghẽn chat nhóm.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Feature 2: Where hanging out is easy -->
<section class="feature-section-dark py-20 md:py-32 px-6">
    <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
            <!-- Text content -->
            <div class="animate-slide-in-left">
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Nơi giao lưu<br>thật dễ dàng
                </h2>
                <p class="text-lg text-dark-300 leading-relaxed">
                    Vào một kênh thoại khi bạn rảnh. Bạn bè trong máy chủ có thể thấy bạn đang online và nhảy vào nói chuyện ngay mà không cần gọi điện.
                </p>
            </div>
            
            <!-- Voice channel illustration -->
            <div class="animate-slide-in-right">
                <div class="bg-dark-800 rounded-2xl p-6 shadow-2xl">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-3 h-3 rounded-full bg-brand-green animate-pulse"></div>
                        <span class="text-white font-bold text-lg">🔊 Kênh thoại chung</span>
                    </div>
                    <div class="space-y-4 pl-4">
                        <div class="flex items-center gap-4">
                            <div class="relative">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-red-500"></div>
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-green rounded-full border-2 border-dark-800"></div>
                            </div>
                            <div>
                                <div class="text-white font-semibold">Minh Anh</div>
                                <div class="text-xs text-brand-green flex items-center gap-1">
                                    <span class="inline-block w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                                    Đang nói
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="relative">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></div>
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-green rounded-full border-2 border-dark-800"></div>
                            </div>
                            <div>
                                <div class="text-white font-semibold">Hoàng Nam</div>
                                <div class="text-xs text-dark-400">Đang nghe</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="relative">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500"></div>
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-dark-400 rounded-full border-2 border-dark-800"></div>
                            </div>
                            <div>
                                <div class="text-white font-semibold">Thu Hà</div>
                                <div class="text-xs text-dark-400">Tắt mic</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Feature 3: From few to a fandom -->
<section class="feature-section-light py-20 md:py-32 px-6">
    <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
            <!-- Moderation illustration -->
            <div class="order-2 lg:order-1 animate-slide-in-left">
                <div class="bg-white rounded-2xl shadow-2xl p-8">
                    <h3 class="text-dark-900 font-bold text-xl mb-6">Quản lý vai trò thành viên</h3>
                    <div class="flex flex-wrap gap-3">
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-red-600 to-red-500 shadow-lg">👑 Admin</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg">🛡️ Moderator</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-yellow-500 to-amber-500 shadow-lg">⭐ VIP</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-green-600 to-green-500 shadow-lg">✓ Member</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg">🎮 Gamer</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg">🎨 Artist</span>
                    </div>
                    <p class="text-dark-400 text-sm mt-6">Tùy chỉnh vai trò và quyền hạn cho cộng đồng của bạn</p>
                </div>
            </div>
            
            <!-- Text content -->
            <div class="order-1 lg:order-2 animate-slide-in-right">
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-dark-900 mb-6 leading-tight">
                    Từ vài người<br>đến cả cộng đồng
                </h2>
                <p class="text-lg text-dark-500 leading-relaxed">
                    Quản lý bất kỳ cộng đồng nào với các công cụ kiểm duyệt và quyền truy cập tùy chỉnh. Cấp quyền đặc biệt cho thành viên, thiết lập kênh riêng tư và nhiều hơn nữa.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Feature 4: Reliable tech -->
<section id="safety" class="feature-section-dark py-20 md:py-32 px-6">
    <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
            <!-- Text content -->
            <div class="animate-slide-in-left">
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Công nghệ<br>đáng tin cậy
                </h2>
                <p class="text-lg text-dark-300 leading-relaxed">
                    Độ trễ thấp, chất lượng âm thanh và video tuyệt vời. Từ cuộc họp nhóm đến buổi stream game - CoCoCord mang đến trải nghiệm mượt mà nhất.
                </p>
            </div>
            
            <!-- Tech illustration -->
            <div class="animate-slide-in-right">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-dark-800 rounded-xl p-6 text-center">
                        <div class="text-4xl mb-3">🎥</div>
                        <div class="text-white font-bold">Video HD</div>
                        <div class="text-dark-400 text-sm">Chất lượng cao</div>
                    </div>
                    <div class="bg-dark-800 rounded-xl p-6 text-center">
                        <div class="text-4xl mb-3">🎧</div>
                        <div class="text-white font-bold">Âm thanh rõ</div>
                        <div class="text-dark-400 text-sm">Khử tiếng ồn</div>
                    </div>
                    <div class="bg-dark-800 rounded-xl p-6 text-center">
                        <div class="text-4xl mb-3">📱</div>
                        <div class="text-white font-bold">Đa nền tảng</div>
                        <div class="text-dark-400 text-sm">Web, Mobile, Desktop</div>
                    </div>
                    <div class="bg-dark-800 rounded-xl p-6 text-center">
                        <div class="text-4xl mb-3">🔒</div>
                        <div class="text-white font-bold">Bảo mật</div>
                        <div class="text-dark-400 text-sm">Mã hóa đầu cuối</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section id="support" class="cta-section pt-32 pb-20 px-6">
    <div class="cta-bg absolute inset-0"></div>
    <div class="relative z-10 max-w-4xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-dark-900 mb-8">
            Sẵn sàng bắt đầu hành trình?
        </h2>
        <p class="text-lg text-dark-500 mb-10 max-w-2xl mx-auto">
            Hàng triệu người đang sử dụng CoCoCord để nói chuyện, chơi game và xây dựng cộng đồng. Tham gia ngay hôm nay!
        </p>
        <a href="${pageContext.request.contextPath}/register" class="inline-flex items-center gap-2 px-10 py-4 bg-brand-blurple text-white font-semibold rounded-full hover:bg-brand-blurple-dark hover:shadow-xl transition-all text-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Tải xuống cho Windows
        </a>
    </div>
</section>
