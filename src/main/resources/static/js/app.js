/**
 * Main App JavaScript
 * Hỗ trợ cho các trang authenticated (Dashboard, Chat, Friends, etc.)
 */

// ==================== HELPER FUNCTIONS ====================

/**
 * Fetch channels của server và navigate đến channel phù hợp
 * Sử dụng function từ ServerSidebar nếu có, nếu không thì fallback
 */
async function navigateToServerWithChannel(serverId) {
  // Sử dụng function từ ServerSidebar nếu đã load
  if (
    window.ServerSidebar &&
    window.ServerSidebar.navigateToServerWithChannel
  ) {
    return window.ServerSidebar.navigateToServerWithChannel(serverId);
  }

  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`/api/servers/${serverId}/channels`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      window.location.href = `/chat?serverId=${serverId}`;
      return;
    }

    const channels = await response.json();

    if (!channels || channels.length === 0) {
      window.location.href = `/chat?serverId=${serverId}`;
      return;
    }

    let targetChannel = channels.find(
      (ch) => ch.name && ch.name.toLowerCase() === "general"
    );

    if (!targetChannel) {
      targetChannel = channels.find(
        (ch) => ch.type && ch.type.toUpperCase() === "TEXT"
      );
    }

    if (!targetChannel) {
      targetChannel = channels[0];
    }
    window.location.href = `/chat?serverId=${serverId}&channelId=${targetChannel.id}`;
  } catch (err) {
    window.location.href = `/chat?serverId=${serverId}`;
  }
}

// ==================== AUTHENTICATION ====================

// Check authentication on app pages
(function checkAuth() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    // No token found, redirect to login and preserve where we were going.
    const next = encodeURIComponent(
      window.location.pathname + window.location.search + window.location.hash
    );
    window.location.href = `/login?next=${next}`;
    return;
  }

  // Verify token is still valid (backend provides /api/auth/me)
  fetch("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        // Token is invalid, try to refresh
        refreshAccessToken();
      }
    })
    .catch((error) => {
      localStorage.clear();
      document.cookie =
        "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    });
})();

function maybeOpenJoinServerFromInviteLink() {
  try {
    const url = new URL(window.location.href);
    let code =
      url.searchParams.get("invite") ||
      url.searchParams.get("inviteCode") ||
      null;
    if (!code) return;

    // Basic open-redirect hardening: only accept simple codes.
    code = String(code).trim();
    if (!code || code.includes("/") || code.includes("\\")) return;

    const input = document.getElementById("globalInviteCodeInput");
    if (input) input.value = code;

    // Ensure modal is visible.
    openGlobalModal("globalJoinServerModal");

    // Clean URL so refresh doesn't re-open repeatedly.
    url.searchParams.delete("invite");
    url.searchParams.delete("inviteCode");
    const qs = url.searchParams.toString();
    const cleaned = url.pathname + (qs ? `?${qs}` : "") + url.hash;
    window.history.replaceState({}, "", cleaned);
  } catch (_) {
    // ignore
  }
}

// ==================== CHANNEL LIST RESIZE (Chat only) ====================
function initChannelSidebarResize() {
  const resizer = document.getElementById("channelResizer");
  const sidebar = document.querySelector(".channel-sidebar");
  if (!resizer || !sidebar) return;

  const MIN_WIDTH = 180;
  const MAX_WIDTH = 360;
  const STORAGE_KEY = "cococord.channelPanelWidth";

  function clampWidth(w) {
    const n = Number(w);
    if (!Number.isFinite(n)) return null;
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n));
  }

  function getCurrentWidth() {
    const css = getComputedStyle(document.documentElement).getPropertyValue(
      "--channel-panel-width"
    );
    const fromCss = parseFloat(css);
    if (Number.isFinite(fromCss) && fromCss > 0) return fromCss;
    const rect = sidebar.getBoundingClientRect();
    return rect.width;
  }

  function applyWidth(px) {
    const w = clampWidth(px);
    if (w == null) return;
    document.documentElement.style.setProperty(
      "--channel-panel-width",
      `${w}px`
    );
    // Also set active-sidebar-width so user-panel follows this width
    document.documentElement.style.setProperty(
      "--active-sidebar-width",
      `${w}px`
    );
  }

  // Restore saved width.
  try {
    const saved = clampWidth(localStorage.getItem(STORAGE_KEY));
    if (saved != null) {
      applyWidth(saved);
    } else {
      // Set default active-sidebar-width for chat page
      document.documentElement.style.setProperty(
        "--active-sidebar-width",
        "232px"
      );
    }
  } catch (_) {
    document.documentElement.style.setProperty(
      "--active-sidebar-width",
      "232px"
    );
  }

  let dragging = false;
  let startX = 0;
  let startW = 0;

  function onMove(e) {
    if (!dragging) return;
    const x = e.clientX;
    const next = startW + (x - startX);
    applyWidth(next);
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);

    try {
      const w = clampWidth(getCurrentWidth());
      if (w != null) localStorage.setItem(STORAGE_KEY, String(w));
    } catch (_) {
      /* ignore */
    }
  }

  resizer.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startW = getCurrentWidth();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    e.preventDefault();
  });
}

