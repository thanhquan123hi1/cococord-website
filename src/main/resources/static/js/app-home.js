/* CoCoCord /app page: persistent sidebar + dynamic main (friends) */

(() => {
    'use strict';

    const state = {
        currentUser: null,
        friends: [],
        requests: [],
        dmItems: [],
        activeTab: 'online',
        friendsSearch: '',
        dmSearch: ''
    };

    const els = {
        globalSearch: () => document.getElementById('globalSearch'),
        dmList: () => document.getElementById('dmList'),

        friendsList: () => document.getElementById('friendsList'),
        friendsSearch: () => document.getElementById('friendsSearch'),
        addFriendBtn: () => document.getElementById('addFriendBtn'),
        addFriendView: () => document.getElementById('addFriendView'),
        addFriendInput: () => document.getElementById('addFriendInput'),
        sendFriendRequestBtn: () => document.getElementById('sendFriendRequestBtn'),
        addFriendHint: () => document.getElementById('addFriendHint'),
        toolbar: () => document.querySelector('.toolbar')
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
        let list = (state.friends || []).slice();

        if (state.activeTab === 'online') {
            list = list.filter((f) => isOnline(f) || !f?.status);
        } else if (state.activeTab === 'pending') {
            renderPendingRequests();
            return;
        }

        if (q) {
            list = list.filter((f) => {
                const key = `${displayName(f)} ${f.username || ''} ${statusText(f)}`.toLowerCase();
                return key.includes(q);
            });
        }

        if (!list.length) {
            container.innerHTML = emptyState(state.activeTab === 'online' ? 'Không có bạn bè nào trực tuyến' : 'Không có bạn bè');
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

                try {
                    if (action === 'accept') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/accept`, { method: 'POST' });
                    if (action === 'decline') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/decline`, { method: 'POST' });
                    if (action === 'cancel') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/cancel`, { method: 'POST' });

                    await Promise.all([loadFriends(), loadRequests(), loadDmSidebar()]);
                    render();
                } catch (err) {
                    alert(err?.message || 'Thao tác thất bại');
                }
            });
        });
    }

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

    function wireEvents() {
        // Sidebar navigation placeholders
        document.querySelectorAll('.sidebar-nav a.nav-item[href="#"]').forEach((a) => {
            a.addEventListener('click', (e) => e.preventDefault());
        });

        // Tabs
        document.querySelectorAll('.tab').forEach((b) => {
            b.addEventListener('click', () => setActiveTab(b.dataset.tab));
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
        // User Control Panel and settings are handled globally by app.js
    }

    function render() {
        renderDmList();
        renderFriendsList();
    }

    async function init() {
        wireEvents();
        await loadCurrentUser();
        await Promise.all([loadFriends(), loadRequests(), loadDmSidebar()]);
        render();
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
