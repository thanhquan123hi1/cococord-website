/* CoCoCord /app page: persistent sidebar + dynamic main (friends) */

(() => {
    'use strict';

    const state = {
        currentUser: null,
        friends: [],
        requests: [],
        blocked: [],
        dmItems: [],
        dmMessages: [],
        activeDmGroupId: null,
        activeDmUser: null,
        activeTab: 'online',
        activeView: 'friends', // 'friends' or 'dm'
        friendsSearch: '',
        dmSearch: ''
    };

    // WebSocket for DM
    let stompClient = null;
    let dmSubscription = null;

    const els = {
        globalSearch: () => document.getElementById('globalSearch'),
        dmList: () => document.getElementById('dmList'),

        // Friends view
        mainArea: () => document.querySelector('.main-area'),
        friendsList: () => document.getElementById('friendsList'),
        friendsSearch: () => document.getElementById('friendsSearch'),
        addFriendBtn: () => document.getElementById('addFriendBtn'),
        addFriendView: () => document.getElementById('addFriendView'),
        addFriendInput: () => document.getElementById('addFriendInput'),
        sendFriendRequestBtn: () => document.getElementById('sendFriendRequestBtn'),
        addFriendHint: () => document.getElementById('addFriendHint'),
        toolbar: () => document.querySelector('.toolbar'),
        topBar: () => document.querySelector('.top-bar'),
        
        // DM Chat view
        dmChatArea: () => document.getElementById('dmChatArea'),
        dmChatTitle: () => document.getElementById('dmChatTitle'),
        dmStartAvatar: () => document.getElementById('dmStartAvatar'),
        dmStartName: () => document.getElementById('dmStartName'),
        dmStartInfo: () => document.getElementById('dmStartInfo'),
        dmMessagesList: () => document.getElementById('dmMessagesList'),
        dmComposer: () => document.getElementById('dmComposer'),
        dmMessageInput: () => document.getElementById('dmMessageInput')
    };

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
        const s = user?.status;
        return String(s || '').toUpperCase() === 'ONLINE';
    }

    async function apiJson(url, options = {}) {
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url, { ...options, headers });
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

    async function loadCurrentUser() {
        // Prefer the cached user from global app shell (app.js)
        try {
            const cached = JSON.parse(localStorage.getItem('user') || 'null');
            if (cached && cached.id) {
                state.currentUser = cached;
                return;
            }
        } catch (_) {
            // ignore
        }

        state.currentUser = await apiJson('/api/auth/me', { method: 'GET' });
        try {
            localStorage.setItem('user', JSON.stringify(state.currentUser || {}));
        } catch (_) {
            // ignore
        }
    }

    async function loadFriends() {
        state.friends = (await apiJson('/api/friends', { method: 'GET' })) || [];
    }

    async function loadRequests() {
        state.requests = (await apiJson('/api/friends/requests', { method: 'GET' })) || [];
    }

    async function loadBlocked() {
        state.blocked = (await apiJson('/api/friends/blocked', { method: 'GET' })) || [];
    }

    async function loadDmSidebar() {
        state.dmItems = (await apiJson('/api/direct-messages/sidebar', { method: 'GET' })) || [];
    }

    function emptyState(message) {
        return `<div style="padding: 24px; color: var(--text-muted);">${escapeHtml(message)}</div>`;
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
            container.innerHTML = `<div style="padding: 8px 10px; color: var(--text-muted); font-size: 13px;">Không có kết quả</div>`;
            return;
        }

        container.innerHTML = items
            .map((it) => {
                const avatar = it.avatarUrl
                    ? `<img src="${escapeHtml(it.avatarUrl)}" alt="">`
                    : `<span>${escapeHtml((it.displayName || it.username || 'U').charAt(0).toUpperCase())}</span>`;
                const unread = Number(it.unreadCount || 0);
                const unreadText = unread > 99 ? '99+' : String(unread);
                return `
                    <div class="dm-row" role="listitem" data-dm-group-id="${escapeHtml(it.dmGroupId)}" data-user-id="${escapeHtml(it.userId)}">
                        <div class="avatar">${avatar}<span class="status-dot ${isOnline(it) ? 'online' : ''}"></span></div>
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
                    // Load DM chat inline instead of redirecting
                    const dmItem = state.dmItems.find(it => String(it.dmGroupId) === String(dmGroupId));
                    openDmChat(dmGroupId, dmItem);
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
        let list = (state.friends || []).slice();

        if (state.activeTab === 'online') {
            // Only show friends who are ONLINE, IDLE, or DO_NOT_DISTURB (not OFFLINE or INVISIBLE)
            list = list.filter((f) => {
                const status = String(f?.status || '').toUpperCase();
                return status === 'ONLINE' || status === 'IDLE' || status === 'DO_NOT_DISTURB';
            });
        } else if (state.activeTab === 'pending') {
            renderPendingRequests();
            return;
        } else if (state.activeTab === 'blocked') {
            renderBlockedUsers();
            return;
        }
        // 'all' tab shows all friends regardless of status

        if (q) {
            list = list.filter((f) => {
                const key = `${displayName(f)} ${f.username || ''} ${statusText(f)}`.toLowerCase();
                return key.includes(q);
            });
        }

        if (!list.length) {
            const emptyMsg = state.activeTab === 'online' 
                ? 'Không có bạn bè nào trực tuyến' 
                : (state.friends.length === 0 ? 'Bạn chưa có bạn bè nào' : 'Không tìm thấy bạn bè');
            container.innerHTML = emptyState(emptyMsg);
            return;
        }

        const headerText = state.activeTab === 'online' ? 'TRỰC TUYẾN' : 'TẤT CẢ BẠN BÈ';

        container.innerHTML = `
            <div class="friend-group-header">${headerText} — ${list.length}</div>
            ${list
                .map((f) => {
                    const avatar = f.avatarUrl
                        ? `<img src="${escapeHtml(f.avatarUrl)}" alt="">`
                        : `<span>${escapeHtml(displayName(f).charAt(0).toUpperCase())}</span>`;
                    const subtitle = statusText(f) || (isOnline(f) ? 'Đang trực tuyến' : '');
                    return `
                        <div class="friend-row" data-user-id="${escapeHtml(f.id)}">
                            <div class="friend-left">
                                <div class="avatar">${avatar}<span class="status-dot ${isOnline(f) ? 'online' : ''}"></span></div>
                                <div class="friend-meta">
                                    <div class="friend-title">${escapeHtml(displayName(f))}</div>
                                    <div class="friend-subtitle">${escapeHtml(subtitle)}</div>
                                </div>
                            </div>
                            <div class="friend-actions">
                                <button class="icon-btn" type="button" title="Nhắn tin" data-action="chat" data-user-id="${escapeHtml(f.id)}"><i class="bi bi-chat-fill"></i></button>
                                <button class="icon-btn" type="button" title="Thêm" data-action="more" data-user-id="${escapeHtml(f.id)}"><i class="bi bi-three-dots-vertical"></i></button>
                            </div>
                        </div>
                    `;
                })
                .join('')}
        `;

        container.querySelectorAll('button[data-action="chat"]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = btn.getAttribute('data-user-id');
                if (userId) openDM(userId);
            });
        });

        container.querySelectorAll('button[data-action="more"]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = btn.getAttribute('data-user-id');
                const friend = state.friends.find(f => String(f.id) === String(userId));
                if (friend) showFriendContextMenu(e, friend);
            });
        });

        container.querySelectorAll('.friend-row').forEach((row) => {
            row.addEventListener('click', () => {
                const userId = row.getAttribute('data-user-id');
                if (userId) openDM(userId);
            });
            // Right-click context menu
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const userId = row.getAttribute('data-user-id');
                const friend = state.friends.find(f => String(f.id) === String(userId));
                if (friend) showFriendContextMenu(e, friend);
            });
        });
    }

    function renderPendingRequests() {
        const container = els.friendsList();
        if (!container) return;

        const q = state.friendsSearch.trim().toLowerCase();
        const requests = (state.requests || []).slice();

        const filtered = q
            ? requests.filter((r) => {
                const key = `${r.senderUsername || ''} ${r.senderDisplayName || ''} ${r.receiverUsername || ''} ${r.receiverDisplayName || ''} ${r.status || ''}`.toLowerCase();
                return key.includes(q);
            })
            : requests;

        if (!filtered.length) {
            container.innerHTML = emptyState('Không có lời mời kết bạn đang chờ');
            return;
        }

        container.innerHTML = `
            <div class="friend-group-header">ĐANG CHỜ — ${filtered.length}</div>
            ${filtered
                .map((r) => {
                    const isSentByMe = state.currentUser && r.senderUsername === state.currentUser.username;
                    const name = isSentByMe
                        ? (r.receiverDisplayName || r.receiverUsername || 'Unknown')
                        : (r.senderDisplayName || r.senderUsername || 'Unknown');
                    const subtitle = isSentByMe ? 'Đã gửi yêu cầu' : 'Yêu cầu kết bạn';
                    const reqId = r.id;

                    return `
                        <div class="friend-row" data-request-id="${escapeHtml(reqId)}">
                            <div class="friend-left">
                                <div class="avatar"><span>${escapeHtml(String(name).charAt(0).toUpperCase())}</span></div>
                                <div class="friend-meta">
                                    <div class="friend-title">${escapeHtml(name)}</div>
                                    <div class="friend-subtitle">${escapeHtml(subtitle)}</div>
                                </div>
                            </div>
                            <div class="friend-actions">
                                ${isSentByMe
                                    ? `<button class="icon-btn" type="button" title="Hủy" data-action="cancel" data-request-id="${escapeHtml(reqId)}"><i class="bi bi-x-lg"></i></button>`
                                    : `
                                        <button class="icon-btn" type="button" title="Chấp nhận" data-action="accept" data-request-id="${escapeHtml(reqId)}"><i class="bi bi-check-lg"></i></button>
                                        <button class="icon-btn" type="button" title="Từ chối" data-action="decline" data-request-id="${escapeHtml(reqId)}"><i class="bi bi-x-lg"></i></button>
                                      `
                                }
                            </div>
                        </div>
                    `;
                })
                .join('')}
        `;

        container.querySelectorAll('button[data-request-id]').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const reqId = btn.getAttribute('data-request-id');
                if (!action || !reqId) return;

                // Disable button to prevent double-click
                btn.disabled = true;

                try {
                    if (action === 'accept') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/accept`, { method: 'POST' });
                    if (action === 'decline') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/decline`, { method: 'POST' });
                    if (action === 'cancel') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/cancel`, { method: 'POST' });

                    await Promise.all([loadFriends(), loadRequests(), loadDmSidebar()]);
                    render();
                } catch (err) {
                    // If request already handled, just refresh the list
                    if (err?.message?.includes('already been handled')) {
                        await Promise.all([loadFriends(), loadRequests()]);
                        render();
                    } else {
                        alert(err?.message || 'Thao tác thất bại');
                        btn.disabled = false;
                    }
                }
            });
        });
    }

    async function openDM(userId) {
        try {
            const dmGroup = await apiJson(`/api/direct-messages/create-dm/${encodeURIComponent(userId)}`, { method: 'POST' });
            if (dmGroup?.id) {
                // Reload DM sidebar to get the new/updated item
                await loadDmSidebar();
                renderDmList();
                
                // Find the DM item for this group
                const dmItem = state.dmItems.find(it => String(it.dmGroupId) === String(dmGroup.id));
                
                // Open DM chat inline
                openDmChat(dmGroup.id, dmItem || {
                    dmGroupId: dmGroup.id,
                    userId: userId,
                    displayName: dmGroup.displayName,
                    username: dmGroup.username,
                    avatarUrl: dmGroup.avatarUrl
                });
            }
        } catch (err) {
            alert(err?.message || 'Không thể mở DM');
        }
    }

    function renderBlockedUsers() {
        const container = els.friendsList();
        if (!container) return;

        const q = state.friendsSearch.trim().toLowerCase();
        const blocked = (state.blocked || []).slice();

        const filtered = q
            ? blocked.filter((u) => {
                const key = `${displayName(u)} ${u.username || ''}`.toLowerCase();
                return key.includes(q);
            })
            : blocked;

        if (!filtered.length) {
            container.innerHTML = emptyState('Không có người dùng bị chặn');
            return;
        }

        container.innerHTML = `
            <div class="friend-group-header">BỊ CHẶN — ${filtered.length}</div>
            ${filtered
                .map((u) => {
                    const avatar = u.avatarUrl
                        ? `<img src="${escapeHtml(u.avatarUrl)}" alt="">`
                        : `<span>${escapeHtml(displayName(u).charAt(0).toUpperCase())}</span>`;
                    return `
                        <div class="friend-row" data-user-id="${escapeHtml(u.id)}">
                            <div class="friend-left">
                                <div class="avatar">${avatar}</div>
                                <div class="friend-meta">
                                    <div class="friend-title">${escapeHtml(displayName(u))}</div>
                                    <div class="friend-subtitle">Đã bị chặn</div>
                                </div>
                            </div>
                            <div class="friend-actions">
                                <button class="icon-btn" type="button" title="Bỏ chặn" data-action="unblock" data-user-id="${escapeHtml(u.id)}"><i class="bi bi-x-lg"></i></button>
                            </div>
                        </div>
                    `;
                })
                .join('')}
        `;

        container.querySelectorAll('button[data-action="unblock"]').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const userId = btn.getAttribute('data-user-id');
                if (!userId) return;
                if (!confirm('Bạn có chắc chắn muốn bỏ chặn người dùng này?')) return;
                try {
                    await apiJson(`/api/friends/blocked/${encodeURIComponent(userId)}`, { method: 'DELETE' });
                    await loadBlocked();
                    render();
                } catch (err) {
                    alert(err?.message || 'Không thể bỏ chặn người dùng');
                }
            });
        });
    }

    function showFriendContextMenu(e, friend) {
        closeContextMenu();
        const menu = document.createElement('div');
        menu.className = 'friend-context-menu';
        menu.innerHTML = `
            <button class="context-item" data-action="dm"><i class="bi bi-chat-fill"></i> Nhắn tin</button>
            <button class="context-item" data-action="profile"><i class="bi bi-person-fill"></i> Xem hồ sơ</button>
            <div class="context-divider"></div>
            <button class="context-item danger" data-action="remove"><i class="bi bi-person-dash-fill"></i> Xóa bạn bè</button>
            <button class="context-item danger" data-action="block"><i class="bi bi-slash-circle"></i> Chặn</button>
        `;

        // Position menu
        const x = Math.min(e.clientX, window.innerWidth - 200);
        const y = Math.min(e.clientY, window.innerHeight - 180);
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        document.body.appendChild(menu);

        menu.querySelectorAll('.context-item').forEach((item) => {
            item.addEventListener('click', async () => {
                const action = item.getAttribute('data-action');
                closeContextMenu();

                if (action === 'dm') {
                    openDM(friend.id);
                } else if (action === 'profile') {
                    if (window.CoCoCordUserProfileModal?.show) {
                        window.CoCoCordUserProfileModal.show(friend.id);
                    }
                } else if (action === 'remove') {
                    if (!confirm(`Bạn có chắc chắn muốn xóa ${displayName(friend)} khỏi danh sách bạn bè?`)) return;
                    try {
                        await apiJson(`/api/friends/${encodeURIComponent(friend.id)}`, { method: 'DELETE' });
                        await Promise.all([loadFriends(), loadDmSidebar()]);
                        render();
                    } catch (err) {
                        alert(err?.message || 'Không thể xóa bạn bè');
                    }
                } else if (action === 'block') {
                    if (!confirm(`Bạn có chắc chắn muốn chặn ${displayName(friend)}?`)) return;
                    try {
                        await apiJson(`/api/friends/blocked/${encodeURIComponent(friend.id)}`, { method: 'POST' });
                        await Promise.all([loadFriends(), loadBlocked(), loadDmSidebar()]);
                        render();
                    } catch (err) {
                        alert(err?.message || 'Không thể chặn người dùng');
                    }
                }
            });
        });

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', closeContextMenuOnClick);
            document.addEventListener('contextmenu', closeContextMenuOnClick);
        }, 0);
    }

    function closeContextMenu() {
        document.querySelectorAll('.friend-context-menu').forEach((m) => m.remove());
        document.removeEventListener('click', closeContextMenuOnClick);
        document.removeEventListener('contextmenu', closeContextMenuOnClick);
    }

    function closeContextMenuOnClick(e) {
        if (!e.target.closest('.friend-context-menu')) {
            closeContextMenu();
        }
    }

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
        const toolbar = els.toolbar();
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
        const toolbar = els.toolbar();
        if (list) list.style.display = 'block';
        if (view) view.style.display = 'none';
        if (toolbar) toolbar.style.display = 'block';
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
            const exact =
                users.find((u) => String(u.username || '').toLowerCase() === value.toLowerCase()) ||
                users.find((u) => String(u.email || '').toLowerCase() === value.toLowerCase());

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

            // Show success feedback briefly before switching tab
            if (hint) {
                hint.textContent = `Đã gửi lời mời kết bạn tới ${target.displayName || target.username}!`;
                hint.className = 'add-friend-hint success';
            }
            if (input) input.value = '';
            await loadRequests();
            
            // Wait a bit for user to see the success message, then switch tab
            setTimeout(() => setActiveTab('pending'), 1500);
        } catch (err) {
            if (hint) {
                hint.textContent = err?.message || 'Gửi lời mời thất bại';
                hint.className = 'add-friend-hint error';
            }
        }
    }

    // ===== DM Chat Functions =====

    async function openDmChat(dmGroupId, dmItem) {
        state.activeDmGroupId = dmGroupId;
        state.activeDmUser = dmItem || null;
        state.activeView = 'dm';
        state.dmMessages = [];

        // Show DM chat area, hide friends view
        const mainArea = els.mainArea();
        const dmChatArea = els.dmChatArea();
        const topBar = els.topBar();

        if (mainArea) mainArea.style.display = 'none';
        if (topBar) topBar.style.display = 'none';
        if (dmChatArea) dmChatArea.style.display = 'flex';

        // Update header
        const title = els.dmChatTitle();
        const startAvatar = els.dmStartAvatar();
        const startName = els.dmStartName();
        const startInfo = els.dmStartInfo();
        const msgInput = els.dmMessageInput();

        const userName = dmItem?.displayName || dmItem?.username || 'Unknown';

        if (title) title.textContent = userName;
        if (startName) startName.textContent = userName;
        if (startAvatar) {
            startAvatar.innerHTML = dmItem?.avatarUrl
                ? `<img src="${escapeHtml(dmItem.avatarUrl)}" alt="">`
                : `<span>${escapeHtml(userName.charAt(0).toUpperCase())}</span>`;
        }
        if (startInfo) {
            startInfo.textContent = `Đây là khởi đầu cuộc trò chuyện của bạn với ${userName}.`;
        }
        if (msgInput) {
            msgInput.placeholder = `Nhắn tin tới @${userName}`;
        }

        // Highlight active DM in sidebar
        document.querySelectorAll('.dm-row').forEach((row) => {
            row.classList.toggle('active', row.getAttribute('data-dm-group-id') === String(dmGroupId));
        });

        // Update URL without reload
        const newUrl = `/app?dmGroupId=${encodeURIComponent(dmGroupId)}`;
        history.pushState({ dmGroupId }, '', newUrl);

        // Load messages
        await loadDmMessages();

        // Connect WebSocket for real-time
        connectDmWebSocket();

        // Focus input
        setTimeout(() => els.dmMessageInput()?.focus(), 100);
    }

    function closeDmChat() {
        state.activeDmGroupId = null;
        state.activeDmUser = null;
        state.activeView = 'friends';
        state.dmMessages = [];

        // Disconnect WebSocket
        disconnectDmWebSocket();

        // Show friends view, hide DM chat
        const mainArea = els.mainArea();
        const dmChatArea = els.dmChatArea();
        const topBar = els.topBar();

        if (mainArea) mainArea.style.display = 'flex';
        if (topBar) topBar.style.display = 'flex';
        if (dmChatArea) dmChatArea.style.display = 'none';

        // Remove active highlight
        document.querySelectorAll('.dm-row.active').forEach((row) => row.classList.remove('active'));

        // Update URL
        history.pushState({}, '', '/app');
    }

    async function loadDmMessages() {
        if (!state.activeDmGroupId) return;
        try {
            const response = await apiJson(`/api/direct-messages/${encodeURIComponent(state.activeDmGroupId)}/messages?page=0&size=50`, { method: 'GET' });
            // API returns Page object with content array
            const messages = response?.content || response || [];
            state.dmMessages = Array.isArray(messages) ? messages.reverse() : [];
            renderDmMessages();
        } catch (err) {
            console.error('Failed to load DM messages:', err);
            state.dmMessages = [];
            renderDmMessages();
        }
    }

    function renderDmMessages() {
        const container = els.dmMessagesList();
        if (!container) return;

        if (!state.dmMessages.length) {
            container.innerHTML = '';
            return;
        }

        const currentUserId = state.currentUser?.id;

        container.innerHTML = state.dmMessages.map((msg) => {
            const avatar = msg.senderAvatarUrl
                ? `<img src="${escapeHtml(msg.senderAvatarUrl)}" alt="">`
                : `<span>${escapeHtml((msg.senderDisplayName || msg.senderUsername || 'U').charAt(0).toUpperCase())}</span>`;
            const time = formatMessageTime(msg.createdAt);
            const senderName = msg.senderDisplayName || msg.senderUsername || 'Unknown';
            const isOwn = String(msg.senderId) === String(currentUserId);
            const isDeleted = msg.deleted === true;

            const contentHtml = isDeleted
                ? `<div class="dm-message-body deleted"><i class="bi bi-slash-circle"></i> Tin nhắn đã bị xóa</div>`
                : `<div class="dm-message-body">${escapeHtml(msg.content || '')}</div>`;

            const actionsHtml = (!isDeleted && isOwn)
                ? `<div class="dm-message-actions">
                       <button class="msg-action-btn" type="button" title="Xóa tin nhắn" data-action="delete" data-msg-id="${escapeHtml(msg.id)}">
                           <i class="bi bi-trash"></i>
                       </button>
                   </div>`
                : '';

            return `
                <div class="dm-message-row ${isDeleted ? 'deleted' : ''}" data-msg-id="${escapeHtml(msg.id)}">
                    <div class="avatar">${avatar}</div>
                    <div class="dm-message-content">
                        <div class="dm-message-header">
                            <span class="dm-sender-name">${escapeHtml(senderName)}</span>
                            <span class="dm-message-time">${escapeHtml(time)}</span>
                        </div>
                        ${contentHtml}
                    </div>
                    ${actionsHtml}
                </div>
            `;
        }).join('');

        // Wire delete buttons
        container.querySelectorAll('.msg-action-btn[data-action="delete"]').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const msgId = btn.getAttribute('data-msg-id');
                if (!msgId) return;
                if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;
                await deleteDmMessage(msgId);
            });
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async function deleteDmMessage(messageId) {
        try {
            await apiJson(`/api/direct-messages/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
            // Update local state
            const msg = state.dmMessages.find(m => m.id === messageId);
            if (msg) {
                msg.deleted = true;
                msg.content = '';
            }
            renderDmMessages();
        } catch (err) {
            console.error('Failed to delete message:', err);
            alert(err?.message || 'Không thể xóa tin nhắn');
        }
    }

    function formatMessageTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }

        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    function connectDmWebSocket() {
        disconnectDmWebSocket();

        const token = localStorage.getItem('accessToken');
        if (!token || !state.activeDmGroupId) return;

        const socket = new SockJS('/ws?token=' + encodeURIComponent(token));
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Disable debug

        stompClient.connect({}, () => {
            dmSubscription = stompClient.subscribe(`/topic/dm/${state.activeDmGroupId}`, (message) => {
                try {
                    const msg = JSON.parse(message.body);
                    // Avoid duplicate
                    if (!state.dmMessages.find(m => m.id === msg.id)) {
                        state.dmMessages.push(msg);
                        renderDmMessages();
                    }
                } catch (e) {
                    console.error('Failed to parse DM message:', e);
                }
            });
        }, (err) => {
            console.error('DM WebSocket error:', err);
        });
    }

    function disconnectDmWebSocket() {
        if (dmSubscription) {
            try { dmSubscription.unsubscribe(); } catch (_) {}
            dmSubscription = null;
        }
        if (stompClient) {
            try { stompClient.disconnect(); } catch (_) {}
            stompClient = null;
        }
    }

    async function sendDmMessage() {
        const input = els.dmMessageInput();
        const content = (input?.value || '').trim();
        if (!content || !state.activeDmGroupId) return;

        try {
            const message = await apiJson(`/api/direct-messages/${encodeURIComponent(state.activeDmGroupId)}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content })
            });
            if (input) input.value = '';
            // Message will arrive via WebSocket, but add optimistically if not duplicate
            if (message && !state.dmMessages.find(m => m.id === message.id)) {
                state.dmMessages.push(message);
                renderDmMessages();
            }
        } catch (err) {
            console.error('Failed to send DM:', err);
            alert(err?.message || 'Không thể gửi tin nhắn');
        }
    }

    // ===== End DM Chat Functions =====

    function wireEvents() {
        // Sidebar navigation placeholders
        document.querySelectorAll('.sidebar-nav a.nav-item[href="#"]').forEach((a) => {
            a.addEventListener('click', (e) => e.preventDefault());
        });

        // Tabs
        document.querySelectorAll('.tab').forEach((b) => {
            b.addEventListener('click', () => {
                closeDmChat();
                setActiveTab(b.dataset.tab);
            });
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
            if (e.key === 'Enter') sendFriendRequest();
            if (e.key === 'Escape') hideAddFriendView();
        });

        // DM Chat close button
        document.getElementById('closeDmChatBtn')?.addEventListener('click', closeDmChat);

        // DM Composer form
        els.dmComposer()?.addEventListener('submit', (e) => {
            e.preventDefault();
            sendDmMessage();
        });

        // DM input Enter key
        els.dmMessageInput()?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendDmMessage();
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state?.dmGroupId) {
                const dmItem = state.dmItems.find(it => String(it.dmGroupId) === String(e.state.dmGroupId));
                openDmChat(e.state.dmGroupId, dmItem);
            } else {
                closeDmChat();
            }
        });
        // User Control Panel and settings are handled globally by app.js
    }

    function render() {
        renderDmList();
        renderFriendsList();
    }

    // Periodic refresh to update online status
    let refreshInterval = null;

    function startPeriodicRefresh() {
        if (refreshInterval) return;
        refreshInterval = setInterval(async () => {
            // Only refresh if on friends tab and not in DM chat
            if (state.activeView === 'friends' && (state.activeTab === 'online' || state.activeTab === 'all')) {
                try {
                    await loadFriends();
                    renderFriendsList();
                } catch (e) {
                    console.warn('Failed to refresh friends:', e);
                }
            }
        }, 30000); // Refresh every 30 seconds
    }

    function stopPeriodicRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }

    async function init() {
        wireEvents();
        await loadCurrentUser();
        await Promise.all([loadFriends(), loadRequests(), loadBlocked(), loadDmSidebar()]);
        render();
        
        // Start periodic refresh for online status
        startPeriodicRefresh();

        // Check URL params for dmGroupId
        const urlParams = new URLSearchParams(window.location.search);
        const dmGroupId = urlParams.get('dmGroupId');
        if (dmGroupId) {
            const dmItem = state.dmItems.find(it => String(it.dmGroupId) === String(dmGroupId));
            openDmChat(dmGroupId, dmItem);
        }
    }

    let lastRootEl = null;

    function maybeInit() {
        const root = document.getElementById('cococordHome');
        if (!root) return;
        if (root === lastRootEl) return;
        lastRootEl = root;
        init().catch((e) => console.error('App home init failed', e));
    }

    // Run on initial page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', maybeInit);
    } else {
        maybeInit();
    }

    // Run again when app.js swaps page content without reloading
    document.addEventListener('cococord:page:loaded', maybeInit);
})();