// Logout function
function logout() {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    // Call logout API
    fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })
      .then(() => {
        localStorage.clear();
        document.cookie =
          "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
      })
      .catch((error) => {
        localStorage.clear();
        document.cookie =
          "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
      });
  } else {
    localStorage.clear();
    document.cookie =
      "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  }
}

// Refresh access token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    localStorage.clear();
    document.cookie =
      "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
    return null;
  }

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      // Cập nhật cookie cho server-side rendering
      const expires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toUTCString();
      document.cookie = `accessToken=${encodeURIComponent(
        data.accessToken
      )}; expires=${expires}; path=/; SameSite=Lax`;
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      return data.accessToken;
    } else {
      localStorage.clear();
      document.cookie =
        "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
      return null;
    }
  } catch (error) {
    localStorage.clear();
    document.cookie =
      "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
    return null;
  }
}

// API request helper with auto token refresh
async function apiRequest(url, options = {}) {
  let accessToken = localStorage.getItem("accessToken");

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  let response = await fetch(url, options);

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      options.headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, options);
    }
  }

  return response;
}

// REMOVED: loadUserInfo() - now handled by UserPanel component (user-panel.js)

// ==================== GLOBAL USER CONTROL PANEL ====================
let globalCurrentUser = null;
let globalUcpInitialized = false;

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function discriminatorFromId(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return "0000";
  return String(n % 10000).padStart(4, "0");
}

// Load current user and render UCP
async function loadGlobalUserPanel() {
  if (globalUcpInitialized) return; // Already initialized
  const response = await apiRequest("/api/auth/me");
  if (!response.ok) throw new Error("Failed to load user");
  globalCurrentUser = await response.json();
  localStorage.setItem("user", JSON.stringify(globalCurrentUser));
  renderGlobalUserPanel();
  bindGlobalUserPanelEvents();
  globalUcpInitialized = true;
  
}

// Render user info into UCP elements
function renderGlobalUserPanel() {
  if (!globalCurrentUser) return;

  const ucpAvatar = document.getElementById("ucpAvatar");
  const ucpName = document.getElementById("ucpName");
  const ucpStatus = document.getElementById("ucpStatus");
  const ucpStatusIndicator = document.getElementById("ucpStatusIndicator");

  const displayName =
    globalCurrentUser.displayName || globalCurrentUser.username || "User";
  const discriminator = discriminatorFromId(globalCurrentUser.id);
  const fullUsername = `${
    globalCurrentUser.username || "user"
  }#${discriminator}`;
  const status = globalCurrentUser.status || "ONLINE";

  if (ucpName) {
    ucpName.textContent = displayName;
    ucpName.title = fullUsername;
  }

  if (ucpStatus) {
    ucpStatus.textContent =
      globalCurrentUser.customStatus || getStatusText(status);
  }

  if (ucpStatusIndicator) {
    ucpStatusIndicator.className = `status-indicator ${status
      .toLowerCase()
      .replace("_", "-")}`;
  }

  if (ucpAvatar) {
    const statusClass = status.toLowerCase().replace("_", "-");
    if (globalCurrentUser.avatarUrl) {
      ucpAvatar.innerHTML = `<img src="${escapeHtml(
        globalCurrentUser.avatarUrl
      )}" alt="${escapeHtml(
        displayName
      )}"><span class="status-indicator ${statusClass}" id="ucpStatusIndicator"></span>`;
    } else {
      ucpAvatar.innerHTML = `${escapeHtml(
        displayName.trim().charAt(0).toUpperCase()
      )}<span class="status-indicator ${statusClass}" id="ucpStatusIndicator"></span>`;
    }
  }
}

