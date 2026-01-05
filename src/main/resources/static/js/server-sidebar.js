/**
 * Server Sidebar JavaScript
 * Manages server list, tooltips, and navigation
 */

(function () {
  "use strict";

  // ==================== DOM ELEMENTS ====================
  const el = {
    serverList:
      document.getElementById("serverList") ||
      document.getElementById("globalServerList"),
    serverTooltip: document.getElementById("serverTooltip"),
    addServerBtn:
      document.getElementById("addServerBtn") ||
      document.getElementById("globalAddServerBtn"),
    discoverBtn:
      document.getElementById("discoverBtn") ||
      document.getElementById("globalDiscoverBtn"),
    createServerModal: document.getElementById("createServerModal"),
    serverContextMenu: document.getElementById("serverContextMenu"),
  };

  // ==================== STATE ====================
  let servers = [];
  let activeServerId = null;
  let tooltipTimeout = null;

  // ==================== API HELPERS ====================
  async function apiGet(url) {
    const accessToken = localStorage.getItem("accessToken");
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  /**
   * Fetch channels của server và navigate đến channel phù hợp
   * Ưu tiên: general channel → TEXT channel đầu tiên → channel đầu tiên
   * @param {number|string} serverId - ID của server
   */
  async function navigateToServerWithChannel(serverId) {
    try {
      console.log(
        `[Server Navigation] Fetching channels for server ${serverId}...`
      );
      const channels = await apiGet(`/api/servers/${serverId}/channels`);
      console.log(
        `[Server Navigation] Found ${channels.length} channels:`,
        channels
      );

      if (!channels || channels.length === 0) {
        console.warn(
          "[Server Navigation] No channels found, navigating without channelId"
        );
        window.location.href = `/chat?serverId=${serverId}`;
        return;
      }

      // Tìm general channel
      let targetChannel = channels.find(
        (ch) => ch.name && ch.name.toLowerCase() === "general"
      );

      // Nếu không có general, tìm TEXT channel đầu tiên
      if (!targetChannel) {
        targetChannel = channels.find(
          (ch) => ch.type && ch.type.toUpperCase() === "TEXT"
        );
      }

      // Nếu vẫn không có, lấy channel đầu tiên
      if (!targetChannel) {
        targetChannel = channels[0];
      }

      console.log("[Server Navigation] Navigating to channel:", targetChannel);
      window.location.href = `/chat?serverId=${serverId}&channelId=${targetChannel.id}`;
    } catch (error) {
      console.error("[Server Navigation] Failed to fetch channels:", error);
      // Fallback: navigate chỉ với serverId
      window.location.href = `/chat?serverId=${serverId}`;
    }
  }

  // ==================== LOAD SERVERS ====================
  function onServerCreatedSuccess(newServerId) {
    closeModal();

    if (window.ServerSidebar && window.ServerSidebar.loadServers) {
      window.ServerSidebar.loadServers();
    }

    sessionStorage.setItem("cococord_pending_reload_server", newServerId);
    window.location.href = `/chat?serverId=${newServerId}`;
  }

  async function loadServers() {
    try {
      servers = await apiGet("/api/servers"); // Sửa endpoint đúng

      console.log(
        "[Server Sidebar] Loaded",
        servers.length,
        "servers from API"
      );

      // Nếu không có server items trong DOM (JSP empty), render từ API
      const existingServerItems = document.querySelectorAll(
        "#globalServerList a.server-item[data-server-id]"
      );
      if (existingServerItems.length === 0 && servers.length > 0) {
        console.log(
          "[Server Sidebar] No JSP servers found, rendering from API"
        );
        renderServerList();
      } else {
        console.log(
          "[Server Sidebar] Found",
          existingServerItems.length,
          "JSP servers, skipping render"
        );
      }
    } catch (error) {
      console.error("Failed to load servers:", error);
      // Không sao, vì JSP đã render sẵn servers rồi
    }
  }

  // ==================== RENDERING ====================
  function renderServerList() {
    if (!el.serverList) {
      console.warn("[Server Sidebar] serverList element not found");
      return;
    }

    // CHỈ xóa các server items được tạo dynamically (không có data-server-id và không phải action buttons)
    const existingServers = el.serverList.querySelectorAll(
      ".server-item:not([data-server-id]):not([data-action-btn])"
    );
    existingServers.forEach((item) => item.remove());

    servers.forEach((server) => {
      // Kiểm tra xem server này đã được render trong JSP chưa
      const existingItem = el.serverList.querySelector(
        `.server-item[data-server-id="${server.id}"]`
      );
      if (existingItem) {
        console.log(
          "[Server Sidebar] Server",
          server.id,
          "already rendered in JSP, skipping"
        );
        return; // Đã có rồi, skip
      }

      console.log("[Server Sidebar] Rendering server", server.id, server.name);

      // Render server mới (được tạo dynamically)
      const serverItem = createServerItem(server);

      // Insert BEFORE the action buttons (divider + add + discover) at the end
      const actionDivider = el.serverList.querySelector(
        ".server-divider[data-action-divider]"
      );
      if (actionDivider) {
        el.serverList.insertBefore(serverItem, actionDivider);
      } else {
        el.serverList.appendChild(serverItem);
      }
    });

    updateActiveServer();
  }

  function createServerItem(server) {
    const item = document.createElement("a");
    item.className = "server-item";
    item.href = `/chat?serverId=${server.id}`; // URL này sẽ được kích hoạt
    item.dataset.serverId = server.id;
    item.dataset.tooltip = server.name;
    item.title = server.name;

    if (server.iconUrl) {
      const img = document.createElement("img");
      img.src = server.iconUrl;
      img.alt = server.name;
      img.onerror = () => {
        img.remove();
        const initial = document.createElement("span");
        initial.className = "server-initial";
        initial.textContent = getServerInitial(server.name);
        item.appendChild(initial);
      };
      item.appendChild(img);
    } else {
      const initial = document.createElement("span");
      initial.className = "server-initial";
      initial.textContent = getServerInitial(server.name);
      item.appendChild(initial);
    }

    item.addEventListener("mouseenter", (e) => showTooltip(e, server.name));
    item.addEventListener("mouseleave", hideTooltip);
    item.addEventListener("contextmenu", (e) => showContextMenu(e, server));

    // Click handler được xử lý bởi event delegation trong attachFirstVisitHandlers()
    // Không cần attach listener trực tiếp nữa

    return item;
  }

  function getServerInitial(name) {
    if (!name) return "?";
    const words = name.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function updateActiveServer() {
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get("serverId");

    // Xóa active cũ
    el.serverList.querySelectorAll(".server-item, .home-btn").forEach((item) => {
      item.classList.remove("active");
    });

    // Logic mới:
    if (currentPath === "/messages") {
      const homeBtn = el.serverList.querySelector(".home-btn");
      if (homeBtn) homeBtn.classList.add("active");
    } 
    // THÊM ĐOẠN NÀY: Xử lý trang Home (/app)
    else if (currentPath === "/app" || currentPath.startsWith("/app/")) {
       if (!serverId) { // Chỉ active Home nếu không có serverId
           const homeBtn = el.serverList.querySelector(".home-btn") || document.getElementById("homeBtn");
           if (homeBtn) homeBtn.classList.add("active");
       }
    }
    else if (serverId) {
      const serverItem = el.serverList.querySelector(
        `[data-server-id="${serverId}"]`
      );
      if (serverItem) serverItem.classList.add("active");
    }
  }

  // ==================== TOOLTIP ====================
  function showTooltip(e, text) {
    if (!el.serverTooltip) return;
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      const rect = e.target.getBoundingClientRect();
      el.serverTooltip.textContent = text;
      el.serverTooltip.style.top = `${rect.top + rect.height / 2}px`;
      el.serverTooltip.style.transform = "translateY(-50%)";
      el.serverTooltip.classList.add("visible");
    }, 200);
  }

  function hideTooltip() {
    clearTimeout(tooltipTimeout);
    if (el.serverTooltip) {
      el.serverTooltip.classList.remove("visible");
    }
  }

  function initActionTooltips() {
    const buttons = [el.addServerBtn, el.discoverBtn];
    buttons.forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("mouseenter", (e) => {
        showTooltip(e, btn.dataset.tooltip || btn.title);
      });
      btn.addEventListener("mouseleave", hideTooltip);
    });
  }

  // ==================== ATTACH HANDLERS TO STATIC ITEMS (JSP rendered) ====================
  function attachFirstVisitHandlers() {
    // Sử dụng event delegation thay vì attach trực tiếp
    const serverListWrapper = document.querySelector("#globalServerList");
    if (!serverListWrapper) {
      console.warn("[Server Sidebar] globalServerList not found");
      return;
    }

    // Remove old listener nếu có
    if (serverListWrapper.dataset.hasGlobalHandler === "true") {
      console.log("[Server Sidebar] Global handler already attached, skipping");
      return;
    }

    serverListWrapper.dataset.hasGlobalHandler = "true";

    console.log(
      "[Server Sidebar] Attaching global click handler via event delegation"
    );

    serverListWrapper.addEventListener(
      "click",
      async (e) => {
        // Tìm server-item được click (có thể click vào child element)
        const serverItem = e.target.closest("a.server-item[data-server-id]");

        if (!serverItem) {
          console.log("[Global Handler] Click not on server item");
          return; // Không phải server item
        }

        const serverId = serverItem.dataset.serverId;
        if (!serverId) {
          console.warn("[Global Handler] No serverId found");
          return;
        }

        console.log(
          "[Global Handler] Click detected on server:",
          serverId,
          e.target
        );

        e.preventDefault();
        e.stopPropagation();

        console.log(`[Server Click] Clicking server ${serverId}`);

        // Nếu đang ở cùng server, không reload
        const urlParams = new URLSearchParams(window.location.search);
        const currentServerId = urlParams.get("serverId");
        if (currentServerId === String(serverId)) {
          console.log("[Server Click] Already on this server, ignoring click");
          return;
        }

        // Fetch channel đầu tiên của server
        try {
          await navigateToServerWithChannel(serverId);
        } catch (error) {
          console.error("[Server Click] Failed to navigate:", error);
          window.location.href = `/chat?serverId=${serverId}`;
        }
      },
      true
    ); // Use capture phase

    console.log("[Server Sidebar] Global handler attached successfully");
  }

  // ==================== OTHERS ====================
  function showContextMenu(e, server) {
    e.preventDefault();
    console.log("Context menu for server:", server.name);
  }

  function initEventListeners() {
    // NOTE: Add Server và Discover button handlers được quản lý bởi app.js
    // Không attach listener ở đây để tránh duplicate handlers

    document.addEventListener("click", (e) => {
      if (el.serverContextMenu && !el.serverContextMenu.contains(e.target)) {
        el.serverContextMenu.style.display = "none";
      }
    });
    document.addEventListener("scroll", hideTooltip, true);
  }

  function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
      }
    });
  }

  // ==================== INITIALIZATION ====================
  async function init() {
    console.log("[Server Sidebar] Initializing...");

    // 1. Attach handlers cho server items có sẵn từ JSP TRƯỚC (nếu có)
    attachFirstVisitHandlers();

    // 2. Load servers từ API và render nếu cần
    await loadServers();

    // 3. Attach handlers cho server items MỚI được render từ API
    attachFirstVisitHandlers();

    // 4. Init các event listeners khác
    initEventListeners();
    initActionTooltips();
    initKeyboardShortcuts();

    console.log("[Server Sidebar] Initialized");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ServerSidebar = {
    loadServers,
    servers: () => servers,
    navigateToServerWithChannel, // Export function để dùng chung
  };
})();
