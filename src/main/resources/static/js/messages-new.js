/* Direct Messages Page - Discord-like Dark Theme */

(() => {
    'use strict';

    // ==================== STATE ====================
    const state = {
        currentUser: null,
        servers: [],
        dmItems: [],
        presenceByUsername: new Map(),
        dmGroupId: null,
        dmGroup: null,
        otherUser: null,
        messages: [],
        stomp: null,
        dmSearch: ''
    };

    // ==================== DOM ELEMENTS ====================
    const els = {
        // Server bar
        serverList: () => document.getElementById('serverList'),
        
        // DM sidebar
        globalSearch: () => document.getElementById('globalSearch'),
        dmList: () => document.getElementById('dmList'),
        
        // User panel
        ucpAvatar: () => document.getElementById('ucpAvatar'),
        ucpName: () => document.getElementById('ucpName'),
        ucpStatus: () => document.getElementById('ucpStatus'),
        ucpStatusDot: () => document.getElementById('ucpStatusDot'),
        settingsBtn: () => document.getElementById('settingsBtn'),
        settingsDropdown: () => document.getElementById('settingsDropdown'),
        logoutBtn: () => document.getElementById('logoutBtn'),
        
        // Main content
        dmTitle: () => document.getElementById('dmTitle'),
        headerStatus: () => document.getElementById('headerStatus'),
        messagesArea: () => document.getElementById('messagesArea'),
        messagesList: () => document.getElementById('messagesList'),
        emptyState: () => document.getElementById('emptyState'),
        dmStart: () => document.getElementById('dmStart'),
        dmStartAvatar: () => document.getElementById('dmStartAvatar'),
        dmStartName: () => document.getElementById('dmStartName'),
        dmStartInfo: () => document.getElementById('dmStartInfo'),
        composer: () => document.getElementById('composer'),
        messageInput: () => document.getElementById('messageInput'),
        
        // Profile panel
        profilePanel: () => document.getElementById('profilePanel'),
        profileAvatar: () => document.getElementById('profileAvatar'),
        profileName: () => document.getElementById('profileName'),
        profileUsername: () => document.getElementById('profileUsername'),
        profileBio: () => document.getElementById('profileBio'),
        profileJoined: () => document.getElementById('profileJoined')
    };

    // ==================== UTILITIES ====================
    function safeText(value) {
        return (value ?? '').toString();
    }

    function escapeHtml(str) {
        return safeText(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function discriminatorFromId(id) {
        const n = Number(id);
        if (!Number.isFinite(n)) return '0000';
        return String(n % 10000).padStart(4, '0');
    }

    function displayName(user) {
        return user?.displayName || user?.username || 'Unknown';
    }

    function fullUsername(user) {
        const username = user?.username || 'unknown';
        const discriminator = discriminatorFromId(user?.id);
        return `${username}#${discriminator}`;
    }

    function isOnline(user) {
        const username = user?.username;
        if (!username) return false;
        const presence = state.presenceByUsername.get(username);
        const p = presence?.status || presence;
        if (p) return String(p).toUpperCase() === 'ONLINE';
        const s = user?.status;
        return String(s || '').toUpperCase() === 'ONLINE';
    }

    function formatTimestamp(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        if (isToday) {
            return `Hôm nay lúc ${time}`;
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();
        
        if (isYesterday) {
            return `Hôm qua lúc ${time}`;
        }
        
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ` ${time}`;
    }

    async function apiJson(url, options = {}) {
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (!response) return null;
        if (response.status === 204) return null;
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return null;
            }
            const text = await response.text().catch(() => '');
            throw new Error(text || `Request failed: ${response.status}`);
        }
        return response.json();
    }

    // ==================== DATA LOADING ====================
    async function loadCurrentUser() {
        state.currentUser = await apiJson('/api/auth/me', { method: 'GET' });
        try {
            localStorage.setItem('user', JSON.stringify(state.currentUser || {}));
        } catch (_) { /* ignore */ }
        renderUserPanel();
    }

    async function loadServers() {
        state.servers = (await apiJson('/api/servers', { method: 'GET' })) || [];
    }

    async function loadDmSidebar() {
        state.dmItems = (await apiJson('/api/direct-messages/sidebar', { method: 'GET' })) || [];
    }

    function readQuery() {
        const url = new URL(window.location.href);
        const dmGroupId = url.searchParams.get('dmGroupId');
        if (dmGroupId) state.dmGroupId = dmGroupId;
    }

    async function loadDmGroupAndMessages() {
        if (!state.dmGroupId) return;

        state.dmGroup = await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}`, { method: 'GET' });
        const page = await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}/messages?page=0&size=50`, { method: 'GET' });

        // Spring Data Page
        state.messages = (page && Array.isArray(page.content)) ? page.content.slice().reverse() : [];

        // Find other user in DM
        if (state.dmGroup && state.currentUser) {
            const members = state.dmGroup.members || state.dmGroup.participants || [];
            state.otherUser = members.find(m => m.id !== state.currentUser.id) || members[0];
        }

        // Find from sidebar if not in group
        if (!state.otherUser && state.dmItems.length > 0) {
            const dmItem = state.dmItems.find(it => String(it.dmGroupId) === String(state.dmGroupId));
            if (dmItem) {
                state.otherUser = {
                    id: dmItem.userId,
                    username: dmItem.username,
                    displayName: dmItem.displayName,
                    avatarUrl: dmItem.avatarUrl
                };
            }
        }

        try {
            await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}/read`, { method: 'POST' });
        } catch (_) { /* ignore */ }
    }

    // ==================== RENDER FUNCTIONS ====================
    function renderUserPanel() {
        const user = state.currentUser;
        const nameEl = els.ucpName();
        const statusEl = els.ucpStatus();
        const avatarEl = els.ucpAvatar();

        if (nameEl) {
            nameEl.textContent = displayName(user);
            nameEl.title = fullUsername(user);
        }
        
        if (statusEl) {
            const customStatus = user?.customStatus;
            statusEl.textContent = customStatus || 'Trực tuyến';
        }
        
        if (avatarEl) {
            const url = user?.avatarUrl;
            if (url) {
                avatarEl.innerHTML = `<img src="${escapeHtml(url)}" alt="${escapeHtml(displayName(user))}"><span class="status-dot online" id="ucpStatusDot"></span>`;
            } else {
                avatarEl.innerHTML = `${escapeHtml(displayName(user).charAt(0).toUpperCase())}<span class="status-dot online" id="ucpStatusDot"></span>`;
            }
        }
    }

    function renderServerBar() {
        const container = els.serverList();
        if (!container) return;

        const servers = (state.servers || []).slice(0, 50);
        container.innerHTML = '';

        if (!servers.length) return;

        for (const s of servers) {
            const name = safeText(s.name || 'Server');
            const id = s.id;
            const href = `/chat?serverId=${encodeURIComponent(id)}`;

            const a = document.createElement('a');
            a.className = 'server-btn server';
            a.href = href;
            a.title = name;

            if (s.iconUrl) {
                a.innerHTML = `<img src="${escapeHtml(s.iconUrl)}" alt="${escapeHtml(name)}" />`;
            } else {
                const initial = name.trim().charAt(0).toUpperCase() || 'S';
                a.innerHTML = `<span>${escapeHtml(initial)}</span>`;
            }

            container.appendChild(a);
        }
    }

    function renderDmList() {
        const container = els.dmList();
        if (!container) return;

        const q = state.dmSearch.trim().toLowerCase();
        const items = (state.dmItems || [])
            .filter((it) => {
                if (!q) return true;
                const key = `${it.displayName || ''} ${it.username || ''}`.toLowerCase();
                return key.includes(q);
            })
            .slice(0, 50);

        if (!items.length) {
            container.innerHTML = '<div style="padding: 8px 10px; color: var(--text-muted); font-size: 13px;">Không có kết quả</div>';
            return;
        }

        container.innerHTML = items
            .map((it) => {
                const online = isOnline(it);
                const avatar = it.avatarUrl 
                    ? `<img src="${escapeHtml(it.avatarUrl)}" alt="">` 
                    : escapeHtml((it.displayName || it.username || 'U').charAt(0).toUpperCase());
                const unread = Number(it.unreadCount || 0);
                const active = state.dmGroupId && String(it.dmGroupId) === String(state.dmGroupId);
                const unreadText = unread > 99 ? '99+' : String(unread);
                return `
                    <div class="dm-row ${active ? 'active' : ''}" role="listitem" data-dm-group-id="${it.dmGroupId}" data-user-id="${it.userId}">
                        <div class="avatar">${typeof avatar === 'string' && avatar.startsWith('<img') ? avatar : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:white;font-weight:600;">${avatar}</span>`}<span class="status-dot ${online ? 'online' : ''}"></span></div>
                        <span class="dm-name">${escapeHtml(it.displayName || it.username || 'Unknown')}</span>
                        <div class="dm-right">
                            <span class="unread-pill ${unread > 0 ? 'show' : ''}">${escapeHtml(unreadText)}</span>
                        </div>
                    </div>
                `;
            })
            .join('');

        container.querySelectorAll('.dm-row').forEach((row) => {
            row.addEventListener('click', () => {
                const dmGroupId = row.getAttribute('data-dm-group-id');
                if (!dmGroupId) return;
                localStorage.setItem('activeDmGroupId', String(dmGroupId));
                window.location.href = `/messages?dmGroupId=${encodeURIComponent(dmGroupId)}`;
            });
        });
    }

    function renderHeader() {
        const titleEl = els.dmTitle();
        const statusEl = els.headerStatus();
        const inputEl = els.messageInput();

        if (!state.dmGroupId) {
            if (titleEl) titleEl.textContent = 'Tin nhắn trực tiếp';
            if (statusEl) statusEl.textContent = '';
            return;
        }

        const name = displayName(state.otherUser) || state.dmGroup?.name || `DM #${state.dmGroupId}`;
        const online = isOnline(state.otherUser);

        if (titleEl) titleEl.textContent = name;
        if (statusEl) statusEl.textContent = online ? 'Đang trực tuyến' : '';
        if (inputEl) inputEl.placeholder = `Nhắn tin tới @${name}`;
    }

    function renderDmStart() {
        const dmStart = els.dmStart();
        const avatarEl = els.dmStartAvatar();
        const nameEl = els.dmStartName();
        const infoEl = els.dmStartInfo();

        if (!state.dmGroupId || !dmStart) return;

        dmStart.style.display = 'block';

        const user = state.otherUser;
        const name = displayName(user);
        const username = fullUsername(user);

        if (avatarEl) {
            if (user?.avatarUrl) {
                avatarEl.innerHTML = `<img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(name)}">`;
            } else {
                avatarEl.innerHTML = escapeHtml(name.charAt(0).toUpperCase());
            }
        }

        if (nameEl) nameEl.textContent = name;
        if (infoEl) infoEl.textContent = `Đây là khởi đầu cuộc trò chuyện của bạn với ${username}.`;
    }

    function renderMessages() {
        const container = els.messagesList();
        const emptyState = els.emptyState();
        const composer = els.composer();

        if (!container) return;

        if (!state.dmGroupId) {
            if (composer) composer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            container.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (composer) composer.style.display = 'block';

        if (!state.messages.length) {
            container.innerHTML = '';
            return;
        }

        let lastSenderId = null;
        let lastTime = null;

        const rows = state.messages.map((m, index) => {
            const senderId = m.senderId;
            const timestamp = new Date(m.createdAt || m.timestamp);
            const showHeader = senderId !== lastSenderId || 
                (lastTime && (timestamp - lastTime) > 5 * 60 * 1000); // 5 minutes

            lastSenderId = senderId;
            lastTime = timestamp;

            const name = m.senderDisplayName || m.senderUsername || 'Unknown';
            const avatar = m.senderAvatarUrl 
                ? `<img src="${escapeHtml(m.senderAvatarUrl)}" alt="">` 
                : escapeHtml(name.charAt(0).toUpperCase());
            const content = escapeHtml(m.content || '');
            const timeStr = formatTimestamp(m.createdAt || m.timestamp);

            if (showHeader) {
                return `
                    <div class="message-row has-header">
                        <div class="message-avatar">${typeof avatar === 'string' && avatar.startsWith('<img') ? avatar : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${avatar}</span>`}</div>
                        <div class="message-body">
                            <div class="message-header">
                                <span class="message-author">${escapeHtml(name)}</span>
                                <span class="message-timestamp">${escapeHtml(timeStr)}</span>
                            </div>
                            <div class="message-content">${content}</div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="message-row">
                        <div class="message-avatar-spacer"></div>
                        <div class="message-body">
                            <div class="message-content">${content}</div>
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = rows.join('');
    }

    function scrollToBottom() {
        const container = els.messagesArea();
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    }

    // ==================== ACTIONS ====================
    async function sendMessage(text) {
        if (!state.dmGroupId) return;
        const content = (text || '').trim();
        if (!content) return;

        const msg = await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content, attachmentUrls: [] })
        });

        if (msg) {
            state.messages.push(msg);
            renderMessages();
            scrollToBottom();
        }
    }

    function toggleSettingsDropdown() {
        const dropdown = els.settingsDropdown();
        if (!dropdown) return;
        const isVisible = dropdown.style.display !== 'none';
        dropdown.style.display = isVisible ? 'none' : 'block';
    }

    // ==================== WEBSOCKET ====================
    function connectPresenceAndDm() {
        const token = localStorage.getItem('accessToken');
        if (!token || !window.SockJS || !window.Stomp) return;

        const socket = new window.SockJS('/ws');
        const stomp = window.Stomp.over(socket);
        stomp.debug = null;

        stomp.connect(
            { Authorization: 'Bearer ' + token },
            () => {
                state.stomp = stomp;

                stomp.subscribe('/topic/presence', (msg) => {
                    try {
                        const presence = JSON.parse(msg.body);
                        if (presence?.username) {
                            state.presenceByUsername.set(presence.username, presence);
                            renderDmList();
                            renderHeader();
                        }
                    } catch (_) { /* ignore */ }
                });

                if (state.dmGroupId) {
                    stomp.subscribe(`/topic/dm/${state.dmGroupId}`, (msg) => {
                        try {
                            const m = JSON.parse(msg.body);
                            if (!m) return;
                            // Append live message
                            state.messages.push(m);
                            renderMessages();
                            scrollToBottom();
                        } catch (_) { /* ignore */ }
                    });
                }

                try {
                    stomp.send('/app/presence.update', {}, JSON.stringify({ status: 'ONLINE' }));
                } catch (_) { /* ignore */ }

                window.addEventListener('beforeunload', () => {
                    try {
                        stomp.send('/app/presence.update', {}, JSON.stringify({ status: 'OFFLINE' }));
                    } catch (_) { /* ignore */ }
                });
            },
            () => { /* ignore */ }
        );
    }

    // ==================== EVENT WIRING ====================
    function wireEvents() {
        // Search
        els.globalSearch()?.addEventListener('input', (e) => {
            state.dmSearch = e.target.value || '';
            renderDmList();
        });

        // Composer
        const form = els.composer();
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = els.messageInput();
            const value = input?.value || '';
            try {
                await sendMessage(value);
                if (input) input.value = '';
            } catch (err) {
                alert(err?.message || 'Gửi tin nhắn thất bại');
            }
        });

        // Settings dropdown
        els.settingsBtn()?.addEventListener('click', toggleSettingsDropdown);
        els.logoutBtn()?.addEventListener('click', () => {
            if (typeof logout === 'function') {
                logout();
            } else {
                localStorage.clear();
                window.location.href = '/login';
            }
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            const dropdown = els.settingsDropdown();
            const btn = els.settingsBtn();
            if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Prevent placeholder menu items from navigating
        document.querySelectorAll('a.nav-item[href="#"]').forEach((a) => {
            a.addEventListener('click', (e) => e.preventDefault());
        });
    }

    // ==================== INIT ====================
    async function init() {
        wireEvents();
        readQuery();

        await loadCurrentUser();
        if (state.dmGroupId) {
            localStorage.setItem('activeDmGroupId', String(state.dmGroupId));
        }

        await Promise.all([loadServers(), loadDmSidebar()]);
        renderServerBar();
        renderDmList();

        if (state.dmGroupId) {
            await loadDmGroupAndMessages();
        }

        // Refresh sidebar counts after marking as read
        await loadDmSidebar();
        renderDmList();

        renderHeader();
        renderDmStart();
        renderMessages();
        connectPresenceAndDm();

        if (state.dmGroupId) {
            scrollToBottom();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        init().catch((e) => {
            console.error('Messages init failed', e);
        });
    });
})();