function getStatusText(status) {
  const statusMap = {
    ONLINE: "Trực tuyến",
    IDLE: "Vắng mặt",
    DO_NOT_DISTURB: "Không làm phiền",
    INVISIBLE: "Ẩn",
    OFFLINE: "Ngoại tuyến",
  };
  return statusMap[status] || "Trực tuyến";
}

// Bind events for UCP
// Note: User Panel is now fully managed by user-panel.js
// This function only handles mic/deafen buttons for backward compatibility
function bindGlobalUserPanelEvents() {
  // Mic button (will be controlled by chat.js for voice, but we can toggle visual state)
  const micBtn = document.getElementById("micBtn");
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      // If chat.js has voice control, let it handle
      if (window.CoCoCordChat && window.CoCoCordChat.toggleMute) {
        window.CoCoCordChat.toggleMute();
      } else {
        // Visual toggle only
        micBtn.classList.toggle("muted");
        const isMuted = micBtn.classList.contains("muted");
        micBtn.innerHTML = isMuted
          ? '<i class="bi bi-mic-mute-fill"></i>'
          : '<i class="bi bi-mic"></i>';
        micBtn.title = isMuted ? "Bật tiếng" : "Tắt tiếng";
      }
    });
  }

  // Deafen button
  const deafenBtn = document.getElementById("deafenBtn");
  if (deafenBtn) {
    deafenBtn.addEventListener("click", () => {
      // If chat.js has voice control, let it handle
      if (window.CoCoCordChat && window.CoCoCordChat.toggleDeafen) {
        window.CoCoCordChat.toggleDeafen();
      } else {
        // Visual toggle only
        deafenBtn.classList.toggle("deafened");
        const isDeafened = deafenBtn.classList.contains("deafened");
        deafenBtn.innerHTML = isDeafened
          ? '<i class="bi bi-volume-mute-fill"></i>'
          : '<i class="bi bi-headphones"></i>';
        deafenBtn.title = isDeafened ? "Bật nghe" : "Tắt nghe";
      }
    });
  }
}

// Update UCP from external source (e.g., after profile edit)
function updateGlobalUserPanel(userData) {
  if (userData) {
    globalCurrentUser = { ...globalCurrentUser, ...userData };
    localStorage.setItem("user", JSON.stringify(globalCurrentUser));
  }
  renderGlobalUserPanel();
}

// ==================== GLOBAL SERVER SIDEBAR LOGIC ====================

async function loadGlobalServers() {
  const serverList = document.getElementById("globalServerList");
  if (!serverList) return;
  const response = await apiRequest("/api/servers");
  if (!response.ok) throw new Error("Failed to load servers");
  const servers = await response.json();
  const existingServerItems = serverList.querySelectorAll(
    ".server-item[data-server-id]"
  );
  existingServerItems.forEach((item) => item.remove());
  const actionDivider = serverList.querySelector(
    ".server-divider[data-action-divider]"
  );

  servers.forEach((server) => {
    const serverItem = document.createElement("a");
    serverItem.className = "server-item";
    serverItem.setAttribute("data-server-id", server.id);
    serverItem.setAttribute("title", server.name);
    serverItem.setAttribute("href", `/chat?serverId=${server.id}`);

    if (server.iconUrl) {
      serverItem.innerHTML = `<img src="${server.iconUrl}" alt="${server.name}">`;
    } else {
      const initial = server.name.charAt(0).toUpperCase();
      serverItem.innerHTML = `<span class="server-initial">${initial}</span>`;
    }

    serverItem.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      const isOnChatPage = window.location.pathname.endsWith("/chat");

      if (
        isOnChatPage &&
        typeof window.CoCoCordChat !== "undefined" &&
        window.CoCoCordChat.selectServer
      ) {
        e.preventDefault();
        window.CoCoCordChat.selectServer(server.id);
        return;
      }
      if (typeof spaNavigate === "function") {
        e.preventDefault();
        spaNavigate(serverItem.href);
      }
    });

    if (actionDivider) {
      serverList.insertBefore(serverItem, actionDivider);
    } else {
      serverList.appendChild(serverItem);
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const currentServerId = urlParams.get("serverId");
  if (currentServerId) {
    const activeItem = serverList.querySelector(
      `[data-server-id="${currentServerId}"]`
    );
    if (activeItem) activeItem.classList.add("active");
  }

  if (window.location.pathname.includes("/app")) {
    const homeBtn = document.querySelector(".server-sidebar .home-btn");
    if (homeBtn) homeBtn.classList.add("active");
  }
}


// Global modal handling
function openGlobalModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "flex";
}

function closeGlobalModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
}

// Create Server functionality
async function handleCreateServer(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById("globalServerNameInput");
  const serverName = nameInput ? nameInput.value.trim() : "";

  if (!serverName) {
    alert("Vui lòng nhập tên server");
    return;
  }

  try {
    const response = await apiRequest("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: serverName }),
    });

    if (!response.ok) throw new Error("Failed to create server");

    const newServer = await response.json();
    closeGlobalModal("globalCreateServerModal");
    if (nameInput) nameInput.value = "";

    // Refresh server list and navigate to new server
    await loadGlobalServers();
    await navigateToServerWithChannel(newServer.id);
  } catch (error) {
    alert("Lỗi khi tạo server: " + error.message);
  }
}

// Join Server functionality
async function handleJoinServer(e) {
  if (e) e.preventDefault();
  const codeInput = document.getElementById("globalInviteCodeInput");
  const inviteCode = codeInput ? codeInput.value.trim() : "";

  if (!inviteCode) {
    alert("Vui lòng nhập mã mời");
    return;
  }

  // Extract code if full URL is pasted
  let code = inviteCode;
  if (inviteCode.includes("/")) {
    code = inviteCode.split("/").pop();
  }

  try {
    const response = await apiRequest(`/api/servers/join/${code}`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Mã mời không hợp lệ");
    }

    const server = await response.json();
    closeGlobalModal("globalJoinServerModal");
    if (codeInput) codeInput.value = "";

    // Refresh and navigate
    await loadGlobalServers();
    await navigateToServerWithChannel(server.id);
  } catch (error) {
    alert("Lỗi: " + error.message);
  }
}

// ==================== LIGHTWEIGHT APP NAVIGATION (KEEP UCP PERSISTENT) ====================

function getAppContextPath() {
  // Derive contextPath from the Home button URL if possible.
  const homeBtn = document.getElementById("homeBtn");
  if (!homeBtn || !homeBtn.href) return "";
  try {
    const u = new URL(homeBtn.href, window.location.origin);
    const p = u.pathname;
    return p.endsWith("/app") ? p.slice(0, -4) : "";
  } catch {
    return "";
  }
}

function updateGlobalSidebarActiveState(serverId = null) {
  // Clear ALL active states from both containers
  const allServerItems = document.querySelectorAll('#globalServerList .server-icon, #serverList .server-icon');
  allServerItems.forEach(item => item.classList.remove('active'));
  
  // Also clear home button
  const homeButtons = document.querySelectorAll('.home-btn, [data-home-btn]');
  homeButtons.forEach(btn => btn.classList.remove('active'));
  
  if (serverId) {
      // Activate specific server
      const serverItem = document.querySelector(`[data-server-id="${serverId}"]`);
      if (serverItem) {
          serverItem.classList.add('active');
      }
  } else {
      // Activate home button for /app path
      const homeBtn = document.querySelector('.home-btn, [data-home-btn]');
      if (homeBtn) {
          homeBtn.classList.add('active');
      }
  }
}

function extractServerIdFromPath(path) {
  const regex = /\/chat\?serverId=(\d+)/;
  const match = path.match(regex);
  return match ? match[1] : null;
}

function updateGlobalSidebarActiveState() {
  const serverList = document.getElementById("globalServerList") || document.getElementById("serverList");
  let homeBtn = document.getElementById("homeBtn");
  
  if (!homeBtn && serverList) {
      homeBtn = serverList.querySelector(".home-btn");
  }

  // Clear old active states
  if (serverList) {
    serverList.querySelectorAll(".active").forEach(el => {
        el.classList.remove("active");
        el.removeAttribute("aria-current");
    });
  }
  if (homeBtn) homeBtn.classList.remove("active");

  // Determine current state
  const urlParams = new URLSearchParams(window.location.search);
  const serverId = urlParams.get("serverId");
  const path = window.location.pathname;
  
  const isHome = (path === "/app" || path.startsWith("/app/")) && !serverId;
  const isChat = (path.includes("/chat") || !!serverId);

  // Set new active state
  if (isHome) {
    if (homeBtn) homeBtn.classList.add("active");
    return;
  }

  if (isChat && serverId && serverList) {
    const activeItem = serverList.querySelector(`[data-server-id="${serverId}"]`);
    if (activeItem) activeItem.classList.add("active");
  }
}

