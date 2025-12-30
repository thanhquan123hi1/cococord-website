/* Friends & Direct Messages - Discord-like Dark Theme */

(() => {
    'use strict';

    // ==================== STATE ====================
    const state = {
        currentUser: null,
        servers: [],
        friends: [],
        requests: [],
        dmItems: [],
        activeTab: 'online',
        presenceByUsername: new Map(),
        stomp: null,
        dmSearch: '',
        friendsSearch: ''
    };

    // ==================== DOM ELEMENTS ====================
    const els = {
        // Server bar
        serverList: () => document.getElementById('serverList'),
        addServerBtn: () => document.getElementById('addServerBtn'),
        
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
        friendsList: () => document.getElementById('friendsList'),
        friendsSearch: () => document.getElementById('friendsSearch'),
        mainToolbar: () => document.querySelector('.main-toolbar'),
        
        // Add friend
        addFriendBtn: () => document.getElementById('addFriendBtn'),
        addFriendView: () => document.getElementById('addFriendView'),
        addFriendInput: () => document.getElementById('addFriendInput'),
        sendFriendRequestBtn: () => document.getElementById('sendFriendRequestBtn'),
        addFriendHint: () => document.getElementById('addFriendHint')
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
        const discriminator = user?.discriminator || discriminatorFromId(user?.id);
        return `${username}#${discriminator}`;
    }

    function statusText(user) {
        return user?.customStatus || user?.bio || '';
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

    async function loadFriends() {
        state.friends = (await apiJson('/api/friends', { method: 'GET' })) || [];
    }

    async function loadRequests() {
        state.requests = (await apiJson('/api/friends/requests', { method: 'GET' })) || [];
    }

    async function loadDmSidebar() {
        state.dmItems = (await apiJson('/api/direct-messages/sidebar', { method: 'GET' })) || [];
    }

    // ==================== RENDER FUNCTIONS ====================
    function renderUserPanel() {
        const user = state.currentUser;
        const nameEl = els.ucpName();
        const statusEl = els.ucpStatus();
        const dotEl = els.ucpStatusDot();
        const avatarEl = els.ucpAvatar();

        if (nameEl) {
            nameEl.textContent = displayName(user);
            nameEl.title = fullUsername(user);
        }
        
        if (statusEl) {
            const customStatus = user?.customStatus;
            statusEl.textContent = customStatus || 'Trực tuyến';
        }
        
        if (dotEl) {
            dotEl.classList.add('online');
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
                const unreadText = unread > 99 ? '99+' : String(unread);
                return `
                    <div class="dm-row" role="listitem" data-dm-group-id="${it.dmGroupId}" data-user-id="${it.userId}">
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
                const userId = row.getAttribute('data-user-id');
                if (dmGroupId) {
                    localStorage.setItem('activeDmGroupId', String(dmGroupId));
                    window.location.href = `/messages?dmGroupId=${encodeURIComponent(dmGroupId)}`;
                    return;
                }
                if (userId) openDM(userId);
            });
        });
    }

    function renderFriendsList() {
        const container = els.friendsList();
        if (!container) return;

        const q = state.friendsSearch.trim().toLowerCase();
        let list = state.friends.slice();

        // Filter based on active tab
        if (state.activeTab === 'online') {
            list = list.filter(isOnline);
        } else if (state.activeTab === 'pending') {
            renderPendingRequests();
            return;
        } else if (state.activeTab === 'blocked') {
            container.innerHTML = emptyState('Không có người dùng bị chặn');
            return;
        }

        if (q) {
            list = list.filter((f) => {
                const key = `${displayName(f)} ${f.username || ''} ${statusText(f)}`.toLowerCase();
                return key.includes(q);
            });
        }

        if (!list.length) {
            const message = state.activeTab === 'online' 
                ? 'Không có bạn bè nào trực tuyến' 
                : 'Không có bạn bè';
            container.innerHTML = emptyState(message);
            return;
        }

        // Group header
        const headerText = state.activeTab === 'online' ? 'TRỰC TUYẾN' : 'TẤT CẢ BẠN BÈ';
        
        container.innerHTML = `
            <div style="padding: 16px 16px 8px; font-size: 12px; font-weight: 600; color: var(--channel-icon); text-transform: uppercase;">
                ${headerText} — ${list.length}
            </div>
            ${list.map((f) => {
                const avatar = f.avatarUrl 
                    ? `<img src="${escapeHtml(f.avatarUrl)}" alt="">` 
                    : escapeHtml((displayName(f)).charAt(0).toUpperCase());
                const online = isOnline(f);
                const title = displayName(f);
                const subtitle = statusText(f) || (online ? 'Đang trực tuyến' : '');
                return `
                    <div class="friend-row" data-user-id="${f.id}">
                        <div class="friend-left">
                            <div class="avatar">${typeof avatar === 'string' && avatar.startsWith('<img') ? avatar : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:white;font-weight:600;">${avatar}</span>`}<span class="status-dot ${online ? 'online' : ''}"></span></div>
                            <div class="friend-meta">
                                <div class="friend-title">${escapeHtml(title)}</div>
                                <div class="friend-subtitle">${escapeHtml(subtitle)}</div>
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="icon-btn" type="button" title="Nhắn tin" data-action="chat" data-user-id="${f.id}"><i class="bi bi-chat-fill"></i></button>
                            <button class="icon-btn" type="button" title="Thêm" data-action="more" data-user-id="${f.id}"><i class="bi bi-three-dots-vertical"></i></button>
                        </div>
                    </div>
                `;
            }).join('')}
        `;

        // Wire up chat buttons
        container.querySelectorAll('button[data-action="chat"]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = btn.getAttribute('data-user-id');
                if (userId) openDM(userId);
            });
        });

        container.querySelectorAll('.friend-row').forEach((row) => {
            row.addEventListener('click', () => {
                const userId = row.getAttribute('data-user-id');
                if (userId) openDM(userId);
            });
        });
    }

    function renderPendingRequests() {
        const container = els.friendsList();
        if (!container) return;

        const q = state.friendsSearch.trim().toLowerCase();
        const requests = state.requests.slice();

        const reqFiltered = q
            ? requests.filter((r) => {
                const key = `${r.senderUsername || ''} ${r.senderDisplayName || ''} ${r.receiverUsername || ''} ${r.receiverDisplayName || ''} ${r.status || ''}`.toLowerCase();
                return key.includes(q);
            })
            : requests;

        if (!reqFiltered.length) {
            container.innerHTML = emptyState('Không có lời mời kết bạn đang chờ');
            return;
        }

        container.innerHTML = `
            <div style="padding: 16px 16px 8px; font-size: 12px; font-weight: 600; color: var(--channel-icon); text-transform: uppercase;">
                ĐANG CHỜ — ${reqFiltered.length}
            </div>
            ${reqFiltered.map((r) => {
                const isSentByMe = state.currentUser && r.senderUsername === state.currentUser.username;
                const name = isSentByMe
                    ? (r.receiverDisplayName || r.receiverUsername || 'Unknown')
                    : (r.senderDisplayName || r.senderUsername || 'Unknown');

                const subtitle = isSentByMe ? 'Lời mời kết bạn đã gửi' : 'Lời mời kết bạn nhận được';
                const avatarUrl = isSentByMe ? r.receiverAvatarUrl : r.senderAvatarUrl;
                const id = isSentByMe ? r.receiverId : r.senderId;

                const avatar = avatarUrl 
                    ? `<img src="${escapeHtml(avatarUrl)}" alt="">` 
                    : escapeHtml(name.charAt(0).toUpperCase());

                const actions = !isSentByMe && String(r.status || '').toUpperCase() === 'PENDING'
                    ? `
                        <button class="icon-btn" type="button" title="Chấp nhận" data-action="accept" data-req-id="${r.id}" style="color: var(--discord-green);"><i class="bi bi-check-lg"></i></button>
                        <button class="icon-btn" type="button" title="Từ chối" data-action="decline" data-req-id="${r.id}" style="color: var(--discord-red);"><i class="bi bi-x-lg"></i></button>
                    `
                    : `
                        <button class="icon-btn" type="button" title="Hủy" data-action="cancel" data-req-id="${r.id}" style="color: var(--discord-red);"><i class="bi bi-x-lg"></i></button>
                    `;

                return `
                    <div class="friend-row" data-user-id="${id}">
                        <div class="friend-left">
                            <div class="avatar">${typeof avatar === 'string' && avatar.startsWith('<img') ? avatar : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:white;font-weight:600;">${avatar}</span>`}<span class="status-dot"></span></div>
                            <div class="friend-meta">
                                <div class="friend-title">${escapeHtml(name)}</div>
                                <div class="friend-subtitle">${escapeHtml(subtitle)}</div>
                            </div>
                        </div>
                        <div class="friend-actions">${actions}</div>
                    </div>
                `;
            }).join('')}
        `;

        // Wire up action buttons
        container.querySelectorAll('button[data-action]').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const reqId = btn.getAttribute('data-req-id');
                if (!action || !reqId) return;

                try {
                    if (action === 'accept') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/accept`, { method: 'POST' });
                    if (action === 'decline') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/decline`, { method: 'POST' });
                    if (action === 'cancel') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/cancel`, { method: 'POST' });
                    await loadRequests();
                    await loadFriends();
                    render();
                } catch (err) {
                    alert(err?.message || 'Thao tác thất bại');
                }
            });
        });
    }

    function emptyState(text) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="bi bi-people"></i></div>
                <div class="empty-state-title">${escapeHtml(text)}</div>
            </div>
        `;
    }

    // ==================== ACTIONS ====================
    async function openDM(userId) {
        try {
            const dmGroup = await apiJson(`/api/direct-messages/create-dm/${encodeURIComponent(userId)}`, { method: 'POST' });
            if (dmGroup?.id) {
                window.location.href = `/messages?dmGroupId=${encodeURIComponent(dmGroup.id)}`;
            }
        } catch (err) {
            alert(err?.message || 'Không thể mở DM');
        }
    }

    async function sendFriendRequest() {
        const input = els.addFriendInput();
        const hint = els.addFriendHint();
        const value = (input?.value || '').trim();
        
        if (hint) {
            hint.textContent = '';
            hint.className = 'add-friend-hint';
        }
        
        if (!value) return;

        try {
            const results = await apiJson(`/api/users/search?query=${encodeURIComponent(value)}`, { method: 'GET' });
            const users = Array.isArray(results) ? results : [];
            const exact = users.find((u) => String(u.username || '').toLowerCase() === value.toLowerCase())
                || users.find((u) => String(u.email || '').toLowerCase() === value.toLowerCase());

            const target = exact || (users.length === 1 ? users[0] : null);
            if (!target?.id) {
                if (hint) {
                    hint.textContent = users.length ? 'Có nhiều kết quả. Hãy nhập chính xác username.' : 'Không tìm thấy người dùng.';
                    hint.className = 'add-friend-hint error';
                }
                return;
            }

            await apiJson('/api/friends/requests', {
                method: 'POST',
                body: JSON.stringify({ receiverUserId: target.id })
            });

            if (hint) {
                hint.textContent = `Đã gửi lời mời kết bạn tới ${target.displayName || target.username}!`;
                hint.className = 'add-friend-hint success';
            }
            if (input) input.value = '';
            await loadRequests();
            setActiveTab('pending');
        } catch (err) {
            if (hint) {
                hint.textContent = err?.message || 'Gửi lời mời thất bại';
                hint.className = 'add-friend-hint error';
            }
        }
    }

    // ==================== TAB MANAGEMENT ====================
    function setActiveTab(tab) {
        state.activeTab = tab;
        document.querySelectorAll('.tab').forEach((b) => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });
        hideAddFriendView();
        render();
    }

    function showAddFriendView() {
        const list = els.friendsList();
        const view = els.addFriendView();
        const toolbar = els.mainToolbar();
        if (list) list.style.display = 'none';
        if (view) view.style.display = 'block';
        if (toolbar) toolbar.style.display = 'none';
        const hint = els.addFriendHint();
        if (hint) {
            hint.textContent = '';
            hint.className = 'add-friend-hint';
        }
        setTimeout(() => els.addFriendInput()?.focus(), 0);
    }

    function hideAddFriendView() {
        const list = els.friendsList();
        const view = els.addFriendView();
        const toolbar = els.mainToolbar();
        if (view) view.style.display = 'none';
        if (list) list.style.display = 'block';
        if (toolbar) toolbar.style.display = 'block';
    }

    function toggleSettingsDropdown() {
        const dropdown = els.settingsDropdown();
        if (!dropdown) return;
        const isVisible = dropdown.style.display !== 'none';
        dropdown.style.display = isVisible ? 'none' : 'block';
    }

    // ==================== WEBSOCKET ====================
    function connectPresence() {
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
                            state.presenceByUsername.set(presence.username, presence.status || presence);
                            render();
                        }
                    } catch (_) { /* ignore */ }
                });

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
        // Tab buttons
        document.querySelectorAll('.tab').forEach((btn) => {
            btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
        });

        // Search inputs
        els.globalSearch()?.addEventListener('input', (e) => {
            state.dmSearch = e.target.value || '';
            renderDmList();
        });

        els.friendsSearch()?.addEventListener('input', (e) => {
            state.friendsSearch = e.target.value || '';
            renderFriendsList();
        });

        // Add friend
        els.addFriendBtn()?.addEventListener('click', showAddFriendView);
        els.sendFriendRequestBtn()?.addEventListener('click', sendFriendRequest);
        els.addFriendInput()?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendFriendRequest();
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

        // Prevent menu items from navigating (placeholders)
        document.querySelectorAll('a.nav-item[href="#"]').forEach((a) => {
            a.addEventListener('click', (e) => e.preventDefault());
        });
    }

    // ==================== RENDER ====================
    function render() {
        renderDmList();
        renderFriendsList();
    }

    // ==================== INIT ====================
    async function init() {
        wireEvents();

        await loadCurrentUser();
        await Promise.all([loadServers(), loadFriends(), loadRequests(), loadDmSidebar()]);
        renderServerBar();

        connectPresence();
        render();
    }

    document.addEventListener('DOMContentLoaded', () => {
        init().catch((e) => {
            console.error('Friends init failed', e);
        });
    });
})();
