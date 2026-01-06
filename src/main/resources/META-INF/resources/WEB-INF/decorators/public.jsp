<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="org.sitemesh.content.Content" %>
<% Content sitemeshContent = (Content) request.getAttribute(Content.class.getName()); %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title><% if (sitemeshContent != null && sitemeshContent.getExtractedProperties().getChild("title").hasValue()) {
        out.print(sitemeshContent.getExtractedProperties().getChild("title").getValue());
    } else { out.print("CoCoCord - Kết nối cộng đồng"); } %></title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            blurple: '#5865f2',
                            'blurple-dark': '#4752c4',
                            green: '#57f287',
                            yellow: '#fee75c',
                            fuchsia: '#eb459e',
                            red: '#ed4245',
                        },
                        dark: {
                            900: '#202225',
                            800: '#2f3136',
                            700: '#36393f',
                            600: '#40444b',
                            500: '#4f545c',
                            400: '#72767d',
                            300: '#96989d',
                            200: '#b9bbbe',
                            100: '#dcddde',
                        }
                    },
                    fontFamily: {
                        display: ['Outfit', 'sans-serif'],
                    },
                    animation: {
                        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                        'slide-in-right': 'slideInRight 0.8s ease-out forwards',
                        'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
                        'float': 'float 6s ease-in-out infinite',
                        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'scale-in': 'scaleIn 0.6s ease-out forwards',
                        'bounce-slow': 'bounceSlow 3s ease-in-out infinite',
                        'glow': 'glow 2s ease-in-out infinite alternate',
                    },
                    keyframes: {
                        fadeInUp: {
                            from: { opacity: '0', transform: 'translateY(30px)' },
                            to: { opacity: '1', transform: 'translateY(0)' },
                        },
                        slideInRight: {
                            from: { opacity: '0', transform: 'translateX(50px)' },
                            to: { opacity: '1', transform: 'translateX(0)' },
                        },
                        slideInLeft: {
                            from: { opacity: '0', transform: 'translateX(-50px)' },
                            to: { opacity: '1', transform: 'translateX(0)' },
                        },
                        float: {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-20px)' },
                        },
                        scaleIn: {
                            from: { opacity: '0', transform: 'scale(0.9)' },
                            to: { opacity: '1', transform: 'scale(1)' },
                        },
                        bounceSlow: {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-10px)' },
                        },
                        glow: {
                            from: { boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' },
                            to: { boxShadow: '0 0 30px rgba(37, 99, 235, 0.6)' },
                        },
                    },
                },
            },
        };
    </script>
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #404eed;
        }
        
        .discord-headline {
            font-weight: 900;
            letter-spacing: -0.025em;
            line-height: 1.1;
        }
        
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-600 { animation-delay: 600ms; }
        
        /* Nav scroll effect */
        .nav-scrolled {
            background: transparent;
        }
        
        /* Glass Nav Container - Always Transparent */
        .nav-glass-container {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
        }
        
        .nav-link {
            position: relative;
            overflow: hidden;
        }
        
        .nav-link::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, #2563eb, #3b82f6);
            border-radius: 2px;
            transition: all 0.3s ease;
            transform: translateX(-50%);
        }
        
        .nav-link:hover::after {
            width: 60%;
        }
        
        /* Mobile menu */
        .mobile-menu {
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        }
        .mobile-menu.open {
            transform: translateX(0);
        }
    </style>

    <% if (sitemeshContent != null) {
        sitemeshContent.getExtractedProperties().getChild("head").writeValueTo(out);
    } %>