async function runScriptsInElement(container) {
  if (!container) return;

  const existingScriptSrc = new Set(
    Array.from(document.querySelectorAll("script[src]")).map((s) => {
      try { return new URL(s.getAttribute("src"), window.location.origin).toString(); } 
      catch { return s.getAttribute("src"); }
    })
  );

  const scripts = Array.from(container.querySelectorAll("script"));

  for (const script of scripts) {
    const src = script.getAttribute("src");
    if (src) {
      let absSrc = src;
      try { absSrc = new URL(src, window.location.origin).toString(); } catch {}

      if (!existingScriptSrc.has(absSrc)) {
        await new Promise((resolve) => {
          const el = document.createElement("script");
          el.src = src;
          el.async = false;
          el.onload = () => {
              resolve();
          };
          el.onerror = (e) => {
              resolve();
          };
          document.body.appendChild(el);
        });
        existingScriptSrc.add(absSrc);
      } 
    } else if (script.textContent && script.textContent.trim()) {
      const el = document.createElement("script");
      el.textContent = script.textContent;
      document.body.appendChild(el);
    }
    script.remove();
  }
}

async function syncHeadStylesFromDoc(doc) {
  const head = doc?.head;
  if (!head) return;

  const normalizeHref = (href) => {
    if (!href) return "";
    try {
      return new URL(href, window.location.origin).toString();
    } catch {
      return href;
    }
  };

  // Styles required by the target page (as returned by the server)
  const targetStyles = new Set(
    Array.from(head.querySelectorAll('link[rel="stylesheet"][href]'))
      .map((l) => normalizeHref(l.getAttribute("href")))
      .filter(Boolean)
  );

  // Styles currently present in the document
  const existingStyles = new Set(
    Array.from(document.head.querySelectorAll('link[rel="stylesheet"][href]'))
      .map((l) => normalizeHref(l.getAttribute("href")))
      .filter(Boolean)
  );

  // Add missing styles from target page. Mark injected ones so we can clean them up later.
  head.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const absHref = normalizeHref(href);
    if (!absHref || existingStyles.has(absHref)) return;

    const el = document.createElement("link");
    // Copy attributes (e.g., integrity/crossorigin/media, or custom markers)
    for (const { name, value } of Array.from(link.attributes)) {
      try {
        el.setAttribute(name, value);
      } catch {
        /* ignore */
      }
    }
    el.rel = "stylesheet";
    el.href = href;
    el.setAttribute("data-cococord-spa", "1");
    document.head.appendChild(el);
    existingStyles.add(absHref);
  });

  // Remove page-specific styles from previous views that are no longer needed.
  // We only remove styles that are explicitly marked as page-scoped or SPA-injected.
  const removable = document.head.querySelectorAll(
    'link[rel="stylesheet"][href][data-cococord-spa], link[rel="stylesheet"][href][data-cococord-page-style]'
  );
  removable.forEach((link) => {
    const absHref = normalizeHref(link.getAttribute("href"));
    if (!absHref) return;
    if (!targetStyles.has(absHref)) {
      link.remove();
    }
  });
}

let _spaNavController = null;
let _spaNavToken = 0;

