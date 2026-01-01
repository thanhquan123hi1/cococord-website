/* global SockJS, Stomp, fetchWithAuth, getAccessToken, logout, Peer */

(function () {
    'use strict';

    // ==================== DOM ELEMENTS ====================
    const el = {
        // Server sidebar - Sử dụng global sidebar từ app.jsp decorator
        globalServerList: document.getElementById('globalServerList'),
        
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
        settingsNavItems: document.querySelectorAll('#userSettingsModal .settings-nav-item[data-tab]'),
        settingsTabs: document.querySelectorAll('#userSettingsModal .settings-tab'),
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
        channelTypeOptions: document.querySelectorAll('.channel-type-option'),
        
        // Create Category Modal
        createCategoryModal: document.getElementById('createCategoryModal'),
        closeCreateCategoryModal: document.getElementById('closeCreateCategoryModal'),
        categoryNameInput: document.getElementById('categoryNameInput'),
        cancelCreateCategory: document.getElementById('cancelCreateCategory'),
        confirmCreateCategory: document.getElementById('confirmCreateCategory'),
        createCategoryBtn: document.getElementById('createCategoryBtn')
    };

    // ==================== STATE ====================
    let stompClient = null;
    let channelSubscription = null;
    let presenceSubscription = null;
    let typingSubscription = null;
    let deleteSubscription = null;
    let voiceSubscription = null;
    let serverChannelsSubscription = null;
    let serverCategoriesSubscription = null;

    let servers = [];
    let channels = [];
    let categories = [];
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

    function normalizeName(name) {
        return String(name || '').trim().toLowerCase();
    }

    function isNewServerOnboardingContext(channel) {
        if (!activeServerId || !channel) return false;
        // Heuristic: brand-new server has only default text+voice channels and no custom categories
        if (Array.isArray(categories) && categories.length > 0) return false;
        if (!Array.isArray(channels) || channels.length > 2) return false;

        const hasDefaultText = channels.some(c => (c.type !== 'VOICE') && normalizeName(c.name) === 'chung');
        const hasDefaultVoice = channels.some(c => (c.type === 'VOICE') && normalizeName(c.name) === 'chung');
        if (!hasDefaultText || !hasDefaultVoice) return false;

        // Show onboarding when viewing the default text channel
        return (channel.type !== 'VOICE') && normalizeName(channel.name) === 'chung';
    }

    function renderChatEmptyState(channel) {
        const onboarding = document.getElementById('serverOnboardingState');
        const channelEmpty = document.getElementById('channelEmptyState');

        const showOnboarding = isNewServerOnboardingContext(channel);
        if (onboarding) onboarding.style.display = showOnboarding ? '' : 'none';
        if (channelEmpty) channelEmpty.style.display = showOnboarding ? 'none' : '';

        if (showOnboarding) {
            const server = servers.find(s => String(s.id) === String(activeServerId));
            const serverName = server?.name || 'Máy chủ của bạn';
            const serverNameEl = document.getElementById('welcomeServerName');
            if (serverNameEl) serverNameEl.textContent = serverName;
        }
    }

    // ==================== RENDER FUNCTIONS ====================
    
    // Cập nhật active state trên global server sidebar (từ app.jsp decorator)
    function updateGlobalServerListActive() {
        if (!el.globalServerList) return;
        
        // Remove active class from all server items
        el.globalServerList.querySelectorAll('.server-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current server
        if (activeServerId) {
            const activeItem = el.globalServerList.querySelector(`[data-server-id="${activeServerId}"]`);
            if (activeItem) activeItem.classList.add('active');
        }
        
        // Update home button state
        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            if (!activeServerId) {
                homeBtn.classList.add('active');
            } else {
                homeBtn.classList.remove('active');
            }
        }
    }
    
    // Gắn SPA-like navigation events vào global server sidebar
    function setupGlobalServerSidebarSPA() {
        if (!el.globalServerList) return;
        
        el.globalServerList.querySelectorAll('.server-item[data-server-id]').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const serverId = item.dataset.serverId;
                if (serverId && String(serverId) !== String(activeServerId)) {
                    await selectServer(Number(serverId));
                }
            });
        });
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

        // Group channels by categoryId
        const uncategorizedChannels = channels.filter(c => !c.categoryId);
        const channelsByCategory = new Map();
        
        for (const cat of categories) {
            channelsByCategory.set(cat.id, channels.filter(c => c.categoryId === cat.id));
        }

        // Helper function to render a channel item
        const renderChannelItem = (c) => {
            const isVoice = c.type === 'VOICE';
            const item = document.createElement('div');
            item.className = 'channel-item' + 
                (isVoice ? ' voice-channel' : '') +
                (String(c.id) === String(activeChannelId) ? ' active' : '') +
                (isVoice && String(c.id) === String(activeVoiceChannelId) ? ' voice-active' : '');
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.dataset.channelId = c.id;
            item.dataset.channelType = c.type || 'TEXT';

            const icon = isVoice 
                ? '<i class="bi bi-volume-up"></i>' 
                : '<span class="hash">#</span>';
            
            item.innerHTML = `
                ${icon}
                <span class="channel-name">${escapeHtml(c.name || 'channel')}</span>
                ${c.isDefault ? '<i class="bi bi-star-fill channel-default-icon" title="Kênh mặc định"></i>' : ''}
            `;

            const channelId = c.id;
            if (isVoice) {
                item.addEventListener('click', () => joinVoiceChannel(channelId));
            } else {
                item.addEventListener('click', () => selectChannel(channelId));
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectChannel(channelId);
                    }
                });
            }

            return item;
        };

        // Helper function to create a category container
        const createCategory = (name, channelList, categoryId = null, collapsed = false) => {
            if (!channelList.length) return null;

            const category = document.createElement('div');
            category.className = 'channel-category';
            if (categoryId) category.dataset.categoryId = categoryId;

            const header = document.createElement('div');
            header.className = 'category-header' + (collapsed ? ' collapsed' : '');
            header.innerHTML = `
                <i class="bi bi-chevron-down category-toggle"></i>
                <span class="category-name">${escapeHtml(name)}</span>
                <button class="category-add-channel" title="Tạo kênh">
                    <i class="bi bi-plus"></i>
                </button>
            `;

            // Toggle collapse
            header.addEventListener('click', (e) => {
                if (e.target.closest('.category-add-channel')) return;
                header.classList.toggle('collapsed');
                channelsContainer.classList.toggle('collapsed');
            });

            // Add channel button
            const addBtn = header.querySelector('.category-add-channel');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Open create channel modal with this category pre-selected
                    openCreateChannelModal(categoryId);
                });
            }

            category.appendChild(header);

            const channelsContainer = document.createElement('div');
            channelsContainer.className = 'channels-container' + (collapsed ? ' collapsed' : '');

            for (const c of channelList) {
                channelsContainer.appendChild(renderChannelItem(c));
            }

            category.appendChild(channelsContainer);
            return category;
        };

        // Render uncategorized channels first (if any)
        if (uncategorizedChannels.length > 0) {
            const textChannels = uncategorizedChannels.filter(c => c.type !== 'VOICE');
            const voiceChannels = uncategorizedChannels.filter(c => c.type === 'VOICE');

            const textCategory = createCategory('KÊNH VĂN BẢN', textChannels);
            if (textCategory) el.channelList.appendChild(textCategory);

            const voiceCategory = createCategory('KÊNH THOẠI', voiceChannels);
            if (voiceCategory) el.channelList.appendChild(voiceCategory);
        }

        // Render channels by category
        for (const cat of categories) {
            const catChannels = channelsByCategory.get(cat.id) || [];
            const categoryEl = createCategory(cat.name, catChannels, cat.id);
            if (categoryEl) el.channelList.appendChild(categoryEl);
        }
    }

    // Helper to open create channel modal with optional category pre-selected
    function openCreateChannelModal(categoryId = null) {
        if (el.createChannelModal) {
            el.createChannelModal.style.display = 'flex';
            el.channelNameInput.value = '';
            el.channelNameInput.focus();
            // Store category ID for when channel is created
            el.createChannelModal.dataset.categoryId = categoryId || '';
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
        const emptyState = el.chatEmpty;
        el.messageList.innerHTML = '';
        if (emptyState) el.messageList.appendChild(emptyState);
        if (emptyState) emptyState.style.display = 'block';
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
        
        // Set new timeout (auto-hide after 5 seconds if no new event)
        const timeout = setTimeout(() => {
            typingUsers.delete(username);
            renderTypingIndicator();
        }, 5000);
        
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
            
            // Add self to presence map
            presenceMap.set(currentUser.username, 'ONLINE');
            
            // UCP is now managed by app.js (global), no need to render here
            // Just notify app.js if it needs to update
            if (window.CoCoCordApp && window.CoCoCordApp.updateGlobalUserPanel) {
                window.CoCoCordApp.updateGlobalUserPanel(currentUser);
            }
        } catch (e) {
            console.error('Failed to load user info', e);
        }
    }

    // ==================== DATA LOADING ====================
    async function loadServers() {
        servers = await apiGet('/api/servers');
    }

    async function loadChannels(serverId) {
        // Load channels and categories in parallel
        try {
            const [channelData, categoryData] = await Promise.all([
                apiGet(`/api/servers/${serverId}/channels`),
                apiGet(`/api/servers/${serverId}/categories`).catch(() => [])
            ]);
            
            channels = channelData || [];
            channels.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            
            categories = categoryData || [];
            categories.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        } catch (e) {
            console.error('Failed to load channels:', e);
            channels = [];
            categories = [];
            throw e; // Re-throw to trigger retry in selectServer
        }
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
                const emptyState = el.chatEmpty;
                el.messageList.innerHTML = '';
                if (items.length) {
                    for (const m of items) appendMessage(m);
                    if (emptyState) emptyState.style.display = 'none';
                } else {
                    const channel = channels.find(c => String(c.id) === String(channelId));
                    renderChatEmptyState(channel);
                    if (emptyState) emptyState.style.display = 'block';
                }
                if (emptyState) el.messageList.appendChild(emptyState);
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
                    // New message - check for duplicates by ID
                    if (document.querySelector(`[data-message-id="${payload.id}"]`)) return;
                    
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
            } catch (e) { console.error('Error handling message:', e); }
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
    async function subscribeToServerUpdates(serverId) {
        await ensureStompConnected();

        // Unsubscribe from previous server subscriptions
        if (serverChannelsSubscription) {
            try { serverChannelsSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            serverChannelsSubscription = null;
        }
        if (serverCategoriesSubscription) {
            try { serverCategoriesSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            serverCategoriesSubscription = null;
        }

        // Subscribe to channel updates for this server
        serverChannelsSubscription = stompClient.subscribe(`/topic/server/${serverId}/channels`, async (message) => {
            try {
                const payload = JSON.parse(message.body);
                console.log('Channel update:', payload);
                // Reload channels and re-render
                await loadChannels(serverId);
                renderChannelList();
            } catch (e) {
                console.error('Error handling channel update:', e);
            }
        });

        // Subscribe to category updates for this server
        serverCategoriesSubscription = stompClient.subscribe(`/topic/server/${serverId}/categories`, async (message) => {
            try {
                const payload = JSON.parse(message.body);
                console.log('Category update:', payload);
                // Reload channels (includes categories) and re-render
                await loadChannels(serverId);
                renderChannelList();
            } catch (e) {
                console.error('Error handling category update:', e);
            }
        });
    }

    async function selectServer(serverId) {
        activeServerId = serverId;
        
        // Cập nhật URL (SPA-style, không reload)
        const newUrl = `/chat?serverId=${serverId}&channelId=${channelId}`;
        history.pushState({ serverId }, '', newUrl);

        const server = servers.find(s => String(s.id) === String(serverId));
        el.serverName.textContent = server ? (server.name || 'Server') : 'Server';

        // Cập nhật active state trên global sidebar
        updateGlobalServerListActive();
        clearMessages();

        // Load data with error handling and retry
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
            try {
                await Promise.all([
                    loadChannels(serverId),
                    loadMembers(serverId),
                    subscribeToServerUpdates(serverId)
                ]);
                break; // Success, exit retry loop
            } catch (e) {
                console.error(`Failed to load server data (attempt ${retryCount + 1}):`, e);
                retryCount++;
                if (retryCount > maxRetries) {
                    console.error('Max retries reached, server data may be incomplete');
                    // Set empty arrays to prevent undefined errors
                    if (!channels || !channels.length) channels = [];
                    if (!members || !members.length) members = [];
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        renderChannelList();
        renderMembersList();

        const nextChannelId = channels.length ? channels[0].id : null;
        if (nextChannelId != null) {
            await selectChannel(nextChannelId);
        } else {
            // No channels - show empty state
            el.channelName.textContent = 'Chọn kênh';
            el.chatComposer.style.display = 'none';
            el.chatEmpty.style.display = 'block';
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
        // Clear category ID when closing
        if (el.createChannelModal) {
            el.createChannelModal.dataset.categoryId = '';
        }
    }

    // ==================== CREATE CATEGORY MODAL ====================
    function showCreateCategoryModal() {
        if (el.createCategoryModal) {
            el.createCategoryModal.style.display = 'flex';
            if (el.categoryNameInput) {
                el.categoryNameInput.value = '';
                el.categoryNameInput.focus();
            }
        }
        // Hide server dropdown if open
        if (el.serverDropdown) el.serverDropdown.classList.remove('show');
    }

    function hideCreateCategoryModal() {
        if (el.createCategoryModal) {
            el.createCategoryModal.style.display = 'none';
        }
    }

    async function createCategory() {
        const name = el.categoryNameInput?.value.trim();
        if (!name || !activeServerId) return;

        try {
            await apiPost(`/api/servers/${activeServerId}/categories`, {
                name: name.toUpperCase()
            });
            hideCreateCategoryModal();
            await loadChannels(activeServerId);
            renderChannelList();
        } catch (e) {
            alert('Không thể tạo danh mục: ' + (e.message || 'Lỗi'));
        }
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

        // Get category ID if set from modal
        const categoryId = el.createChannelModal?.dataset.categoryId || null;

        try {
            const payload = {
                name,
                type: selectedChannelType
            };
            if (categoryId) {
                payload.categoryId = parseInt(categoryId, 10);
            }

            await apiPost(`/api/servers/${activeServerId}/channels`, payload);
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
            const server = servers.find(s => String(s.id) === String(activeServerId));
            const channelName = channel?.name || 'Voice Channel';
            const serverName = server?.name || 'Máy chủ';
            
            if (el.voiceChannelName) {
                el.voiceChannelName.textContent = channelName;
            }
            const voiceServerName = document.getElementById('voiceServerName');
            if (voiceServerName) {
                voiceServerName.textContent = serverName;
            }
            if (el.voiceConnectedBar) {
                el.voiceConnectedBar.classList.add('show');
            }
            
            // Show Voice Channel View
            const voiceView = document.getElementById('voiceChannelView');
            const textView = document.querySelector('.text-channel-view');
            if (voiceView) {
                voiceView.classList.add('active');
            }
            if (textView) {
                textView.style.display = 'none';
            }
            
            // Render self in participants grid
            renderVoiceParticipants([{
                peerId: peer?.id,
                username: currentUser?.displayName || currentUser?.username || 'Bạn',
                avatarUrl: currentUser?.avatarUrl,
                isMuted: isMuted,
                isDeafened: isDeafened,
                isCameraOn: false,
                isLocal: true
            }]);
            
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
    
    // Remote media streams keyed by peerId (used for remote video tiles)
    const remoteMediaStreams = new Map();

    function attachStreamToVideo(video, stream, { muted = false } = {}) {
        if (!video || !stream) return;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = !!muted;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            Promise.resolve(video.play()).catch(() => { /* ignore */ });
        };
    }

    function renderVoiceParticipants(participants) {
        const grid = document.getElementById('voiceParticipantsGrid');
        if (!grid) return;
        
        grid.setAttribute('data-count', participants.length);
        grid.innerHTML = participants.map(p => {
            const avatarHtml = p.avatarUrl
                ? `<img class="voice-participant-avatar" src="${p.avatarUrl}" alt="${escapeHtml(p.username)}">`
                : `<div class="voice-participant-avatar-placeholder">${(p.username || '?').charAt(0).toUpperCase()}</div>`;
            
            // Video element cho camera/screenshare
            const videoHtml = p.isCameraOn || p.isScreenSharing
                ? `<video class="voice-participant-video" id="video-${p.peerId}" autoplay playsinline ${p.isLocal ? 'muted' : ''}></video>`
                : '';
            
            return `
                <div class="voice-participant-tile ${p.isLocal ? 'self' : ''} ${p.isCameraOn ? 'camera-on' : ''} ${p.isScreenSharing ? 'screen-sharing' : ''}" id="voice-tile-${p.peerId}">
                    ${videoHtml}
                    <div class="voice-avatar-wrapper" style="${p.isCameraOn || p.isScreenSharing ? 'display:none' : ''}">
                        ${avatarHtml}
                    </div>
                    <div class="voice-participant-info">
                        <div class="voice-participant-name">
                            ${p.isMuted ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.3.43-2.05V9.5c0-.28.22-.5.5-.5s.5.22.5.5V11zm-5.5 4.28l-1.23-1.23V15c0 .55-.45 1-1 1H9.27l-2 2h4c1.66 0 3-1.34 3-3v-.72zm3.13 3.13L4.41 6.41 3 7.82l3.03 3.03C6.01 11.23 6 11.61 6 12v3c0 1.66 1.34 3 3 3h2v2h2v-2h.17l3.31 3.31 1.15-1.15zM12 3c-1.66 0-3 1.34-3 3v2.17l6 6V6c0-1.66-1.34-3-3-3z"/></svg>' : ''}
                            ${escapeHtml(p.username)}
                        </div>
                        ${!p.isCameraOn && !p.isScreenSharing ? `
                            <div class="voice-indicator">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                                </svg>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Attach video streams sau khi render
        participants.forEach(p => {
            const shouldShowVideo = (p.isCameraOn || p.isScreenSharing);
            if (!shouldShowVideo) return;

            const video = document.getElementById(`video-${p.peerId}`);
            if (!video) return;

            if (p.isLocal && localVideoStream) {
                attachStreamToVideo(video, localVideoStream, { muted: true });
                return;
            }

            // Remote video (if we have a remote stream with a video track)
            const remoteStream = remoteMediaStreams.get(p.peerId);
            const hasRemoteVideo = !!(remoteStream && remoteStream.getVideoTracks && remoteStream.getVideoTracks().length);
            if (hasRemoteVideo) {
                attachStreamToVideo(video, remoteStream, { muted: false });
            }
        });
    }
    
    async function leaveVoiceChannel() {
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        // Stop local video stream (camera/screen share)
        if (localVideoStream) {
            try {
                localVideoStream.getTracks().forEach(track => track.stop());
            } catch (e) { /* ignore */ }
            localVideoStream = null;
        }
        isCameraOn = false;
        isScreenSharing = false;
        
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
        
        // Update UI - hide voice view, show text view
        const voiceView = document.getElementById('voiceChannelView');
        const textView = document.querySelector('.text-channel-view');
        if (voiceView) {
            voiceView.classList.remove('active');
        }
        if (textView) {
            textView.style.display = '';
        }
        
        if (el.voiceConnectedBar) {
            el.voiceConnectedBar.classList.remove('show');
        }
        
        // Remove all audio elements
        document.querySelectorAll('[id^="audio-"]').forEach(el => el.remove());
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
        const { type, peerId, userId, username, avatarUrl, isMuted: peerMuted, isDeafened: peerDeafened, isCameraOn: peerCameraOn } = payload;
        
        switch (type) {
            case 'USER_JOINED':
                // Someone joined, call them
                if (peerId && peerId !== peer?.id) {
                    console.log('User joined voice, calling:', username);
                    callPeer(peerId, userId, username);
                    
                    // Add to participants and re-render
                    voiceParticipantsMap.set(peerId, {
                        peerId,
                        userId,
                        username,
                        avatarUrl,
                        isMuted: peerMuted || false,
                        isDeafened: peerDeafened || false,
                        isCameraOn: peerCameraOn || false,
                        isLocal: false
                    });
                    renderVoiceParticipantsFromMap();
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
                    voiceParticipantsMap.delete(peerId);
                    renderVoiceParticipantsFromMap();
                    
                    // Remove their audio
                    const audio = document.getElementById(`audio-${peerId}`);
                    if (audio) audio.remove();
                }
                break;
                
            case 'PARTICIPANTS_UPDATE':
                // Update participants list UI
                if (payload.participants) {
                    updateVoiceParticipants(payload.participants);
                }
                break;
                
            case 'MUTE_CHANGE':
                // Update participant's mute state
                if (peerId) {
                    const participant = voiceParticipantsMap.get(peerId);
                    if (participant) {
                        participant.isMuted = payload.isMuted;
                        renderVoiceParticipantsFromMap();
                    }
                }
                break;
                
            case 'DEAFEN_CHANGE':
                // Update participant's deafen state
                if (peerId) {
                    const participant = voiceParticipantsMap.get(peerId);
                    if (participant) {
                        participant.isDeafened = payload.isDeafened;
                        participant.isMuted = payload.isMuted || participant.isMuted;
                        renderVoiceParticipantsFromMap();
                    }
                }
                break;
                
            case 'CAMERA_CHANGE':
                // Update participant's camera state
                if (peerId) {
                    const participant = voiceParticipantsMap.get(peerId);
                    if (participant) {
                        participant.isCameraOn = payload.isCameraOn;
                        renderVoiceParticipantsFromMap();
                    }
                }
                break;
                
            case 'SCREEN_CHANGE':
                // Update participant's screen share state
                if (peerId) {
                    const participant = voiceParticipantsMap.get(peerId);
                    if (participant) {
                        participant.isScreenSharing = payload.isScreenSharing;
                        renderVoiceParticipantsFromMap();
                    }
                }
                break;
        }
    }
    
    // Store participants for rendering
    const voiceParticipantsMap = new Map();
    
    function renderVoiceParticipantsFromMap() {
        const participants = [];
        
        // Add self first
        if (peer?.id) {
            participants.push({
                peerId: peer.id,
                username: currentUser?.displayName || currentUser?.username || 'Bạn',
                avatarUrl: currentUser?.avatarUrl,
                isMuted: isMuted,
                isDeafened: isDeafened,
                isCameraOn: isCameraOn,
                isScreenSharing: isScreenSharing,
                isLocal: true
            });
        }
        
        // Add others
        voiceParticipantsMap.forEach(p => participants.push(p));
        
        renderVoiceParticipants(participants);
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
        // Save full remote stream for video tiles
        remoteMediaStreams.set(peerId, stream);

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

        // Re-render to allow remote video element to appear (if camera flag is on)
        renderVoiceParticipantsFromMap();
    }
    
    function removeRemoteStream(peerId) {
        const audio = document.getElementById(`audio-${peerId}`);
        if (audio) {
            audio.srcObject = null;
            audio.remove();
        }

        remoteMediaStreams.delete(peerId);

        const video = document.getElementById(`video-${peerId}`);
        if (video) {
            video.srcObject = null;
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
        
        // Update participants map then re-render (self always uses local state)
        if (!participants || !Array.isArray(participants)) return;

        const remotePeerIds = new Set();
        participants.forEach((p) => {
            if (!p) return;

            const normalizedPeerId = p.peerId || p.peerID || p.peer || p.id;
            const normalizedUserId = p.userId || p.userID || p.user || p.user_id;

            const isLocalParticipant = !!(
                (peer?.id && normalizedPeerId && String(normalizedPeerId) === String(peer.id)) ||
                (currentUser?.id && normalizedUserId && String(normalizedUserId) === String(currentUser.id))
            );

            if (isLocalParticipant) {
                return;
            }

            if (!normalizedPeerId) {
                return;
            }

            remotePeerIds.add(String(normalizedPeerId));
            voiceParticipantsMap.set(normalizedPeerId, {
                peerId: normalizedPeerId,
                userId: normalizedUserId,
                username: p.username,
                avatarUrl: p.avatarUrl,
                isMuted: !!p.isMuted,
                isDeafened: !!p.isDeafened,
                isCameraOn: !!p.isCameraOn,
                isScreenSharing: !!p.isScreenSharing,
                isLocal: false
            });
        });

        // Remove remotes not present anymore (if server sends full snapshot)
        Array.from(voiceParticipantsMap.keys()).forEach((pid) => {
            if (!remotePeerIds.has(String(pid))) {
                voiceParticipantsMap.delete(pid);
            }
        });

        renderVoiceParticipantsFromMap();
    }
    
    // ==================== CAMERA/SCREENSHARE ====================
    let localVideoStream = null;
    let isCameraOn = false;
    let isScreenSharing = false;

    function stopLocalVideoStream() {
        if (!localVideoStream) return;
        try {
            localVideoStream.getTracks().forEach(t => t.stop());
        } catch (e) { /* ignore */ }
        localVideoStream = null;
    }
    
    async function toggleCamera() {
        // Always stop any existing video stream first to avoid leaked/stale tracks
        if (localVideoStream) {
            stopLocalVideoStream();
        }
        if (isScreenSharing) {
            isScreenSharing = false;
        }
        
        if (isCameraOn) {
            // Turn off camera
            stopLocalVideoStream();
            isCameraOn = false;
            
            // Remove video from peer connections
            voiceConnections.forEach(({ call }) => {
                const pc = call.peerConnection;
                if (pc) {
                    const senders = pc.getSenders();
                    const videoSender = senders.find(s => s.track?.kind === 'video');
                    if (videoSender) {
                        pc.removeTrack(videoSender);
                    }
                }
            });
            
        } else {
            // Turn on camera
            try {
                localVideoStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
                isCameraOn = true;
                
                // Add video track to peer connections
                const videoTrack = localVideoStream.getVideoTracks()[0];
                voiceConnections.forEach(({ call }) => {
                    const pc = call.peerConnection;
                    if (pc && videoTrack) {
                        pc.addTrack(videoTrack, localVideoStream);
                    }
                });
                
            } catch (err) {
                console.error('Failed to get camera:', err);
                if (err?.name === 'NotReadableError') {
                    showToast('Camera đang được ứng dụng/tab khác sử dụng');
                } else if (err?.name === 'NotAllowedError') {
                    showToast('Vui lòng cho phép truy cập camera');
                } else {
                    showToast('Không thể bật camera');
                }
                return;
            }
        }
        
        // Notify server
        if (stompClient?.connected && activeVoiceChannelId) {
            stompClient.send('/app/voice.camera', {}, JSON.stringify({
                channelId: activeVoiceChannelId,
                isCameraOn: isCameraOn
            }));
        }
        
        updateVoiceViewButtons();
        updateSelfVideoTile();
    }
    
    async function toggleScreenShare() {
        if (isScreenSharing) {
            // Stop screen share
            stopLocalVideoStream();
            isScreenSharing = false;
        } else {
            // Start screen share
            try {
                // Stop camera if on
                if (isCameraOn) {
                    stopLocalVideoStream();
                    isCameraOn = false;
                }
                
                localVideoStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'always'
                    },
                    audio: false
                });
                
                isScreenSharing = true;
                
                // Add video track to peer connections
                const videoTrack = localVideoStream.getVideoTracks()[0];
                voiceConnections.forEach(({ call }) => {
                    const pc = call.peerConnection;
                    if (pc && videoTrack) {
                        pc.addTrack(videoTrack, localVideoStream);
                    }
                });
                
                // Handle when user stops sharing via browser UI
                videoTrack.onended = () => {
                    isScreenSharing = false;
                    localVideoStream = null;
                    updateVoiceViewButtons();
                    updateSelfVideoTile();
                };
                
            } catch (err) {
                console.error('Failed to share screen:', err);
                if (err.name !== 'NotAllowedError') {
                    showToast('Không thể chia sẻ màn hình');
                }
                return;
            }
        }
        
        // Notify server
        if (stompClient?.connected && activeVoiceChannelId) {
            stompClient.send('/app/voice.screen', {}, JSON.stringify({
                channelId: activeVoiceChannelId,
                isScreenSharing: isScreenSharing
            }));
        }
        
        updateVoiceViewButtons();
        updateSelfVideoTile();
    }
    
    function updateVoiceViewButtons() {
        // Update mute button
        const btnMute = document.getElementById('voiceBtnMute');
        if (btnMute) {
            btnMute.classList.toggle('active', isMuted);
            btnMute.innerHTML = isMuted 
                ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.3.43-2.05V9.5c0-.28.22-.5.5-.5s.5.22.5.5V11zm-5.5 4.28l-1.23-1.23V15c0 .55-.45 1-1 1H9.27l-2 2h4c1.66 0 3-1.34 3-3v-.72zm3.13 3.13L4.41 6.41 3 7.82l3.03 3.03C6.01 11.23 6 11.61 6 12v3c0 1.66 1.34 3 3 3h2v2h2v-2h.17l3.31 3.31 1.15-1.15zM12 3c-1.66 0-3 1.34-3 3v2.17l6 6V6c0-1.66-1.34-3-3-3z"/></svg>
                <span class="voice-btn-label">Tắt tiếng</span>`
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                <span class="voice-btn-label">Tắt tiếng</span>`;
        }
        
        // Update deafen button
        const btnDeafen = document.getElementById('voiceBtnDeafen');
        if (btnDeafen) {
            btnDeafen.classList.toggle('active', isDeafened);
            btnDeafen.innerHTML = isDeafened
                ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.63 3.63L2.21 5.05 6.16 9H4.41C3.07 9 2.2 10.33 2.56 11.6L4.1 16.93C4.3 17.59 4.89 18.04 5.58 18.04H8.5L12 21.5V15.5l3.76 3.76c-.37.23-.76.43-1.18.58v2.09c.72-.23 1.41-.53 2.06-.92l2.31 2.31 1.41-1.41L3.63 3.63zM12 4L9.91 6.09 12 8.18V4zm6.5 8c0-1.77-.77-3.29-2-4.35V13.5l2-2v.5z"/></svg>
                <span class="voice-btn-label">Bật nghe</span>`
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/></svg>
                <span class="voice-btn-label">Tắt nghe</span>`;
        }
        
        // Update camera button
        const btnCamera = document.getElementById('voiceBtnCamera');
        if (btnCamera) {
            btnCamera.classList.toggle('active', isCameraOn);
            btnCamera.innerHTML = isCameraOn
                ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                <span class="voice-btn-label">Tắt Camera</span>`
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>
                <span class="voice-btn-label">Bật Camera</span>`;
        }
        
        // Update screen share button
        const btnScreen = document.getElementById('voiceBtnScreen');
        if (btnScreen) {
            btnScreen.classList.toggle('active', isScreenSharing);
        }
        
        // Update voice bar buttons
        const barMute = document.getElementById('voiceBarMute');
        if (barMute) {
            barMute.classList.toggle('muted', isMuted);
            barMute.innerHTML = isMuted 
                ? '<i class="bi bi-mic-mute-fill"></i>' 
                : '<i class="bi bi-mic-fill"></i>';
        }
        
        const barDeafen = document.getElementById('voiceBarDeafen');
        if (barDeafen) {
            barDeafen.classList.toggle('deafened', isDeafened);
            barDeafen.innerHTML = isDeafened 
                ? '<i class="bi bi-volume-mute-fill"></i>' 
                : '<i class="bi bi-headphones"></i>';
        }
    }
    
    // Update video tile cho self user
    function updateSelfVideoTile() {
        const selfTile = document.getElementById(`voice-tile-${peer?.id}`);
        if (!selfTile) return;
        
        const hasVideo = isCameraOn || isScreenSharing;
        selfTile.classList.toggle('camera-on', isCameraOn);
        selfTile.classList.toggle('screen-sharing', isScreenSharing);
        
        // Get or create video element
        let video = selfTile.querySelector('video');
        const avatarWrapper = selfTile.querySelector('.voice-avatar-wrapper');
        
        if (hasVideo && localVideoStream) {
            // Show video
            if (!video) {
                video = document.createElement('video');
                video.id = `video-${peer?.id}`;
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                video.className = 'voice-participant-video';
                selfTile.insertBefore(video, selfTile.firstChild);
            }
            attachStreamToVideo(video, localVideoStream, { muted: true });
            video.style.display = '';
            
            // Hide avatar
            if (avatarWrapper) avatarWrapper.style.display = 'none';
        } else {
            // Hide video
            if (video) {
                video.srcObject = null;
                video.style.display = 'none';
            }
            // Show avatar
            if (avatarWrapper) avatarWrapper.style.display = '';
        }
        
        // Update camera off indicator
        const indicator = selfTile.querySelector('.voice-indicator');
        if (indicator) {
            indicator.style.display = hasVideo ? 'none' : '';
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

        // Server onboarding actions (empty state for new servers)
        document.getElementById('onboardingInviteBtn')?.addEventListener('click', () => showInviteFriendsModal());
        document.getElementById('onboardingPersonalizeBtn')?.addEventListener('click', () => showServerSettingsModal());
        document.getElementById('onboardingFirstMessageBtn')?.addEventListener('click', () => el.chatInput?.focus());
        document.getElementById('onboardingAddAppBtn')?.addEventListener('click', () => alert('Tính năng đang phát triển'));
        document.getElementById('onboardingGettingStartedLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Hướng dẫn Bắt Đầu đang được cập nhật');
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
        
        // Create category modal
        el.createCategoryBtn?.addEventListener('click', showCreateCategoryModal);
        el.closeCreateCategoryModal?.addEventListener('click', hideCreateCategoryModal);
        el.cancelCreateCategory?.addEventListener('click', hideCreateCategoryModal);
        el.confirmCreateCategory?.addEventListener('click', createCategory);
        el.categoryNameInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') createCategory();
        });
        
        // Channel type selection
        el.channelTypeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                selectedChannelType = opt.dataset.type;
                el.channelTypeOptions.forEach(o => o.classList.toggle('active', o === opt));
            });
        });
        
        // User settings - now handled by app.js global UCP
        // el.settingsBtn?.addEventListener('click', showUserSettingsModal);
        // el.logoutBtn?.addEventListener('click', doLogout);
        
        // User Settings Modal (still needed if modal is in chat page)
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
        el.userSettingsModal?.querySelector('#saveProfileBtn')?.addEventListener('click', saveProfileSettings);
        
        // Escape key to close settings modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && el.userSettingsModal?.classList.contains('show')) {
                hideUserSettingsModal();
            }
        });
        
        // Mic/Deafen buttons - app.js handles visual toggle, but voice logic stays here
        // These are now bound by app.js which calls our exported toggleMute/toggleDeafen
        
        // Voice disconnect button
        el.voiceDisconnectBtn?.addEventListener('click', leaveVoiceChannel);
        
        // Voice view controls
        const voiceBtnMute = document.getElementById('voiceBtnMute');
        const voiceBtnDeafen = document.getElementById('voiceBtnDeafen');
        const voiceBtnCamera = document.getElementById('voiceBtnCamera');
        const voiceBtnScreen = document.getElementById('voiceBtnScreen');
        const voiceBtnDisconnect = document.getElementById('voiceBtnDisconnect');
        
        voiceBtnMute?.addEventListener('click', () => {
            toggleMute();
            updateVoiceViewButtons();
        });
        
        voiceBtnDeafen?.addEventListener('click', () => {
            toggleDeafen();
            updateVoiceViewButtons();
        });
        
        voiceBtnCamera?.addEventListener('click', toggleCamera);
        voiceBtnScreen?.addEventListener('click', toggleScreenShare);
        voiceBtnDisconnect?.addEventListener('click', leaveVoiceChannel);
        
        // Voice connected bar controls
        document.getElementById('voiceBarMute')?.addEventListener('click', () => {
            toggleMute();
            updateVoiceViewButtons();
        });
        document.getElementById('voiceBarDeafen')?.addEventListener('click', () => {
            toggleDeafen();
            updateVoiceViewButtons();
        });
        document.getElementById('voiceBarDisconnect')?.addEventListener('click', leaveVoiceChannel);
        
        // User info dropdown - now handled by app.js global UCP
        // el.userInfoBtn?.addEventListener('click', ...);
        // el.logoutBtnUser?.addEventListener('click', doLogout);
        
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
        el.createCategoryModal?.addEventListener('click', (e) => {
            if (e.target === el.createCategoryModal) hideCreateCategoryModal();
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

        // Pick server - validate that requested server exists, fallback to first server
        let requestedServer = qp.serverId ? servers.find(s => String(s.id) === String(qp.serverId)) : null;
        activeServerId = requestedServer ? requestedServer.id : (servers.length ? servers[0].id : null);
        
        // Cập nhật global sidebar (active state + SPA events)
        updateGlobalServerListActive();
        setupGlobalServerSidebarSPA();

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
        
        // Pick channel - validate that requested channel exists, fallback to first channel
        let requestedChannel = qp.channelId ? channels.find(c => String(c.id) === String(qp.channelId)) : null;
        activeChannelId = requestedChannel ? requestedChannel.id : (channels.length ? channels[0].id : null);
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
        el.chatComposer.style.display = '';

        // Subscribe to channel updates and load history (don't block on WebSocket errors)
        try {
            await subscribeToChannel(activeChannelId);
        } catch (e) {
            console.warn('Failed to subscribe to channel:', e);
        }
        
        await loadHistory(activeChannelId);
        
        // Subscribe to server updates after channel setup
        try {
            await subscribeToServerUpdates(activeServerId);
        } catch (e) {
            console.warn('Failed to subscribe to server updates:', e);
        }
        
        // Handle browser back/forward navigation (SPA)
        window.addEventListener('popstate', async (event) => {
            if (event.state && event.state.serverId) {
                await selectServer(event.state.serverId);
            }
        });
    }

    // Track initialization state to prevent double-init
    let _chatInitialized = false;
    
    function cleanupSubscriptions() {
        // Unsubscribe all active subscriptions to prevent duplicate messages
        if (channelSubscription) {
            try { channelSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            channelSubscription = null;
        }
        if (presenceSubscription) {
            try { presenceSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            presenceSubscription = null;
        }
        if (typingSubscription) {
            try { typingSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            typingSubscription = null;
        }
        if (deleteSubscription) {
            try { deleteSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            deleteSubscription = null;
        }
        if (voiceSubscription) {
            try { voiceSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            voiceSubscription = null;
        }
        if (serverChannelsSubscription) {
            try { serverChannelsSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            serverChannelsSubscription = null;
        }
        if (serverCategoriesSubscription) {
            try { serverCategoriesSubscription.unsubscribe(); } catch (e) { /* ignore */ }
            serverCategoriesSubscription = null;
        }
    }
    
    async function initIfNeeded() {
        // Only init if we're on the chat page
        if (!document.getElementById('chatApp')) return;
        
        // Check if already initialized for current DOM
        if (_chatInitialized && el.channelList && document.contains(el.channelList)) return;
        
        // Cleanup old subscriptions to prevent duplicate messages
        cleanupSubscriptions();
        
        // Reinitialize element references in case DOM was replaced by SPA navigation
        reinitElements();
        _chatInitialized = true;
        
        await init();
    }
    
    function reinitElements() {
        // Re-query all DOM elements after SPA navigation
        el.globalServerList = document.getElementById('globalServerList');
        el.serverName = document.getElementById('serverName');
        el.serverHeader = document.getElementById('serverHeader');
        el.serverDropdown = document.getElementById('serverDropdown');
        el.channelList = document.getElementById('channelList');
        el.invitePeopleBtn = document.getElementById('invitePeopleBtn');
        el.serverSettingsBtn = document.getElementById('serverSettingsBtn');
        el.createChannelBtn = document.getElementById('createChannelBtn');
        el.leaveServerBtn = document.getElementById('leaveServerBtn');
        el.channelName = document.getElementById('channelName');
        el.channelTopic = document.getElementById('channelTopic');
        el.welcomeChannelName = document.getElementById('welcomeChannelName');
        el.messageList = document.getElementById('messageList');
        el.chatEmpty = document.getElementById('chatEmpty');
        el.chatComposer = document.getElementById('chatComposer');
        el.chatInput = document.getElementById('chatInput');
        el.membersSidebar = document.getElementById('membersSidebar');
        el.membersToggleBtn = document.getElementById('membersToggleBtn');
        el.onlineMembersList = document.getElementById('onlineMembersList');
        el.offlineMembersList = document.getElementById('offlineMembersList');
        el.onlineCount = document.getElementById('onlineCount');
        el.offlineCount = document.getElementById('offlineCount');
        el.voiceConnectedBar = document.getElementById('voiceConnectedBar');
        el.voiceChannelName = document.getElementById('voiceChannelName');
        el.voiceDisconnectBtn = document.getElementById('voiceDisconnectBtn');
        el.createServerModal = document.getElementById('createServerModal');
        el.closeCreateServerModal = document.getElementById('closeCreateServerModal');
        el.serverNameInput = document.getElementById('serverNameInput');
        el.cancelCreateServer = document.getElementById('cancelCreateServer');
        el.confirmCreateServer = document.getElementById('confirmCreateServer');
        el.createChannelModal = document.getElementById('createChannelModal');
        el.closeCreateChannelModal = document.getElementById('closeCreateChannelModal');
        el.channelNameInput = document.getElementById('channelNameInput');
        el.cancelCreateChannel = document.getElementById('cancelCreateChannel');
        el.confirmCreateChannel = document.getElementById('confirmCreateChannel');
        el.channelTypeOptions = document.querySelectorAll('.channel-type-option');
        el.createCategoryModal = document.getElementById('createCategoryModal');
        el.closeCreateCategoryModal = document.getElementById('closeCreateCategoryModal');
        el.categoryNameInput = document.getElementById('categoryNameInput');
        el.cancelCreateCategory = document.getElementById('cancelCreateCategory');
        el.confirmCreateCategory = document.getElementById('confirmCreateCategory');
        el.createCategoryBtn = document.getElementById('createCategoryBtn');
    }

    // Initial run
    initIfNeeded().catch((e) => {
        console.error('Chat init failed:', e);
    });
    
    // Listen for SPA navigation events to re-init when navigating to /chat
    document.addEventListener('cococord:page:loaded', (e) => {
        const url = e.detail?.url || '';
        if (url.includes('/chat')) {
            _chatInitialized = false; // Force re-init
            initIfNeeded().catch((e) => {
                console.error('Chat re-init failed:', e);
            });
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get('serverId');

    if (serverId) {
        console.log("Detected serverId from URL:", serverId);
        if (typeof loadServerDetails === 'function') {
            loadServerDetails(serverId);
        } else {
            console.error("Hàm loadServerDetails chưa được định nghĩa trong chat.js!");
        }
        
        const serverItem = document.querySelector(`.server-item[data-server-id="${serverId}"]`);
        if (serverItem) serverItem.classList.add('active');
    }
});
    
    // Export API cho SPA navigation từ app.js
    window.CoCoCordChat = {
        selectServer: selectServer,
        selectChannel: selectChannel,
        updateGlobalServerListActive: updateGlobalServerListActive,
        toggleMute: toggleMute,
        toggleDeafen: toggleDeafen,
        updateVoiceButtonStates: updateVoiceButtonStates,
        init: initIfNeeded
    };
})();
