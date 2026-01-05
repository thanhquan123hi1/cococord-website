<%@ page contentType="text/html;charset=UTF-8" language="java" %> <%@ page
import="org.sitemesh.content.Content" %> <% Content sitemeshContent = (Content)
request.getAttribute(Content.class.getName()); %>
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>
      <% if (sitemeshContent != null &&
      sitemeshContent.getExtractedProperties().getChild("title").hasValue()) {
      out.print(sitemeshContent.getExtractedProperties().getChild("title").getValue());
      } else { out.print("CoCoCord - Connect & Chat"); } %>
    </title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              display: ["Outfit", "sans-serif"],
            },
            animation: {
              "fade-in-up": "fadeInUp 0.8s ease-out forwards",
            },
            keyframes: {
              fadeInUp: {
                from: { opacity: "0", transform: "translateY(30px)" },
                to: { opacity: "1", transform: "translateY(0)" },
              },
            },
          },
        },
      };
    </script>
    <style>
      body {
        background: linear-gradient(
          180deg,
          hsl(235 65% 35%) 0%,
          hsl(228 58% 20%) 50%,
          hsl(228 58% 12%) 100%
        );
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
    </style>

    <% if (sitemeshContent != null) {
    sitemeshContent.getExtractedProperties().getChild("head").writeValueTo(out);
    } %>
  </head>
  <body class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300"
      id="navbar"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo -->
        <a
          href="${pageContext.request.contextPath}/"
          class="flex items-center gap-2 group relative z-50"
        >
          <svg
            width="28"
            height="22"
            viewBox="0 0 28 22"
            fill="none"
            class="text-white group-hover:text-blue-400 transition"
          >
            <path
              d="M23.7219 2.07962C21.9478 1.26571 20.0549 0.672392 18.0867 0.341797C17.8381 0.769092 17.5619 1.34839 17.3684 1.80395C15.2726 1.49921 13.195 1.49921 11.1356 1.80395C10.9421 1.34839 10.6577 0.769092 10.4073 0.341797C8.43722 0.672392 6.54244 1.26755 4.76837 2.08331C1.2244 7.31024 0.255336 12.4048 0.739867 17.4272C3.09888 19.1469 5.38583 20.2104 7.6363 20.9278C8.19118 20.1795 8.68601 19.3822 9.11303 18.5429C8.30091 18.2484 7.52296 17.8844 6.78676 17.4599C6.98034 17.3205 7.16949 17.1755 7.35421 17.0268C11.7899 19.0908 16.6241 19.0908 21.0055 17.0268C21.1921 17.1755 21.3812 17.3205 21.5729 17.4599C20.8349 17.8863 20.0551 18.2502 19.243 18.5447C19.67 19.3822 20.163 20.1814 20.7197 20.9297C22.9702 20.2122 25.2589 19.1488 27.6179 17.4272C28.1892 11.6183 26.6548 6.57169 23.7219 2.07962ZM9.34839 14.3283C7.99968 14.3283 6.89605 13.0864 6.89605 11.5883C6.89605 10.0903 7.97527 8.84662 9.34839 8.84662C10.7215 8.84662 11.8252 10.0885 11.8007 11.5883C11.8025 13.0864 10.7215 14.3283 9.34839 14.3283ZM19.0091 14.3283C17.6604 14.3283 16.5568 13.0864 16.5568 11.5883C16.5568 10.0903 17.636 8.84662 19.0091 8.84662C20.3823 8.84662 21.4859 10.0885 21.4614 11.5883C21.4614 13.0864 20.3823 14.3283 19.0091 14.3283Z"
              fill="currentColor"
            />
          </svg>
          <span class="text-xl font-bold text-white">CoCoCord</span>
        </a>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-8 relative z-50">
          <a
            href="${pageContext.request.contextPath}/"
            class="text-white hover:text-blue-400 transition font-medium text-sm"
            >Tải xuống</a
          >
          <a
            href="#features"
            class="text-white hover:text-blue-400 transition font-medium text-sm"
            >Tính năng</a
          >
          <a
            href="#security"
            class="text-white hover:text-blue-400 transition font-medium text-sm"
            >Bảo mật</a
          >
        </div>

        <!-- Right Side Buttons -->
        <div class="flex gap-3 items-center relative z-50">
          <a
            href="${pageContext.request.contextPath}/login"
            class="hidden sm:inline-block px-6 py-2 text-white hover:text-blue-400 transition font-medium text-sm"
          >
            Đăng nhập
          </a>
          <a
            href="${pageContext.request.contextPath}/register"
            class="px-6 py-3 bg-white text-gray-900 rounded-full hover:opacity-90 transition font-semibold text-sm"
          >
            Đăng ký
          </a>
        </div>
      </div>
    </nav>

    <!-- Main Content - Flex grow to push footer down -->
    <main class="flex-grow pt-20">
      <% if (sitemeshContent != null) {
      sitemeshContent.getExtractedProperties().getChild("body").writeValueTo(out);
      } %>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900/50 border-t border-gray-800 pt-20 pb-12 px-6">
      <div class="max-w-7xl mx-auto">
        <!-- Footer Content Grid -->
        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-20"
        >
          <!-- Brand Column -->
          <div class="col-span-2 md:col-span-3 lg:col-span-1">
            <div class="flex items-center gap-2 mb-6">
              <svg
                width="32"
                height="32"
                viewBox="0 0 28 22"
                fill="none"
                class="text-white"
              >
                <path
                  d="M23.7219 2.07962C21.9478 1.26571 20.0549 0.672392 18.0867 0.341797C17.8381 0.769092 17.5619 1.34839 17.3684 1.80395C15.2726 1.49921 13.195 1.49921 11.1356 1.80395C10.9421 1.34839 10.6577 0.769092 10.4073 0.341797C8.43722 0.672392 6.54244 1.26755 4.76837 2.08331C1.2244 7.31024 0.255336 12.4048 0.739867 17.4272C3.09888 19.1469 5.38583 20.2104 7.6363 20.9278C8.19118 20.1795 8.68601 19.3822 9.11303 18.5429C8.30091 18.2484 7.52296 17.8844 6.78676 17.4599C6.98034 17.3205 7.16949 17.1755 7.35421 17.0268C11.7899 19.0908 16.6241 19.0908 21.0055 17.0268C21.1921 17.1755 21.3812 17.3205 21.5729 17.4599C20.8349 17.8863 20.0551 18.2502 19.243 18.5447C19.67 19.3822 20.163 20.1814 20.7197 20.9297C22.9702 20.2122 25.2589 19.1488 27.6179 17.4272C28.1892 11.6183 26.6548 6.57169 23.7219 2.07962ZM9.34839 14.3283C7.99968 14.3283 6.89605 13.0864 6.89605 11.5883C6.89605 10.0903 7.97527 8.84662 9.34839 8.84662C10.7215 8.84662 11.8252 10.0885 11.8007 11.5883C11.8025 13.0864 10.7215 14.3283 9.34839 14.3283ZM19.0091 14.3283C17.6604 14.3283 16.5568 13.0864 16.5568 11.5883C16.5568 10.0903 17.636 8.84662 19.0091 8.84662C20.3823 8.84662 21.4859 10.0885 21.4614 11.5883C21.4614 13.0864 20.3823 14.3283 19.0091 14.3283Z"
                  fill="currentColor"
                />
              </svg>
              <span class="text-xl font-bold text-white">CoCoCord</span>
            </div>
            <p class="text-gray-400 text-sm leading-relaxed">
              Your place to talk. Join a community that shares your interests.
            </p>
          </div>

          <!-- Product Links -->
          <div>
            <h3 class="text-blue-400 font-bold mb-4 uppercase text-sm">
              Product
            </h3>
            <ul class="space-y-3">
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Download</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Nitro</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Status</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Blog</a
                >
              </li>
            </ul>
          </div>

          <!-- Company Links -->
          <div>
            <h3 class="text-blue-400 font-bold mb-4 uppercase text-sm">
              Company
            </h3>
            <ul class="space-y-3">
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >About</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Jobs</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Brand</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Newsroom</a
                >
              </li>
            </ul>
          </div>

          <!-- Resources Links -->
          <div>
            <h3 class="text-blue-400 font-bold mb-4 uppercase text-sm">
              Resources
            </h3>
            <ul class="space-y-3">
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >College</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Support</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Safety</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Feedback</a
                >
              </li>
            </ul>
          </div>

          <!-- Policies Links -->
          <div>
            <h3 class="text-blue-400 font-bold mb-4 uppercase text-sm">
              Policies
            </h3>
            <ul class="space-y-3">
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Terms</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Privacy</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Cookie Settings</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition text-sm"
                  >Guidelines</a
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>

    <% if (sitemeshContent != null) {
    sitemeshContent.getExtractedProperties().getChild("page.script").writeValueTo(out);
    } %>
  </body>
</html>