async function spaNavigate(url, opts = {}) {
  const { pushState = true } = opts;

  const pageArea = document.querySelector(".page-content-area");
  if (!pageArea) {
    window.location.href = url;
    return;
  }

  const targetUrl = new URL(url, window.location.origin);
  const currentHash = window.location.hash === "#" ? "" : window.location.hash;
  const targetHash = targetUrl.hash === "#" ? "" : targetUrl.hash;
  const isSame =
    targetUrl.pathname === window.location.pathname &&
    targetUrl.search === window.location.search &&
    targetHash === currentHash;

  if (isSame) return;

  try {
    if (_spaNavController) try { _spaNavController.abort(); } catch {}
    _spaNavController = new AbortController();
    const myToken = ++_spaNavToken;

    const res = await fetch(targetUrl.toString(), {
      headers: { "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin",
      signal: _spaNavController.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    if (myToken !== _spaNavToken) return;
    
    const doc = new DOMParser().parseFromString(html, "text/html");
    const newArea = doc.querySelector(".page-content-area");

    const nextHtml = newArea ? newArea.innerHTML : (doc.body ? doc.body.innerHTML : html);
    pageArea.innerHTML = nextHtml;

    if (myToken !== _spaNavToken) return;
    // await syncHeadStylesFromDoc(doc); // Có thể comment dòng này nếu nghi ngờ lỗi CSS
    await runScriptsInElement(pageArea);

    if (doc.title) document.title = doc.title;
    if (pushState) {
      history.pushState({}, "", targetUrl.pathname + targetUrl.search + targetUrl.hash);
    }

    updateGlobalSidebarActiveState(extractServerIdFromPath(path));
    
    document.dispatchEvent(
      new CustomEvent("cococord:page:loaded", {
        detail: { url: targetUrl.toString() },
      })
    );
  } catch (e) {
    if (e?.name === "AbortError") return;
    window.location.href = url;
  }
}

function initAppLinkInterception() {
  if (window.__cococordSpaLinksInit) return;
  window.__cococordSpaLinksInit = true;

  document.addEventListener(
    "click",
    (e) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;

      const a = e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      if (a.closest && a.closest("#globalServerList")) return; // handled by server SPA logic

      // Home button has its own handler in initGlobalSidebar; avoid double navigation.
      if (
        a.id === "homeBtn" ||
        (a.classList && a.classList.contains("home-btn"))
      )
        return;

      const rawHref = a.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#")) return;

      let u;
      try {
        u = new URL(a.href, window.location.origin);
      } catch {
        return;
      }
      if (u.origin !== window.location.origin) return;

      const ctx = getAppContextPath();
      const appPrefixes = [
        (ctx || "") + "/app",
        (ctx || "") + "/chat",
        (ctx || "") + "/messages",
        (ctx || "") + "/profile",
        (ctx || "") + "/sessions",
        (ctx || "") + "/change-password",
      ];

      const isAppRoute = appPrefixes.some(
        (p) => u.pathname === p || u.pathname.startsWith(p + "/")
      );
      if (!isAppRoute) return;

      // Do not hijack settings route: it's handled by a modal/button in UCP.
      if (u.pathname === (ctx || "") + "/settings") return;

      // Special case: if already on /chat and clicking a server link, keep existing SPA behaviour
      const isChatTarget = u.pathname.endsWith("/chat");
      const serverId = u.searchParams.get("serverId");
      if (
        isChatTarget &&
        serverId &&
        window.location.pathname.endsWith("/chat") &&
        window.CoCoCordChat &&
        typeof window.CoCoCordChat.selectServer === "function"
      ) {
        e.preventDefault();
        history.pushState(
          { serverId: Number(serverId) },
          "",
          u.pathname + u.search + u.hash
        );
        updateGlobalSidebarActiveState();
        window.CoCoCordChat.selectServer(Number(serverId));
        return;
      }

      e.preventDefault();
      spaNavigate(u.toString());
    },
    true
  );
}

// Initialize global sidebar events
function initGlobalSidebar() {
  // Home (Discord logo) button: navigate without full page reload to keep UCP persistent
  const homeBtn = document.getElementById("homeBtn");
  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      // Allow opening in a new tab/window
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      e.preventDefault();

      const ctx = getAppContextPath();
      spaNavigate((ctx || "") + "/app");
    });
  }

  // Add Server button
  const addServerBtn = document.getElementById("globalAddServerBtn");
  if (addServerBtn) {
    addServerBtn.addEventListener("click", () =>
      openGlobalModal("globalCreateServerModal")
    );
  }

  // Discover button
  const discoverBtn = document.getElementById("globalDiscoverBtn");
  if (discoverBtn) {
    discoverBtn.addEventListener("click", () =>
      openGlobalModal("globalJoinServerModal")
    );
  }

  // Create Server Modal - Close buttons
  const closeCreateBtn = document.getElementById(
    "closeGlobalCreateServerModal"
  );
  if (closeCreateBtn) {
    closeCreateBtn.addEventListener("click", () =>
      closeGlobalModal("globalCreateServerModal")
    );
  }

  const cancelCreateBtn = document.getElementById("cancelGlobalCreateServer");
  if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener("click", () =>
      closeGlobalModal("globalCreateServerModal")
    );
  }

  // Create Server Modal - Confirm button
  const confirmCreateBtn = document.getElementById("confirmGlobalCreateServer");
  if (confirmCreateBtn) {
    confirmCreateBtn.addEventListener("click", handleCreateServer);
  }

  // Join Server Modal - Close buttons
  const closeJoinBtn = document.getElementById("closeGlobalJoinServerModal");
  if (closeJoinBtn) {
    closeJoinBtn.addEventListener("click", () =>
      closeGlobalModal("globalJoinServerModal")
    );
  }

  const cancelJoinBtn = document.getElementById("cancelGlobalJoinServer");
  if (cancelJoinBtn) {
    cancelJoinBtn.addEventListener("click", () =>
      closeGlobalModal("globalJoinServerModal")
    );
  }

  // Join Server Modal - Confirm button
  const confirmJoinBtn = document.getElementById("confirmGlobalJoinServer");
  if (confirmJoinBtn) {
    confirmJoinBtn.addEventListener("click", handleJoinServer);
  }

  // Close modals on backdrop click
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  // Close modals on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay").forEach((modal) => {
        modal.style.display = "none";
      });
    }
  });

  // Attach SPA click events to existing server items (rendered by JSP)
  attachSPAEventsToServerList();

  // Then also load servers via API (will update/overwrite if needed)
  loadGlobalServers();

  updateGlobalSidebarActiveState();

  initAppLinkInterception();
}

