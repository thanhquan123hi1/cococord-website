/**
 * Server Sidebar JavaScript
 * Manages server list, tooltips, and navigation
 */

(function() {
    'use strict';

    // ==================== DOM ELEMENTS ====================
    const el = {
        serverList: document.getElementById('serverList'),
        serverTooltip: document.getElementById('serverTooltip'),
        addServerBtn: document.getElementById('addServerBtn'),
        discoverBtn: document.getElementById('discoverBtn'),
        createServerModal: document.getElementById('createServerModal'),
        serverContextMenu: document.getElementById('serverContextMenu')
    };

    // ==================== STATE ====================
    let servers = [];
    let activeServerId = null;
    let tooltipTimeout = null;

    // ==================== FIRST SERVER VISIT RELOAD (per server) ====================
    const VISITED_SERVERS_KEY = 'cococord_visited_servers';
    const PENDING_RELOAD_SERVER_KEY = 'cococord_pending_reload_server';

    function getVisitedServers() {
        try {
            const data = sessionStorage.getItem(VISITED_SERVERS_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function hasVisitedServer(serverId) {
        return getVisitedServers().includes(String(serverId));
    }

    function markServerAsVisited(serverId) {
        const visited = getVisitedServers();
        if (!visited.includes(String(serverId))) {
            visited.push(String(serverId));
            sessionStorage.setItem(VISITED_SERVERS_KEY, JSON.stringify(visited));
        }
    }

    function setPendingReloadForServer(serverId) {
        sessionStorage.setItem(PENDING_RELOAD_SERVER_KEY, String(serverId));
    }

    function getPendingReloadServer() {
        return sessionStorage.getItem(PENDING_RELOAD_SERVER_KEY);
    }

    function clearPendingReloadServer() {
        sessionStorage.removeItem(PENDING_RELOAD_SERVER_KEY);
    }

    // Check reload logic - Runs IMMEDIATELY
    function checkAndReloadForFirstVisit() {
        const urlParams = new URLSearchParams(window.location.search);
        const currentServerId = urlParams.get('serverId');
        
        // Chỉ xử lý trên trang chat với serverId
        if (!currentServerId) return false;

        const pendingServerId = getPendingReloadServer();
        
        // Kiểm tra xem server hiện tại có cờ pending reload không
        if (pendingServerId === currentServerId) {
            console.log(`[First Visit] First time visiting server ${currentServerId}. Reloading page once...`);
            clearPendingReloadServer();
            markServerAsVisited(currentServerId);
            window.location.reload();
            return true;
        }
        
        return false;
    }

    // Run the check IMMEDIATELY
    if (checkAndReloadForFirstVisit()) {
        return; // Stop execution if reloading
    }

    // ==================== API HELPERS ====================
    async function apiGet(url) {
        const accessToken = localStorage.getItem('accessToken');
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
    }

    async function loadServers() {
        try {
            servers = await apiGet('/api/users/me/servers'); 
            
            // Mock data check (optional)
            if (servers.length === 0 && typeof window.ServerSidebar !== 'undefined') {
                 // Fallback logic if needed
            }
            
            renderServerList();
        } catch (error) {
            console.error('Failed to load servers:', error);
        }
    }

    // ==================== RENDERING ====================
    function renderServerList() {
        if (!el.serverList) return;

        const homeBtn = el.serverList.querySelector('.home-btn');
        const firstDivider = el.serverList.querySelector('.server-divider');
        
        const existingServers = el.serverList.querySelectorAll('.server-item:not(.home-btn):not(.add-server-btn):not(.discover-btn)');
        existingServers.forEach(item => item.remove());

        servers.forEach(server => {
            const serverItem = createServerItem(server);
            if (firstDivider) {
                firstDivider.after(serverItem);
            } else {
                el.serverList.appendChild(serverItem);
            }
        });

        updateActiveServer();
    }

    function createServerItem(server) {
        const item = document.createElement('a');
        item.className = 'server-item';
        item.href = `/chat?serverId=${server.id}`; // URL này sẽ được kích hoạt
        item.dataset.serverId = server.id;
        item.dataset.tooltip = server.name;
        item.title = server.name;

        if (server.iconUrl) {
            const img = document.createElement('img');
            img.src = server.iconUrl;
            img.alt = server.name;
            img.onerror = () => {
                img.remove();
                const initial = document.createElement('span');
                initial.className = 'server-initial';
                initial.textContent = getServerInitial(server.name);
                item.appendChild(initial);
            };
            item.appendChild(img);
        } else {
            const initial = document.createElement('span');
            initial.className = 'server-initial';
            initial.textContent = getServerInitial(server.name);
            item.appendChild(initial);
        }

        item.addEventListener('mouseenter', (e) => showTooltip(e, server.name));
        item.addEventListener('mouseleave', hideTooltip);
        item.addEventListener('contextmenu', (e) => showContextMenu(e, server));

        item.addEventListener('click', (e) => {
            const serverId = String(server.id);
            if (!hasVisitedServer(serverId)) {
                console.log(`[First Visit] First time clicking server ${serverId}. Setting pending reload flag.`);
                setPendingReloadForServer(serverId);
            }
        });

        return item;
    }

    function getServerInitial(name) {
        if (!name) return '?';
        const words = name.split(/\s+/);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    function updateActiveServer() {
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const serverId = urlParams.get('serverId');

        el.serverList.querySelectorAll('.server-item').forEach(item => {
            item.classList.remove('active');
        });

        if (currentPath === '/messages') {
            const homeBtn = el.serverList.querySelector('.home-btn');
            if (homeBtn) homeBtn.classList.add('active');
        } else if (serverId) {
            const serverItem = el.serverList.querySelector(`[data-server-id="${serverId}"]`);
            if (serverItem) serverItem.classList.add('active');
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
            el.serverTooltip.style.transform = 'translateY(-50%)';
            el.serverTooltip.classList.add('visible');
        }, 200);
    }

    function hideTooltip() {
        clearTimeout(tooltipTimeout);
        if (el.serverTooltip) {
            el.serverTooltip.classList.remove('visible');
        }
    }

    function initActionTooltips() {
        const buttons = [el.addServerBtn, el.discoverBtn];
        buttons.forEach(btn => {
            if (!btn) return;
            btn.addEventListener('mouseenter', (e) => {
                showTooltip(e, btn.dataset.tooltip || btn.title);
            });
            btn.addEventListener('mouseleave', hideTooltip);
        });
    }

    // ==================== ATTACH HANDLERS TO STATIC ITEMS ====================
    function attachFirstVisitHandlers() {
        const allServerItems = document.querySelectorAll('#globalServerList .server-item, #mainServerSidebar .server-item');
        
        allServerItems.forEach(item => {
            if (item.dataset.hasFirstVisitHandler || !item.href || item.classList.contains('home-btn')) {
                return;
            }
            
            item.dataset.hasFirstVisitHandler = 'true';
            
            item.addEventListener('click', (e) => {
                const serverId = item.dataset.serverId;
                if (serverId && !hasVisitedServer(serverId)) {
                    console.log(`[First Visit] First time clicking server ${serverId}. Setting pending reload flag.`);
                    setPendingReloadForServer(serverId);
                }
            });
        });
    }

    // ==================== OTHERS ====================
    function showContextMenu(e, server) {
        e.preventDefault();
        console.log('Context menu for server:', server.name);
    }

    function openCreateServerModal() {
        if (el.createServerModal) {
            el.createServerModal.style.display = 'flex';
        }
    }

    function initEventListeners() {
        if (el.addServerBtn) {
            el.addServerBtn.addEventListener('click', openCreateServerModal);
        }
        if (el.discoverBtn) {
            el.discoverBtn.addEventListener('click', () => {
                console.log('Discover servers clicked');
            });
        }
        document.addEventListener('click', (e) => {
            if (el.serverContextMenu && !el.serverContextMenu.contains(e.target)) {
                el.serverContextMenu.style.display = 'none';
            }
        });
        document.addEventListener('scroll', hideTooltip, true);
    }

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
            }
        });
    }

    // ==================== INITIALIZATION ====================
    function init() {
        attachFirstVisitHandlers();
        loadServers();
        initEventListeners();
        initActionTooltips();
        initKeyboardShortcuts();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.ServerSidebar = {
        loadServers,
        servers: () => servers
    };
})();