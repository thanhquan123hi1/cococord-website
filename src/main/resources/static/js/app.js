/**
 * Main App JavaScript
 * Hỗ trợ cho các trang authenticated (Dashboard, Chat, Friends, etc.)
 */

// Check authentication on app pages
(function checkAuth() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        // No token found, redirect to login
        window.location.href = '/login';
        return;
    }
    
    // Verify token is still valid (backend provides /api/auth/me)
    fetch('/api/auth/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            // Token is invalid, try to refresh
            refreshAccessToken();
        }
    })
    .catch(error => {
        console.error('Auth verification error:', error);
        localStorage.clear();
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
    });
})();

// Logout function
function logout() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
        // Call logout API
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(() => {
            localStorage.clear();
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Logout error:', error);
            localStorage.clear();
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
        });
    } else {
        localStorage.clear();
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
    }
}

// Refresh access token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
        localStorage.clear();
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
        return null;
    }
    
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            // Cập nhật cookie cho server-side rendering
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `accessToken=${encodeURIComponent(data.accessToken)}; expires=${expires}; path=/; SameSite=Lax`;
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            return data.accessToken;
        } else {
            localStorage.clear();
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
            return null;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        localStorage.clear();
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
        return null;
    }
}

// API request helper with auto token refresh
async function apiRequest(url, options = {}) {
    let accessToken = localStorage.getItem('accessToken');
    
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
    };
    
    let response = await fetch(url, options);
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
            options.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, options);
        }
    }
    
    return response;
}