// Handle browser back/forward without full reload (best-effort)
window.addEventListener("popstate", () => {
  const ctx = getAppContextPath();
  const path = window.location.pathname;
  const appRoutes = [
    (ctx || "") + "/app",
    (ctx || "") + "/chat",
    (ctx || "") + "/friends",
    (ctx || "") + "/messages",
    (ctx || "") + "/profile",
    (ctx || "") + "/sessions",
    (ctx || "") + "/change-password",
  ];
  const isAppRoute = appRoutes.some(
    (r) => path === r || path.startsWith(r + "/")
  );
  if (isAppRoute) spaNavigate(window.location.href, { pushState: false });
});

// Attach SPA navigation events to server items in global sidebar
function attachSPAEventsToServerList() {
  const serverList = document.getElementById("globalServerList");
  if (!serverList) return;

  serverList
    .querySelectorAll(".server-item[data-server-id]")
    .forEach((item) => {
      const serverId = item.getAttribute("data-server-id");
      if (!serverId) return;

      item.addEventListener("click", (e) => {
        // Allow opening in a new tab/window
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;

        const isOnChatPage = window.location.pathname.endsWith("/chat");
        if (
          isOnChatPage &&
          typeof window.CoCoCordChat !== "undefined" &&
          window.CoCoCordChat.selectServer
        ) {
          e.preventDefault();
          window.CoCoCordChat.selectServer(Number(serverId));
          return;
        }

        if (typeof spaNavigate === "function") {
          e.preventDefault();
          spaNavigate(item.href);
        }
      });
    });
}

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  // REMOVED: loadUserInfo() - now handled by UserPanel component
  initGlobalSidebar();
  loadGlobalUserPanel(); // Load and init UCP

  // If we arrived from an invite link (/invite/{code} -> /app?invite=code), open Join modal.
  maybeOpenJoinServerFromInviteLink();

  // Chat-only: channel list resize.
  initChannelSidebarResize();

  // Auto-refresh token before it expires (every 45 minutes)
  setInterval(() => {
    refreshAccessToken();
  }, 45 * 60 * 1000);
});

// Export functions
window.CoCoCordApp = {
  logout,
  apiRequest,
  refreshAccessToken,
  loadGlobalServers,
  openGlobalModal,
  closeGlobalModal,
  updateGlobalUserPanel,
  renderGlobalUserPanel,
};

// ==================== GLOBAL REALTIME CLIENT ====================
// Single SockJS/STOMP connection reused across presence, inbox, friends, etc.
(function initRealtimeClient() {
  if (window.CoCoCordRealtime) return;

  let stomp = null;
  let connectPromise = null;

  async function ensureConnected() {
    if (connectPromise) return connectPromise;

    const token = localStorage.getItem("accessToken");
    if (!token || !window.SockJS || !window.Stomp) {
      connectPromise = Promise.resolve(null);
      return connectPromise;
    }

    connectPromise = new Promise((resolve) => {
      try {
        const socket = new window.SockJS("/ws");
        stomp = window.Stomp.over(socket);
        stomp.debug = null;
        stomp.connect(
          { Authorization: "Bearer " + token },
          () => resolve(stomp),
          () => resolve(null)
        );
      } catch (_) {
        resolve(null);
      }
    });

    return connectPromise;
  }

  async function subscribe(destination, onMessage) {
    const client = await ensureConnected();
    if (!client) return () => {};
    try {
      const sub = client.subscribe(destination, onMessage);
      return () => {
        try {
          sub.unsubscribe();
        } catch (_) {
          /* ignore */
        }
      };
    } catch (_) {
      return () => {};
    }
  }

  async function send(destination, headers, body) {
    const client = await ensureConnected();
    if (!client) return false;
    try {
      client.send(destination, headers || {}, body || "");
      return true;
    } catch (_) {
      return false;
    }
  }

  window.CoCoCordRealtime = {
    ensureConnected,
    subscribe,
    send,
    getClient: () => stomp,
  };
})();

