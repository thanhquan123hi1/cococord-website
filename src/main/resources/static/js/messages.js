/* global CocoCordMarkdown */
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
        dmSearch: '',
        // Typing indicator state
        typingUsers: new Map(), // username -> { timeout, displayName, avatarUrl }
        isCurrentlyTyping: false,
        typingTimeout: null,
        stopTypingTimeout: null
    };

    // ==================== CALL (Delegated to global CallManager) ====================
    // Note: Call functionality is now handled by the global CoCoCordCallManager
    // This local state is kept only for backward compatibility with legacy overlay
    const call = {
        active: false,
        roomId: null,
        isCaller: false,
        video: false,
        pc: null,
        localStream: null,
        remoteStream: null,
        sub: null
    };

    // ==================== DOM ELEMENTS ====================
    const els = {
        // Server bar
        serverList: () => document.getElementById('serverList'),

        // DM sidebar
        globalSearch: () => document.getElementById('globalSearch'),
        dmList: () => document.getElementById('dmList'),

        // User panel - REMOVED, now handled by UserPanel component (user-panel.js)

        // Main content
        dmTitle: () => document.getElementById('dmTitle'),
        headerStatus: () => document.getElementById('headerStatus'),
        messagesArea: () => document.getElementById('messagesArea'),
        messagesList: () => document.getElementById('messagesList'),
        emptyState: () => document.getElementById('emptyState'),
        // Typing indicator container - will be inserted dynamically
        typingIndicator: () => document.getElementById('typingIndicator'),
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

    const callEls = {
        voiceBtn: () => document.getElementById('dmVoiceCallBtn'),
        videoBtn: () => document.getElementById('dmVideoCallBtn'),
        overlay: () => document.getElementById('dmCallOverlay'),
        title: () => document.getElementById('dmCallTitle'),
        hangupBtn: () => document.getElementById('dmCallHangupBtn'),
        localVideo: () => document.getElementById('dmCallLocalVideo'),
        remoteVideo: () => document.getElementById('dmCallRemoteVideo'),
        remoteAudio: () => document.getElementById('dmCallRemoteAudio')
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

    /**
     * Fetch channels của server và navigate đến channel phù hợp
     * Sử dụng function từ ServerSidebar nếu có, nếu không thì fallback
     */
    async function navigateToServerWithChannel(serverId) {
        // Sử dụng function từ ServerSidebar nếu đã load
        if (window.ServerSidebar && window.ServerSidebar.navigateToServerWithChannel) {
            return window.ServerSidebar.navigateToServerWithChannel(serverId);
        }

        // Fallback nếu ServerSidebar chưa load
        try {
            console.log('[Messages -> Server] Fetching channels for server:', serverId);
            const channels = await apiJson(`/api/servers/${serverId}/channels`);

            if (!channels || channels.length === 0) {
                console.warn('[Messages -> Server] No channels found, navigating without channelId');
                window.location.href = `/chat?serverId=${encodeURIComponent(serverId)}`;
                return;
            }

            // Tìm general channel
            let targetChannel = channels.find(ch =>
                ch.name && ch.name.toLowerCase() === 'general'
            );

            // Nếu không có general, tìm TEXT channel đầu tiên
            if (!targetChannel) {
                targetChannel = channels.find(ch =>
                    ch.type && ch.type.toUpperCase() === 'TEXT'
                );
            }

            // Nếu vẫn không có, lấy channel đầu tiên
            if (!targetChannel) {
                targetChannel = channels[0];
            }

            console.log('[Messages -> Server] Navigating to channel:', targetChannel);
            window.location.href = `/chat?serverId=${encodeURIComponent(serverId)}&channelId=${encodeURIComponent(targetChannel.id)}`;
        } catch (err) {
            console.error('[Messages -> Server] Failed to fetch channels:', err);
            // Fallback: navigate chỉ với serverId
            window.location.href = `/chat?serverId=${encodeURIComponent(serverId)}`;
        }
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

        const response = await fetch(url, { ...options, headers });

        if (!response) throw new Error('Không thể kết nối tới máy chủ');
        if (response.status === 204) return null;

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return null;
            }

            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            let payload = null;
            let text = '';

            if (contentType.includes('application/json')) {
                payload = await response.json().catch(() => null);
            } else {
                text = await response.text().catch(() => '');
                payload = (() => { try { return JSON.parse(text); } catch (_) { return null; } })();
            }

            const message =
                (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
                (typeof payload === 'string' ? payload : '') ||
                text ||
                `Request failed: ${response.status}`;

            throw new Error(String(message).trim() || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
        }

        const okContentType = (response.headers.get('content-type') || '').toLowerCase();
        if (okContentType.includes('application/json')) {
            return response.json();
        }
        return null;
    }

    // ==================== DATA LOADING ====================
    async function loadCurrentUser() {
        state.currentUser = await apiJson('/api/auth/me', { method: 'GET' });
        try {
            localStorage.setItem('user', JSON.stringify(state.currentUser || {}));
        } catch (_) { /* ignore */ }
        // User Panel is now handled globally by UserPanel component (user-panel.js)
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

        try {
            state.dmGroup = await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}`, { method: 'GET' });
            console.log('DM Group loaded:', state.dmGroup);
        } catch (err) {
            console.error('Failed to load DM group:', err);
            return;
        }

        try {
            const page = await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}/messages?page=0&size=50`, { method: 'GET' });
            // Spring Data Page
            state.messages = (page && Array.isArray(page.content)) ? page.content.slice().reverse() : [];
            console.log('Messages loaded:', state.messages.length);
        } catch (err) {
            console.error('Failed to load messages:', err);
            state.messages = [];
        }

        // Find other user in DM - check both userId and id fields
        if (state.dmGroup && state.currentUser) {
            const members = state.dmGroup.members || state.dmGroup.participants || [];
            state.otherUser = members.find(m => {
                const memberId = m.userId || m.id;
                return memberId !== state.currentUser.id;
            });
            // Map fields for consistency
            if (state.otherUser && state.otherUser.userId && !state.otherUser.id) {
                state.otherUser.id = state.otherUser.userId;
            }
            console.log('Other user found:', state.otherUser);
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
                console.log('Other user from sidebar:', state.otherUser);
            }
        }

        try {
            await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}/read`, { method: 'POST' });
        } catch (_) { /* ignore */ }
    }
    // TYPING INDICATOR ====================
    function renderTypingIndicator() {
        let indicator = document.getElementById('typingIndicator');
        const container = els.messagesArea();

        if (state.typingUsers.size === 0) {
            if (indicator) indicator.remove();
            return;
        }

        // Create if not exists
        if (!indicator && container) {
            indicator = document.createElement('div');
            indicator.id = 'typingIndicator';
            indicator.className = 'typing-indicator';
            // Insert at the bottom of messages area, or before the input area if it was outside
            // In layout, messagesArea is the scrolling container. 
            // We usually want it floating at bottom or just appended.
            // Let's append to messagesArea
            container.appendChild(indicator);
        }

        if (!indicator) return;

        const users = Array.from(state.typingUsers.values());
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

        // Scroll to see typing if near bottom
        scrollToBottom();
    }

    function addTypingUser(username, displayName, avatarUrl) {
        // Don't show own typing
        if (state.currentUser && username === state.currentUser.username) return;

        // Clear existing timeout
        const existing = state.typingUsers.get(username);
        if (existing?.timeout) clearTimeout(existing.timeout);

        // Set new timeout (auto-hide after 5 seconds if no new event)
        const timeout = setTimeout(() => {
            state.typingUsers.delete(username);
            renderTypingIndicator();
        }, 5000);

        state.typingUsers.set(username, { displayName, avatarUrl, timeout });
        renderTypingIndicator();
    }

    function removeTypingUser(username) {
        const existing = state.typingUsers.get(username);
        if (existing?.timeout) clearTimeout(existing.timeout);
        state.typingUsers.delete(username);
        renderTypingIndicator();
    }

    // Send typing notification
    function sendTypingNotification() {
        if (!state.stomp || !state.stomp.connected || !state.dmGroupId) return;

        // Send "start typing" if not already typing
        if (!state.isCurrentlyTyping) {
            state.isCurrentlyTyping = true;
            try {
                state.stomp.send('/app/chat.dm.typing', {}, JSON.stringify({
                    channelId: state.dmGroupId, // reusing channelId field for dmGroupId in DTO if needed, or backend handles it
                    dmGroupId: state.dmGroupId,
                    isTyping: true
                }));
            } catch (_) { /* ignore */ }
        }

        if (state.stopTypingTimeout) clearTimeout(state.stopTypingTimeout);

        state.stopTypingTimeout = setTimeout(() => {
            sendStopTypingNotification();
        }, 2000);

        if (state.typingTimeout) clearTimeout(state.typingTimeout);
        state.typingTimeout = setTimeout(() => {
            const input = els.messageInput();
            if (document.activeElement === input && input?.value?.trim()) {
                state.isCurrentlyTyping = false; // Reset so next keystroke sends typing again
            }
        }, 3000);
    }

    function sendStopTypingNotification() {
        if (!state.stomp || !state.stomp.connected || !state.dmGroupId) return;

        if (state.isCurrentlyTyping) {
            state.isCurrentlyTyping = false;
            try {
                state.stomp.send('/app/chat.dm.typing', {}, JSON.stringify({
                    dmGroupId: state.dmGroupId,
                    isTyping: false
                }));
            } catch (_) { /* ignore */ }
        }
    }

    // ==================== 

    // ==================== RENDER FUNCTIONS ====================
    // REMOVED: renderUserPanel() - now handled by global UserPanel component (user-panel.js)

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

            // Fetch channels trước khi navigate
            a.addEventListener('click', async (e) => {
                e.preventDefault();
                await navigateToServerWithChannel(id);
            });

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

    let chatInputManager = null;

    // ==================== INITIALIZATION ====================
    function initChatInputManager() {
        if (chatInputManager) chatInputManager.destroy();

        // Kiểm tra thư viện đã load chưa
        if (typeof ChatInputManager === 'undefined') {
            console.warn('[Messages] ChatInputManager not loaded');
            return;
        }

        // Support both /app (dmComposer) and /messages (composer) pages
        const composerEl = document.getElementById('dmComposer') || document.getElementById('composer');
        const inputEl = document.getElementById('dmMessageInput') || document.getElementById('messageInput');

        if (!composerEl || !inputEl) {
            console.warn('[Messages] Composer elements not found');
            return;
        }

        const composerSelector = composerEl.id === 'dmComposer' ? '#dmComposer' : '#composer';
        const inputSelector = inputEl.id === 'dmMessageInput' ? '#dmMessageInput' : '#messageInput';

        console.log('[Messages] Initializing ChatInputManager with:', { composerSelector, inputSelector });

        chatInputManager = new ChatInputManager({
            composerSelector: composerSelector,
            inputSelector: inputSelector,
            attachBtnSelector: '#attachBtn',
            emojiBtnSelector: '#emojiBtn',
            gifBtnSelector: '#gifBtn',
            stickerBtnSelector: '#stickerBtn',

            // Gửi tin nhắn (Text + File)
            onSendMessage: async (text, files) => {
                const filesToSend = files || chatInputManager.getAttachedFiles();
                if (filesToSend.length > 0) {
                    await uploadAndSendFiles(filesToSend, text);
                } else if (text.trim()) {
                    await sendMessage(text);
                }
            },
            // Gửi GIF
            onSendGif: async (gifUrl, gifData) => {
                await sendRichMessage(gifUrl, 'GIF', gifData);
            },
            // Gửi Sticker
            onSendSticker: async (stickerId, stickerUrl) => {
                await sendRichMessage(stickerUrl, 'STICKER', { stickerId });
            },
            // Typing events
            onTypingStart: () => sendTypingNotification(),
            onTypingEnd: () => sendStopTypingNotification()
        });

        console.log('[Messages] ChatInputManager initialized successfully');
    }

    // ==================== RICH MESSAGE ACTIONS ====================

    async function uploadAndSendFiles(files, textContent) {
        if (!state.dmGroupId) return;
        try {
            const uploadedAttachments = [];
            // Upload từng file
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                // Gọi API upload (dùng chung với server chat)
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    uploadedAttachments.push({
                        fileName: data.fileName || file.name,
                        fileUrl: data.fileUrl,
                        fileType: data.fileType || file.type,
                        fileSize: data.fileSize || file.size
                    });
                }
            }

            // Determine message type based on uploaded files
            let messageType = 'TEXT';
            if (uploadedAttachments.length > 0) {
                const hasImage = uploadedAttachments.some(att => att.fileType && att.fileType.startsWith('image/'));
                const hasVideo = uploadedAttachments.some(att => att.fileType && att.fileType.startsWith('video/'));

                if (hasImage) {
                    messageType = 'IMAGE';
                } else if (hasVideo) {
                    messageType = 'VIDEO';
                } else {
                    messageType = 'FILE';
                }
            }

            // Extract attachment URLs for the API
            const attachmentUrls = uploadedAttachments.map(att => att.fileUrl);

            // Build metadata with file details
            const metadata = uploadedAttachments.length > 0
                ? JSON.stringify({ files: uploadedAttachments })
                : null;

            // Gửi tin nhắn với định dạng đúng DTO
            await apiJson(`/api/direct-messages/${state.dmGroupId}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    content: textContent || '',
                    attachmentUrls: attachmentUrls,
                    type: messageType,
                    metadata: metadata
                })
            });

            // Clear input sau khi gửi xong
            if (chatInputManager) {
                chatInputManager.clearAttachments();
                if (chatInputManager.inputEl) chatInputManager.inputEl.value = '';
            }

            // Load lại tin nhắn mới nhất (hoặc chờ websocket)
            await loadDmGroupAndMessages();

        } catch (e) {
            console.error("Upload error:", e);
            alert("Lỗi khi gửi file!");
        }
    }

    // Gửi tin nhắn đặc biệt (Sticker/GIF)
    async function sendRichMessage(content, type, metadata = null) {
        if (!state.dmGroupId) return;
        try {
            // Build payload theo đúng DTO SendDirectMessageRequest
            const payload = {
                content: content,                    // URL của sticker hoặc GIF
                attachmentUrls: [],                  // Mảng rỗng cho sticker/GIF
                type: type,                          // 'STICKER' hoặc 'GIF'
                metadata: metadata ? JSON.stringify(metadata) : null  // Convert object to JSON string
            };

            await apiJson(`/api/direct-messages/${state.dmGroupId}/messages`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            // Không cần load lại vì WebSocket sẽ broadcast tin nhắn mới
            // await loadDmGroupAndMessages();
        } catch (e) {
            console.error(`Error sending ${type}:`, e);
        }
    }
    function handleNewMessage(msg) {
        console.log('[MSG-HANDLE] 📨 handleNewMessage called:', {
            msgId: msg?.id,
            content: msg?.content?.substring(0, 50),
            currentCount: state.messages.length,
            stackTrace: new Error().stack.substring(0, 200)
        });

        // Check if message already exists
        const exists = state.messages.find(m => m.id === msg.id);
        if (exists) {
            console.warn('[MSG-HANDLE] ⚠️ DUPLICATE DETECTED! Message already exists in state:', msg.id);
        }

        state.messages.push(msg);
        console.log('[MSG-HANDLE] ✅ Message added to state, new count:', state.messages.length);
        renderMessages();
        scrollToBottom();
    }
    // ==================== RENDERING IMPROVEMENTS ====================

    function renderAttachments(msg) {
        if (!msg.attachments || msg.attachments.length === 0) return '';

        let html = '<div class="message-attachments">';
        msg.attachments.forEach(att => {
            // Kiểm tra nếu là ảnh thì hiển thị thumbnail
            if (att.fileType && att.fileType.startsWith('image/')) {
                html += `
                    <div class="attachment-item">
                        <a href="${att.fileUrl}" target="_blank" class="attachment-image-link">
                            <img src="${att.fileUrl}" alt="${att.fileName}" class="attachment-image" loading="lazy">
                        </a>
                    </div>`;
            } else if (att.fileType && att.fileType.startsWith('video/')) {
                html += `
                    <div class="attachment-item">
                        <video src="${att.fileUrl}" controls class="attachment-video"></video>
                    </div>`;
            } else {
                // File thường (PDF, Zip, Doc...)
                html += `
                    <div class="attachment-item">
                        <a href="${att.fileUrl}" target="_blank" class="attachment-file-card">
                            <div class="file-icon"><i class="bi bi-file-earmark-text"></i></div>
                            <div class="file-info">
                                <span class="file-name">${att.fileName}</span>
                                <span class="file-size">${formatBytes(att.fileSize)}</span>
                            </div>
                            <div class="file-download"><i class="bi bi-download"></i></div>
                        </a>
                    </div>`;
            }
        });
        html += '</div>';
        return html;
    }

    function formatBytes(bytes, decimals = 2) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function renderMessages() {
        console.log('[MSG-RENDER] 🎨 renderMessages called, message count:', state.messages.length);
        const container = document.getElementById('messagesArea');
        if (!container) return;
        const emptyState = els.emptyState();
        const composer = els.composer();

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

        // Render all messages
        const html = state.messages.map((m, index) => {
            // Logic gộp tin nhắn (Header) - so sánh với tin nhắn trước
            const prev = state.messages[index - 1];
            const isSeq = prev &&
                prev.senderId === m.senderId &&
                (new Date(m.createdAt || m.timestamp) - new Date(prev.createdAt || prev.timestamp) < 5 * 60 * 1000);

            // Render content based on message type
            const contentHtml = renderMessageContent(m);

            // Render attachments (file, image, video)
            const attachmentsHtml = renderAttachments(m);

            // Get sender info with fallbacks
            const senderName = m.senderDisplayName || m.senderUsername || m.senderName || 'Unknown';
            const senderAvatar = m.senderAvatarUrl || m.senderAvatar || '/images/default-avatar.png';
            const avatarInitial = senderName.charAt(0).toUpperCase();
            const timestamp = m.createdAt || m.timestamp;

            if (!isSeq) {
                // Tin nhắn có Header (Avatar + Tên)
                return `
                    <div class="message-row has-header" id="msg-${m.id}" data-message-id="${m.id}">
                        <div class="message-avatar">
                            ${senderAvatar && senderAvatar !== '/images/default-avatar.png'
                        ? `<img src="${escapeHtml(senderAvatar)}" alt="Avatar">`
                        : `<div class="avatar-placeholder">${avatarInitial}</div>`
                    }
                        </div>
                        <div class="message-content-wrapper">
                            <div class="message-header">
                                <span class="username">${escapeHtml(senderName)}</span>
                                <span class="timestamp">${formatTimestamp(timestamp)}</span>
                            </div>
                            <div class="message-body markdown-content">
                                ${contentHtml}
                                ${attachmentsHtml}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Tin nhắn nối tiếp (Không Avatar)
                return `
                    <div class="message-row is-sequence" id="msg-${m.id}" data-message-id="${m.id}">
                        <div class="timestamp-hover">${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div class="message-content-wrapper">
                            <div class="message-body markdown-content">
                                ${contentHtml}
                                ${attachmentsHtml}
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render message content based on type (TEXT, STICKER, GIF, IMAGE, etc.)
     */
    function renderMessageContent(msg) {
        const type = (msg.type || 'TEXT').toUpperCase();
        const content = msg.content || '';

        switch (type) {
            case 'STICKER':
                // Sticker: hiển thị ảnh với class đặc biệt
                return `<img src="${escapeHtml(content)}" class="message-sticker" alt="Sticker" loading="lazy" />`;

            case 'GIF':
                // GIF: detect format và render phù hợp
                return renderGifContent(content, msg.metadata);

            case 'IMAGE':
                // Single image (không có attachments riêng)
                if (content && !msg.attachments?.length) {
                    return `<a href="${escapeHtml(content)}" target="_blank"><img src="${escapeHtml(content)}" class="message-image" alt="Image" loading="lazy" /></a>`;
                }
                // Nếu có attachments thì text content vẫn render bình thường
                return renderTextContent(content);

            case 'VIDEO':
                // Video inline
                if (content && content.match(/\.(mp4|webm|ogg)$/i)) {
                    return `<video src="${escapeHtml(content)}" controls class="message-video" preload="metadata"></video>`;
                }
                return renderTextContent(content);

            case 'AUDIO':
                // Audio player
                if (content && content.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                    return `<audio src="${escapeHtml(content)}" controls class="message-audio"></audio>`;
                }
                return renderTextContent(content);

            case 'SYSTEM':
                // System message (join, leave, etc.)
                return `<div class="system-message"><em>${escapeHtml(content)}</em></div>`;

            case 'TEXT':
            case 'FILE':
            default:
                // Default text rendering with markdown
                return renderTextContent(content);
        }
    }

    /**
     * Render text content with markdown support
     */
    function renderTextContent(content) {
        if (!content || !content.trim()) return '';
        return window.CocoCordMarkdown
            ? window.CocoCordMarkdown.render(content)
            : escapeHtml(content);
    }

    /**
     * Render GIF content - supports both .gif images and .mp4 videos (Tenor/Giphy format)
     */
    function renderGifContent(url, metadata) {
        if (!url) return '';

        // Parse metadata if string
        let gifData = null;
        if (metadata) {
            try {
                gifData = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (e) { /* ignore */ }
        }

        // Check if URL is mp4 (Tenor often uses mp4 for "GIFs")
        const isMp4 = url.toLowerCase().endsWith('.mp4') || url.includes('.mp4');
        const isWebm = url.toLowerCase().endsWith('.webm');

        if (isMp4 || isWebm) {
            // Video-based GIF: autoplay, loop, muted, no controls
            return `
                <video src="${escapeHtml(url)}" 
                    class="message-gif" 
                    autoplay loop muted playsinline
                    ${gifData?.width ? `width="${gifData.width}"` : ''}
                    ${gifData?.height ? `height="${gifData.height}"` : ''}>
                </video>`;
        } else {
            // Standard GIF image
            return `<img src="${escapeHtml(url)}" class="message-gif" alt="GIF" loading="lazy" />`;
        }
    }

    function scrollToBottom() {
        const container = els.messagesArea();
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    }

    // ==================== ACTIONS ====================
    async function sendMessage(content) {
        if (!content.trim()) return;

        console.log('[MSG-SEND] 🚀 Sending message via REST API:', { content: content.substring(0, 50), dmGroupId: state.dmGroupId });

        try {
            const msg = await apiJson(`/api/direct-messages/${state.dmGroupId}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    content: content,
                    attachmentUrls: [],
                    type: 'TEXT',
                    metadata: null
                })
            });

            console.log('[MSG-SEND] ✅ REST API response received:', { msgId: msg?.id, content: msg?.content?.substring(0, 50) });

            if (msg) {
                console.log('[MSG-SEND] 📝 Calling handleNewMessage from REST response (POTENTIAL DUPLICATE SOURCE #1)');
                handleNewMessage(msg);
                if (chatInputManager && chatInputManager.inputEl) {
                    chatInputManager.inputEl.value = ''; // Xóa input sau khi gửi thành công
                }
            }
        } catch (err) {
            console.error('[MSG-SEND] ❌ Lỗi gửi tin nhắn:', err);
        }
    }

    function toggleSettingsDropdown() {
        const dropdown = els.settingsDropdown();
        if (!dropdown) return;
        const isVisible = dropdown.style.display !== 'none';
        dropdown.style.display = isVisible ? 'none' : 'block';
    }

    function getCallRoomId() {
        // For 1:1 DM we can use dmGroupId as the signaling room
        return state.dmGroupId ? String(state.dmGroupId) : null;
    }

    // ==================== CALL FUNCTIONS (Delegated to Global CallManager) ====================
    // These functions now delegate to the global CoCoCordCallManager
    // Legacy overlay functions are kept for backward compatibility but will be replaced
    // by the global call overlay in CallManager

    async function startCall({ video }) {
        console.log('[Messages] ⚡ startCall() called, video:', video);

        // Delegate to global CallManager
        if (!window.CoCoCordCallManager) {
            console.error('[Messages] CoCoCordCallManager not loaded');
            return;
        }

        console.log('[Messages] CallManager found, preparing call data...');

        const roomId = getCallRoomId();
        if (!roomId || !state.otherUser) {
            console.warn('[Messages] Cannot start call: missing roomId or otherUser');
            return;
        }

        const targetUserId = state.otherUser.id;
        const targetUser = {
            id: state.otherUser.id,
            username: state.otherUser.username,
            displayName: state.otherUser.displayName || state.otherUser.username,
            avatarUrl: state.otherUser.avatarUrl
        };

        console.log('[Messages] Calling CallManager.startCall() with:', {
            targetUserId,
            roomId,
            targetUser: targetUser.username,
            video
        });

        try {
            const success = await window.CoCoCordCallManager.startCall(targetUserId, roomId, targetUser, video);
            console.log('[Messages] CallManager.startCall() returned:', success);
            if (!success) {
                throw new Error('Failed to start call');
            }
        } catch (err) {
            console.error('[Messages] Failed to start call:', err);
            throw err;
        }
    }

    function endCall({ sendHangup } = { sendHangup: true }) {
        // Delegate to global CallManager
        if (window.CoCoCordCallManager) {
            window.CoCoCordCallManager.endCall(sendHangup);
        }

        // Also hide any legacy overlay on this page
        hideCallOverlay();
    }

    function showCallOverlay({ video, outgoing }) {
        // NO-OP: Legacy overlay completely disabled
        // All call UI is now handled by global CoCoCordCallManager
        return;
    }

    function hideCallOverlay() {
        // Ensure legacy overlay stays hidden
        const overlay = callEls.overlay();
        if (overlay) {
            overlay.style.display = 'none';
            overlay.setAttribute('aria-hidden', 'true');
        }
    }

    // Legacy media attachment functions - kept for any remaining usage
    function attachStreamToVideo(videoEl, stream, { muted = false } = {}) {
        if (!videoEl || !stream) return;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.muted = !!muted;
        videoEl.srcObject = stream;
        videoEl.onloadedmetadata = () => {
            Promise.resolve(videoEl.play()).catch(() => { /* ignore */ });
        };
    }

    function attachStreamToAudio(audioEl, stream) {
        if (!audioEl || !stream) return;
        audioEl.autoplay = true;
        audioEl.srcObject = stream;
        Promise.resolve(audioEl.play()).catch(() => { /* ignore */ });
    }

    function stopStream(stream) {
        if (!stream) return;
        try {
            stream.getTracks().forEach(t => t.stop());
        } catch (_) { /* ignore */ }
    }

    // NOTE: The following legacy WebRTC functions have been removed as call functionality
    // is now handled by the global CoCoCordCallManager (call-manager.js):
    // - sendSignal() -> CoCoCordRealtime.send()
    // - createPeerConnection() -> CallManager handles internally
    // - ensureLocalMedia() -> CallManager handles internally  
    // - handleSignal() -> CallManager handles via global subscription

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
                        const data = JSON.parse(msg.body);
                        const payload = (data && data.type && data.payload) ? data.payload : data;
                        const username = payload?.username;
                        const status = payload?.newStatus || payload?.status;
                        if (username && status) {
                            state.presenceByUsername.set(username, { username, status: String(status).toUpperCase() });
                            renderDmList();
                            renderHeader();
                        }
                    } catch (_) { /* ignore */ }
                });

                if (state.dmGroupId) {
                    console.log('[WS-SUB] 🔌 Subscribing to /topic/dm/' + state.dmGroupId);
                    stomp.subscribe(`/topic/dm/${state.dmGroupId}`, (msg) => {
                        try {
                            console.log('[WS-MSG] 📡 WebSocket message received on /topic/dm/' + state.dmGroupId);
                            const m = JSON.parse(msg.body);
                            console.log('[WS-MSG] 📦 Parsed message:', { msgId: m?.id, content: m?.content?.substring(0, 50), sender: m?.senderUsername });
                            if (!m) return;

                            // Check if message already exists (DUPLICATE CHECK)
                            const exists = state.messages.find(msg => msg.id === m.id);
                            if (exists) {
                                console.warn('[WS-MSG] ⚠️ DUPLICATE VIA WEBSOCKET! Message already in state, ignoring:', m.id);
                                return;
                            }

                            console.log('[WS-MSG] 📝 Adding WebSocket message to state (POTENTIAL DUPLICATE SOURCE #2)');
                            // Append live message
                            state.messages.push(m);
                            renderMessages();
                            scrollToBottom();
                        } catch (err) {
                            console.error('[WS-MSG] ❌ Error parsing WebSocket message:', err);
                        }
                    });

                    // NOTE: Call signaling subscription removed - now handled globally by CoCoCordCallManager
                    // The global call manager subscribes to /topic/user.{userId}.calls on app load

                    // Typing events for this DM
                    stomp.subscribe(`/topic/dm/${state.dmGroupId}/typing`, (msg) => {
                        try {
                            const data = JSON.parse(msg.body);
                            if (data.isTyping) {
                                addTypingUser(data.username, data.displayName, data.avatarUrl);
                            } else {
                                removeTypingUser(data.username);
                            }
                        } catch (_) { /* ignore */ }
                    });
                }

                // Presence is tracked authoritatively by websocket connect/disconnect.
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

        // Only wire the legacy settings dropdown when it exists on this page.
        if (els.settingsDropdown()) {
            els.settingsBtn()?.addEventListener('click', toggleSettingsDropdown);
            els.logoutBtn()?.addEventListener('click', () => {
                if (typeof logout === 'function') {
                    logout();
                } else {
                    localStorage.clear();
                    window.location.href = '/login';
                }
            });
        }

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

        // Prevent placeholder menu items from navigating
        document.querySelectorAll('a.nav-item[href="#"]').forEach((a) => {
            a.addEventListener('click', (e) => e.preventDefault());
        });

        // Disable browser right-click on app
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Add Server Button - Left click and right click opens context menu
        const addServerBtn = document.getElementById('addServerBtn');
        if (addServerBtn) {
            addServerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showServerContextMenu(e);
            });

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

        // DM Call buttons
        callEls.voiceBtn()?.addEventListener('click', async () => {
            console.log('[Messages] 🎤 Voice call button clicked');
            console.log('[Messages] dmGroupId:', state.dmGroupId, 'otherUser:', state.otherUser?.username);

            if (!state.dmGroupId || !state.otherUser) return;
            try {
                await startCall({ video: false });
            } catch (err) {
                alert(err?.name === 'NotAllowedError' ? 'Vui lòng cho phép microphone' : (err?.message || 'Không thể gọi thoại'));
                endCall({ sendHangup: false });
            }
        });

        callEls.videoBtn()?.addEventListener('click', async () => {
            console.log('[Messages] 📹 Video call button clicked');
            console.log('[Messages] dmGroupId:', state.dmGroupId, 'otherUser:', state.otherUser?.username);

            if (!state.dmGroupId || !state.otherUser) return;
            try {
                await startCall({ video: true });
            } catch (err) {
                if (err?.name === 'NotAllowedError') {
                    alert('Vui lòng cho phép camera/microphone');
                } else if (err?.name === 'NotReadableError') {
                    alert('Camera đang được ứng dụng/tab khác sử dụng');
                } else {
                    alert(err?.message || 'Không thể gọi video');
                }
                endCall({ sendHangup: false });
            }
        });

        callEls.hangupBtn()?.addEventListener('click', () => endCall({ sendHangup: true }));
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
                await navigateToServerWithChannel(server.id);
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
                await navigateToServerWithChannel(serverId);
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
    let friendsList = [];
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
        friendsList = [];
        invitedFriends.clear();
    }

    async function loadFriendsForInvite() {
        try {
            friendsList = (await apiJson('/api/friends', { method: 'GET' })) || [];
        } catch (err) {
            console.error('Failed to load friends:', err);
            friendsList = [];
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
            const friend = friendsList.find(f => f.id === friendId);
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
            // Don't revert the invited state, keep it as "sent" even on error
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

    // ==================== INIT ====================
    async function init() {
        // CRITICAL: Force hide legacy call overlay immediately
        const legacyOverlay = document.getElementById('dmCallOverlay');
        if (legacyOverlay) {
            legacyOverlay.style.display = 'none';
            legacyOverlay.style.visibility = 'hidden';
            legacyOverlay.style.opacity = '0';
            legacyOverlay.style.pointerEvents = 'none';
            legacyOverlay.setAttribute('aria-hidden', 'true');

            // Add mutation observer to prevent any script from showing it
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const display = legacyOverlay.style.display;
                        if (display !== 'none') {
                            console.warn('[Messages] Legacy overlay attempted to show, forcing hide');
                            legacyOverlay.style.display = 'none';
                            legacyOverlay.style.visibility = 'hidden';
                            legacyOverlay.style.opacity = '0';
                        }
                    }
                }
            });
            observer.observe(legacyOverlay, { attributes: true, attributeFilter: ['style'] });
        }

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

        // Initialize ChatInputManager for file/sticker/GIF/emoji buttons
        initChatInputManager();

        if (state.dmGroupId) {
            scrollToBottom();
        }
    }

    let lastRootEl = null;

    function maybeInit() {
        const root = document.getElementById('dmApp');
        if (!root) return;
        if (root === lastRootEl) return;
        lastRootEl = root;

        init().catch((e) => {
            console.error('Messages init failed', e);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', maybeInit);
    } else {
        maybeInit();
    }

    document.addEventListener('cococord:page:loaded', maybeInit);
})();