// Load user info
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update user display name
    const displayNameElements = document.querySelectorAll('#user-display-name, #current-username, .user-name');
    displayNameElements.forEach(element => {
        if (user.displayName || user.username) {
            element.textContent = user.displayName || user.username;
        }
    });
    
    // Update user avatar
    const avatarElements = document.querySelectorAll('.user-avatar');
    avatarElements.forEach(element => {
        if (user.avatarUrl) {
            element.innerHTML = `<img src="${user.avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
        }
    });
}

// ==================== GLOBAL USER CONTROL PANEL ====================
let globalCurrentUser = null;
let globalUcpInitialized = false;

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function discriminatorFromId(id) {
    const n = Number(id);
    if (!Number.isFinite(n)) return '0000';
    return String(n % 10000).padStart(4, '0');
}

// Load current user and render UCP
async function loadGlobalUserPanel() {
    if (globalUcpInitialized) return; // Already initialized
    
    try {
        const response = await apiRequest('/api/auth/me');
        if (!response.ok) throw new Error('Failed to load user');
        
        globalCurrentUser = await response.json();
        
        // Store in localStorage for other uses
        localStorage.setItem('user', JSON.stringify(globalCurrentUser));
        
        renderGlobalUserPanel();
        bindGlobalUserPanelEvents();
        globalUcpInitialized = true;
        
    } catch (e) {
        console.error('Failed to load global user panel', e);
    }
}

// Render user info into UCP elements
function renderGlobalUserPanel() {
    if (!globalCurrentUser) return;
    
    const ucpAvatar = document.getElementById('ucpAvatar');
    const ucpName = document.getElementById('ucpName');
    const ucpStatus = document.getElementById('ucpStatus');
    const ucpStatusIndicator = document.getElementById('ucpStatusIndicator');
    
    const displayName = globalCurrentUser.displayName || globalCurrentUser.username || 'User';
    const discriminator = discriminatorFromId(globalCurrentUser.id);
    const fullUsername = `${globalCurrentUser.username || 'user'}#${discriminator}`;
    const status = globalCurrentUser.status || 'ONLINE';
    
    if (ucpName) {
        ucpName.textContent = displayName;
        ucpName.title = fullUsername;
    }
    
    if (ucpStatus) {
        ucpStatus.textContent = globalCurrentUser.customStatus || getStatusText(status);
    }
    
    if (ucpStatusIndicator) {
        ucpStatusIndicator.className = `status-indicator ${status.toLowerCase().replace('_', '-')}`;
    }
    
    if (ucpAvatar) {
        const statusClass = status.toLowerCase().replace('_', '-');
        if (globalCurrentUser.avatarUrl) {
            ucpAvatar.innerHTML = `<img src="${escapeHtml(globalCurrentUser.avatarUrl)}" alt="${escapeHtml(displayName)}"><span class="status-indicator ${statusClass}" id="ucpStatusIndicator"></span>`;
        } else {
            ucpAvatar.innerHTML = `${escapeHtml(displayName.trim().charAt(0).toUpperCase())}<span class="status-indicator ${statusClass}" id="ucpStatusIndicator"></span>`;
        }
    }
}

function getStatusText(status) {
    const statusMap = {
        'ONLINE': 'Trực tuyến',
        'IDLE': 'Vắng mặt', 
        'DO_NOT_DISTURB': 'Không làm phiền',
        'INVISIBLE': 'Ẩn',
        'OFFLINE': 'Ngoại tuyến'
    };
    return statusMap[status] || 'Trực tuyến';
}

// Bind events for UCP
function bindGlobalUserPanelEvents() {
    const userInfoBtn = document.getElementById('userInfoBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtnUser = document.getElementById('logoutBtnUser');
    const settingsBtn = document.getElementById('settingsBtn');
    const statusItems = document.querySelectorAll('#userDropdown .status-item');
    
    // Toggle user dropdown
    if (userInfoBtn && userDropdown) {
        userInfoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = userDropdown.style.display !== 'none';
            userDropdown.style.display = isVisible ? 'none' : 'block';
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && e.target !== userInfoBtn) {
            userDropdown.style.display = 'none';
        }
    });
    
    // Logout button in dropdown
    if (logoutBtnUser) {
        logoutBtnUser.addEventListener('click', () => {
            logout();
        });
    }
    
    // Settings button - open user settings modal if available
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // Try to use UserSettingsModal if available (from chat.js or user-settings-modal.js)
            if (window.UserSettingsModal && window.UserSettingsModal.open) {
                window.UserSettingsModal.open();
            } else {
                // Fallback: navigate to settings page
                window.location.href = '/settings';
            }
        });
    }
    
    // Status change items
    statusItems.forEach(item => {
        item.addEventListener('click', async () => {
            const newStatus = item.dataset.status;
            if (!newStatus) return;
            
            try {
                const response = await apiRequest('/api/users/me/status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        status: newStatus,
                        customStatus: globalCurrentUser?.customStatus || null,
                        customStatusEmoji: globalCurrentUser?.customStatusEmoji || null
                    })
                });
                
                if (response.ok) {
                    // Update local state
                    if (globalCurrentUser) {
                        globalCurrentUser.status = newStatus;
                    }
                    renderGlobalUserPanel();
                    
                    // Close dropdown
                    if (userDropdown) {
                        userDropdown.style.display = 'none';
                    }
                }
            } catch (e) {
                console.error('Failed to update status', e);
            }
        });
    });
    
    // Mic button (will be controlled by chat.js for voice, but we can toggle visual state)
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            // If chat.js has voice control, let it handle
            if (window.CoCoCordChat && window.CoCoCordChat.toggleMute) {
                window.CoCoCordChat.toggleMute();
            } else {
                // Visual toggle only
                micBtn.classList.toggle('muted');
                const isMuted = micBtn.classList.contains('muted');
                micBtn.innerHTML = isMuted 
                    ? '<i class="bi bi-mic-mute-fill"></i>' 
                    : '<i class="bi bi-mic"></i>';
                micBtn.title = isMuted ? 'Bật tiếng' : 'Tắt tiếng';
            }
        });
    }
    
    // Deafen button
    const deafenBtn = document.getElementById('deafenBtn');
    if (deafenBtn) {
        deafenBtn.addEventListener('click', () => {
            // If chat.js has voice control, let it handle
            if (window.CoCoCordChat && window.CoCoCordChat.toggleDeafen) {
                window.CoCoCordChat.toggleDeafen();
            } else {
                // Visual toggle only
                deafenBtn.classList.toggle('deafened');
                const isDeafened = deafenBtn.classList.contains('deafened');
                deafenBtn.innerHTML = isDeafened 
                    ? '<i class="bi bi-volume-mute-fill"></i>' 
                    : '<i class="bi bi-headphones"></i>';
                deafenBtn.title = isDeafened ? 'Bật nghe' : 'Tắt nghe';
            }
        });
    }
}

