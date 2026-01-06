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
      const channels = await apiGet(`/api/servers/${serverId}/channels`);

      if (!channels || channels.length === 0) {
        window.location.href = `/chat?serverId=${serverId}`;
        return;
      }

      let targetChannel = channels.find(
        (ch) => ch.name && ch.name.toLowerCase() === "general"
      );

      // Nếu không có general, tìm TEXT channel đầu tiên
      if (!targetChannel) {
        targetChannel = channels.find(
          (ch) => ch.type && ch.type.toUpperCase() === "TEXT"
        );
      }

      if (!targetChannel) {
        targetChannel = channels[0];
      }

      window.location.href = `/chat?serverId=${serverId}&channelId=${targetChannel.id}`;
    } catch (error) {
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
    servers = await apiGet("/api/servers");
    const existingServerItems = document.querySelectorAll(
      "#globalServerList a.server-item[data-server-id]"
    );
    if (existingServerItems.length === 0 && servers.length > 0) {
      renderServerList();
    }
  }

  // ==================== RENDERING ====================
  function renderServerList() {
    if (!el.serverList) {
      return;
    }

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
        return;
      }

      const serverItem = createServerItem(server);

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

    el.serverList.querySelectorAll(".server-item, .home-btn").forEach((item) => {
      item.classList.remove("active");
    });

    if (currentPath === "/messages") {
      const homeBtn = el.serverList.querySelector(".home-btn");
      if (homeBtn) homeBtn.classList.add("active");
    }

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
      return;
    }

    // Remove old listener nếu có
    if (serverListWrapper.dataset.hasGlobalHandler === "true") {
      return;
    }

    serverListWrapper.dataset.hasGlobalHandler = "true";

    serverListWrapper.addEventListener(
      "click",
      async (e) => {
        // Tìm server-item được click (có thể click vào child element)
        const serverItem = e.target.closest("a.server-item[data-server-id]");

        if (!serverItem) {
          return;
        }

        const serverId = serverItem.dataset.serverId;
        if (!serverId) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        // Nếu đang ở cùng server, không reload
        const urlParams = new URLSearchParams(window.location.search);
        const currentServerId = urlParams.get("serverId");
        if (currentServerId === String(serverId)) {
          return;
        }

        // Fetch channel đầu tiên của server
        try {
          await navigateToServerWithChannel(serverId);
        } catch (error) {
          window.location.href = `/chat?serverId=${serverId}`;
        }
      },
      true
    ); // Use capture phase
  }

  // ==================== OTHERS ====================
  function showContextMenu(e, server) {
    e.preventDefault();

    // Remove existing context menu if any
    const existingMenu = document.querySelector('.server-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'server-context-menu';
    menu.innerHTML = `
        <div class="context-item" data-action="invite">
            <i class="bi bi-person-plus"></i>
            <span>Mời bạn bè</span>
        </div>
        <div class="context-item" data-action="settings">
            <i class="bi bi-gear"></i>
            <span>Cài đặt Server</span>
        </div>
        <div class="context-divider"></div>
        <div class="context-item danger" data-action="leave">
            <i class="bi bi-box-arrow-right"></i>
            <span>Rời Server</span>
        </div>
    `;

    // Position
    menu.style.position = 'fixed';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.style.zIndex = '1000';
    menu.style.background = '#111214';
    menu.style.borderRadius = '4px';
    menu.style.padding = '6px 8px';
    menu.style.minWidth = '188px';
    menu.style.boxShadow = '0 8px 16px rgba(0,0,0,0.24)';

    // Add styles for items if not redundant with global css
    // Assuming .context-item style exists from header-toolbar or global css

    document.body.appendChild(menu);

    // Close on click outside
    const closeMenu = (ev) => {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    // Delay to avoid immediate close
    setTimeout(() => document.addEventListener('click', closeMenu), 0);

    // Handle clicks
    menu.addEventListener('click', (ev) => {
      const item = ev.target.closest('.context-item');
      if (!item) return;
      const action = item.dataset.action;

      if (action === 'invite') {
        if (window.InviteModalManager) {
          window.InviteModalManager.openModal(server.id, server.name);
        } else {
          console.error('InviteModalManager not found');
        }
      }
      // Handle other actions if needed...

      menu.remove();
      document.removeEventListener('click', closeMenu);
    });
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
