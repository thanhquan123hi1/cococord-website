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
        dmSearch: ''
    };

    // ==================== CALL (WebRTC + WebSocket signaling) ====================
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
            
            // Render markdown content
            const rawContent = m.content || '';
            const content = window.CocoCordMarkdown 
                ? window.CocoCordMarkdown.render(rawContent)
                : escapeHtml(rawContent);
            
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
                            <div class="message-content markdown-content">${content}</div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="message-row">
                        <div class="message-avatar-spacer"></div>
                        <div class="message-body">
                            <div class="message-content markdown-content">${content}</div>
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

    function getCallRoomId() {
        // For 1:1 DM we can use dmGroupId as the signaling room
        return state.dmGroupId ? String(state.dmGroupId) : null;
    }

    function showCallOverlay({ video, outgoing }) {
        const overlay = callEls.overlay();
        if (!overlay) return;

        const otherName = displayName(state.otherUser);
        const typeLabel = video ? 'Video Call' : 'Voice Call';
        const prefix = outgoing ? 'Đang gọi' : 'Đang nhận';
        const title = callEls.title();
        if (title) title.textContent = `${prefix}: ${otherName} • ${typeLabel}`;

        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');

        const localVideo = callEls.localVideo();
        const remoteVideo = callEls.remoteVideo();
        if (localVideo) localVideo.style.display = video ? '' : 'none';
        if (remoteVideo) remoteVideo.style.display = video ? '' : 'none';
    }

    function hideCallOverlay() {
        const overlay = callEls.overlay();
        if (!overlay) return;
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }

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

    function sendSignal(payload) {
        if (!state.stomp || !state.stomp.connected) return;
        try {
            state.stomp.send('/app/call.signal', {}, JSON.stringify(payload));
        } catch (_) { /* ignore */ }
    }

    function createPeerConnection() {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        pc.onicecandidate = (e) => {
            if (!e.candidate || !call.roomId) return;
            sendSignal({
                roomId: call.roomId,
                type: 'ICE',
                candidate: e.candidate.candidate,
                sdpMid: e.candidate.sdpMid,
                sdpMLineIndex: e.candidate.sdpMLineIndex,
                video: call.video
            });
        };

        pc.ontrack = (e) => {
            if (!call.remoteStream) {
                call.remoteStream = new MediaStream();
            }
            call.remoteStream.addTrack(e.track);

            // Always attach audio
            attachStreamToAudio(callEls.remoteAudio(), call.remoteStream);

            // Attach video when present and call is video
            const hasVideo = call.remoteStream.getVideoTracks().length > 0;
            if (call.video && hasVideo) {
                attachStreamToVideo(callEls.remoteVideo(), call.remoteStream, { muted: false });
            }
        };

        pc.onconnectionstatechange = () => {
            const s = pc.connectionState;
            if (s === 'failed' || s === 'closed' || s === 'disconnected') {
                // Keep it simple: end call on teardown
                endCall({ sendHangup: false });
            }
        };

        return pc;
    }

    async function ensureLocalMedia(video) {
        if (call.localStream) return call.localStream;

        call.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
        });

        if (video) {
            attachStreamToVideo(callEls.localVideo(), call.localStream, { muted: true });
        }

        return call.localStream;
    }

    async function startCall({ video }) {
        const roomId = getCallRoomId();
        if (!roomId || !state.otherUser) return;
        if (!state.stomp || !state.stomp.connected) return;
        if (call.active) return;

        call.active = true;
        call.roomId = roomId;
        call.isCaller = true;
        call.video = !!video;
        call.pc = createPeerConnection();

        showCallOverlay({ video: call.video, outgoing: true });

        const stream = await ensureLocalMedia(call.video);
        stream.getTracks().forEach(t => call.pc.addTrack(t, stream));

        // Notify start (simple auto-join on other side)
        sendSignal({ roomId: call.roomId, type: 'CALL_START', video: call.video });

        const offer = await call.pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: call.video
        });
        await call.pc.setLocalDescription(offer);
        sendSignal({ roomId: call.roomId, type: 'OFFER', sdp: offer.sdp, video: call.video });
    }

    function endCall({ sendHangup } = { sendHangup: true }) {
        if (!call.active) {
            hideCallOverlay();
            return;
        }

        if (sendHangup && call.roomId) {
            sendSignal({ roomId: call.roomId, type: 'HANGUP', video: call.video });
        }

        try {
            if (call.pc) {
                call.pc.onicecandidate = null;
                call.pc.ontrack = null;
                call.pc.close();
            }
        } catch (_) { /* ignore */ }

        stopStream(call.localStream);
        stopStream(call.remoteStream);

        call.pc = null;
        call.localStream = null;
        call.remoteStream = null;
        call.active = false;
        call.roomId = null;
        call.isCaller = false;
        call.video = false;

        const lv = callEls.localVideo();
        const rv = callEls.remoteVideo();
        const ra = callEls.remoteAudio();
        if (lv) lv.srcObject = null;
        if (rv) rv.srcObject = null;
        if (ra) ra.srcObject = null;

        hideCallOverlay();
    }

    async function handleSignal(evt) {
        if (!evt || !evt.type) return;
        const selfId = state.currentUser?.id;
        if (selfId && evt.fromUserId && String(evt.fromUserId) === String(selfId)) return;
        const roomId = getCallRoomId();
        if (!roomId || evt.roomId !== roomId) return;

        switch (evt.type) {
            case 'CALL_START': {
                if (call.active) return;
                call.active = true;
                call.roomId = roomId;
                call.isCaller = false;
                call.video = !!evt.video;
                call.pc = createPeerConnection();
                showCallOverlay({ video: call.video, outgoing: false });
                // Ask permissions early so offer handling is smooth
                try {
                    const stream = await ensureLocalMedia(call.video);
                    stream.getTracks().forEach(t => call.pc.addTrack(t, stream));
                } catch (err) {
                    // If callee can't open devices, end locally
                    endCall({ sendHangup: true });
                }
                break;
            }
            case 'OFFER': {
                if (!call.active) {
                    call.active = true;
                    call.roomId = roomId;
                    call.isCaller = false;
                    call.video = !!evt.video;
                    call.pc = createPeerConnection();
                    showCallOverlay({ video: call.video, outgoing: false });
                }

                if (!call.pc) {
                    call.pc = createPeerConnection();
                }

                if (!call.localStream) {
                    const stream = await ensureLocalMedia(!!evt.video);
                    stream.getTracks().forEach(t => call.pc.addTrack(t, stream));
                }

                await call.pc.setRemoteDescription({ type: 'offer', sdp: evt.sdp });
                const answer = await call.pc.createAnswer();
                await call.pc.setLocalDescription(answer);
                sendSignal({ roomId: call.roomId, type: 'ANSWER', sdp: answer.sdp, video: call.video });
                break;
            }
            case 'ANSWER': {
                if (!call.pc) return;
                await call.pc.setRemoteDescription({ type: 'answer', sdp: evt.sdp });
                break;
            }
            case 'ICE': {
                if (!call.pc || !evt.candidate) return;
                try {
                    await call.pc.addIceCandidate({
                        candidate: evt.candidate,
                        sdpMid: evt.sdpMid,
                        sdpMLineIndex: evt.sdpMLineIndex
                    });
                } catch (_) { /* ignore */ }
                break;
            }
            case 'HANGUP': {
                endCall({ sendHangup: false });
                break;
            }
        }
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

                    // Call signaling for this DM
                    stomp.subscribe(`/topic/call/${state.dmGroupId}`, (msg) => {
                        try {
                            const evt = JSON.parse(msg.body);
                            handleSignal(evt);
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
            if (!state.dmGroupId || !state.otherUser) return;
            try {
                await startCall({ video: false });
            } catch (err) {
                alert(err?.name === 'NotAllowedError' ? 'Vui lòng cho phép microphone' : (err?.message || 'Không thể gọi thoại'));
                endCall({ sendHangup: false });
            }
        });

        callEls.videoBtn()?.addEventListener('click', async () => {
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
