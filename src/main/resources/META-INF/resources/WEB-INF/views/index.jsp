<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CoCoCord - Kết nối mọi người, mọi lúc, mọi nơi</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              discord: {
                blurple: "hsl(235 86% 65%)",
                dark: "hsl(228 58% 12%)",
                darker: "hsl(228 58% 8%)",
                light: "hsl(228 58% 25%)",
                green: "hsl(139 47% 44%)",
                yellow: "hsl(38 96% 54%)",
                pink: "hsl(349 55% 60%)",
              },
            },
            fontFamily: {
              display: ["Outfit", "sans-serif"],
            },
            animation: {
              "fade-in-up": "fadeInUp 0.8s ease-out forwards",
              "slide-in-right": "slideInRight 0.8s ease-out forwards",
              float: "float 6s ease-in-out infinite",
            },
            keyframes: {
              fadeInUp: {
                from: { opacity: "0", transform: "translateY(30px)" },
                to: { opacity: "1", transform: "translateY(0)" },
              },
              slideInRight: {
                from: { opacity: "0", transform: "translateX(50px)" },
                to: { opacity: "1", transform: "translateX(0)" },
              },
              float: {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-20px)" },
              },
            },
          },
        },
      };
    </script>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        background: linear-gradient(
          180deg,
          hsl(235 65% 35%) 0%,
          hsl(228 58% 20%) 50%,
          hsl(228 58% 12%) 100%
        );
        min-height: 100vh;
        font-family: "Outfit", sans-serif;
        color: #ffffff;
      }

      .discord-headline {
        font-weight: 900;
        font-style: italic;
        letter-spacing: -0.025em;
        text-shadow: 0 4px 30px hsl(235 86% 65% / 0.3);
        line-height: 1.1;
      }

      .animation-delay-200 {
        animation-delay: 200ms;
      }

      .animation-delay-400 {
        animation-delay: 400ms;
      }

      .animation-delay-600 {
        animation-delay: 600ms;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(50px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-20px);
        }
      }
    </style>
  </head>
  <body>
    <!-- Navbar -->

    <!-- Hero Section -->
    <section
      class="relative w-full pt-32 pb-20 flex items-center overflow-hidden min-h-screen"
    >
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute -top-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"
        ></div>
        <div
          class="absolute top-1/3 -right-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"
          style="animation-delay: 2s"
        ></div>
        <div
          class="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animation-delay-400"
        ></div>
      </div>

      <div class="relative w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div
          class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        >
          <!-- Left Content -->
          <div
            class="text-center lg:text-left space-y-6 lg:space-y-8 order-2 lg:order-1"
          >
            <div class="animate-fade-in-up">
              <h1
                class="discord-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight"
              >
                Group Chat<br />
                <span
                  class="bg-gradient-to-r pr-4 from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent"
                >
                  That's All</span
                ><br />
                <span
                  class="bg-gradient-to-r pr-4 from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent"
                >
                  Fun & Games
                </span>
              </h1>
            </div>

            <div class="animate-fade-in-up animation-delay-200">
              <p
                class="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-lg leading-relaxed mx-auto lg:mx-0"
              >
                CoCoCord là nơi tuyệt vời để chơi game và chilled với bạn bè.
              </p>
            </div>

            <div class="animate-fade-in-up animation-delay-400">
              <div
                class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:center"
              >
                <a
                  href="/register"
                  class="px-6 sm:px-8 py-3 bg-white text-gray-900 font-bold rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    ></path>
                  </svg>
                  Download
                </a>
                <a
                  href="/login"
                  class="px-6 sm:px-8 py-3 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-sm sm:text-base"
                >
                  Open Browser App
                </a>
              </div>
            </div>
          </div>

          <!-- Right Content - App Preview -->
          <div
            class="hidden lg:flex order-1 lg:order-2 animate-slide-in-right animation-delay-600 justify-center"
          >
            <div class="w-full max-w-xl">
              <!-- Main Preview Window -->
              <div
                class="rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800/50"
              >
                <div class="bg-gradient-to-b from-gray-800 to-gray-900 p-4">
                  <!-- Window Controls -->
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>

                  <!-- Content -->
                  <div class="flex gap-2 bg-gray-900 rounded-lg h-72">
                    <!-- Servers Sidebar -->
                    <div
                      class="w-14 flex flex-col gap-2 items-center py-2 border-r border-gray-700"
                    >
                      <div
                        class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm"
                      >
                        🎮
                      </div>
                      <div
                        class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-semibold"
                      >
                        GC
                      </div>
                      <div
                        class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm"
                      >
                        💬
                      </div>
                    </div>

                    <!-- Channels Sidebar -->
                    <div
                      class="hidden sm:flex w-36 bg-gray-800/50 p-2 border-r border-gray-700 flex-col"
                    >
                      <div
                        class="text-xs font-bold text-gray-400 uppercase mb-2"
                      >
                        Gaming
                      </div>
                      <div class="space-y-1 text-xs">
                        <div
                          class="text-white py-1.5 px-2 rounded bg-blue-600/20 cursor-pointer font-medium"
                        >
                          # general
                        </div>
                        <div
                          class="text-gray-400 py-1.5 px-2 rounded hover:bg-gray-700/50 cursor-pointer"
                        >
                          🔊 voice
                        </div>
                        <div
                          class="text-gray-400 py-1.5 px-2 rounded hover:bg-gray-700/50 cursor-pointer"
                        >
                          # games
                        </div>
                      </div>
                    </div>

                    <!-- Chat Area -->
                    <div class="flex-1 flex flex-col p-3">
                      <div
                        class="text-xs font-semibold text-white mb-2 border-b border-gray-700 pb-1"
                      >
                        # general
                      </div>
                      <div class="space-y-2 flex-1 overflow-hidden text-xs">
                        <div class="flex gap-2">
                          <div
                            class="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex-shrink-0"
                          ></div>
                          <div class="min-w-0">
                            <div class="flex items-baseline gap-1">
                              <span class="text-white font-semibold"
                                >Negav</span
                              >
                              <span class="text-gray-500">10:45</span>
                            </div>
                            <p class="text-gray-300">Ai chơi khum?</p>
                          </div>
                        </div>
                        <div class="flex gap-2">
                          <div
                            class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0"
                          ></div>
                          <div class="min-w-0">
                            <div class="flex items-baseline gap-1">
                              <span class="text-white font-semibold">J97</span>
                              <span class="text-gray-500">10:46</span>
                            </div>
                            <p class="text-gray-300">OK nè!</p>
                          </div>
                        </div>
                      </div>
                      <div
                        class="mt-2 p-2 bg-gray-700/30 rounded text-xs text-gray-400 border border-gray-600"
                      >
                        <input
                          type="text"
                          placeholder="..."
                          class="w-full bg-transparent outline-none text-white placeholder-gray-600 text-xs"
                        />
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

    <!-- Features Section -->
    <section id="features" class="py-32 px-6 relative">
      <!-- Background Gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent pointer-events-none"
      ></div>

      <div class="relative max-w-7xl mx-auto">
        <!-- Feature 1: Create Invite-Only -->
        <!--
        <div class="grid lg:grid-cols-2 gap-16 items-center mb-40">
          <div class="space-y-8">
            <div>
              <h2
                class="discord-headline text-4xl md:text-5xl lg:text-6xl text-white mb-6"
              >
                Create an<br />invite-only<br />place where<br />you belong
              </h2>
            </div>
            <p
              class="text-lg md:text-xl text-gray-300 leading-relaxed max-w-lg"
            >
              Discord servers are organized into topic-based channels where you
              can collaborate, share, and just talk about your day without
              clogging up a group chat.
            </p>
          </div>
          <div
            class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700/50"
          >
            <div class="grid grid-cols-3 gap-4">
              <div
                class="aspect-square rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-5xl hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                🎮
              </div>
              <div
                class="aspect-square rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center text-5xl hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                🎵
              </div>
              <div
                class="aspect-square rounded-2xl bg-gradient-to-br from-pink-600 to-pink-500 flex items-center justify-center text-5xl hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                🎨
              </div>
              <div
                class="aspect-square rounded-2xl bg-gradient-to-br from-yellow-600 to-yellow-500 flex items-center justify-center text-5xl hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                📚
              </div>
              <div
                class="aspect-square rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-5xl hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                ⚡
              </div>
              <div
                class="aspect-square rounded-2xl bg-gray-700 flex items-center justify-center text-3xl hover:scale-110 transition-transform cursor-pointer shadow-lg text-gray-400"
              >
                +
              </div>
            </div>
          </div>
        </div>
        -->

        <!-- Feature 2: Hanging Out -->
        <div
          class="grid lg:grid-cols-2 gap-16 items-center lg:grid-flow-dense mb-40"
        >
          <div
            class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700/50 lg:col-start-2"
          >
            <div class="space-y-4">
              <div
                class="bg-gray-900/60 rounded-2xl p-6 border border-gray-700"
              >
                <div class="flex items-center gap-3 mb-4">
                  <div
                    class="w-3 h-3 rounded-full bg-green-500 animate-pulse"
                  ></div>
                  <span class="text-white font-bold text-lg"
                    >🔊 Voice Channels</span
                  >
                </div>
                <div class="space-y-3 pl-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-red-500"
                    ></div>
                    <div>
                      <div class="text-white font-semibold text-sm">Sarah</div>
                      <div
                        class="text-xs text-green-400 flex items-center gap-1"
                      >
                        <span class="w-2 h-2 rounded-full bg-green-400"></span>
                        Speaking
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"
                    ></div>
                    <div>
                      <div class="text-white font-semibold text-sm">Mike</div>
                      <div class="text-xs text-gray-400">Listening</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-orange-500"
                    ></div>
                    <div>
                      <div class="text-white font-semibold text-sm">Jordan</div>
                      <div class="text-xs text-gray-400">Muted</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="lg:col-start-1 lg:row-start-1 space-y-8">
            <div>
              <h2
                class="discord-headline text-4xl md:text-5xl lg:text-6xl text-white mb-6"
              >
                Where hanging<br />out is easy
              </h2>
            </div>
            <p
              class="text-lg md:text-xl text-gray-300 leading-relaxed max-w-lg"
            >
              Grab a seat in a voice channel when you're free. Friends in your
              server can see you're around and instantly pop in to talk without
              having to call.
            </p>
          </div>
        </div>

        <!-- Feature 3: Moderation -->
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <div class="space-y-8">
            <div>
              <h2
                class="discord-headline text-4xl md:text-5xl lg:text-6xl text-white mb-6"
              >
                From few to<br />a fandom
              </h2>
            </div>
            <p
              class="text-lg md:text-xl text-gray-300 leading-relaxed max-w-lg"
            >
              Get any community running with moderation tools and custom member
              access. Give members special powers, set up private channels, and
              more.
            </p>
          </div>
          <div
            class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700/50"
          >
            <div class="flex flex-wrap gap-4 justify-center">
              <span
                class="px-6 py-3 rounded-full text-white font-bold text-sm bg-gradient-to-r from-red-600 to-red-500 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-red-500/50"
                >Admin</span
              >
              <span
                class="px-6 py-3 rounded-full text-white font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-blue-500/50"
                >Moderator</span
              >
              <span
                class="px-6 py-3 rounded-full text-white font-bold text-sm bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-yellow-500/50"
                >VIP</span
              >
              <span
                class="px-6 py-3 rounded-full text-white font-bold text-sm bg-gradient-to-r from-green-600 to-green-500 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-green-500/50"
                >Member</span
              >
            </div>
            <p class="text-center text-gray-400 text-sm mt-8">
              Customize roles and permissions for your community
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-40 px-6 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"
        ></div>
        <div
          class="absolute top-1/4 right-0 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"
        ></div>
      </div>

      <div class="relative max-w-4xl mx-auto text-center">
        <div class="space-y-8 animate-fade-in-up">
          <h2
            class="discord-headline text-5xl md:text-6xl lg:text-7xl text-white leading-tight"
          >
            Ready to start<br />your journey?
          </h2>

          <p
            class="text-2xl md:text-3xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Join millions of people using Discord to talk, play games, and build
            communities.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <a
              href="/register"
              class="group px-10 py-4 bg-white text-gray-900 font-bold rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2 text-lg"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              Download for Windows
            </a>
            <a
              href="/login"
              class="px-10 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg"
            >
              Open CoCoCord in your browser
            </a>
          </div>
        </div>

        <!-- Decorative Elements -->
        <div class="flex justify-center gap-12 mt-24 opacity-60">
          <div
            class="w-20 h-20 rounded-full bg-pink-600/20 flex items-center justify-center text-4xl animate-float"
          >
            💬
          </div>
          <div
            class="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center text-4xl animate-float animation-delay-200"
          >
            🎮
          </div>
          <div
            class="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center text-4xl animate-float animation-delay-400"
          >
            🎧
          </div>
        </div>
      </div>
    </section>

    <script>
      if (typeof window.forceInitAppHome === "function") {
        window.forceInitAppHome();
      }
    </script>
  </body>
</html>