// ==================== GLOBAL PRESENCE STORE ====================
// One source of truth for ONLINE/OFFLINE across /app friends + DM sidebar.
(function initPresenceStore() {
  const statusByUserId = new Map(); // userId(string) -> status(string)
  const listeners = new Set();

  function normalizeStatus(raw) {
    const s = String(raw || "").toUpperCase();
    return s || null;
  }

  function isOnlineStatus(status) {
    const s = normalizeStatus(status);
    if (!s) return false;
    return s !== "OFFLINE" && s !== "INVISIBLE";
  }

  function emit(userId, status) {
    const payload = { userId: String(userId), status: normalizeStatus(status) };
    for (const fn of listeners) {
      try {
        fn(payload);
      } catch (_) {
        /* ignore */
      }
    }
  }

  function applyStatus(userId, status) {
    if (userId == null) return;
    const key = String(userId);
    const normalized = normalizeStatus(status);
    if (!normalized) return;
    const prev = statusByUserId.get(key);
    if (prev === normalized) return;
    statusByUserId.set(key, normalized);
    emit(key, normalized);
  }

  function parsePresenceMessage(body) {
    // Supports:
    // - WebSocketEvent: { type: 'user.status.changed', payload: { userId, newStatus, ... } }
    // - Legacy: { userId, status } or { username, status }
    let data;
    try {
      data = JSON.parse(body);
    } catch (_) {
      return null;
    }
    if (!data) return null;

    if (data.type && data.payload) {
      const t = String(data.type);
      if (t !== "user.status.changed") return null;
      const p = data.payload || {};
      return { userId: p.userId, status: p.newStatus || p.status || null };
    }
    if (data.userId && (data.newStatus || data.status)) {
      return { userId: data.userId, status: data.newStatus || data.status };
    }
    return null;
  }

  let connectedOnce = false;

  async function ensureConnected() {
    if (connectedOnce) return true;
    const rt = window.CoCoCordRealtime;
    if (!rt || typeof rt.ensureConnected !== "function") return false;

    const client = await rt.ensureConnected();
    if (!client) return false;

    // Subscribe once.
    connectedOnce = true;
    rt.subscribe("/topic/presence", (msg) => {
      const evt = parsePresenceMessage(msg.body);
      if (evt?.userId) applyStatus(evt.userId, evt.status);
    });
    rt.subscribe("/user/queue/presence", (msg) => {
      const evt = parsePresenceMessage(msg.body);
      if (evt?.userId) applyStatus(evt.userId, evt.status);
    });

    return true;
  }

  async function hydrateSnapshot(userIds) {
    const ids = Array.from(
      new Set(
        (userIds || []).map((x) => Number(x)).filter((n) => Number.isFinite(n))
      )
    );
    if (!ids.length) return;

    try {
      const params = new URLSearchParams();
      ids.forEach((id) => params.append("ids", String(id)));
      const qs = params.toString();
      const resp =
        window.CoCoCordApp && window.CoCoCordApp.apiRequest
          ? await window.CoCoCordApp.apiRequest(`/api/presence/users?${qs}`, {
              method: "GET",
            })
          : await fetch(`/api/presence/users?${qs}`, {
              method: "GET",
              headers: {
                Authorization:
                  "Bearer " + (localStorage.getItem("accessToken") || ""),
              },
            });

      if (!resp || !resp.ok) return;
      const map = await resp.json();
      if (!map) return;
      Object.keys(map).forEach((k) => applyStatus(k, map[k]));
      // Ensure every requested id has a value (avoid null status).
      ids.forEach((id) => {
        const key = String(id);
        if (!statusByUserId.has(key)) applyStatus(key, "OFFLINE");
      });
    } catch (_) {
      /* ignore */
    }
  }

  function getStatus(userId) {
    if (userId == null) return null;
    return statusByUserId.get(String(userId)) || null;
  }

  function isOnline(userId) {
    const s = getStatus(userId);
    return s ? isOnlineStatus(s) : null;
  }

  function subscribe(fn) {
    if (typeof fn !== "function") return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  window.CoCoCordPresence = {
    ensureConnected,
    hydrateSnapshot,
    subscribe,
    getStatus,
    isOnline,
  };
})();
