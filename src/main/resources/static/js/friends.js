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
        const discriminator = discriminatorFromId(user?.id);
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
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Only set Content-Type for requests with body
        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }

        try {
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
            
            // Check if response has content
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            }
            return null;
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
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
        if (!userId) {
            console.error('openDM: userId is required');
            return;
        }
        try {
            console.log('Opening DM with userId:', userId);
            const dmGroup = await apiJson(`/api/direct-messages/create-dm/${encodeURIComponent(userId)}`, { method: 'POST' });
            console.log('DM Group response:', dmGroup);
            if (dmGroup?.id) {
                window.location.href = `/messages?dmGroupId=${encodeURIComponent(dmGroup.id)}`;
            } else {
                console.error('DM Group has no id:', dmGroup);
                alert('Không thể mở tin nhắn. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('openDM error:', err);
            // Don't show alert for JSON parse errors, just log
            if (err.message && err.message.includes('JSON')) {
                console.error('JSON parse error - server may have returned invalid response');
            }
            alert('Không thể mở tin nhắn. Vui lòng thử lại.');
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
            // Close context menu on outside click
            const contextMenu = document.getElementById('serverContextMenu');
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        // Prevent menu items from navigating (placeholders)
        document.querySelectorAll('a.nav-item[href="#"]').forEach((a) => {
            a.addEventListener('click', (e) => e.preventDefault());
        });

        // Disable browser right-click on app
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Add Server Button - Left click opens context menu
        const addServerBtn = document.getElementById('addServerBtn');
        if (addServerBtn) {
            addServerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showServerContextMenu(e);
            });

            // Right click also opens context menu
            addServerBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showServerContextMenu(e);
            });
        }

        // Context menu items
        document.getElementById('ctxJoinServer')?.addEventListener('click', () => {
            hideServerContextMenu();
            showJoinServerModal();
        });

        document.getElementById('ctxCreateServer')?.addEventListener('click', () => {
            hideServerContextMenu();
            showCreateServerModal();
        });

        // Modal buttons
        document.getElementById('closeCreateServerModal')?.addEventListener('click', hideCreateServerModal);
        document.getElementById('backToStep1')?.addEventListener('click', showCreateServerStep1);
        document.getElementById('confirmCreateServer')?.addEventListener('click', createServer);
        document.getElementById('cancelJoinServer')?.addEventListener('click', hideJoinServerModal);
        document.getElementById('confirmJoinServer')?.addEventListener('click', joinServer);
        document.getElementById('switchToJoinServer')?.addEventListener('click', () => {
            hideCreateServerModal();
            showJoinServerModal();
        });

        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const template = btn.getAttribute('data-template');
                showCreateServerStep2(template);
            });
        });

        // Server icon upload
        const uploadCircle = document.getElementById('uploadCircle');
        const serverIconInput = document.getElementById('serverIconInput');
        const uploadedIcon = document.getElementById('uploadedIcon');

        uploadCircle?.addEventListener('click', () => {
            serverIconInput?.click();
        });

        serverIconInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (uploadedIcon && uploadCircle) {
                        uploadedIcon.src = ev.target.result;
                        uploadedIcon.style.display = 'block';
                        uploadCircle.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            }
        });

        // Close modals on overlay click
        document.getElementById('createServerModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'createServerModal') hideCreateServerModal();
        });
        document.getElementById('joinServerModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'joinServerModal') hideJoinServerModal();
        });
        document.getElementById('createChannelModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'createChannelModal') hideCreateChannelModal();
        });
        document.getElementById('inviteFriendsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'inviteFriendsModal') hideInviteFriendsModal();
        });

        // Invite Friends Modal
        document.getElementById('closeInviteFriendsModal')?.addEventListener('click', hideInviteFriendsModal);
        document.getElementById('copyInviteLinkBtn')?.addEventListener('click', copyInviteLink);
        document.getElementById('inviteFriendSearch')?.addEventListener('input', (e) => {
            filterInviteFriends(e.target.value);
        });

        // Create Channel Modal
        document.getElementById('closeCreateChannelModal')?.addEventListener('click', hideCreateChannelModal);
        document.getElementById('cancelCreateChannel')?.addEventListener('click', hideCreateChannelModal);
        document.getElementById('confirmCreateChannel')?.addEventListener('click', createChannel);

        // Channel type selection
        document.querySelectorAll('.channel-type-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.channel-type-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                const type = option.getAttribute('data-type');
                const icon = document.getElementById('channelNameIcon');
                if (icon) {
                    icon.className = type === 'voice' ? 'bi bi-volume-up-fill' : 'bi bi-hash';
                }
            });
        });

        // User panel action buttons - Mute/Deafen
        const muteBtn = document.getElementById('muteBtn');
        const deafenBtn = document.getElementById('deafenBtn');

        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = muteBtn.getAttribute('data-muted') === 'true';
                muteBtn.setAttribute('data-muted', !isMuted);
                muteBtn.classList.toggle('muted', !isMuted);
                muteBtn.innerHTML = !isMuted 
                    ? '<i class="bi bi-mic-mute-fill"></i>' 
                    : '<i class="bi bi-mic-fill"></i>';
                muteBtn.title = !isMuted ? 'Bật tiếng' : 'Tắt tiếng';
            });
        }

        if (deafenBtn) {
            deafenBtn.addEventListener('click', () => {
                const isDeafened = deafenBtn.getAttribute('data-deafened') === 'true';
                deafenBtn.setAttribute('data-deafened', !isDeafened);
                deafenBtn.classList.toggle('deafened', !isDeafened);
                deafenBtn.innerHTML = !isDeafened 
                    ? '<i class="bi bi-headphones"></i><span style="position:absolute;width:2px;height:20px;background:var(--discord-red);transform:rotate(45deg);"></span>' 
                    : '<i class="bi bi-headphones"></i>';
                deafenBtn.title = !isDeafened ? 'Bật âm thanh' : 'Tắt âm thanh';
                deafenBtn.style.position = !isDeafened ? 'relative' : '';
            });
        }
    }

    // ==================== SERVER CONTEXT MENU ====================
    function showServerContextMenu(e) {
        const menu = document.getElementById('serverContextMenu');
        if (!menu) return;

        const btn = document.getElementById('addServerBtn');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        menu.style.left = (rect.right + 8) + 'px';
        menu.style.top = rect.top + 'px';
        menu.style.display = 'block';
    }

    function hideServerContextMenu() {
        const menu = document.getElementById('serverContextMenu');
        if (menu) menu.style.display = 'none';
    }

    // ==================== CREATE SERVER MODAL ====================
    function showCreateServerModal() {
        const modal = document.getElementById('createServerModal');
        if (modal) modal.style.display = 'flex';
        showCreateServerStep1();
    }

    function hideCreateServerModal() {
        const modal = document.getElementById('createServerModal');
        if (modal) modal.style.display = 'none';
        // Reset modal state
        showCreateServerStep1();
        const input = document.getElementById('serverNameInput');
        const uploadCircle = document.getElementById('uploadCircle');
        const uploadedIcon = document.getElementById('uploadedIcon');
        const serverIconInput = document.getElementById('serverIconInput');
        if (input) input.value = '';
        if (uploadCircle) uploadCircle.style.display = 'flex';
        if (uploadedIcon) {
            uploadedIcon.style.display = 'none';
            uploadedIcon.src = '';
        }
        if (serverIconInput) serverIconInput.value = '';
    }

    function showCreateServerStep1() {
        const step1 = document.getElementById('createServerStep1');
        const step2 = document.getElementById('createServerStep2');
        if (step1) step1.style.display = 'flex';
        if (step2) step2.style.display = 'none';
    }

    function showCreateServerStep2(template) {
        const step1 = document.getElementById('createServerStep1');
        const step2 = document.getElementById('createServerStep2');
        const input = document.getElementById('serverNameInput');
        
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'flex';
        
        // Set default name based on template
        const templateNames = {
            'custom': 'Máy chủ của ' + (state.currentUser?.displayName || state.currentUser?.username || 'bạn'),
            'gaming': 'Nhóm Game',
            'school': 'CLB Trường học',
            'study': 'Nhóm Học tập',
            'friends': 'Nhóm Bạn bè'
        };
        
        if (input) {
            input.value = templateNames[template] || templateNames['custom'];
            setTimeout(() => input.focus(), 100);
        }
    }

    async function createServer() {
        const input = document.getElementById('serverNameInput');
        const name = (input?.value || '').trim();
        if (!name) {
            input?.focus();
            return;
        }

        try {
            const server = await apiJson('/api/servers', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            if (server?.id) {
                hideCreateServerModal();
                await loadServers();
                renderServerBar();
                // Navigate to new server
                window.location.href = `/chat?serverId=${encodeURIComponent(server.id)}`;
            }
        } catch (err) {
            alert(err?.message || 'Tạo máy chủ thất bại');
        }
    }

    // ==================== JOIN SERVER MODAL ====================
    function showJoinServerModal() {
        const modal = document.getElementById('joinServerModal');
        const input = document.getElementById('inviteCodeInput');
        if (modal) modal.style.display = 'flex';
        if (input) {
            input.value = '';
            setTimeout(() => input.focus(), 100);
        }
    }

    function hideJoinServerModal() {
        const modal = document.getElementById('joinServerModal');
        if (modal) modal.style.display = 'none';
    }

    async function joinServer() {
        const input = document.getElementById('inviteCodeInput');
        const value = (input?.value || '').trim();
        if (!value) {
            input?.focus();
            return;
        }

        // Extract invite code from URL if full URL provided
        let inviteCode = value;
        if (value.includes('/invite/')) {
            inviteCode = value.split('/invite/').pop().split(/[?#]/)[0];
        }

        try {
            const result = await apiJson(`/api/invites/${encodeURIComponent(inviteCode)}/join`, {
                method: 'POST'
            });
            if (result?.serverId || result?.id) {
                hideJoinServerModal();
                await loadServers();
                renderServerBar();
                const serverId = result.serverId || result.id;
                window.location.href = `/chat?serverId=${encodeURIComponent(serverId)}`;
            }
        } catch (err) {
            alert(err?.message || 'Không thể tham gia máy chủ. Mã mời không hợp lệ.');
        }
    }

    // ==================== CREATE CHANNEL MODAL ====================
    let createChannelServerId = null;
    let createChannelCategoryId = null;

    function showCreateChannelModal(serverId, categoryId = null, categoryName = null) {
        createChannelServerId = serverId;
        createChannelCategoryId = categoryId;
        
        const modal = document.getElementById('createChannelModal');
        const input = document.getElementById('channelNameInput');
        const categoryLabel = document.getElementById('channelCategoryName');
        const privateToggle = document.getElementById('privateChannelToggle');
        
        if (modal) modal.style.display = 'flex';
        if (input) {
            input.value = '';
            setTimeout(() => input.focus(), 100);
        }
        if (categoryLabel) {
            categoryLabel.textContent = categoryName ? `trong ${categoryName}` : '';
        }
        if (privateToggle) {
            privateToggle.checked = false;
        }
        
        // Reset channel type to text
        document.querySelectorAll('.channel-type-option').forEach(o => o.classList.remove('selected'));
        document.querySelector('.channel-type-option[data-type="text"]')?.classList.add('selected');
        const icon = document.getElementById('channelNameIcon');
        if (icon) icon.className = 'bi bi-hash';
    }

    function hideCreateChannelModal() {
        const modal = document.getElementById('createChannelModal');
        if (modal) modal.style.display = 'none';
        createChannelServerId = null;
        createChannelCategoryId = null;
    }

    async function createChannel() {
        if (!createChannelServerId) {
            alert('Vui lòng chọn một máy chủ.');
            return;
        }

        const input = document.getElementById('channelNameInput');
        const privateToggle = document.getElementById('privateChannelToggle');
        const selectedType = document.querySelector('.channel-type-option.selected');
        
        let name = (input?.value || '').trim();
        if (!name) {
            input?.focus();
            return;
        }

        // Convert to lowercase and replace spaces with hyphens
        name = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF-]/g, '');

        const channelType = selectedType?.getAttribute('data-type') || 'text';
        const isPrivate = privateToggle?.checked || false;

        try {
            const channel = await apiJson(`/api/servers/${encodeURIComponent(createChannelServerId)}/channels`, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    type: channelType.toUpperCase(),
                    categoryId: createChannelCategoryId,
                    isPrivate
                })
            });
            
            if (channel?.id) {
                hideCreateChannelModal();
                // Reload or navigate to the new channel
                window.location.href = `/chat?serverId=${encodeURIComponent(createChannelServerId)}&channelId=${encodeURIComponent(channel.id)}`;
            }
        } catch (err) {
            alert(err?.message || 'Tạo kênh thất bại');
        }
    }

    // ==================== INVITE FRIENDS MODAL ====================
    let inviteServerId = null;
    let inviteServerName = '';
    let inviteCode = '';
    let inviteFriendsList = [];
    let invitedFriends = new Set();

    async function showInviteFriendsModal(serverId, serverName) {
        inviteServerId = serverId;
        inviteServerName = serverName || 'Máy chủ';
        invitedFriends.clear();

        const modal = document.getElementById('inviteFriendsModal');
        const serverNameEl = document.getElementById('inviteServerName');
        const searchInput = document.getElementById('inviteFriendSearch');
        
        if (modal) modal.style.display = 'flex';
        if (serverNameEl) serverNameEl.textContent = inviteServerName;
        if (searchInput) searchInput.value = '';

        // Load friends and invite link
        await Promise.all([loadFriendsForInvite(), generateInviteLink()]);
        renderInviteFriendsList();
    }

    function hideInviteFriendsModal() {
        const modal = document.getElementById('inviteFriendsModal');
        if (modal) modal.style.display = 'none';
        inviteServerId = null;
        inviteServerName = '';
        inviteCode = '';
        inviteFriendsList = [];
        invitedFriends.clear();
    }

    async function loadFriendsForInvite() {
        try {
            inviteFriendsList = (await apiJson('/api/friends', { method: 'GET' })) || [];
        } catch (err) {
            console.error('Failed to load friends:', err);
            inviteFriendsList = [];
        }
    }

    async function generateInviteLink() {
        if (!inviteServerId) return;
        
        try {
            const invite = await apiJson(`/api/servers/${encodeURIComponent(inviteServerId)}/invites`, {
                method: 'POST',
                body: JSON.stringify({ maxUses: 0, expiresInDays: 7 })
            });
            
            inviteCode = invite?.code || '';
            const linkInput = document.getElementById('inviteLinkInput');
            if (linkInput && inviteCode) {
                linkInput.value = `${window.location.origin}/invite/${inviteCode}`;
            }
        } catch (err) {
            console.error('Failed to generate invite:', err);
            const linkInput = document.getElementById('inviteLinkInput');
            if (linkInput) {
                linkInput.value = 'Không thể tạo link mời';
            }
        }
    }

    function renderInviteFriendsList(filter = '') {
        const container = document.getElementById('inviteFriendsList');
        if (!container) return;

        const q = filter.trim().toLowerCase();
        const filtered = inviteFriendsList.filter(f => {
            if (!q) return true;
            const name = `${f.displayName || ''} ${f.username || ''}`.toLowerCase();
            return name.includes(q);
        });

        if (!filtered.length) {
            container.innerHTML = `<div class="invite-empty">${filter ? 'Không tìm thấy bạn bè' : 'Bạn chưa có bạn bè nào'}</div>`;
            return;
        }

        container.innerHTML = filtered.map(friend => {
            const avatarHtml = friend.avatarUrl 
                ? `<img src="${escapeHtml(friend.avatarUrl)}" alt="">`
                : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${escapeHtml((friend.displayName || friend.username || 'U').charAt(0).toUpperCase())}</span>`;
            
            const isInvited = invitedFriends.has(friend.id);
            const online = isOnline(friend);
            
            return `
                <div class="invite-friend-row" data-friend-id="${friend.id}">
                    <div class="invite-friend-avatar">
                        ${avatarHtml}
                        <span class="status-dot ${online ? 'online' : ''}"></span>
                    </div>
                    <span class="invite-friend-name">${escapeHtml(friend.displayName || friend.username || 'Unknown')}</span>
                    <button class="btn-invite ${isInvited ? 'invited' : ''}" ${isInvited ? 'disabled' : ''} onclick="inviteFriend(${friend.id})">
                        ${isInvited ? 'Đã mời' : 'Mời'}
                    </button>
                </div>
            `;
        }).join('');
    }

    function filterInviteFriends(query) {
        renderInviteFriendsList(query);
    }

    async function inviteFriend(friendId) {
        if (!inviteServerId || !friendId) return;
        
        // Mark as invited immediately for better UX
        invitedFriends.add(friendId);
        renderInviteFriendsList(document.getElementById('inviteFriendSearch')?.value || '');

        try {
            // Send DM with invite link
            const friend = inviteFriendsList.find(f => f.id === friendId);
            if (friend) {
                // Find or create DM group with this friend
                const dmGroup = await apiJson(`/api/direct-messages/find-or-create?userId=${encodeURIComponent(friendId)}`, {
                    method: 'POST'
                });
                
                if (dmGroup?.id) {
                    const inviteLink = document.getElementById('inviteLinkInput')?.value || '';
                    await apiJson(`/api/direct-messages/${encodeURIComponent(dmGroup.id)}/messages`, {
                        method: 'POST',
                        body: JSON.stringify({
                            content: `Bạn được mời tham gia máy chủ ${inviteServerName}!\n${inviteLink}`,
                            attachmentUrls: []
                        })
                    });
                }
            }
        } catch (err) {
            console.error('Failed to send invite:', err);
        }
    }

    // Make inviteFriend accessible globally for onclick
    window.inviteFriend = inviteFriend;

    async function copyInviteLink() {
        const linkInput = document.getElementById('inviteLinkInput');
        const copyBtn = document.getElementById('copyInviteLinkBtn');
        
        if (!linkInput?.value) return;

        try {
            await navigator.clipboard.writeText(linkInput.value);
            if (copyBtn) {
                copyBtn.textContent = 'Đã sao chép!';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = 'Sao chép';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback: select the text
            linkInput.select();
            document.execCommand('copy');
        }
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
