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
        if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
        }
        return res.json();
    }

    async function apiPost(url, body = {}) {
        const accessToken = localStorage.getItem('accessToken');
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || `Request failed: ${res.status}`);
        }
        return res.json();
    }

    // ==================== SERVER LIST ====================
    async function loadServers() {
        try {
            servers = await apiGet('/api/servers');
            renderServerList();
        } catch (error) {
            console.error('Failed to load servers:', error);
        }
    }

    function renderServerList() {
        if (!el.serverList) return;

        // Keep home button and divider
        const homeBtn = el.serverList.querySelector('.home-btn');
        const firstDivider = el.serverList.querySelector('.server-divider');
        
        // Remove existing server items (not home or divider)
        const existingServers = el.serverList.querySelectorAll('.server-item:not(.home-btn):not(.add-server-btn):not(.discover-btn)');
        existingServers.forEach(item => item.remove());

        // Add servers after the divider
        servers.forEach(server => {
            const serverItem = createServerItem(server);
            if (firstDivider) {
                firstDivider.after(serverItem);
            } else {
                el.serverList.appendChild(serverItem);
            }
        });

        // Update active state based on current page
        updateActiveServer();
    }

    function createServerItem(server) {
        const item = document.createElement('a');
        item.className = 'server-item';
        item.href = `/chat?serverId=${server.id}`;
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

        // Add event listeners
        item.addEventListener('mouseenter', (e) => showTooltip(e, server.name));
        item.addEventListener('mouseleave', hideTooltip);
        item.addEventListener('contextmenu', (e) => showContextMenu(e, server));

        return item;
    }

    function getServerInitial(name) {
        if (!name) return '?';
        // Get first letter of each word, max 2 letters
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

        // Remove all active states
        el.serverList.querySelectorAll('.server-item').forEach(item => {
            item.classList.remove('active');
        });

        // Set active based on current page
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

    // Add tooltips to action buttons
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

    // ==================== CONTEXT MENU ====================
    function showContextMenu(e, server) {
        e.preventDefault();
        // Context menu implementation - can be expanded
        console.log('Context menu for server:', server.name);
    }

    // ==================== CREATE SERVER MODAL ====================
    function openCreateServerModal() {
        if (el.createServerModal) {
            el.createServerModal.style.display = 'flex';
        }
    }

    // ==================== EVENT LISTENERS ====================
    function initEventListeners() {
        // Add server button
        if (el.addServerBtn) {
            el.addServerBtn.addEventListener('click', openCreateServerModal);
        }

        // Discover button
        if (el.discoverBtn) {
            el.discoverBtn.addEventListener('click', () => {
                // Navigate to discover page or show modal
                console.log('Discover servers clicked');
            });
        }

        // Close context menu on click outside
        document.addEventListener('click', (e) => {
            if (el.serverContextMenu && !el.serverContextMenu.contains(e.target)) {
                el.serverContextMenu.style.display = 'none';
            }
        });

        // Close tooltip on scroll
        document.addEventListener('scroll', hideTooltip, true);
    }

    // ==================== KEYBOARD SHORTCUTS ====================
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K - Quick channel switcher (future implementation)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                console.log('Quick channel switcher - To be implemented');
            }
        });
    }

    // ==================== INITIALIZATION ====================
    function init() {
        loadServers();
        initEventListeners();
        initActionTooltips();
        initKeyboardShortcuts();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for external use
    window.ServerSidebar = {
        loadServers,
        servers: () => servers
    };
})();