// Update UCP from external source (e.g., after profile edit)
function updateGlobalUserPanel(userData) {
    if (userData) {
        globalCurrentUser = { ...globalCurrentUser, ...userData };
        localStorage.setItem('user', JSON.stringify(globalCurrentUser));
    }
    renderGlobalUserPanel();
}

// ==================== GLOBAL SERVER SIDEBAR LOGIC ====================

// Load servers for global sidebar
async function loadGlobalServers() {
    const serverList = document.getElementById('globalServerList');
    if (!serverList) return;
    
    try {
        const response = await apiRequest('/api/servers');
        if (!response.ok) throw new Error('Failed to load servers');
        
        const servers = await response.json();
        serverList.innerHTML = '';
        
        servers.forEach(server => {
            const serverItem = document.createElement('a');
            serverItem.className = 'server-item';
            serverItem.setAttribute('data-server-id', server.id);
            serverItem.setAttribute('title', server.name);
            serverItem.setAttribute('href', `/chat?serverId=${server.id}`);
            
            if (server.iconUrl) {
                serverItem.innerHTML = `<img src="${server.iconUrl}" alt="${server.name}">`;
            } else {
                const initial = server.name.charAt(0).toUpperCase();
                serverItem.innerHTML = `<span class="server-initial">${initial}</span>`;
            }
            
            // SPA-like navigation: nếu đang ở trang /chat, không reload toàn trang
            serverItem.addEventListener('click', (e) => {
                // Allow opening in a new tab/window
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

                const isOnChatPage = window.location.pathname.endsWith('/chat');

                // If already on /chat, delegate to chat.js SPA API
                if (isOnChatPage && typeof window.CoCoCordChat !== 'undefined' && window.CoCoCordChat.selectServer) {
                    e.preventDefault();
                    window.CoCoCordChat.selectServer(server.id);
                    return;
                }

                // From other pages (e.g. /app), navigate to /chat without full reload to keep UCP persistent
                if (typeof spaNavigate === 'function') {
                    e.preventDefault();
                    spaNavigate(serverItem.href);
                }
            });
            
            serverList.appendChild(serverItem);
        });
        
        // Highlight current server if on chat page
        const urlParams = new URLSearchParams(window.location.search);
        const currentServerId = urlParams.get('serverId');
        if (currentServerId) {
            const activeItem = serverList.querySelector(`[data-server-id="${currentServerId}"]`);
            if (activeItem) activeItem.classList.add('active');
        }
        
        // Highlight home button on friends page
        if (window.location.pathname.includes('/friends')) {
            const homeBtn = document.querySelector('.server-sidebar .home-btn');
            if (homeBtn) homeBtn.classList.add('active');
        }
        
    } catch (error) {
        console.error('Error loading servers:', error);
    }
}

// Global modal handling
function openGlobalModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeGlobalModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Create Server functionality
async function handleCreateServer(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('globalServerNameInput');
    const serverName = nameInput ? nameInput.value.trim() : '';
    
    if (!serverName) {
        alert('Vui lòng nhập tên server');
        return;
    }
    
    try {
        const response = await apiRequest('/api/servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: serverName })
        });
        
        if (!response.ok) throw new Error('Failed to create server');
        
        const newServer = await response.json();
        closeGlobalModal('globalCreateServerModal');
        if (nameInput) nameInput.value = '';
        
        // Refresh server list and navigate to new server
        await loadGlobalServers();
        window.location.href = `/chat?serverId=${newServer.id}`;
    } catch (error) {
        console.error('Error creating server:', error);
        alert('Lỗi khi tạo server: ' + error.message);
    }
}

