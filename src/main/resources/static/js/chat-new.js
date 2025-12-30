/* global SockJS, Stomp, fetchWithAuth, getAccessToken, logout */

(function () {
    'use strict';

    // ==================== DOM ELEMENTS ====================
    const el = {
        // Server sidebar
        serverList: document.getElementById('serverList'),
        addServerBtn: document.getElementById('addServerBtn'),
        
        // Channel sidebar
        serverName: document.getElementById('serverName'),
        serverHeader: document.getElementById('serverHeader'),
        serverDropdown: document.getElementById('serverDropdown'),
        channelList: document.getElementById('channelList'),
        
        // Server dropdown actions
        invitePeopleBtn: document.getElementById('invitePeopleBtn'),
        serverSettingsBtn: document.getElementById('serverSettingsBtn'),
        createChannelBtn: document.getElementById('createChannelBtn'),
        leaveServerBtn: document.getElementById('leaveServerBtn'),
        
        // Main content
        channelName: document.getElementById('channelName'),
        channelTopic: document.getElementById('channelTopic'),
        welcomeChannelName: document.getElementById('welcomeChannelName'),
        messageList: document.getElementById('messageList'),
        chatEmpty: document.getElementById('chatEmpty'),
        chatComposer: document.getElementById('chatComposer'),
        chatInput: document.getElementById('chatInput'),
        
        // Members sidebar
        membersSidebar: document.getElementById('membersSidebar'),
        membersToggleBtn: document.getElementById('membersToggleBtn'),
        onlineMembersList: document.getElementById('onlineMembersList'),
        offlineMembersList: document.getElementById('offlineMembersList'),
        onlineCount: document.getElementById('onlineCount'),
        offlineCount: document.getElementById('offlineCount'),
        
        // User panel
        ucpAvatar: document.getElementById('ucpAvatar'),
        ucpName: document.getElementById('ucpName'),
        ucpStatus: document.getElementById('ucpStatus'),
        ucpStatusIndicator: document.getElementById('ucpStatusIndicator'),
        settingsBtn: document.getElementById('settingsBtn'),
        userSettingsDropdown: document.getElementById('userSettingsDropdown'),
        logoutBtn: document.getElementById('logoutBtn'),
        
        // Create Server Modal
        createServerModal: document.getElementById('createServerModal'),
        closeCreateServerModal: document.getElementById('closeCreateServerModal'),
        serverNameInput: document.getElementById('serverNameInput'),
        cancelCreateServer: document.getElementById('cancelCreateServer'),
        confirmCreateServer: document.getElementById('confirmCreateServer'),
        
        // Create Channel Modal
        createChannelModal: document.getElementById('createChannelModal'),
        closeCreateChannelModal: document.getElementById('closeCreateChannelModal'),
        channelNameInput: document.getElementById('channelNameInput'),
        cancelCreateChannel: document.getElementById('cancelCreateChannel'),
        confirmCreateChannel: document.getElementById('confirmCreateChannel'),
        channelTypeOptions: document.querySelectorAll('.channel-type-option')
    };

    // ==================== STATE ====================
    let stompClient = null;
    let channelSubscription = null;
    let presenceSubscription = null;

    let servers = [];
    let channels = [];
    let members = [];
    let presenceMap = new Map(); // username -> status

    let activeServerId = null;
    let activeChannelId = null;
    let selectedChannelType = 'TEXT';
    let currentUser = null;

    // ==================== UTILITIES ====================
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            serverId: params.get('serverId') ? Number(params.get('serverId')) : null,
            channelId: params.get('channelId') ? Number(params.get('channelId')) : null
        };
    }

    function setQueryParams(next) {
        const params = new URLSearchParams(window.location.search);
        if (next.serverId != null) params.set('serverId', String(next.serverId));
        else params.delete('serverId');
        if (next.channelId != null) params.set('channelId', String(next.channelId));
        else params.delete('channelId');
        history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }

    async function apiGet(url) {
        const res = await fetchWithAuth(url);
        if (!res || !res.ok) {
            const text = res ? await res.text().catch(() => '') : '';
            throw new Error(text || `Request failed: ${res ? res.status : 'no response'}`);
        }
        return res.json();
    }

    async function apiPost(url, body = {}) {
        const res = await fetchWithAuth(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res || !res.ok) {
            const text = res ? await res.text().catch(() => '') : '';
            throw new Error(text || `Request failed: ${res ? res.status : 'no response'}`);
        }
        if (res.status === 204) return null;
        return res.json();
    }

    function formatTime(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return '';
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        if (isToday) {
            return 'Hôm nay lúc ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    }

    function discriminatorFromId(id) {
        const n = Number(id);
        if (!Number.isFinite(n)) return '0000';
        return String(n % 10000).padStart(4, '0');
    }

    function getDiscriminator(user) {
        return user?.discriminator || discriminatorFromId(user?.id);
    }

    function escapeHtml(text) {
        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    /**
     * Mask email for privacy display
     * Example: thanhquan957@gmail.com -> t***n957@gmail.com
     */
    function maskEmail(email) {
        if (!email || typeof email !== 'string') return '***@***';
        const atIndex = email.indexOf('@');
        if (atIndex < 1) return '***@***';
        
        const localPart = email.substring(0, atIndex);
        const domain = email.substring(atIndex);
        
        if (localPart.length <= 2) {
            return localPart.charAt(0) + '***' + domain;
        }
        
        // Show first char, last chars (up to 4), mask the middle
        const firstChar = localPart.charAt(0);
        const lastChars = localPart.length > 4 ? localPart.substring(localPart.length - 4) : localPart.substring(1);
        return firstChar + '***' + lastChars + domain;
    }

    function isOnline(username) {
        const status = presenceMap.get(username);
        return status && String(status).toUpperCase() === 'ONLINE';
    }

    // ==================== RENDER FUNCTIONS ====================
    function renderServerList() {
        el.serverList.innerHTML = '';

        if (!servers.length) {
            const div = document.createElement('div');
            div.className = 'server-item';
            div.title = 'Chưa có server';
            div.innerHTML = '<i class="bi bi-question-lg"></i>';
            el.serverList.appendChild(div);
            return;
        }

        for (const s of servers) {
            const btn = document.createElement('div');
            btn.className = 'server-item' + (String(s.id) === String(activeServerId) ? ' active' : '');
            btn.setAttribute('role', 'button');
            btn.setAttribute('tabindex', '0');
            btn.title = s.name || 'Server';
            btn.dataset.serverId = s.id;

            if (s.iconUrl) {
                const img = document.createElement('img');
                img.alt = s.name || 'Server';
                img.src = s.iconUrl;
                btn.appendChild(img);
            } else {
                const span = document.createElement('span');
                span.className = 'server-initial';
                span.textContent = (s.name || 'S').trim().charAt(0).toUpperCase();
                btn.appendChild(span);
            }

            btn.addEventListener('click', () => selectServer(s.id));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectServer(s.id);
                }
            });

            el.serverList.appendChild(btn);
        }
    }

    function renderChannelList() {
        el.channelList.innerHTML = '';

        if (!channels.length) {
            const div = document.createElement('div');
            div.style.cssText = 'padding: 8px; color: var(--text-muted); font-size: 13px;';
            div.textContent = 'Chưa có kênh nào.';
            el.channelList.appendChild(div);
            return;
        }

        // Group by category (if exists) or default
        const textChannels = channels.filter(c => c.type !== 'VOICE');
        const voiceChannels = channels.filter(c => c.type === 'VOICE');

        if (textChannels.length > 0) {
            const category = document.createElement('div');
            category.className = 'channel-category';
            category.innerHTML = `
                <div class="category-header">
                    <i class="bi bi-chevron-down"></i>
                    <span>KÊNH VĂN BẢN</span>
                </div>
            `;
            
            for (const c of textChannels) {
                const item = document.createElement('div');
                item.className = 'channel-item' + (String(c.id) === String(activeChannelId) ? ' active' : '');
                item.setAttribute('role', 'button');
                item.setAttribute('tabindex', '0');
                item.dataset.channelId = c.id;

                item.innerHTML = `
                    <span class="hash">#</span>
                    <span class="channel-name">${escapeHtml(c.name || 'channel')}</span>
                `;

                item.addEventListener('click', () => selectChannel(c.id));
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectChannel(c.id);
                    }
                });

                category.appendChild(item);
            }
            el.channelList.appendChild(category);
        }

        if (voiceChannels.length > 0) {
            const category = document.createElement('div');
            category.className = 'channel-category';
            category.innerHTML = `
                <div class="category-header">
                    <i class="bi bi-chevron-down"></i>
                    <span>KÊNH THOẠI</span>
                </div>
            `;
            
            for (const c of voiceChannels) {
                const item = document.createElement('div');
                item.className = 'channel-item' + (String(c.id) === String(activeChannelId) ? ' active' : '');
                item.innerHTML = `
                    <span class="hash"><i class="bi bi-volume-up"></i></span>
                    <span class="channel-name">${escapeHtml(c.name || 'channel')}</span>
                `;
                category.appendChild(item);
            }
            el.channelList.appendChild(category);
        }
    }

    function renderMembersList() {
        const onlineMembers = members.filter(m => isOnline(m.username));
        const offlineMembers = members.filter(m => !isOnline(m.username));

        el.onlineCount.textContent = onlineMembers.length;
        el.offlineCount.textContent = offlineMembers.length;

        el.onlineMembersList.innerHTML = onlineMembers.map(m => `
            <div class="member-item online" data-user-id="${m.id}">
                <div class="member-avatar">
                    ${m.avatarUrl ? `<img src="${escapeHtml(m.avatarUrl)}" alt="">` : escapeHtml((m.displayName || m.username || 'U').charAt(0).toUpperCase())}
                    <span class="status-dot online"></span>
                </div>
                <span class="member-name">${escapeHtml(m.displayName || m.username || 'User')}</span>
            </div>
        `).join('');

        el.offlineMembersList.innerHTML = offlineMembers.map(m => `
            <div class="member-item" data-user-id="${m.id}">
                <div class="member-avatar">
                    ${m.avatarUrl ? `<img src="${escapeHtml(m.avatarUrl)}" alt="">` : escapeHtml((m.displayName || m.username || 'U').charAt(0).toUpperCase())}
                    <span class="status-dot"></span>
                </div>
                <span class="member-name">${escapeHtml(m.displayName || m.username || 'User')}</span>
            </div>
        `).join('');
    }

    function clearMessages() {
        el.messageList.innerHTML = '';
        el.chatEmpty.style.display = 'block';
        el.chatComposer.style.display = 'none';
    }

    function appendMessage(msg) {
        el.chatEmpty.style.display = 'none';

        const row = document.createElement('div');
        row.className = 'message-row';
        row.dataset.messageId = msg.id;

        const displayName = msg.displayName || msg.username || 'User';
        const initial = displayName.trim().charAt(0).toUpperCase();

        row.innerHTML = `
            <div class="message-avatar">
                ${msg.avatarUrl ? `<img src="${escapeHtml(msg.avatarUrl)}" alt="${escapeHtml(displayName)}">` : initial}
            </div>
            <div class="message-body">
                <div class="message-header">
                    <span class="message-author" title="${escapeHtml(msg.username || 'user')}#${discriminatorFromId(msg.userId || msg.senderId)}">${escapeHtml(displayName)}</span>
                    <span class="message-timestamp">${formatTime(msg.createdAt)}</span>
                </div>
                <div class="message-content">${escapeHtml(msg.content || '')}</div>
            </div>
        `;

        el.messageList.appendChild(row);
    }

    function scrollToBottom() {
        el.messageList.scrollTop = el.messageList.scrollHeight;
    }

    // ==================== USER PANEL ====================
    async function loadMe() {
        try {
            currentUser = await apiGet('/api/auth/me');
            const displayName = currentUser.displayName || currentUser.username || 'User';
            const discriminator = getDiscriminator(currentUser);
            const fullUsername = `${currentUser.username || 'user'}#${discriminator}`;
            
            el.ucpName.textContent = displayName;
            el.ucpName.title = fullUsername;
            el.ucpStatus.textContent = currentUser.customStatus || 'Trực tuyến';
            el.ucpStatusIndicator.className = 'status-indicator online';
            
            if (currentUser.avatarUrl) {
                el.ucpAvatar.innerHTML = `<img src="${currentUser.avatarUrl}" alt="${displayName}"><span class="status-indicator online" id="ucpStatusIndicator"></span>`;
            } else {
                el.ucpAvatar.innerHTML = `${displayName.trim().charAt(0).toUpperCase()}<span class="status-indicator online" id="ucpStatusIndicator"></span>`;
            }

            // Add self to presence map
            presenceMap.set(currentUser.username, 'ONLINE');
        } catch (e) {
            console.error('Failed to load user info', e);
        }
    }

    // ==================== DATA LOADING ====================
    async function loadServers() {
        servers = await apiGet('/api/servers');
    }

    async function loadChannels(serverId) {
        channels = await apiGet(`/api/channels/servers/${serverId}/channels`);
        channels.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }

    async function loadMembers(serverId) {
        try {
            members = await apiGet(`/api/servers/${serverId}/members`);
        } catch (e) {
            members = [];
        }
    }

    async function loadHistory(channelId) {
        const page = await apiGet(`/api/messages/channel/${channelId}?page=0&size=50`);
        const items = Array.isArray(page.content) ? page.content.slice() : [];
        items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

        el.messageList.innerHTML = '';
        if (!items.length) {
            el.chatEmpty.style.display = 'block';
        } else {
            el.chatEmpty.style.display = 'none';
            for (const m of items) appendMessage(m);
        }
        el.chatComposer.style.display = '';
        scrollToBottom();
    }

    // ==================== WEBSOCKET ====================
    function ensureStompConnected() {
        if (stompClient && stompClient.connected) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const token = getAccessToken && getAccessToken();
            if (!token) {
                reject(new Error('Missing access token'));
                return;
            }

            const socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);
            stompClient.debug = null;

            stompClient.connect(
                { Authorization: `Bearer ${token}` },
                () => {
                    // Subscribe to presence updates
                    presenceSubscription = stompClient.subscribe('/topic/presence', (message) => {
                        try {
                            const presence = JSON.parse(message.body);
                            if (presence?.username) {
                                presenceMap.set(presence.username, presence.status);
                                renderMembersList();
                            }
                        } catch (e) { /* ignore */ }
                    });

                    // Announce online
                    try {
                        stompClient.send('/app/presence.update', {}, JSON.stringify({ status: 'ONLINE' }));
                    } catch (e) { /* ignore */ }

                    resolve();
                },
                (err) => reject(err)
            );
        });
    }

    async function subscribeToChannel(channelId) {
        await ensureStompConnected();

        if (channelSubscription) {
            try { channelSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            channelSubscription = null;
        }

        channelSubscription = stompClient.subscribe(`/topic/channel/${channelId}`, (message) => {
            try {
                const data = JSON.parse(message.body);
                
                // Handle WebSocketEvent wrapper format from REST API
                // or direct message format from WebSocket controller
                let payload, eventType;
                if (data.type && data.payload) {
                    // WebSocketEvent wrapper format: { type: "message.created", payload: {...} }
                    eventType = data.type;
                    payload = data.payload;
                } else {
                    // Direct message format from WebSocket controller
                    eventType = 'message.created';
                    payload = data;
                }
                
                if (String(payload.channelId) !== String(activeChannelId)) return;
                
                // Handle different event types
                if (eventType === 'message.deleted') {
                    const row = document.querySelector(`[data-message-id="${payload}"]`);
                    if (row) {
                        row.classList.add('message-deleted');
                        setTimeout(() => row.remove(), 300);
                    }
                    return;
                }
                
                // Check for duplicates by ID
                if (document.querySelector(`[data-message-id="${payload.id}"]`)) return;
                
                appendMessage(payload);
                scrollToBottom();
            } catch (e) { console.error('Error handling message:', e); }
        });
    }

    // ==================== SERVER/CHANNEL SELECTION ====================
    async function selectServer(serverId) {
        activeServerId = serverId;
        setQueryParams({ serverId, channelId: null });

        const server = servers.find(s => String(s.id) === String(serverId));
        el.serverName.textContent = server ? (server.name || 'Server') : 'Server';

        renderServerList();
        clearMessages();

        await Promise.all([
            loadChannels(serverId),
            loadMembers(serverId)
        ]);
        
        renderChannelList();
        renderMembersList();

        const nextChannelId = channels.length ? channels[0].id : null;
        if (nextChannelId != null) {
            await selectChannel(nextChannelId);
        }
    }

    async function selectChannel(channelId) {
        activeChannelId = channelId;
        setQueryParams({ serverId: activeServerId, channelId });

        const channel = channels.find(c => String(c.id) === String(channelId));
        const channelName = channel ? (channel.name || 'channel') : 'channel';
        
        el.channelName.textContent = channelName;
        el.welcomeChannelName.textContent = '#' + channelName;
        el.chatInput.placeholder = `Nhắn #${channelName}`;
        
        if (channel?.topic) {
            el.channelTopic.textContent = channel.topic;
            el.channelTopic.style.display = '';
        } else {
            el.channelTopic.style.display = 'none';
        }

        renderChannelList();
        await subscribeToChannel(channelId);
        await loadHistory(channelId);
    }

    // ==================== MODALS ====================
    function showCreateServerModal() {
        el.createServerModal.style.display = 'flex';
        el.serverNameInput.value = '';
        el.serverNameInput.focus();
    }

    function hideCreateServerModal() {
        el.createServerModal.style.display = 'none';
    }

    function showCreateChannelModal() {
        el.createChannelModal.style.display = 'flex';
        el.channelNameInput.value = '';
        selectedChannelType = 'TEXT';
        el.channelTypeOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.type === 'TEXT');
        });
        el.channelNameInput.focus();
    }

    function hideCreateChannelModal() {
        el.createChannelModal.style.display = 'none';
    }

    async function createServer() {
        const name = el.serverNameInput.value.trim();
        if (!name) return;

        try {
            const newServer = await apiPost('/api/servers', { name });
            hideCreateServerModal();
            await loadServers();
            renderServerList();
            if (newServer?.id) {
                await selectServer(newServer.id);
            }
        } catch (e) {
            alert('Không thể tạo server: ' + (e.message || 'Lỗi'));
        }
    }

    async function createChannel() {
        const name = el.channelNameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
        if (!name || !activeServerId) return;

        try {
            await apiPost(`/api/channels/servers/${activeServerId}/channels`, {
                name,
                type: selectedChannelType
            });
            hideCreateChannelModal();
            await loadChannels(activeServerId);
            renderChannelList();
        } catch (e) {
            alert('Không thể tạo kênh: ' + (e.message || 'Lỗi'));
        }
    }

    // ==================== DROPDOWNS ====================
    function toggleServerDropdown() {
        const isVisible = el.serverDropdown.style.display !== 'none';
        el.serverDropdown.style.display = isVisible ? 'none' : 'block';
    }

    function toggleUserSettings() {
        const isVisible = el.userSettingsDropdown.style.display !== 'none';
        el.userSettingsDropdown.style.display = isVisible ? 'none' : 'block';
    }

    function toggleMembersSidebar() {
        el.membersSidebar.classList.toggle('show');
        el.membersToggleBtn.classList.toggle('active');
    }

    // ==================== EVENT WIRING ====================
    function wireEvents() {
        // Server header dropdown
        el.serverHeader?.addEventListener('click', toggleServerDropdown);
        
        // Server dropdown actions
        el.createChannelBtn?.addEventListener('click', () => {
            toggleServerDropdown();
            showCreateChannelModal();
        });
        
        // Add server button
        el.addServerBtn?.addEventListener('click', showCreateServerModal);
        
        // Create server modal
        el.closeCreateServerModal?.addEventListener('click', hideCreateServerModal);
        el.cancelCreateServer?.addEventListener('click', hideCreateServerModal);
        el.confirmCreateServer?.addEventListener('click', createServer);
        el.serverNameInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') createServer();
        });
        
        // Create channel modal
        el.closeCreateChannelModal?.addEventListener('click', hideCreateChannelModal);
        el.cancelCreateChannel?.addEventListener('click', hideCreateChannelModal);
        el.confirmCreateChannel?.addEventListener('click', createChannel);
        el.channelNameInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') createChannel();
        });
        
        // Channel type selection
        el.channelTypeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                selectedChannelType = opt.dataset.type;
                el.channelTypeOptions.forEach(o => o.classList.toggle('active', o === opt));
            });
        });
        
        // User settings
        el.settingsBtn?.addEventListener('click', toggleUserSettings);
        el.logoutBtn?.addEventListener('click', () => {
            if (typeof logout === 'function') logout();
        });
        
        // Members toggle
        el.membersToggleBtn?.addEventListener('click', toggleMembersSidebar);
        
        // Chat composer
        el.chatComposer?.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = (el.chatInput.value || '').trim();
            if (!text || !activeChannelId) return;

            if (!stompClient || !stompClient.connected) return;

            stompClient.send(
                '/app/chat.sendMessage',
                {},
                JSON.stringify({ channelId: activeChannelId, content: text })
            );

            el.chatInput.value = '';
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!el.serverHeader?.contains(e.target) && !el.serverDropdown?.contains(e.target)) {
                el.serverDropdown.style.display = 'none';
            }
            if (!el.settingsBtn?.contains(e.target) && !el.userSettingsDropdown?.contains(e.target)) {
                el.userSettingsDropdown.style.display = 'none';
            }
        });
        
        // Close modals on overlay click
        el.createServerModal?.addEventListener('click', (e) => {
            if (e.target === el.createServerModal) hideCreateServerModal();
        });
        el.createChannelModal?.addEventListener('click', (e) => {
            if (e.target === el.createChannelModal) hideCreateChannelModal();
        });

        // Announce offline on page unload
        window.addEventListener('beforeunload', () => {
            try {
                if (stompClient?.connected) {
                    stompClient.send('/app/presence.update', {}, JSON.stringify({ status: 'OFFLINE' }));
                }
            } catch (e) { /* ignore */ }
        });
    }

    // ==================== INITIALIZATION ====================
    async function init() {
        wireEvents();
        await loadMe();

        const qp = getQueryParams();
        await loadServers();

        // Pick server
        activeServerId = qp.serverId || (servers.length ? servers[0].id : null);
        renderServerList();

        if (!activeServerId) {
            clearMessages();
            return;
        }

        const server = servers.find(s => String(s.id) === String(activeServerId));
        el.serverName.textContent = server ? (server.name || 'Server') : 'Server';

        await Promise.all([
            loadChannels(activeServerId),
            loadMembers(activeServerId)
        ]);
        
        activeChannelId = qp.channelId || (channels.length ? channels[0].id : null);
        renderChannelList();
        renderMembersList();

        if (!activeChannelId) {
            clearMessages();
            return;
        }

        const channel = channels.find(c => String(c.id) === String(activeChannelId));
        const channelName = channel ? (channel.name || 'channel') : 'channel';
        el.channelName.textContent = channelName;
        el.welcomeChannelName.textContent = '#' + channelName;
        el.chatInput.placeholder = `Nhắn #${channelName}`;

        await subscribeToChannel(activeChannelId);
        await loadHistory(activeChannelId);
    }

    init().catch((e) => {
        console.error('Chat init failed:', e);
        clearMessages();
    });
})();