</head>
<body class="min-h-screen flex flex-col text-white">
    <!-- Header/Navbar - Glass Effect Style -->
    <nav class="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 transition-all duration-500" id="navbar">
        <div class="max-w-7xl mx-auto">
            <div class="nav-glass-container flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-2xl transition-all duration-300">
                <!-- Logo -->
                <a href="${pageContext.request.contextPath}/" class="flex items-center gap-2.5 group relative z-50">
                    <div class="nav-logo-icon w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
                        <!-- <svg width="20" height="16" viewBox="0 0 28 22" fill="none" class="text-white">
                            <path d="M23.7219 2.07962C21.9478 1.26571 20.0549 0.672392 18.0867 0.341797C17.8381 0.769092 17.5619 1.34839 17.3684 1.80395C15.2726 1.49921 13.195 1.49921 11.1356 1.80395C10.9421 1.34839 10.6577 0.769092 10.4073 0.341797C8.43722 0.672392 6.54244 1.26755 4.76837 2.08331C1.2244 7.31024 0.255336 12.4048 0.739867 17.4272C3.09888 19.1469 5.38583 20.2104 7.6363 20.9278C8.19118 20.1795 8.68601 19.3822 9.11303 18.5429C8.30091 18.2484 7.52296 17.8844 6.78676 17.4599C6.98034 17.3205 7.16949 17.1755 7.35421 17.0268C11.7899 19.0908 16.6241 19.0908 21.0055 17.0268C21.1921 17.1755 21.3812 17.3205 21.5729 17.4599C20.8349 17.8863 20.0551 18.2502 19.243 18.5447C19.67 19.3822 20.163 20.1814 20.7197 20.9297C22.9702 20.2122 25.2589 19.1488 27.6179 17.4272C28.1892 11.6183 26.6548 6.57169 23.7219 2.07962ZM9.34839 14.3283C7.99968 14.3283 6.89605 13.0864 6.89605 11.5883C6.89605 10.0903 7.97527 8.84662 9.34839 8.84662C10.7215 8.84662 11.8252 10.0885 11.8007 11.5883C11.8025 13.0864 10.7215 14.3283 9.34839 14.3283ZM19.0091 14.3283C17.6604 14.3283 16.5568 13.0864 16.5568 11.5883C16.5568 10.0903 17.636 8.84662 19.0091 8.84662C20.3823 8.84662 21.4859 10.0885 21.4614 11.5883C21.4614 13.0864 20.3823 14.3283 19.0091 14.3283Z" fill="currentColor"/>
                        </svg> -->
                        <img src="${pageContext.request.contextPath}/images/cococord-logo.png" alt="Logo" class="w-full h-full object-contain">
                    </div>
                    <span class="text-lg font-bold text-white hidden sm:inline group-hover:text-blue-300 transition-colors">CoCoCord</span>
                </a>

                <!-- Desktop Navigation -->
                <div class="hidden lg:flex items-center gap-1 relative z-50">
                    <a href="#features" class="nav-link px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 font-medium text-sm">Tính năng</a>
                    <a href="#safety" class="nav-link px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 font-medium text-sm">Bảo mật</a>
                    <a href="#support" class="nav-link px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 font-medium text-sm">Hỗ trợ</a>
                </div>

                <!-- Right Side Buttons -->
                <div class="flex gap-2 sm:gap-3 items-center relative z-50">
                    <a href="${pageContext.request.contextPath}/login" class="hidden sm:inline-flex items-center justify-center px-5 py-2 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 font-semibold text-sm">
                        Đăng nhập
                    </a>
                    
                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-btn" class="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu" class="mobile-menu fixed inset-0 z-40 lg:hidden">
        <div class="absolute inset-0 bg-dark-900/95 backdrop-blur-lg"></div>
        <div class="relative h-full flex flex-col p-6 pt-20">
            <div class="flex flex-col gap-4">
                <a href="#features" class="text-white text-lg font-medium py-3 border-b border-dark-600">Tính năng</a>
                <a href="#safety" class="text-white text-lg font-medium py-3 border-b border-dark-600">Bảo mật</a>
                <a href="#support" class="text-white text-lg font-medium py-3 border-b border-dark-600">Hỗ trợ</a>
            </div>
            <div class="mt-auto flex flex-col gap-3">
                <a href="${pageContext.request.contextPath}/register" class="w-full px-6 py-3 bg-brand-blurple text-white text-center rounded-full font-semibold">
                    Đăng ký
                </a>
                <a href="${pageContext.request.contextPath}/login" class="w-full px-6 py-3 border border-white text-white text-center rounded-full font-medium">
                    Đăng nhập
                </a>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <main class="flex-grow">
        <% if (sitemeshContent != null) {
            sitemeshContent.getExtractedProperties().getChild("body").writeValueTo(out);
        } %>
    </main>

    <!-- Footer -->
    <footer class="bg-dark-900 pt-20 pb-8 px-6">
        <div class="max-w-7xl mx-auto">
            <!-- Footer Top -->
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
                <!-- Brand Column -->
                <div class="col-span-2 md:col-span-4 lg:col-span-1">
                    <div class="flex items-center gap-2 mb-6">
                        <!-- <svg width="32" height="24" viewBox="0 0 28 22" fill="none" class="text-brand-blurple">
                            <path d="M23.7219 2.07962C21.9478 1.26571 20.0549 0.672392 18.0867 0.341797C17.8381 0.769092 17.5619 1.34839 17.3684 1.80395C15.2726 1.49921 13.195 1.49921 11.1356 1.80395C10.9421 1.34839 10.6577 0.769092 10.4073 0.341797C8.43722 0.672392 6.54244 1.26755 4.76837 2.08331C1.2244 7.31024 0.255336 12.4048 0.739867 17.4272C3.09888 19.1469 5.38583 20.2104 7.6363 20.9278C8.19118 20.1795 8.68601 19.3822 9.11303 18.5429C8.30091 18.2484 7.52296 17.8844 6.78676 17.4599C6.98034 17.3205 7.16949 17.1755 7.35421 17.0268C11.7899 19.0908 16.6241 19.0908 21.0055 17.0268C21.1921 17.1755 21.3812 17.3205 21.5729 17.4599C20.8349 17.8863 20.0551 18.2502 19.243 18.5447C19.67 19.3822 20.163 20.1814 20.7197 20.9297C22.9702 20.2122 25.2589 19.1488 27.6179 17.4272C28.1892 11.6183 26.6548 6.57169 23.7219 2.07962ZM9.34839 14.3283C7.99968 14.3283 6.89605 13.0864 6.89605 11.5883C6.89605 10.0903 7.97527 8.84662 9.34839 8.84662C10.7215 8.84662 11.8252 10.0885 11.8007 11.5883C11.8025 13.0864 10.7215 14.3283 9.34839 14.3283ZM19.0091 14.3283C17.6604 14.3283 16.5568 13.0864 16.5568 11.5883C16.5568 10.0903 17.636 8.84662 19.0091 8.84662C20.3823 8.84662 21.4859 10.0885 21.4614 11.5883C21.4614 13.0864 20.3823 14.3283 19.0091 14.3283Z" fill="currentColor"/>
                        </svg> -->
                        <img src="${pageContext.request.contextPath}/images/cococord-logo.png" alt="Server" style="width: 60px; height: 60px; object-fit: contain;">
                        <span class="text-xl font-bold text-white">CoCoCord</span>
                    </div>
                    <p class="text-dark-300 text-sm leading-relaxed mb-6">
                        Nơi kết nối cộng đồng. Trò chuyện, chơi game và xây dựng cộng đồng của bạn.
                    </p>
                    <!-- Social Links -->
                    <div class="flex gap-4">
                        <a href="#" class="text-dark-400 hover:text-white transition">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                        </a>
                        <a href="#" class="text-dark-400 hover:text-white transition">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        </a>
                        <a href="#" class="text-dark-400 hover:text-white transition">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                    </div>
                </div>

                <!-- Sản phẩm -->
                <div>
                    <h3 class="text-brand-blurple font-semibold mb-4 text-sm uppercase tracking-wider">Sản phẩm</h3>
                    <ul class="space-y-3">
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Tải xuống</a></li>
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Nitro</a></li>
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Trạng thái</a></li>
                    </ul>
                </div>

                <!-- Công ty -->
                <div>
                    <h3 class="text-brand-blurple font-semibold mb-4 text-sm uppercase tracking-wider">Công ty</h3>
                    <ul class="space-y-3">
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Về chúng tôi</a></li>
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Tuyển dụng</a></li>
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Thương hiệu</a></li>
                    </ul>
                </div>

                <!-- Tài nguyên -->
                <div>
                    <h3 class="text-brand-blurple font-semibold mb-4 text-sm uppercase tracking-wider">Tài nguyên</h3>
                    <ul class="space-y-3">
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Hỗ trợ</a></li>
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">An toàn</a></li>
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Blog</a></li>
                    </ul>
                </div>

                <!-- Chính sách -->
                <div>
                    <h3 class="text-brand-blurple font-semibold mb-4 text-sm uppercase tracking-wider">Chính sách</h3>
                    <ul class="space-y-3">
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Điều khoản</a></li>
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Quyền riêng tư</a></li>
                        <li><a href="#" class="text-dark-300 hover:text-white hover:underline transition text-sm">Hướng dẫn</a></li>
                    </ul>
                </div>
            </div>

            <!-- Footer Bottom -->
            <div class="border-t border-dark-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                    <!-- <svg width="28" height="22" viewBox="0 0 28 22" fill="none" class="text-brand-blurple">
                        <path d="M23.7219 2.07962C21.9478 1.26571 20.0549 0.672392 18.0867 0.341797C17.8381 0.769092 17.5619 1.34839 17.3684 1.80395C15.2726 1.49921 13.195 1.49921 11.1356 1.80395C10.9421 1.34839 10.6577 0.769092 10.4073 0.341797C8.43722 0.672392 6.54244 1.26755 4.76837 2.08331C1.2244 7.31024 0.255336 12.4048 0.739867 17.4272C3.09888 19.1469 5.38583 20.2104 7.6363 20.9278C8.19118 20.1795 8.68601 19.3822 9.11303 18.5429C8.30091 18.2484 7.52296 17.8844 6.78676 17.4599C6.98034 17.3205 7.16949 17.1755 7.35421 17.0268C11.7899 19.0908 16.6241 19.0908 21.0055 17.0268C21.1921 17.1755 21.3812 17.3205 21.5729 17.4599C20.8349 17.8863 20.0551 18.2502 19.243 18.5447C19.67 19.3822 20.163 20.1814 20.7197 20.9297C22.9702 20.2122 25.2589 19.1488 27.6179 17.4272C28.1892 11.6183 26.6548 6.57169 23.7219 2.07962ZM9.34839 14.3283C7.99968 14.3283 6.89605 13.0864 6.89605 11.5883C6.89605 10.0903 7.97527 8.84662 9.34839 8.84662C10.7215 8.84662 11.8252 10.0885 11.8007 11.5883C11.8025 13.0864 10.7215 14.3283 9.34839 14.3283ZM19.0091 14.3283C17.6604 14.3283 16.5568 13.0864 16.5568 11.5883C16.5568 10.0903 17.636 8.84662 19.0091 8.84662C20.3823 8.84662 21.4859 10.0885 21.4614 11.5883C21.4614 13.0864 20.3823 14.3283 19.0091 14.3283Z" fill="currentColor"/>
                    </svg> -->
                    <img src="${pageContext.request.contextPath}/images/cococord-logo.png" alt="Server" style="width: 60px; height: 60px; object-fit: contain;">
                    <span class="text-lg font-bold text-white">CoCoCord</span>
                </div>
                <a href="${pageContext.request.contextPath}/register" class="px-6 py-2 bg-brand-blurple text-white rounded-full hover:bg-brand-blurple-dark transition font-medium text-sm">
                    Đăng ký
                </a>
            </div>
        </div>
    </footer>

    <script>
        // Navbar scroll effect
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('nav-scrolled');
            } else {
                navbar.classList.remove('nav-scrolled');
            }
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('open');
            });

            // Close mobile menu when clicking a link
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('open');
                });
            });
        }

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    </script>

    <% if (sitemeshContent != null) {
        sitemeshContent.getExtractedProperties().getChild("page.script").writeValueTo(out);
    } %>
</body>
</html>