// Join Server functionality
async function handleJoinServer(e) {
    if (e) e.preventDefault();
    const codeInput = document.getElementById('globalInviteCodeInput');
    const inviteCode = codeInput ? codeInput.value.trim() : '';
    
    if (!inviteCode) {
        alert('Vui lòng nhập mã mời');
        return;
    }
    
    // Extract code if full URL is pasted
    let code = inviteCode;
    if (inviteCode.includes('/')) {
        code = inviteCode.split('/').pop();
    }
    
    try {
        const response = await apiRequest(`/api/servers/join/${code}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Mã mời không hợp lệ');
        }
        
        const server = await response.json();
        closeGlobalModal('globalJoinServerModal');
        if (codeInput) codeInput.value = '';
        
        // Refresh and navigate
        await loadGlobalServers();
        window.location.href = `/chat?serverId=${server.id}`;
    } catch (error) {
        console.error('Error joining server:', error);
        alert('Lỗi: ' + error.message);
    }
}

// ==================== LIGHTWEIGHT APP NAVIGATION (KEEP UCP PERSISTENT) ====================

function getAppContextPath() {
    // Derive contextPath from the Home button URL if possible.
    const homeBtn = document.getElementById('homeBtn');
    if (!homeBtn || !homeBtn.href) return '';
    try {
        const u = new URL(homeBtn.href, window.location.origin);
        const p = u.pathname;
        return p.endsWith('/app') ? p.slice(0, -4) : '';
    } catch {
        return '';
    }
}

function updateGlobalSidebarActiveState() {
    const homeBtn = document.getElementById('homeBtn');
    const serverList = document.getElementById('globalServerList');

    serverList?.querySelectorAll('.server-item.active').forEach(el => el.classList.remove('active'));
    if (homeBtn) homeBtn.classList.remove('active');

    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get('serverId');
    const isChat = window.location.pathname.endsWith('/chat');
    const isHome = window.location.pathname.endsWith('/app') && !serverId;

    if (isHome && homeBtn) {
        homeBtn.classList.add('active');
        return;
    }

    if (isChat && serverId && serverList) {
        const activeItem = serverList.querySelector(`[data-server-id="${serverId}"]`);
        if (activeItem) activeItem.classList.add('active');
    }
}

async function runScriptsInElement(container) {
    if (!container) return;

    const existingScriptSrc = new Set(
        Array.from(document.querySelectorAll('script[src]')).map(s => {
            try { return new URL(s.getAttribute('src'), window.location.origin).toString(); } catch { return s.getAttribute('src'); }
        })
    );

    const scripts = Array.from(container.querySelectorAll('script'));
    for (const script of scripts) {
        const src = script.getAttribute('src');
        if (src) {
            let absSrc = src;
            try { absSrc = new URL(src, window.location.origin).toString(); } catch { /* ignore */ }

            if (!existingScriptSrc.has(absSrc)) {
                await new Promise((resolve) => {
                    const el = document.createElement('script');
                    el.src = src;
                    el.async = false;
                    el.onload = resolve;
                    el.onerror = resolve;
                    document.body.appendChild(el);
                });
                existingScriptSrc.add(absSrc);
            }
        } else if (script.textContent && script.textContent.trim()) {
            const el = document.createElement('script');
            el.textContent = script.textContent;
            document.body.appendChild(el);
        }

        // Remove inert script tag from injected HTML
        script.remove();
    }
}

async function syncHeadStylesFromDoc(doc) {
    const head = doc?.head;
    if (!head) return;

    const existingStyles = new Set(
        Array.from(document.head.querySelectorAll('link[rel="stylesheet"][href]')).map(l => {
            try { return new URL(l.getAttribute('href'), window.location.origin).toString(); } catch { return l.getAttribute('href'); }
        })
    );

    head.querySelectorAll('link[rel="stylesheet"][href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        let absHref = href;
        try { absHref = new URL(href, window.location.origin).toString(); } catch { /* ignore */ }

        if (existingStyles.has(absHref)) return;
        const el = document.createElement('link');
        el.rel = 'stylesheet';
        el.href = href;
        document.head.appendChild(el);
        existingStyles.add(absHref);
    });
}

let _spaNavController = null;
let _spaNavToken = 0;

async function spaNavigate(url, opts = {}) {
    const { pushState = true } = opts;

    const pageArea = document.querySelector('.page-content-area');
    if (!pageArea) {
        window.location.href = url;
        return;
    }

    const targetUrl = new URL(url, window.location.origin);
    const currentHash = window.location.hash === '#' ? '' : window.location.hash;
    const targetHash = targetUrl.hash === '#' ? '' : targetUrl.hash;
    const isSame = (
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search &&
        targetHash === currentHash
    );

    if (isSame) return;

    try {
        // Abort any in-flight navigation to keep transitions smooth
        if (_spaNavController) {
            try { _spaNavController.abort(); } catch { /* ignore */ }
        }
        _spaNavController = new AbortController();
        const myToken = ++_spaNavToken;

        const res = await fetch(targetUrl.toString(), {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
            signal: _spaNavController.signal
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        if (myToken !== _spaNavToken) return;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newArea = doc.querySelector('.page-content-area');

        // If the server returns an undecorated fragment (no SiteMesh wrapper),
        // fall back to using the response body instead of doing a full reload.
        const nextHtml = newArea ? newArea.innerHTML : (doc.body ? doc.body.innerHTML : html);
        pageArea.innerHTML = nextHtml;
        if (myToken !== _spaNavToken) return;
        await syncHeadStylesFromDoc(doc);
        await runScriptsInElement(pageArea);

        if (doc.title) document.title = doc.title;
        if (pushState) {
            history.pushState({}, '', targetUrl.pathname + targetUrl.search + targetUrl.hash);
        }

        updateGlobalSidebarActiveState();
        document.dispatchEvent(new CustomEvent('cococord:page:loaded', { detail: { url: targetUrl.toString() } }));
    } catch (e) {
        if (e && (e.name === 'AbortError' || String(e).includes('AbortError'))) {
            return;
        }
        console.warn('SPA navigate failed, fallback to full navigation', e);
        window.location.href = url;
    }
}

function initAppLinkInterception() {
    if (window.__cococordSpaLinksInit) return;
    window.__cococordSpaLinksInit = true;

    document.addEventListener('click', (e) => {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

        const a = e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        if (a.target && a.target !== '_self') return;
        if (a.hasAttribute('download')) return;
        if (a.closest && a.closest('#globalServerList')) return; // handled by server SPA logic

        // Home button has its own handler in initGlobalSidebar; avoid double navigation.
        if (a.id === 'homeBtn' || (a.classList && a.classList.contains('home-btn'))) return;

        const rawHref = a.getAttribute('href') || '';
        if (!rawHref || rawHref.startsWith('#')) return;

        let u;
        try {
            u = new URL(a.href, window.location.origin);
        } catch {
            return;
        }
        if (u.origin !== window.location.origin) return;

        const ctx = getAppContextPath();
        const appPrefixes = [
            (ctx || '') + '/app',
            (ctx || '') + '/chat',
            (ctx || '') + '/friends',
            (ctx || '') + '/messages',
            (ctx || '') + '/profile',
            (ctx || '') + '/sessions',
            (ctx || '') + '/change-password'
        ];

        const isAppRoute = appPrefixes.some(p => u.pathname === p || u.pathname.startsWith(p + '/'));
        if (!isAppRoute) return;

        // Do not hijack settings route: it's handled by a modal/button in UCP.
        if (u.pathname === (ctx || '') + '/settings') return;

        // Special case: if already on /chat and clicking a server link, keep existing SPA behaviour
        const isChatTarget = u.pathname.endsWith('/chat');
        const serverId = u.searchParams.get('serverId');
        if (
            isChatTarget &&
            serverId &&
            window.location.pathname.endsWith('/chat') &&
            window.CoCoCordChat &&
            typeof window.CoCoCordChat.selectServer === 'function'
        ) {
            e.preventDefault();
            history.pushState({ serverId: Number(serverId) }, '', u.pathname + u.search + u.hash);
            updateGlobalSidebarActiveState();
            window.CoCoCordChat.selectServer(Number(serverId));
            return;
        }

        e.preventDefault();
        spaNavigate(u.toString());
    }, true);
}

// Initialize global sidebar events
function initGlobalSidebar() {
    // Home (Discord logo) button: navigate without full page reload to keep UCP persistent
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', (e) => {
            // Allow opening in a new tab/window
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();

            const ctx = getAppContextPath();
            spaNavigate((ctx || '') + '/app');
        });
    }

    // Add Server button
    const addServerBtn = document.getElementById('globalAddServerBtn');
    if (addServerBtn) {
        addServerBtn.addEventListener('click', () => openGlobalModal('globalCreateServerModal'));
    }
    
    // Discover button
    const discoverBtn = document.getElementById('globalDiscoverBtn');
    if (discoverBtn) {
        discoverBtn.addEventListener('click', () => openGlobalModal('globalJoinServerModal'));
    }
    
    // Create Server Modal - Close buttons
    const closeCreateBtn = document.getElementById('closeGlobalCreateServerModal');
    if (closeCreateBtn) {
        closeCreateBtn.addEventListener('click', () => closeGlobalModal('globalCreateServerModal'));
    }
    
    const cancelCreateBtn = document.getElementById('cancelGlobalCreateServer');
    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', () => closeGlobalModal('globalCreateServerModal'));
    }
    
    // Create Server Modal - Confirm button
    const confirmCreateBtn = document.getElementById('confirmGlobalCreateServer');
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', handleCreateServer);
    }
    
    // Join Server Modal - Close buttons
    const closeJoinBtn = document.getElementById('closeGlobalJoinServerModal');
    if (closeJoinBtn) {
        closeJoinBtn.addEventListener('click', () => closeGlobalModal('globalJoinServerModal'));
    }
    
    const cancelJoinBtn = document.getElementById('cancelGlobalJoinServer');
    if (cancelJoinBtn) {
        cancelJoinBtn.addEventListener('click', () => closeGlobalModal('globalJoinServerModal'));
    }
    
    // Join Server Modal - Confirm button
    const confirmJoinBtn = document.getElementById('confirmGlobalJoinServer');
    if (confirmJoinBtn) {
        confirmJoinBtn.addEventListener('click', handleJoinServer);
    }
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none';
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
window.addEventListener('popstate', () => {
    const ctx = getAppContextPath();
    const path = window.location.pathname;
    const appRoutes = [
        (ctx || '') + '/app',
        (ctx || '') + '/chat',
        (ctx || '') + '/friends',
        (ctx || '') + '/messages',
        (ctx || '') + '/profile',
        (ctx || '') + '/sessions',
        (ctx || '') + '/change-password'
    ];
    const isAppRoute = appRoutes.some(r => path === r || path.startsWith(r + '/'));
    if (isAppRoute) spaNavigate(window.location.href, { pushState: false });
});

// Attach SPA navigation events to server items in global sidebar
function attachSPAEventsToServerList() {
    const serverList = document.getElementById('globalServerList');
    if (!serverList) return;
    
    serverList.querySelectorAll('.server-item[data-server-id]').forEach(item => {
        const serverId = item.getAttribute('data-server-id');
        if (!serverId) return;
        
        item.addEventListener('click', (e) => {
            // Allow opening in a new tab/window
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

            const isOnChatPage = window.location.pathname.endsWith('/chat');
            if (isOnChatPage && typeof window.CoCoCordChat !== 'undefined' && window.CoCoCordChat.selectServer) {
                e.preventDefault();
                window.CoCoCordChat.selectServer(Number(serverId));
                return;
            }

            if (typeof spaNavigate === 'function') {
                e.preventDefault();
                spaNavigate(item.href);
            }
        });
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    initGlobalSidebar();
    loadGlobalUserPanel(); // Load and init UCP
    
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
    loadUserInfo,
    loadGlobalServers,
    openGlobalModal,
    closeGlobalModal,
    updateGlobalUserPanel,
    renderGlobalUserPanel
};
