/* global SockJS, Stomp, fetchWithAuth, getAccessToken, logout, Peer */

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
        userInfoBtn: document.getElementById('userInfoBtn'),
        userDropdown: document.getElementById('userDropdown'),
        logoutBtnUser: document.getElementById('logoutBtnUser'),
        
        // Mic/Deafen buttons
        micBtn: document.getElementById('micBtn'),
        deafenBtn: document.getElementById('deafenBtn'),
        
        // Voice Connected Bar
        voiceConnectedBar: document.getElementById('voiceConnectedBar'),
        voiceChannelName: document.getElementById('voiceChannelName'),
        voiceDisconnectBtn: document.getElementById('voiceDisconnectBtn'),
        
        // User Settings Modal
        userSettingsModal: document.getElementById('userSettingsModal'),
        closeUserSettingsModal: document.getElementById('closeUserSettingsModal'),
        settingsNavItems: document.querySelectorAll('.settings-nav-item[data-tab]'),
        settingsTabs: document.querySelectorAll('.settings-tab'),
        settingsTitle: document.getElementById('settingsTitle'),
        settingsLogoutBtn: document.getElementById('settingsLogoutBtn'),
        
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
    let typingSubscription = null;
    let deleteSubscription = null;
    let voiceSubscription = null;

    let servers = [];
    let channels = [];
    let members = [];
    let presenceMap = new Map(); // username -> status

    let activeServerId = null;
    let activeChannelId = null;
    let selectedChannelType = 'TEXT';
    let currentUser = null;

    // Pagination state for infinite scroll
    let currentPage = 0;
    let isLoadingHistory = false;
    let hasMoreMessages = true;
    let oldestMessageId = null;

    // Typing indicator state
    let typingUsers = new Map(); // username -> { timeout, displayName, avatarUrl }
    let myTypingTimeout = null;
    let isCurrentlyTyping = false;

    // Voice Chat State (PeerJS/WebRTC)
    let peer = null;
    let localStream = null;
    let activeVoiceChannelId = null;
    let voiceConnections = new Map(); // peerId -> { call, stream, userId }
    let isMuted = false;
    let isDeafened = false;

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

    function escapeHtml(text) {
        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
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
            
            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <i class="bi bi-chevron-down"></i>
                <span>KÊNH VĂN BẢN</span>
            `;
            category.appendChild(header);
            
            const channelsContainer = document.createElement('div');
            channelsContainer.className = 'channels-container';
            
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

                // Use closure to capture correct channel id
                const channelId = c.id;
                item.addEventListener('click', function() { 
                    selectChannel(channelId); 
                });
                item.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectChannel(channelId);
                    }
                });

                channelsContainer.appendChild(item);
            }
            category.appendChild(channelsContainer);
            el.channelList.appendChild(category);
        }

        if (voiceChannels.length > 0) {
            const category = document.createElement('div');
            category.className = 'channel-category';
            
            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <i class="bi bi-chevron-down"></i>
                <span>KÊNH THOẠI</span>
            `;
            category.appendChild(header);
            
            const channelsContainer = document.createElement('div');
            channelsContainer.className = 'channels-container';
            
            for (const c of voiceChannels) {
                const item = document.createElement('div');
                item.className = 'channel-item voice-channel' + (String(c.id) === String(activeVoiceChannelId) ? ' voice-active' : '');
                item.setAttribute('role', 'button');
                item.setAttribute('tabindex', '0');
                item.dataset.channelId = c.id;
                
                item.innerHTML = `
                    <span class="hash"><i class="bi bi-volume-up"></i></span>
                    <span class="channel-name">${escapeHtml(c.name || 'channel')}</span>
                `;
                
                // Voice channels - join voice when clicked
                const channelId = c.id;
                item.addEventListener('click', function() { 
                    joinVoiceChannel(channelId); 
                });
                
                channelsContainer.appendChild(item);
            }
            category.appendChild(channelsContainer);
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
        // Reset pagination state
        currentPage = 0;
        hasMoreMessages = true;
        oldestMessageId = null;
        hideNewMessagesBanner();
    }

    function appendMessage(msg, prepend = false) {
        el.chatEmpty.style.display = 'none';

        const row = document.createElement('div');
        row.className = 'message-row';
        row.dataset.messageId = msg.id;
        row.dataset.userId = msg.userId || msg.senderId || '';
        row.dataset.username = msg.username || '';

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
                    ${msg.editedAt ? '<span class="message-edited">(đã chỉnh sửa)</span>' : ''}
                </div>
                <div class="message-content">${escapeHtml(msg.content || '')}</div>
            </div>
        `;

        if (prepend) {
            el.messageList.insertBefore(row, el.messageList.firstChild);
        } else {
            el.messageList.appendChild(row);
        }
        
        return row;
    }

    // Check if user is near bottom of message list
    function isNearBottom() {
        const threshold = 100; // pixels from bottom
        return el.messageList.scrollHeight - el.messageList.scrollTop - el.messageList.clientHeight < threshold;
    }

    // Smart scroll - only auto-scroll if user is near bottom
    function smartScroll() {
        if (isNearBottom()) {
            scrollToBottom();
            hideNewMessagesBanner();
        }
    }

    // Show "New Messages" banner
    function showNewMessagesBanner() {
        let banner = document.getElementById('newMessagesBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'newMessagesBanner';
            banner.className = 'new-messages-banner';
            banner.innerHTML = `
                <span>Có tin nhắn mới</span>
                <i class="bi bi-chevron-down"></i>
            `;
            banner.addEventListener('click', () => {
                scrollToBottom();
                hideNewMessagesBanner();
            });
            el.messageList.parentElement.appendChild(banner);
        }
        banner.classList.add('show');
    }

    function hideNewMessagesBanner() {
        const banner = document.getElementById('newMessagesBanner');
        if (banner) banner.classList.remove('show');
    }

    function scrollToBottom() {
        el.messageList.scrollTop = el.messageList.scrollHeight;
    }

    // ==================== TYPING INDICATOR ====================
    function renderTypingIndicator() {
        let indicator = document.getElementById('typingIndicator');
        
        if (typingUsers.size === 0) {
            if (indicator) indicator.remove();
            return;
        }
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'typingIndicator';
            indicator.className = 'typing-indicator';
            // Insert before chat composer
            el.chatComposer.parentElement.insertBefore(indicator, el.chatComposer);
        }
        
        const users = Array.from(typingUsers.values());
        const avatarsHtml = users.slice(0, 3).map(u => `
            <div class="typing-avatar">
                ${u.avatarUrl ? `<img src="${escapeHtml(u.avatarUrl)}" alt="">` : escapeHtml((u.displayName || 'U').charAt(0).toUpperCase())}
            </div>
        `).join('');
        
        let text = '';
        if (users.length === 1) {
            text = `<strong>${escapeHtml(users[0].displayName)}</strong> đang nhập...`;
        } else if (users.length === 2) {
            text = `<strong>${escapeHtml(users[0].displayName)}</strong> và <strong>${escapeHtml(users[1].displayName)}</strong> đang nhập...`;
        } else if (users.length > 2) {
            text = `<strong>${escapeHtml(users[0].displayName)}</strong> và ${users.length - 1} người khác đang nhập...`;
        }
        
        indicator.innerHTML = `
            <div class="typing-avatars">${avatarsHtml}</div>
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
            <div class="typing-text">${text}</div>
        `;
    }

    function addTypingUser(username, displayName, avatarUrl) {
        // Don't show own typing
        if (currentUser && username === currentUser.username) return;
        
        // Clear existing timeout
        const existing = typingUsers.get(username);
        if (existing?.timeout) clearTimeout(existing.timeout);
        
        // Set new timeout (auto-hide after 3 seconds)
        const timeout = setTimeout(() => {
            typingUsers.delete(username);
            renderTypingIndicator();
        }, 3000);
        
        typingUsers.set(username, { displayName, avatarUrl, timeout });
        renderTypingIndicator();
    }

    function removeTypingUser(username) {
        const existing = typingUsers.get(username);
        if (existing?.timeout) clearTimeout(existing.timeout);
        typingUsers.delete(username);
        renderTypingIndicator();
    }

    function clearAllTyping() {
        typingUsers.forEach(u => {
            if (u.timeout) clearTimeout(u.timeout);
        });
        typingUsers.clear();
        renderTypingIndicator();
    }

    // Send typing notification
    function sendTypingNotification() {
        if (!stompClient?.connected || !activeChannelId) return;
        
        if (!isCurrentlyTyping) {
            isCurrentlyTyping = true;
            stompClient.send('/app/chat.typing', {}, JSON.stringify({
                channelId: activeChannelId,
                isTyping: true
            }));
        }
        
        // Reset typing timeout
        if (myTypingTimeout) clearTimeout(myTypingTimeout);
        myTypingTimeout = setTimeout(() => {
            isCurrentlyTyping = false;
        }, 3000);
    }

    // ==================== USER PANEL ====================
    async function loadMe() {
        try {
            currentUser = await apiGet('/api/auth/me');
            const displayName = currentUser.displayName || currentUser.username || 'User';
            const discriminator = discriminatorFromId(currentUser.id);
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

    async function loadHistory(channelId, append = false) {
        if (isLoadingHistory) return;
        
        isLoadingHistory = true;
        
        try {
            const page = await apiGet(`/api/messages/channel/${channelId}?page=${currentPage}&size=50`);
            const items = Array.isArray(page.content) ? page.content.slice() : [];
            
            // Check if there are more pages
            hasMoreMessages = !page.last && items.length > 0;
            
            // Sort by date ascending
            items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

            if (!append) {
                // Initial load
                el.messageList.innerHTML = '';
                if (!items.length) {
                    el.chatEmpty.style.display = 'block';
                } else {
                    el.chatEmpty.style.display = 'none';
                    for (const m of items) appendMessage(m);
                }
                el.chatComposer.style.display = '';
                scrollToBottom();
                
                // Track oldest message for pagination
                if (items.length > 0) {
                    oldestMessageId = items[0].id;
                }
            } else {
                // Prepending older messages (infinite scroll)
                if (items.length > 0) {
                    // Save scroll position
                    const scrollHeightBefore = el.messageList.scrollHeight;
                    const scrollTopBefore = el.messageList.scrollTop;
                    
                    // Prepend messages in reverse order (oldest first)
                    for (let i = items.length - 1; i >= 0; i--) {
                        appendMessage(items[i], true);
                    }
                    
                    // Restore scroll position (keep user at same visual position)
                    const scrollHeightAfter = el.messageList.scrollHeight;
                    el.messageList.scrollTop = scrollTopBefore + (scrollHeightAfter - scrollHeightBefore);
                    
                    oldestMessageId = items[0].id;
                }
            }
            
            currentPage++;
        } catch (e) {
            console.error('Failed to load history:', e);
        } finally {
            isLoadingHistory = false;
            hideLoadingSpinner();
        }
    }

    // Load more messages when scrolling to top
    async function loadMoreHistory() {
        if (!activeChannelId || isLoadingHistory || !hasMoreMessages) return;
        
        showLoadingSpinner();
        await loadHistory(activeChannelId, true);
    }

    function showLoadingSpinner() {
        let spinner = document.getElementById('historySpinner');
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.id = 'historySpinner';
            spinner.className = 'history-spinner';
            spinner.innerHTML = '<div class="spinner"></div>';
            el.messageList.insertBefore(spinner, el.messageList.firstChild);
        }
    }

    function hideLoadingSpinner() {
        const spinner = document.getElementById('historySpinner');
        if (spinner) spinner.remove();
    }

    // Handle scroll event for infinite scroll
    function handleMessageScroll() {
        // Check if scrolled to top
        if (el.messageList.scrollTop === 0 && hasMoreMessages && !isLoadingHistory) {
            loadMoreHistory();
        }
        
        // Hide new messages banner if at bottom
        if (isNearBottom()) {
            hideNewMessagesBanner();
        }
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

        // Unsubscribe from previous channel
        if (channelSubscription) {
            try { channelSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            channelSubscription = null;
        }
        if (typingSubscription) {
            try { typingSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            typingSubscription = null;
        }
        if (deleteSubscription) {
            try { deleteSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            deleteSubscription = null;
        }

        // Clear typing users from previous channel
        clearAllTyping();

        // Subscribe to new messages
        channelSubscription = stompClient.subscribe(`/topic/channel/${channelId}`, (message) => {
            try {
                const payload = JSON.parse(message.body);
                if (String(payload.channelId) !== String(activeChannelId)) return;
                
                // Check if this is an edit (message already exists)
                const existingRow = document.querySelector(`[data-message-id="${payload.id}"]`);
                if (existingRow) {
                    // Update existing message (edit)
                    const contentEl = existingRow.querySelector('.message-content');
                    const headerEl = existingRow.querySelector('.message-header');
                    if (contentEl) contentEl.textContent = payload.content || '';
                    if (headerEl && payload.editedAt && !headerEl.querySelector('.message-edited')) {
                        const editedSpan = document.createElement('span');
                        editedSpan.className = 'message-edited';
                        editedSpan.textContent = '(đã chỉnh sửa)';
                        headerEl.appendChild(editedSpan);
                    }
                } else {
                    // New message
                    appendMessage(payload);
                    
                    // Remove typing indicator for this user
                    if (payload.username) removeTypingUser(payload.username);
                    
                    // Smart scroll - show banner if not at bottom
                    if (isNearBottom()) {
                        scrollToBottom();
                    } else {
                        showNewMessagesBanner();
                    }
                }
            } catch (e) { /* ignore */ }
        });

        // Subscribe to typing indicators
        typingSubscription = stompClient.subscribe(`/topic/channel/${channelId}/typing`, (message) => {
            try {
                const payload = JSON.parse(message.body);
                if (payload.isTyping) {
                    // Find member info
                    const member = members.find(m => m.username === payload.username);
                    addTypingUser(
                        payload.username,
                        member?.displayName || payload.username,
                        member?.avatarUrl || null
                    );
                } else {
                    removeTypingUser(payload.username);
                }
            } catch (e) { /* ignore */ }
        });

        // Subscribe to message deletions
        deleteSubscription = stompClient.subscribe(`/topic/channel/${channelId}/delete`, (message) => {
            try {
                const messageId = message.body.replace(/"/g, '');
                const row = document.querySelector(`[data-message-id="${messageId}"]`);
                if (row) {
                    row.classList.add('message-deleted');
                    setTimeout(() => row.remove(), 300);
                }
            } catch (e) { /* ignore */ }
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

        // Reset pagination state for new channel
        currentPage = 0;
        hasMoreMessages = true;
        oldestMessageId = null;
        clearAllTyping();

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

    // ==================== CUSTOM CONTEXT MENU ====================
    let activeContextMenu = null;
    let contextTargetMessage = null;
    let contextTargetServer = null;

    function createContextMenu() {
        // Remove existing menu if any
        hideContextMenu();
        
        const menu = document.createElement('div');
        menu.id = 'customContextMenu';
        menu.className = 'context-menu';
        document.body.appendChild(menu);
        activeContextMenu = menu;
        return menu;
    }

    function showContextMenu(x, y, items) {
        const menu = createContextMenu();
        
        menu.innerHTML = items.map(item => {
            if (item.divider) {
                return '<div class="context-menu-divider"></div>';
            }
            const dangerClass = item.danger ? ' danger' : '';
            return `<div class="context-menu-item${dangerClass}" data-action="${item.action}">${item.icon ? `<i class="${item.icon}"></i>` : ''}${escapeHtml(item.label)}</div>`;
        }).join('');
        
        // Position menu
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.display = 'block';
        
        // Adjust if menu goes off screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
        
        // Add click handlers
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                handleContextMenuAction(action);
                hideContextMenu();
            });
        });
    }

    function hideContextMenu() {
        if (activeContextMenu) {
            activeContextMenu.remove();
            activeContextMenu = null;
        }
        contextTargetMessage = null;
        contextTargetServer = null;
    }

    function handleContextMenuAction(action) {
        switch (action) {
            case 'reply':
                handleReplyMessage();
                break;
            case 'copy':
                handleCopyMessage();
                break;
            case 'edit':
                handleEditMessage();
                break;
            case 'delete':
                handleDeleteMessage();
                break;
            case 'invite-friends':
                handleInviteFriendsFromMenu();
                break;
            case 'leave-server':
                handleLeaveServerFromMenu();
                break;
            case 'server-settings':
                handleServerSettingsFromMenu();
                break;
        }
    }

    // Message context menu handlers
    function handleReplyMessage() {
        if (!contextTargetMessage) return;
        const content = contextTargetMessage.querySelector('.message-content')?.textContent || '';
        const author = contextTargetMessage.querySelector('.message-author')?.textContent || '';
        
        // Focus input and add reply reference
        el.chatInput.focus();
        el.chatInput.placeholder = `Đang trả lời ${author}...`;
        el.chatInput.dataset.replyTo = contextTargetMessage.dataset.messageId;
        
        // Show reply preview (optional UI)
        showReplyPreview(author, content);
    }

    function showReplyPreview(author, content) {
        let preview = document.getElementById('replyPreview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'replyPreview';
            preview.className = 'reply-preview';
            el.chatComposer.insertBefore(preview, el.chatComposer.firstChild);
        }
        
        preview.innerHTML = `
            <div class="reply-preview-content">
                <i class="bi bi-reply-fill"></i>
                <span>Đang trả lời <strong>${escapeHtml(author)}</strong>: ${escapeHtml(content.slice(0, 50))}${content.length > 50 ? '...' : ''}</span>
            </div>
            <button class="reply-cancel" type="button"><i class="bi bi-x"></i></button>
        `;
        
        preview.querySelector('.reply-cancel').addEventListener('click', cancelReply);
    }

    function cancelReply() {
        const preview = document.getElementById('replyPreview');
        if (preview) preview.remove();
        if (el.chatInput) {
            const channel = channels.find(c => String(c.id) === String(activeChannelId));
            el.chatInput.placeholder = `Nhắn #${channel?.name || 'channel'}`;
            delete el.chatInput.dataset.replyTo;
        }
    }

    function handleCopyMessage() {
        if (!contextTargetMessage) return;
        const content = contextTargetMessage.querySelector('.message-content')?.textContent || '';
        navigator.clipboard.writeText(content).then(() => {
            showToast('Đã sao chép tin nhắn');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    function handleEditMessage() {
        if (!contextTargetMessage) return;
        const messageId = contextTargetMessage.dataset.messageId;
        const contentEl = contextTargetMessage.querySelector('.message-content');
        const currentContent = contentEl?.textContent || '';
        
        // Replace content with input
        const originalHtml = contentEl.innerHTML;
        contentEl.innerHTML = `
            <input type="text" class="edit-message-input" value="${escapeHtml(currentContent)}">
            <div class="edit-message-hint">Escape để hủy • Enter để lưu</div>
        `;
        
        const input = contentEl.querySelector('.edit-message-input');
        input.focus();
        input.select();
        
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Escape') {
                contentEl.innerHTML = originalHtml;
            } else if (e.key === 'Enter') {
                const newContent = input.value.trim();
                if (newContent && newContent !== currentContent) {
                    try {
                        // Send edit via WebSocket
                        if (stompClient?.connected) {
                            stompClient.send('/app/chat.editMessage', {}, JSON.stringify({
                                messageId: messageId,
                                content: newContent
                            }));
                        }
                        contentEl.textContent = newContent;
                    } catch (err) {
                        console.error('Failed to edit:', err);
                        contentEl.innerHTML = originalHtml;
                    }
                } else {
                    contentEl.innerHTML = originalHtml;
                }
            }
        });
        
        input.addEventListener('blur', () => {
            // Restore on blur after delay
            setTimeout(() => {
                if (contentEl.querySelector('.edit-message-input')) {
                    contentEl.innerHTML = originalHtml;
                }
            }, 200);
        });
    }

    async function handleDeleteMessage() {
        if (!contextTargetMessage) return;
        const messageId = contextTargetMessage.dataset.messageId;
        
        if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;
        
        try {
            if (stompClient?.connected) {
                stompClient.send('/app/chat.deleteMessage', {}, JSON.stringify(messageId));
            }
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Không thể xóa tin nhắn');
        }
    }

    // Server context menu handlers
    function handleInviteFriendsFromMenu() {
        if (!contextTargetServer) return;
        const serverId = contextTargetServer.dataset.serverId;
        if (serverId && String(serverId) !== String(activeServerId)) {
            selectServer(Number(serverId)).then(() => showInviteFriendsModal());
        } else {
            showInviteFriendsModal();
        }
    }

    function handleLeaveServerFromMenu() {
        if (!contextTargetServer) return;
        const serverId = contextTargetServer.dataset.serverId;
        if (serverId) {
            // Temporarily set active server to leave
            const prevServerId = activeServerId;
            activeServerId = Number(serverId);
            leaveCurrentServer().finally(() => {
                if (activeServerId === Number(serverId)) {
                    activeServerId = prevServerId;
                }
            });
        }
    }

    function handleServerSettingsFromMenu() {
        showServerSettingsModal();
    }

    // Simple toast notification
    function showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // Context menu for messages
    function showMessageContextMenu(e, messageRow) {
        e.preventDefault();
        contextTargetMessage = messageRow;
        
        const messageUserId = messageRow.dataset.userId;
        const isOwnMessage = currentUser && String(messageUserId) === String(currentUser.id);
        // TODO: Check if user is admin for delete permission
        const canDelete = isOwnMessage; // || isAdmin
        
        const items = [
            { action: 'reply', icon: 'bi bi-reply-fill', label: 'Trả lời' },
            { action: 'copy', icon: 'bi bi-clipboard', label: 'Sao chép văn bản' }
        ];
        
        if (isOwnMessage) {
            items.push({ action: 'edit', icon: 'bi bi-pencil', label: 'Chỉnh sửa' });
        }
        
        if (canDelete) {
            items.push({ divider: true });
            items.push({ action: 'delete', icon: 'bi bi-trash', label: 'Xóa tin nhắn', danger: true });
        }
        
        showContextMenu(e.clientX, e.clientY, items);
    }

    // Context menu for server icons
    function showServerContextMenu(e, serverItem) {
        e.preventDefault();
        contextTargetServer = serverItem;
        
        const items = [
            { action: 'invite-friends', icon: 'bi bi-person-plus', label: 'Mời bạn bè' },
            { action: 'server-settings', icon: 'bi bi-gear', label: 'Cài đặt Server' },
            { divider: true },
            { action: 'leave-server', icon: 'bi bi-box-arrow-left', label: 'Rời Server', danger: true }
        ];
        
        showContextMenu(e.clientX, e.clientY, items);
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

    // ==================== SERVER SETTINGS & LEAVE ====================
    function showServerSettingsModal() {
        // TODO: Implement server settings modal
        alert('Chức năng Cài đặt Server đang được phát triển');
    }

    async function leaveCurrentServer() {
        if (!activeServerId) return;
        
        const server = servers.find(s => String(s.id) === String(activeServerId));
        const serverName = server?.name || 'Server';
        
        if (!confirm(`Bạn có chắc muốn rời khỏi "${serverName}"?`)) return;
        
        try {
            await apiPost(`/api/servers/${activeServerId}/leave`, {});
            await loadServers();
            renderServerList();
            
            // Select another server if available
            if (servers.length > 0) {
                await selectServer(servers[0].id);
            } else {
                activeServerId = null;
                activeChannelId = null;
                el.serverName.textContent = 'Chọn một server';
                el.channelList.innerHTML = '';
                clearMessages();
            }
        } catch (e) {
            alert('Không thể rời server: ' + (e.message || 'Lỗi'));
        }
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

    // ==================== INVITE FRIENDS MODAL ====================
    let inviteCode = '';
    let friendsList = [];
    let invitedFriends = new Set();

    async function showInviteFriendsModal() {
        if (!activeServerId) return;
        
        const server = servers.find(s => String(s.id) === String(activeServerId));
        const serverName = server?.name || 'Máy chủ';
        invitedFriends.clear();

        const modal = document.getElementById('inviteFriendsModal');
        const serverNameEl = document.getElementById('inviteServerName');
        const searchInput = document.getElementById('inviteFriendSearch');
        
        if (modal) modal.style.display = 'flex';
        if (serverNameEl) serverNameEl.textContent = serverName;
        if (searchInput) searchInput.value = '';

        // Load friends and invite link
        await Promise.all([loadFriendsForInvite(), generateInviteLink()]);
        renderInviteFriendsList();
    }

    function hideInviteFriendsModal() {
        const modal = document.getElementById('inviteFriendsModal');
        if (modal) modal.style.display = 'none';
        inviteCode = '';
        friendsList = [];
        invitedFriends.clear();
    }

    async function loadFriendsForInvite() {
        try {
            friendsList = await apiGet('/api/friends') || [];
        } catch (err) {
            console.error('Failed to load friends:', err);
            friendsList = [];
        }
    }

    async function generateInviteLink() {
        if (!activeServerId) return;
        
        try {
            const invite = await apiPost(`/api/servers/${activeServerId}/invites`, { maxUses: 0, expiresInDays: 7 });
            
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
        const filtered = friendsList.filter(f => {
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
            
            const invited = invitedFriends.has(friend.id);
            const online = isOnline(friend.username);
            
            return `
                <div class="invite-friend-row" data-friend-id="${friend.id}">
                    <div class="invite-friend-avatar">
                        ${avatarHtml}
                        <span class="status-dot ${online ? 'online' : ''}"></span>
                    </div>
                    <span class="invite-friend-name">${escapeHtml(friend.displayName || friend.username || 'Unknown')}</span>
                    <button class="btn-invite ${invited ? 'invited' : ''}" ${invited ? 'disabled' : ''} onclick="inviteFriendFromChat(${friend.id})">
                        ${invited ? 'Đã mời' : 'Mời'}
                    </button>
                </div>
            `;
        }).join('');
    }

    function filterInviteFriends(query) {
        renderInviteFriendsList(query);
    }

    async function inviteFriendFromChat(friendId) {
        if (!activeServerId || !friendId) return;
        
        const server = servers.find(s => String(s.id) === String(activeServerId));
        const serverName = server?.name || 'Máy chủ';
        
        // Mark as invited immediately for better UX
        invitedFriends.add(friendId);
        renderInviteFriendsList(document.getElementById('inviteFriendSearch')?.value || '');

        try {
            // Send DM with invite link
            const friend = friendsList.find(f => f.id === friendId);
            if (friend) {
                // Find or create DM group with this friend
                const res = await fetch(`/api/direct-messages/find-or-create?userId=${encodeURIComponent(friendId)}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getAccessToken()}`
                    }
                });
                
                if (res.ok) {
                    const dmGroup = await res.json();
                    if (dmGroup?.id) {
                        const inviteLink = document.getElementById('inviteLinkInput')?.value || '';
                        await fetch(`/api/direct-messages/${encodeURIComponent(dmGroup.id)}/messages`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${getAccessToken()}`
                            },
                            body: JSON.stringify({
                                content: `Bạn được mời tham gia máy chủ ${serverName}!\n${inviteLink}`,
                                attachmentUrls: []
                            })
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Failed to send invite:', err);
        }
    }

    // Make inviteFriendFromChat accessible globally for onclick
    window.inviteFriendFromChat = inviteFriendFromChat;

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
            linkInput.select();
            document.execCommand('copy');
        }
    }

    // ==================== USER SETTINGS MODAL ====================
    function showUserSettingsModal() {
        if (!el.userSettingsModal) return;
        
        // Populate user data
        populateSettingsData();
        
        // Show modal with animation
        el.userSettingsModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus first input or close button
        setTimeout(() => {
            el.closeUserSettingsModal?.focus();
        }, 100);
    }
    
    function hideUserSettingsModal() {
        if (!el.userSettingsModal) return;
        el.userSettingsModal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    function populateSettingsData() {
        if (!currentUser) return;
        
        // Account tab
        const usernameDisplay = document.getElementById('settingsUsername');
        const emailDisplay = document.getElementById('settingsEmail');
        const avatarDisplay = document.getElementById('settingsAvatar');
        const displayNameDisplay = document.getElementById('settingsDisplayName');
        
        if (usernameDisplay) usernameDisplay.textContent = currentUser.username || 'user';
        if (emailDisplay) emailDisplay.textContent = currentUser.email || 'email@example.com';
        if (displayNameDisplay) displayNameDisplay.textContent = currentUser.displayName || currentUser.username || 'User';
        
        if (avatarDisplay) {
            if (currentUser.avatarUrl) {
                avatarDisplay.innerHTML = `<img src="${escapeHtml(currentUser.avatarUrl)}" alt="Avatar">`;
            } else {
                const initial = (currentUser.displayName || currentUser.username || 'U').charAt(0).toUpperCase();
                avatarDisplay.innerHTML = `<span class="avatar-initial">${initial}</span>`;
            }
        }
        
        // Profile tab inputs
        const displayNameInput = document.getElementById('profileDisplayName');
        const aboutMeInput = document.getElementById('profileAboutMe');
        
        if (displayNameInput) displayNameInput.value = currentUser.displayName || '';
        if (aboutMeInput) aboutMeInput.value = currentUser.aboutMe || '';
    }
    
    function switchSettingsTab(tabName) {
        // Update nav
        el.settingsNavItems?.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });
        
        // Update tabs - use data-tab attribute instead of id
        el.settingsTabs?.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update title
        if (el.settingsTitle) {
            const titles = {
                'account': 'Tài khoản của tôi',
                'profile': 'Hồ sơ cá nhân',
                'voice': 'Giọng nói & Video',
                'notifications': 'Thông báo',
                'privacy': 'Quyền riêng tư',
                'appearance': 'Giao diện',
                'language': 'Ngôn ngữ',
                'devices': 'Thiết bị',
                'connections': 'Kết nối',
                'accessibility': 'Trợ năng',
                'keybinds': 'Phím tắt'
            };
            el.settingsTitle.textContent = titles[tabName] || 'Cài đặt';
        }
    }
    
    async function saveProfileSettings() {
        const displayNameInput = document.getElementById('profileDisplayName');
        const aboutMeInput = document.getElementById('profileAboutMe');
        
        const data = {
            displayName: displayNameInput?.value?.trim() || '',
            aboutMe: aboutMeInput?.value?.trim() || ''
        };
        
        try {
            await apiPost('/api/users/me/profile', data);
            if (currentUser) {
                currentUser.displayName = data.displayName;
                currentUser.aboutMe = data.aboutMe;
            }
            populateSettingsData();
            showToast('Đã lưu hồ sơ');
        } catch (e) {
            showToast('Không thể lưu hồ sơ');
        }
    }

    // ==================== VOICE CHANNEL (PeerJS/WebRTC) ====================
    function initPeer() {
        if (peer) return Promise.resolve(peer);
        
        return new Promise((resolve, reject) => {
            // Generate unique peer ID based on user
            const peerId = `cococord-${currentUser?.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            peer = new Peer(peerId, {
                debug: 0 // Disable debug logs
            });
            
            peer.on('open', (id) => {
                console.log('PeerJS connected with ID:', id);
                resolve(peer);
            });
            
            peer.on('call', handleIncomingCall);
            
            peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                if (err.type === 'unavailable-id') {
                    // Try again with different ID
                    peer = null;
                    setTimeout(() => initPeer().then(resolve).catch(reject), 1000);
                } else {
                    reject(err);
                }
            });
            
            peer.on('disconnected', () => {
                console.log('PeerJS disconnected, attempting to reconnect...');
                peer?.reconnect();
            });
        });
    }
    
    async function joinVoiceChannel(channelId) {
        if (!channelId) return;
        
        // Leave current voice channel if any
        if (activeVoiceChannelId) {
            await leaveVoiceChannel();
        }
        
        try {
            // Request microphone permission
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            
            // Initialize PeerJS
            await initPeer();
            
            activeVoiceChannelId = channelId;
            
            // Re-render channel list to show active state
            renderChannelList();
            
            // Update UI
            const channel = channels.find(c => String(c.id) === String(channelId));
            if (el.voiceChannelName) {
                el.voiceChannelName.textContent = channel?.name || 'Voice Channel';
            }
            if (el.voiceConnectedBar) {
                el.voiceConnectedBar.classList.add('show');
            }
            
            // Subscribe to voice channel via WebSocket
            await subscribeToVoiceChannel(channelId);
            
            // Notify server that we joined
            if (stompClient?.connected) {
                stompClient.send('/app/voice.join', {}, JSON.stringify({
                    channelId: channelId,
                    serverId: activeServerId,
                    peerId: peer.id
                }));
            }
            
            // Update mic/deafen button states
            updateVoiceButtonStates();
            
        } catch (err) {
            console.error('Failed to join voice channel:', err);
            if (err.name === 'NotAllowedError') {
                showToast('Vui lòng cho phép truy cập microphone');
            } else {
                showToast('Không thể kết nối voice channel');
            }
            await leaveVoiceChannel();
        }
    }
    
    async function leaveVoiceChannel() {
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        // Close all peer connections
        voiceConnections.forEach(({ call }) => {
            try { call.close(); } catch (e) { /* ignore */ }
        });
        voiceConnections.clear();
        
        // Notify server
        if (stompClient?.connected && activeVoiceChannelId) {
            stompClient.send('/app/voice.leave', {}, JSON.stringify({
                channelId: activeVoiceChannelId,
                peerId: peer?.id
            }));
        }
        
        // Unsubscribe from voice channel
        if (voiceSubscription) {
            try { voiceSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            voiceSubscription = null;
        }
        
        activeVoiceChannelId = null;
        
        // Re-render channel list to remove active state
        renderChannelList();
        
        // Update UI
        if (el.voiceConnectedBar) {
            el.voiceConnectedBar.classList.remove('show');
        }
    }
    
    async function subscribeToVoiceChannel(channelId) {
        await ensureStompConnected();
        
        if (voiceSubscription) {
            try { voiceSubscription.unsubscribe(); } catch (e) { /* ignore */ }
        }
        
        voiceSubscription = stompClient.subscribe(`/topic/voice/${channelId}`, (message) => {
            try {
                const payload = JSON.parse(message.body);
                handleVoiceEvent(payload);
            } catch (e) { /* ignore */ }
        });
    }
    
    function handleVoiceEvent(payload) {
        const { type, peerId, userId, username } = payload;
        
        switch (type) {
            case 'USER_JOINED':
                // Someone joined, call them
                if (peerId && peerId !== peer?.id) {
                    console.log('User joined voice, calling:', username);
                    callPeer(peerId, userId, username);
                }
                break;
                
            case 'USER_LEFT':
                // Someone left, close their connection
                if (peerId) {
                    const conn = voiceConnections.get(peerId);
                    if (conn) {
                        try { conn.call.close(); } catch (e) { /* ignore */ }
                        voiceConnections.delete(peerId);
                    }
                }
                break;
                
            case 'PARTICIPANTS_UPDATE':
                // Update participants list UI
                if (payload.participants) {
                    updateVoiceParticipants(payload.participants);
                }
                break;
        }
    }
    
    function callPeer(peerId, userId, username) {
        if (!peer || !localStream) return;
        
        const call = peer.call(peerId, localStream);
        
        call.on('stream', (remoteStream) => {
            console.log('Received stream from:', username);
            playRemoteStream(remoteStream, peerId);
        });
        
        call.on('close', () => {
            console.log('Call closed with:', username);
            removeRemoteStream(peerId);
            voiceConnections.delete(peerId);
        });
        
        voiceConnections.set(peerId, { call, userId, username });
    }
    
    function handleIncomingCall(call) {
        if (!localStream) {
            call.close();
            return;
        }
        
        call.answer(localStream);
        
        call.on('stream', (remoteStream) => {
            console.log('Received incoming stream');
            playRemoteStream(remoteStream, call.peer);
        });
        
        call.on('close', () => {
            removeRemoteStream(call.peer);
            voiceConnections.delete(call.peer);
        });
        
        voiceConnections.set(call.peer, { call, userId: null, username: null });
    }
    
    function playRemoteStream(stream, peerId) {
        // Create audio element for this stream
        let audio = document.getElementById(`audio-${peerId}`);
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = `audio-${peerId}`;
            audio.autoplay = true;
            audio.style.display = 'none';
            document.body.appendChild(audio);
        }
        audio.srcObject = stream;
        audio.muted = isDeafened;
    }
    
    function removeRemoteStream(peerId) {
        const audio = document.getElementById(`audio-${peerId}`);
        if (audio) {
            audio.srcObject = null;
            audio.remove();
        }
    }
    
    function toggleMute() {
        isMuted = !isMuted;
        
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
        
        // Notify server
        if (stompClient?.connected && activeVoiceChannelId) {
            stompClient.send('/app/voice.mute', {}, JSON.stringify({
                channelId: activeVoiceChannelId,
                isMuted: isMuted
            }));
        }
        
        updateVoiceButtonStates();
    }
    
    function toggleDeafen() {
        isDeafened = !isDeafened;
        
        // If deafening, also mute
        if (isDeafened && !isMuted) {
            isMuted = true;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                });
            }
        }
        
        // Mute/unmute all remote streams
        document.querySelectorAll('audio[id^="audio-"]').forEach(audio => {
            audio.muted = isDeafened;
        });
        
        // Notify server
        if (stompClient?.connected && activeVoiceChannelId) {
            stompClient.send('/app/voice.deafen', {}, JSON.stringify({
                channelId: activeVoiceChannelId,
                isDeafened: isDeafened,
                isMuted: isMuted
            }));
        }
        
        updateVoiceButtonStates();
    }
    
    function updateVoiceButtonStates() {
        if (el.micBtn) {
            el.micBtn.classList.toggle('muted', isMuted);
            el.micBtn.innerHTML = isMuted 
                ? '<i class="bi bi-mic-mute-fill"></i>' 
                : '<i class="bi bi-mic-fill"></i>';
            el.micBtn.title = isMuted ? 'Bật tiếng' : 'Tắt tiếng';
        }
        
        if (el.deafenBtn) {
            el.deafenBtn.classList.toggle('deafened', isDeafened);
            el.deafenBtn.innerHTML = isDeafened 
                ? '<i class="bi bi-volume-mute-fill"></i>' 
                : '<i class="bi bi-headphones"></i>';
            el.deafenBtn.title = isDeafened ? 'Bật nghe' : 'Tắt nghe';
        }
    }
    
    function updateVoiceParticipants(participants) {
        // Update UI to show who's in voice channel
        // This could update a participants list in the channel sidebar
        console.log('Voice participants:', participants);
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
    
    function toggleUserDropdown() {
        if (!el.userDropdown) return;
        const isVisible = el.userDropdown.style.display !== 'none';
        el.userDropdown.style.display = isVisible ? 'none' : 'block';
    }

    function toggleMembersSidebar() {
        el.membersSidebar.classList.toggle('show');
        el.membersToggleBtn.classList.toggle('active');
    }
    
    function doLogout() {
        if (typeof logout === 'function') {
            logout();
        } else {
            localStorage.clear();
            window.location.href = '/login';
        }
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
        
        el.invitePeopleBtn?.addEventListener('click', () => {
            toggleServerDropdown();
            showInviteFriendsModal();
        });
        
        el.serverSettingsBtn?.addEventListener('click', () => {
            toggleServerDropdown();
            showServerSettingsModal();
        });
        
        el.leaveServerBtn?.addEventListener('click', () => {
            toggleServerDropdown();
            leaveCurrentServer();
        });
        
        // Invite Friends Modal
        document.getElementById('closeInviteFriendsModal')?.addEventListener('click', hideInviteFriendsModal);
        document.getElementById('copyInviteLinkBtn')?.addEventListener('click', copyInviteLink);
        document.getElementById('inviteFriendSearch')?.addEventListener('input', (e) => {
            filterInviteFriends(e.target.value);
        });
        document.getElementById('inviteFriendsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'inviteFriendsModal') hideInviteFriendsModal();
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
        el.settingsBtn?.addEventListener('click', showUserSettingsModal);
        el.logoutBtn?.addEventListener('click', doLogout);
        
        // User Settings Modal
        el.closeUserSettingsModal?.addEventListener('click', hideUserSettingsModal);
        el.settingsLogoutBtn?.addEventListener('click', doLogout);
        el.settingsNavItems?.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                if (tab) switchSettingsTab(tab);
            });
        });
        el.userSettingsModal?.addEventListener('click', (e) => {
            // Close on overlay click (outside modal content)
            if (e.target === el.userSettingsModal) hideUserSettingsModal();
        });
        document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfileSettings);
        
        // Escape key to close settings modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && el.userSettingsModal?.classList.contains('show')) {
                hideUserSettingsModal();
            }
        });
        
        // Mic/Deafen buttons
        el.micBtn?.addEventListener('click', () => {
            if (activeVoiceChannelId) {
                toggleMute();
            }
        });
        el.deafenBtn?.addEventListener('click', () => {
            if (activeVoiceChannelId) {
                toggleDeafen();
            }
        });
        
        // Voice disconnect button
        el.voiceDisconnectBtn?.addEventListener('click', leaveVoiceChannel);
        
        // User info dropdown (click on user info shows dropdown with logout)
        el.userInfoBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserDropdown();
        });
        el.logoutBtnUser?.addEventListener('click', doLogout);
        
        // Members toggle
        el.membersToggleBtn?.addEventListener('click', toggleMembersSidebar);
        
        // Chat composer
        el.chatComposer?.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = (el.chatInput.value || '').trim();
            if (!text || !activeChannelId) return;

            if (!stompClient || !stompClient.connected) return;

            // Cancel reply if active
            cancelReply();

            stompClient.send(
                '/app/chat.sendMessage',
                {},
                JSON.stringify({ channelId: activeChannelId, content: text })
            );

            el.chatInput.value = '';
        });
        
        // Typing indicator - send when user types
        el.chatInput?.addEventListener('input', () => {
            sendTypingNotification();
        });
        
        // Message list scroll handler for infinite scroll & new message banner
        el.messageList?.addEventListener('scroll', handleMessageScroll);
        
        // Context menu - prevent default on message list
        el.messageList?.addEventListener('contextmenu', (e) => {
            const messageRow = e.target.closest('.message-row');
            if (messageRow) {
                showMessageContextMenu(e, messageRow);
            } else {
                // Don't show custom menu if not on a message
                hideContextMenu();
            }
        });
        
        // Context menu - for global server sidebar (in decorator)
        const globalServerList = document.getElementById('globalServerList');
        globalServerList?.addEventListener('contextmenu', (e) => {
            const serverItem = e.target.closest('.server-item');
            if (serverItem && serverItem.dataset.serverId) {
                showServerContextMenu(e, serverItem);
            }
        });
        
        // Also handle local server list if exists
        el.serverList?.addEventListener('contextmenu', (e) => {
            const serverItem = e.target.closest('.server-item');
            if (serverItem && serverItem.dataset.serverId) {
                showServerContextMenu(e, serverItem);
            }
        });
        
        // Hide context menu on click anywhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                hideContextMenu();
            }
        });
        
        // Hide context menu on scroll
        document.addEventListener('scroll', hideContextMenu, true);
        
        // Hide context menu on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideContextMenu();
            }
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!el.serverHeader?.contains(e.target) && !el.serverDropdown?.contains(e.target)) {
                if (el.serverDropdown) el.serverDropdown.style.display = 'none';
            }
            if (!el.settingsBtn?.contains(e.target) && !el.userSettingsDropdown?.contains(e.target)) {
                if (el.userSettingsDropdown) el.userSettingsDropdown.style.display = 'none';
            }
            if (!el.userInfoBtn?.contains(e.target) && !el.userDropdown?.contains(e.target)) {
                if (el.userDropdown) el.userDropdown.style.display = 'none';
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
