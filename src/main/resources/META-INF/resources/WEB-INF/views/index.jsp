<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<title>CoCoCord - Nơi kết nối cộng đồng của bạn</title>

<head>
<style>
    /* ===== COLOR PALETTE (Discord Night Sky Theme) ===== */
    :root {
        /* Primary Blues */
        --night-deep: #0a0e27;
        --night-blue: #111a3e;
        --night-mid: #1a2456;
        --night-light: #2b3a7a;
        
        /* Accent Purples */
        --accent-purple: #5865f2;
        --accent-purple-dark: #4752c4;
        --accent-purple-light: #7983f5;
        
        /* Star colors */
        --star-bright: #ffffff;
        --star-dim: rgba(255, 255, 255, 0.4);
        --star-glow: rgba(138, 180, 255, 0.6);
        
        /* UI Colors */
        --surface-dark: #0d1117;
        --surface-mid: #161b22;
        --text-primary: #ffffff;
        --text-secondary: rgba(255, 255, 255, 0.7);
    }
    
    /* Hero section with deep night sky gradient */
    .hero-section {
        background: linear-gradient(180deg, 
            #0a0e27 0%, 
            #111a3e 30%, 
            #1a2456 60%, 
            #2b3a7a 100%);
        position: relative;
        overflow: hidden;
        min-height: 100vh;
    }
    
    /* Animated stars background */
    .hero-section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 90px 40px, white, transparent),
            radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 160px 120px, white, transparent),
            radial-gradient(2px 2px at 200px 50px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 250px 160px, white, transparent),
            radial-gradient(2px 2px at 300px 100px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 350px 200px, white, transparent),
            radial-gradient(2px 2px at 400px 60px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 450px 180px, white, transparent),
            radial-gradient(2px 2px at 500px 90px, rgba(255,255,255,0.6), transparent);
        background-repeat: repeat;
        background-size: 550px 250px;
        animation: starTwinkle 8s ease-in-out infinite;
        opacity: 0.8;
    }
    
    @keyframes starTwinkle {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 0.5; }
    }
    
    /* Floating star sparkles */
    .star-sparkle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 10px 2px rgba(138, 180, 255, 0.6);
        animation: sparkleFloat 6s ease-in-out infinite;
    }
    
    @keyframes sparkleFloat {
        0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
        50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
    }
    
    /* Large decorative star */
    .star-large {
        position: absolute;
        font-size: 1.5rem;
        color: rgba(255, 255, 255, 0.3);
        animation: starPulse 4s ease-in-out infinite;
    }
    
    @keyframes starPulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
    }
    
    /* Cloud/wave decoration at bottom */
    .hero-decoration-bottom {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1;
    }
    
    /* Feature sections */
    .section-white { background-color: #ffffff; }
    .section-gray { background-color: #f6f6f6; }
    .section-dark { 
        background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
    }
    
    /* Discord-style title */
    .hero-title {
        font-family: 'Outfit', 'ABC Ginto Nord', sans-serif;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: -0.04em;
        line-height: 0.95;
        text-shadow: 0 4px 30px rgba(88, 101, 242, 0.3);
    }
    
    /* Floating animation */
    @keyframes heroFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    .hero-float { animation: heroFloat 6s ease-in-out infinite; }
    
    /* Voice user cards */
    .voice-card { border-radius: 16px; overflow: hidden; }
    .voice-card-red { background: linear-gradient(135deg, #ED4245 0%, #F04747 100%); }
    .voice-card-yellow { background: linear-gradient(135deg, #FEE75C 0%, #F0B132 100%); }
    .voice-card-green { background: linear-gradient(135deg, #57F287 0%, #3BA55C 100%); }
    .voice-card-blue { background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%); }
    
    /* Sparkle decorations */
    .sparkle {
        position: absolute;
        pointer-events: none;
    }
    .sparkle::before {
        content: '✦';
        font-size: 1.5rem;
        color: rgba(255,255,255,0.3);
    }
    
    /* Wumpus bounce */
    @keyframes wumpusBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
    }
    .wumpus-bounce { animation: wumpusBounce 3s ease-in-out infinite; }
    
    /* CTA Section with night sky continuation */
    .cta-night-section {
        background: linear-gradient(180deg, 
            #f6f6f6 0%, 
            #e8e8e8 50%,
            #1a2456 50%,
            #0a0e27 100%);
        position: relative;
    }
    
    .cta-night-section::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 50%;
        background-image: 
            radial-gradient(2px 2px at 50px 30px, white, transparent),
            radial-gradient(1px 1px at 100px 60px, rgba(255,255,255,0.7), transparent),
            radial-gradient(2px 2px at 180px 80px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 250px 40px, white, transparent),
            radial-gradient(2px 2px at 320px 90px, rgba(255,255,255,0.6), transparent);
        background-repeat: repeat;
        background-size: 400px 150px;
        pointer-events: none;
    }
</style>
</head>

<!-- Hero Section - Discord Night Sky Style -->
<section class="hero-section flex flex-col items-center justify-center pt-24 pb-20 px-4 md:px-8">
    <!-- Animated star sparkles -->
    <div class="star-sparkle top-20 left-[8%]" style="animation-delay: 0s;"></div>
    <div class="star-sparkle top-32 right-[12%]" style="animation-delay: 1s;"></div>
    <div class="star-sparkle top-40 left-[25%]" style="animation-delay: 2s;"></div>
    <div class="star-sparkle top-24 right-[30%]" style="animation-delay: 0.5s;"></div>
    <div class="star-sparkle top-52 left-[15%]" style="animation-delay: 1.5s;"></div>
    <div class="star-sparkle top-36 right-[20%]" style="animation-delay: 2.5s;"></div>
    
    <!-- Large decorative stars -->
    <div class="star-large top-28 left-[5%]">✦</div>
    <div class="star-large top-16 right-[8%]" style="animation-delay: 1s;">✧</div>
    <div class="star-large top-44 left-[35%]" style="animation-delay: 2s;">✦</div>
    <div class="star-large bottom-32 right-[15%]" style="animation-delay: 0.5s;">✧</div>
    
    <div class="max-w-7xl mx-auto w-full relative z-10">
        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <!-- Left side - Text content -->
            <div class="text-center lg:text-left animate-fade-in-up">
                <h1 class="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6">
                    GROUP CHAT<br>
                    THAT'S ALL<br>
                    FUN & GAMES
                </h1>
                <p class="text-lg md:text-xl text-white/80 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    CoCoCord tuyệt vời để chơi game và trò chuyện với bạn bè, hoặc xây dựng cộng đồng toàn cầu. Tùy chỉnh không gian riêng để nói chuyện, chơi và giao lưu.
                </p>
                
                <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <a href="${pageContext.request.contextPath}/register" class="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-dark-900 font-semibold rounded-full hover:shadow-2xl hover:text-brand-blurple transition-all text-base">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download for Windows
                    </a>
                    <a href="${pageContext.request.contextPath}/app" class="inline-flex items-center justify-center px-8 py-4 bg-dark-800 text-white font-semibold rounded-full hover:bg-dark-700 transition-all text-base">
                        Open CoCoCord in browser
                    </a>
                </div>
            </div>
            
            <!-- Right side - Hero Image / App Preview -->
            <div class="relative z-10 animate-fade-in-up animation-delay-200">
                <div class="hero-float">
                    <!-- Discord-style app mockup -->
                    <div class="bg-dark-800 rounded-2xl shadow-2xl overflow-hidden border border-dark-600 max-w-xl mx-auto">
                        <!-- Window controls -->
                        <div class="bg-dark-900 px-4 py-3 flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-red-500"></div>
                            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div class="w-3 h-3 rounded-full bg-green-500"></div>
                            <span class="ml-4 text-dark-400 text-sm">CoCoCord</span>
                        </div>
                        
                        <div class="flex h-72 md:h-80">
                            <!-- Server sidebar -->
                            <div class="w-16 bg-dark-900 p-2 space-y-2 flex-shrink-0">
                                <div class="w-12 h-12 rounded-2xl bg-brand-blurple flex items-center justify-center">
                                    <!-- <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                                    </svg> -->
                                    <img src="${pageContext.request.contextPath}/images/cococord-logo.png" alt="Server" style="width: 50px; height: 50px; object-fit: contain;">
                                </div>
                                <div class="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center text-white text-sm font-bold">TC</div>
                                <div class="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center text-xl">🎮</div>
                                <div class="w-12 h-1 rounded-full bg-dark-600 mx-auto my-1"></div>
                                <div class="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-dark-400 text-2xl hover:bg-brand-green hover:text-white transition-colors cursor-pointer">+</div>
                            </div>
                            
                            <!-- Channels -->
                            <div class="w-44 bg-dark-800 p-3 flex-shrink-0 hidden sm:block">
                                <div class="text-white font-bold mb-3 flex items-center justify-between text-sm">
                                    <span>The Crew</span>
                                    <svg class="w-4 h-4 text-dark-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                </div>
                                <div class="text-dark-400 text-xs font-bold uppercase mb-2">Text Channels</div>
                                <div class="space-y-1 text-sm mb-4">
                                    <div class="text-dark-300 px-2 py-1 flex items-center gap-1.5"><span class="text-dark-500">#</span> gaming</div>
                                    <div class="text-white bg-dark-600/50 rounded px-2 py-1 flex items-center gap-1.5"><span class="text-dark-400">#</span> main-chat</div>
                                </div>
                                <div class="text-dark-400 text-xs font-bold uppercase mb-2">Voice Channels</div>
                                <div class="space-y-1 text-sm">
                                    <div class="text-dark-300 px-2 py-1 flex items-center gap-1.5">
                                        <svg class="w-4 h-4 text-dark-400" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                                        vc-general
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Chat area -->
                            <div class="flex-1 bg-dark-700 p-3 flex flex-col min-w-0">
                                <div class="text-dark-300 text-sm mb-3 flex items-center gap-1.5 border-b border-dark-600 pb-2">
                                    <span class="text-dark-500">#</span> main-chat
                                </div>
                                <div class="space-y-3 flex-1 overflow-hidden">
                                    <div class="flex items-start gap-2">
                                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex-shrink-0"></div>
                                        <div class="min-w-0">
                                            <div class="text-white font-medium text-sm">Negav <span class="text-dark-400 text-xs ml-1">9:32 AM</span></div>
                                            <div class="text-dark-200 text-sm">Có gì hot khum anh em? 😅</div>
                                        </div>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex-shrink-0"></div>
                                        <div class="min-w-0">
                                            <div class="text-white font-medium text-sm">J97 <span class="text-dark-400 text-xs ml-1">9:33 AM</span></div>
                                            <div class="text-dark-200 text-sm">Đom đóm không thể có 5tr 😂</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Members list -->
                            <div class="w-36 bg-dark-800 p-3 hidden lg:block flex-shrink-0">
                                <div class="text-dark-400 text-xs font-bold uppercase mb-2">Online — 3</div>
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <div class="relative">
                                            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-teal-500"></div>
                                            <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-dark-800"></div>
                                        </div>
                                        <span class="text-dark-200 text-xs truncate">Negav</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="relative">
                                            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-pink-500"></div>
                                            <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-dark-800"></div>
                                        </div>
                                        <span class="text-dark-200 text-xs truncate">J97</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="relative">
                                            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                                            <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-dark-800"></div>
                                        </div>
                                        <span class="text-dark-200 text-xs truncate">Thiên An</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Bottom wave decoration - removed for seamless dark theme -->
</section>

<!-- Feature 1: Voice Channels - Grab a seat -->
<section class="relative py-20 md:py-32 px-4 md:px-8" style="background: linear-gradient(180deg, #2b3a7a 0%, #1a2456 50%, #111a3e 100%);">
    <!-- Stars background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none" style="background-image: radial-gradient(2px 2px at 40px 60px, white, transparent), radial-gradient(1px 1px at 100px 120px, rgba(255,255,255,0.7), transparent), radial-gradient(2px 2px at 200px 80px, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 300px 160px, white, transparent); background-repeat: repeat; background-size: 400px 200px;"></div>
    <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <!-- Left - Voice Channel UI -->
            <div class="order-2 lg:order-1">
                <div class="relative">
                    <!-- Voice channel mockup -->
                    <div class="flex flex-col lg:flex-row gap-6 items-start">
                        <!-- Server/Channel sidebar -->
                        <div class="bg-dark-800 rounded-xl overflow-hidden shadow-2xl w-full lg:w-56 flex-shrink-0">
                            <div class="p-3 border-b border-dark-600">
                                <div class="text-white font-bold flex items-center justify-between text-sm">
                                    <span>The Crew</span>
                                    <svg class="w-4 h-4 text-dark-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                </div>
                            </div>
                            <div class="p-3">
                                <div class="text-dark-400 text-xs font-bold uppercase mb-2">Text Channels</div>
                                <div class="space-y-1 text-sm mb-4">
                                    <div class="text-dark-300 px-2 py-1 flex items-center gap-1.5"><span class="text-dark-500">#</span> gaming</div>
                                    <div class="text-dark-300 px-2 py-1 flex items-center gap-1.5"><span class="text-dark-500">#</span> main-chat</div>
                                </div>
                                <div class="text-dark-400 text-xs font-bold uppercase mb-2">Voice Channels</div>
                                <div class="text-white bg-dark-600/50 rounded px-2 py-1.5 flex items-center gap-1.5 mb-2">
                                    <svg class="w-4 h-4 text-dark-300" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                                    vc-general
                                </div>
                                <div class="pl-5 space-y-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600"></div>
                                        <span class="text-dark-200 text-sm">Rod</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                                        <span class="text-dark-200 text-sm">I'm a Bird</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600"></div>
                                        <span class="text-dark-200 text-sm">moongirl</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-pink-600"></div>
                                        <span class="text-dark-200 text-sm">kirbs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Voice channel active view with video cards -->
                        <div class="flex-1 w-full">
                            <div class="flex items-center gap-2 mb-4 text-dark-700">
                                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                                <span class="text-lg text-white font-bold">vc-general</span>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="voice-card voice-card-red p-4 aspect-video flex items-center justify-center">
                                    <div class="text-center">
                                        <div class="w-12 h-12 mx-auto rounded-full bg-white/20 mb-2 flex items-center justify-center text-2xl">🎮</div>
                                        <span class="text-white text-sm font-medium">Rod</span>
                                    </div>
                                </div>
                                <div class="voice-card voice-card-yellow p-4 aspect-video flex items-center justify-center">
                                    <div class="text-center">
                                        <div class="w-12 h-12 mx-auto rounded-full bg-white/30 mb-2 flex items-center justify-center text-2xl">🌙</div>
                                        <span class="text-dark-800 text-sm font-medium">moongirl</span>
                                    </div>
                                </div>
                                <div class="voice-card voice-card-green p-4 aspect-video flex items-center justify-center">
                                    <div class="text-center">
                                        <div class="w-12 h-12 mx-auto rounded-full bg-white/20 mb-2 flex items-center justify-center text-2xl">🐦</div>
                                        <span class="text-white text-sm font-medium">I'm a Bird</span>
                                    </div>
                                </div>
                                <div class="voice-card voice-card-blue p-4 aspect-video flex items-center justify-center">
                                    <div class="text-center">
                                        <div class="w-12 h-12 mx-auto rounded-full bg-white/20 mb-2 flex items-center justify-center text-2xl">⭐</div>
                                        <span class="text-white text-sm font-medium">kirbs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right - Text -->
            <div class="order-1 lg:order-2 relative z-10">
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                    Grab a seat in a<br>voice channel
                </h2>
                <p class="text-lg text-white/70 leading-relaxed">
                    Kênh thoại giúp bạn trò chuyện dễ dàng. Không cần gọi điện hay sắp xếp lịch — chỉ cần nhảy vào khi bạn rảnh. Bạn bè trong server có thể thấy bạn đang online và vào nói chuyện ngay lập tức.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Feature 2: Create an invite-only place -->
<section id="features" class="relative py-20 md:py-32 px-4 md:px-8" style="background: linear-gradient(180deg, #111a3e 0%, #0d1225 50%, #0a0e27 100%);">
    <!-- Stars background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none" style="background-image: radial-gradient(1px 1px at 60px 40px, white, transparent), radial-gradient(2px 2px at 150px 100px, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 250px 70px, white, transparent), radial-gradient(2px 2px at 350px 130px, rgba(255,255,255,0.5), transparent); background-repeat: repeat; background-size: 450px 180px;"></div>
    <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <!-- Left - Text -->
            <div class="relative z-10">
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                    Create an<br>invite-only place
                </h2>
                <p class="text-lg text-white/70 leading-relaxed">
                    Server CoCoCord được tổ chức thành các kênh theo chủ đề, nơi bạn có thể cộng tác, chia sẻ và trò chuyện về ngày của bạn mà không làm nghẽn group chat.
                </p>
            </div>
            
            <!-- Right - App UI Preview -->
            <div class="relative z-10">
                <div class="bg-dark-800 rounded-2xl shadow-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                    <div class="bg-dark-900 px-4 py-3 flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-red-500"></div>
                        <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div class="p-4">
                        <div class="flex gap-3">
                            <div class="w-14 space-y-2 flex-shrink-0">
                                <div class="w-12 h-12 rounded-2xl bg-brand-blurple mx-auto flex items-center justify-center">
                                    <!-- <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                                    </svg> -->
                                    <img src="${pageContext.request.contextPath}/images/cococord-logo.png" alt="Server" style="width: 50px; height: 50px; object-fit: contain;">
                                </div>
                                <div class="w-12 h-12 rounded-full bg-dark-700 mx-auto"></div>
                                <div class="w-12 h-12 rounded-full bg-dark-700 mx-auto"></div>
                            </div>
                            <div class="flex-1 bg-dark-700 rounded-lg p-4">
                                <div class="text-white font-bold mb-3 text-sm">Welcome to #mess-hall</div>
                                <div class="space-y-3">
                                    <div class="flex items-start gap-3">
                                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex-shrink-0"></div>
                                        <div class="flex-1">
                                            <div class="text-white text-sm font-medium">Olive <span class="text-dark-400 text-xs">Today at 9:32 AM</span></div>
                                            <div class="text-dark-300 text-sm">lol what did i miss? 😅</div>
                                        </div>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex-shrink-0"></div>
                                        <div class="flex-1">
                                            <div class="text-white text-sm font-medium">Rod <span class="text-dark-400 text-xs">Today at 9:33 AM</span></div>
                                            <div class="text-dark-300 text-sm">yeah that sounds right did anyone take notes?</div>
                                        </div>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex-shrink-0"></div>
                                        <div class="flex-1">
                                            <div class="text-white text-sm font-medium">moongirl <span class="text-dark-400 text-xs">Today at 9:34 AM</span></div>
                                            <div class="text-dark-300 text-sm">I got you! 📝</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Feature 3: From few to a fandom -->
<section class="relative py-20 md:py-32 px-4 md:px-8" style="background: linear-gradient(180deg, #0a0e27 0%, #111a3e 50%, #1a2456 100%);">
    <!-- Stars background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none" style="background-image: radial-gradient(2px 2px at 80px 50px, white, transparent), radial-gradient(1px 1px at 180px 90px, rgba(255,255,255,0.7), transparent), radial-gradient(2px 2px at 280px 60px, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 380px 120px, white, transparent); background-repeat: repeat; background-size: 500px 170px;"></div>
    <div class="max-w-7xl mx-auto relative z-10">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <!-- Left - Roles/Moderation illustration -->
            <div class="order-2 lg:order-1">
                <div class="bg-dark-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/10 hover:border-white/20 transition-colors duration-300">
                    <h3 class="text-white font-bold text-xl mb-6">Quản lý vai trò thành viên</h3>
                    <div class="flex flex-wrap gap-3">
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-red-600 to-red-500 shadow-lg hover:scale-105 transition-transform cursor-default">👑 Admin</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg hover:scale-105 transition-transform cursor-default">🛡️ Moderator</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-yellow-500 to-amber-500 shadow-lg hover:scale-105 transition-transform cursor-default">⭐ VIP</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-green-600 to-green-500 shadow-lg hover:scale-105 transition-transform cursor-default">✓ Member</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg hover:scale-105 transition-transform cursor-default">🎮 Gamer</span>
                        <span class="px-5 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-default">🎨 Artist</span>
                    </div>
                    <p class="text-white/50 text-sm mt-6">Tùy chỉnh vai trò và quyền hạn cho cộng đồng của bạn</p>
                </div>
            </div>
            
            <!-- Right - Text -->
            <div class="order-1 lg:order-2">
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                    From few to a fandom
                </h2>
                <p class="text-lg text-white/70 leading-relaxed">
                    Quản lý cộng đồng với công cụ kiểm duyệt mạnh mẽ và quyền truy cập tùy chỉnh. Cấp quyền đặc biệt cho thành viên, thiết lập kênh riêng tư và nhiều hơn nữa.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Feature 4: Reliable tech -->
<section id="safety" class="relative py-20 md:py-32 px-4 md:px-8" style="background: linear-gradient(180deg, #1a2456 0%, #111a3e 50%, #0a0e27 100%);">
    <!-- Stars background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none" style="background-image: radial-gradient(1px 1px at 50px 70px, white, transparent), radial-gradient(2px 2px at 140px 40px, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 230px 110px, white, transparent), radial-gradient(2px 2px at 320px 60px, rgba(255,255,255,0.5), transparent); background-repeat: repeat; background-size: 420px 160px;"></div>
    <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <!-- Left - Text -->
            <div class="relative z-10">
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                    Reliable tech for<br>staying close
                </h2>
                <p class="text-lg text-white/70 leading-relaxed">
                    Độ trễ thấp, âm thanh và video chất lượng cao giúp bạn cảm giác như đang ở cùng phòng. Wave to friends, watch them play, or enjoy a movie together.
                </p>
            </div>
            
            <!-- Right - Tech features grid -->
            <div class="relative z-10">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:scale-105 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default group">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <div class="text-white font-bold text-lg">Video HD</div>
                        <div class="text-white/50 text-sm">Chất lượng cao</div>
                    </div>
                    <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:scale-105 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default group">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                            </svg>
                        </div>
                        <div class="text-white font-bold text-lg">Âm thanh rõ</div>
                        <div class="text-white/50 text-sm">Khử tiếng ồn</div>
                    </div>
                    <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:scale-105 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default group">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-shadow">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <div class="text-white font-bold text-lg">Đa nền tảng</div>
                        <div class="text-white/50 text-sm">Web, Mobile, Desktop</div>
                    </div>
                    <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:scale-105 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default group">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-shadow">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        </div>
                        <div class="text-white font-bold text-lg">Bảo mật</div>
                        <div class="text-white/50 text-sm">Mã hóa đầu cuối</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section with Night Sky Theme -->
<section id="support" class="relative overflow-hidden" style="background: linear-gradient(180deg, #0a0e27 0%, #111a3e 100%);">
    <!-- Stars background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none" style="background-image: radial-gradient(2px 2px at 60px 50px, white, transparent), radial-gradient(1px 1px at 160px 90px, rgba(255,255,255,0.7), transparent), radial-gradient(2px 2px at 260px 40px, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 360px 100px, white, transparent); background-repeat: repeat; background-size: 450px 150px;"></div>
    
    <!-- CTA content -->
    <div class="relative z-10 pt-16 pb-24 px-4 md:px-8">
        <div class="max-w-4xl mx-auto text-center relative z-10">
            <!-- Wumpus-style mascot illustration -->
            <h2 class="hero-title text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 uppercase">
                You can't scroll anymore.<br>Better go chat.
            </h2>
            <p class="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
                Hàng triệu người đang sử dụng CoCoCord để kết nối với cộng đồng và bạn bè. Tham gia ngay hôm nay — hoàn toàn miễn phí!
            </p>
            <a href="${pageContext.request.contextPath}/register" class="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white font-semibold rounded-full hover:from-[#1d4ed8] hover:to-[#1e40af] hover:shadow-2xl hover:shadow-blue-500/30 transition-all text-lg group">
                <svg class="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download for Windows
            </a>
        </div>
    </div>
    
    <!-- Lower part - Night sky with stars -->
    <div class="relative py-20" style="background: linear-gradient(180deg, #0a0e27 0%, #111a3e 50%, #1a2456 100%);">
        <!-- Animated stars -->
        <div class="absolute inset-0" style="
            background-image: 
                radial-gradient(2px 2px at 30px 40px, white, transparent),
                radial-gradient(1px 1px at 70px 90px, rgba(255,255,255,0.8), transparent),
                radial-gradient(2px 2px at 150px 60px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 200px 120px, white, transparent),
                radial-gradient(2px 2px at 280px 30px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 350px 100px, white, transparent),
                radial-gradient(2px 2px at 420px 70px, rgba(255,255,255,0.5), transparent),
                radial-gradient(1px 1px at 500px 150px, white, transparent);
            background-repeat: repeat;
            background-size: 550px 200px;
            animation: starTwinkle 8s ease-in-out infinite;
        "></div>
        
        <!-- Decorative stars -->
        <div class="star-large top-8 left-[10%]">✦</div>
        <div class="star-large top-16 right-[15%]" style="animation-delay: 1s;">✧</div>
        <div class="star-large bottom-12 left-[20%]" style="animation-delay: 2s;">✦</div>
        <div class="star-large bottom-8 right-[25%]" style="animation-delay: 0.5s;">✧</div>
        
        <!-- Sparkle dots -->
        <div class="star-sparkle top-10 left-[30%]" style="animation-delay: 0s;"></div>
        <div class="star-sparkle top-20 right-[35%]" style="animation-delay: 1.5s;"></div>
        <div class="star-sparkle bottom-16 left-[40%]" style="animation-delay: 0.5s;"></div>
        <div class="star-sparkle bottom-24 right-[20%]" style="animation-delay: 2s;"></div>
    </div>
</section>

<!-- Smooth Scroll Script -->
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    });
</script>
