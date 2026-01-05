/* global SockJS, Stomp, getAccessToken */

(function () {
    'use strict';

    const LOG = {
        info: (...args) => console.log('[VOICE]', ...args),
        debug: (...args) => console.debug('[VOICE]', ...args),
        warn: (...args) => console.warn('[VOICE]', ...args),
        error: (...args) => console.error('[VOICE]', ...args)
    };

    function safeJsonParse(text) {
        try { return JSON.parse(text); } catch (e) { return null; }
    }

    function escapeHtml(text) {
        const s = String(text ?? '');
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    class VoiceManager {
        constructor(options = {}) {
            this.options = options;
            this.stompClient = null;
            this.connected = false;

            this.channelId = null;
            this.currentUser = null;

            this.users = new Map(); // userId -> {userId, username, displayName, avatarUrl, micOn, camOn, speaking}
            this.streams = new Map(); // userId -> MediaStream
            this.peerConnections = new Map(); // userId -> RTCPeerConnection
            this.pendingIce = new Map(); // userId -> RTCIceCandidateInit[]

            this.localStream = null;
            this.screenStream = null;
            this.cameraTrack = null;
            this.micOn = true;
            this.camOn = false;
            this.screenOn = false;
            this.speaking = false;

            this.subPresence = null;
            this.subSignal = null;

            this._speakingTimer = null;
            this._audioCtx = null;
            this._analyser = null;
            this._analyserSrc = null;

            this._renderScheduled = false;
        }

        bindStompClient(stompClient) {
            if (!stompClient) return;
            this.stompClient = stompClient;
            this.connected = !!stompClient.connected;
        }

        async connect() {
            if (this.stompClient && this.stompClient.connected) {
                this.connected = true;
                return;
            }
            if (this.stompClient?.connected) {
                this.connected = true;
                return;
            }

            const token = (typeof getAccessToken === 'function') ? getAccessToken() : null;
            if (!token) throw new Error('Missing access token');

            const socket = new SockJS('/ws');
            const stomp = Stomp.over(socket);
            stomp.debug = null;

            await new Promise((resolve, reject) => {
                stomp.connect(
                    { Authorization: `Bearer ${token}` },
                    () => resolve(),
                    (err) => reject(err)
                );
            });

            this.stompClient = stomp;
            this.connected = true;
            LOG.info('STOMP connected');
        }

        setCurrentUser(user) {
            this.currentUser = user;
        }

        async ensureLocalMedia() {
            if (this.localStream) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                this.localStream = stream;
                this.micOn = true;
                this.camOn = false;
                this.screenOn = false;

                // Default: camera off (but keep track available for instant enable)
                const v = stream.getVideoTracks?.()[0];
                this.cameraTrack = v || null;
                if (this.cameraTrack) this.cameraTrack.enabled = false;

                this.startSpeakingDetection();
            } catch (e) {
                // Fallback: audio only
                LOG.warn('getUserMedia(video+audio) failed, falling back to audio only', e?.name);
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                this.localStream = stream;
                this.micOn = true;
                this.camOn = false;
                this.screenOn = false;
                this.startSpeakingDetection();
            }
        }

        rtcConfig() {
            return {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            };
        }

        async join(channelId) {
            await this.connect();
            if (!this.currentUser?.id) throw new Error('Missing currentUser');

            if (this.channelId && String(this.channelId) !== String(channelId)) {
                await this.leave();
            }

            this.channelId = Number(channelId);

            await this.ensureLocalMedia();

            this.subscribeTopics();

            LOG.info('JOIN', { channelId: this.channelId, userId: this.currentUser.id });
            this.stompClient.send('/app/voice/join', {}, JSON.stringify({ channelId: this.channelId }));

            // Render immediately with self
            this.upsertUser({
                userId: this.currentUser.id,
                username: this.currentUser.username,
                displayName: this.currentUser.displayName,
                avatarUrl: this.currentUser.avatarUrl,
                micOn: this.micOn,
                camOn: this.camOn,
                screenOn: this.screenOn,
                speaking: this.speaking
            });
            this.render();

            // Broadcast initial state
            this.sendState({ micOn: this.micOn, camOn: this.camOn, screenOn: this.screenOn, speaking: false });
        }

        subscribeTopics() {
            if (!this.stompClient?.connected || !this.channelId) return;

            const presenceTopic = `/topic/voice/${this.channelId}`;
            const signalTopic = `/topic/voice/${this.channelId}/signal`;

            if (this.subPresence) {
                try { this.subPresence.unsubscribe(); } catch (e) { /* ignore */ }
            }
            if (this.subSignal) {
                try { this.subSignal.unsubscribe(); } catch (e) { /* ignore */ }
            }

            this.subPresence = this.stompClient.subscribe(presenceTopic, (msg) => {
                const payload = safeJsonParse(msg.body);
                if (!payload?.type) return;
                this.onPresence(payload);
            });

            this.subSignal = this.stompClient.subscribe(signalTopic, (msg) => {
                const payload = safeJsonParse(msg.body);
                if (!payload?.type) return;
                this.onSignal(payload);
            });

            LOG.info('Subscribed', { presenceTopic, signalTopic });
        }

        async leave() {
            if (!this.channelId) return;

            const leavingChannelId = this.channelId;
            LOG.info('LEAVE', { channelId: leavingChannelId });

            try {
                if (this.stompClient?.connected) {
                    this.stompClient.send('/app/voice/leave', {}, JSON.stringify({ channelId: leavingChannelId }));
                }
            } catch (e) { /* ignore */ }

            // Clean subscriptions
            if (this.subPresence) {
                try { this.subPresence.unsubscribe(); } catch (e) { /* ignore */ }
                this.subPresence = null;
            }
            if (this.subSignal) {
                try { this.subSignal.unsubscribe(); } catch (e) { /* ignore */ }
                this.subSignal = null;
            }

            // Close peer connections
            for (const [uid, pc] of this.peerConnections.entries()) {
                try { pc.close(); } catch (e) { /* ignore */ }
                this.peerConnections.delete(uid);
            }

            // Stop media
            this.stopSpeakingDetection();

            if (this.screenStream) {
                try { this.screenStream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
            }
            this.screenStream = null;
            this.screenOn = false;

            if (this.localStream) {
                try { this.localStream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
            }
            this.localStream = null;
            this.cameraTrack = null;

            // Clear state
            this.channelId = null;
            this.users.clear();
            this.streams.clear();
            this.pendingIce.clear();

            this.render();
            this.emitStateChange();
        }

        upsertUser(u) {
            if (!u?.userId) return;
            const prev = this.users.get(u.userId) || {};
            this.users.set(u.userId, {
                userId: u.userId,
                username: u.username ?? prev.username,
                displayName: u.displayName ?? prev.displayName,
                avatarUrl: u.avatarUrl ?? prev.avatarUrl,
                micOn: (u.micOn != null) ? !!u.micOn : (prev.micOn ?? true),
                camOn: (u.camOn != null) ? !!u.camOn : (prev.camOn ?? false),
                screenOn: (u.screenOn != null) ? !!u.screenOn : (prev.screenOn ?? false),
                speaking: (u.speaking != null) ? !!u.speaking : (prev.speaking ?? false)
            });
        }

        removeUser(userId) {
            if (!userId) return;

            // close pc
            const pc = this.peerConnections.get(userId);
            if (pc) {
                try { pc.close(); } catch (e) { /* ignore */ }
                this.peerConnections.delete(userId);
            }

            // remove audio
            const audio = document.getElementById(`audio-user-${userId}`);
            if (audio) audio.remove();

            this.streams.delete(userId);
            this.users.delete(userId);
        }

        onPresence(payload) {
            const type = payload.type;
            if (type === 'VOICE_USERS') {
                const list = Array.isArray(payload.users) ? payload.users : [];
                LOG.info('USER_LIST', { count: list.length });

                // Merge list
                const seen = new Set();
                list.forEach((m) => {
                    if (!m?.userId) return;
                    seen.add(String(m.userId));
                    this.upsertUser(m);
                });

                // Ensure self is present
                if (this.currentUser?.id) {
                    seen.add(String(this.currentUser.id));
                    this.upsertUser({
                        userId: this.currentUser.id,
                        username: this.currentUser.username,
                        displayName: this.currentUser.displayName,
                        avatarUrl: this.currentUser.avatarUrl,
                        micOn: this.micOn,
                        camOn: this.camOn,
                        screenOn: this.screenOn,
                        speaking: this.speaking
                    });
                }

                // Remove missing users (except self)
                for (const uid of Array.from(this.users.keys())) {
                    if (this.currentUser?.id && String(uid) === String(this.currentUser.id)) continue;
                    if (!seen.has(String(uid))) {
                        this.removeUser(uid);
                    }
                }

                // Ensure connections
                for (const uid of Array.from(this.users.keys())) {
                    if (this.currentUser?.id && String(uid) === String(this.currentUser.id)) continue;
                    this.ensurePeerConnection(uid);
                }

                this.render();
                this.emitStateChange();
                return;
            }

            if (type === 'USER_JOIN') {
                const u = payload.user;
                if (u?.userId) {
                    LOG.info('USER_JOIN', { userId: u.userId });
                    this.upsertUser(u);
                    if (String(u.userId) !== String(this.currentUser?.id)) {
                        this.ensurePeerConnection(u.userId);
                    }
                    this.render();
                    this.emitStateChange();
                }
                return;
            }

            if (type === 'USER_LEAVE') {
                const uid = payload.userId;
                if (uid) {
                    LOG.info('USER_LEAVE', { userId: uid });
                    this.removeUser(uid);
                    this.render();
                    this.emitStateChange();
                }
                return;
            }

            if (type === 'VOICE_STATE_UPDATE') {
                const uid = payload.userId;
                if (!uid) return;

                // ignore self echo; local UI is authoritative
                if (String(uid) === String(this.currentUser?.id)) return;

                const prev = this.users.get(uid);
                if (!prev) {
                    this.upsertUser({ userId: uid });
                }

                this.upsertUser({
                    userId: uid,
                    micOn: payload.micOn,
                    camOn: payload.camOn,
                    screenOn: payload.screenOn,
                    speaking: payload.speaking
                });

                this.render();
                this.emitStateChange();
            }
        }

        shouldOfferTo(remoteUserId) {
            const myId = Number(this.currentUser?.id);
            const otherId = Number(remoteUserId);
            if (!Number.isFinite(myId) || !Number.isFinite(otherId)) return false;
            return myId > otherId;
        }

        ensurePeerConnection(remoteUserId) {
            if (!remoteUserId || String(remoteUserId) === String(this.currentUser?.id)) return;

            if (this.peerConnections.has(remoteUserId)) return;

            const pc = new RTCPeerConnection(this.rtcConfig());
            this.peerConnections.set(remoteUserId, pc);

            LOG.debug('PC_CREATE', { remoteUserId });

            // Add local tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach((track) => {
                    try {
                        pc.addTrack(track, this.localStream);
                    } catch (e) { /* ignore */ }
                });
            }

            pc.onicecandidate = (event) => {
                if (!event.candidate) return;
                this.sendIce(remoteUserId, event.candidate.toJSON ? event.candidate.toJSON() : event.candidate);
            };

            pc.ontrack = (event) => {
                const stream = event.streams?.[0];
                if (!stream) return;
                LOG.info('TRACK', { remoteUserId, tracks: stream.getTracks().map(t => t.kind) });
                this.streams.set(remoteUserId, stream);
                this.render();
                this.emitStateChange();
                this.ensureRemoteAudio(remoteUserId, stream);
            };

            pc.onconnectionstatechange = () => {
                LOG.debug('PC_STATE', { remoteUserId, state: pc.connectionState });
            };

            // If we are offerer, start negotiation
            if (this.shouldOfferTo(remoteUserId)) {
                console.log(`[WebRTC] I (id=${this.currentUser.id}) am offering to ${remoteUserId}`);
                this.createAndSendOffer(remoteUserId).catch(e => console.error('Offer failed', e));
            } else {
                console.log(`[WebRTC] I (id=${this.currentUser.id}) will wait for offer from ${remoteUserId}`);
                // Không làm gì cả, ngồi đợi bên kia gửi Offer tới
            }
        }

        async createAndSendOffer(remoteUserId) {
            const pc = this.peerConnections.get(remoteUserId);
            if (!pc) return;

            LOG.info('OFFER ->', { to: remoteUserId });
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            this.stompClient.send('/app/voice/signal/offer', {}, JSON.stringify({
                channelId: this.channelId,
                fromUserId: this.currentUser.id,
                toUserId: remoteUserId,
                sdp: offer.sdp
            }));
        }

        async onSignal(payload) {
            const type = payload.type;
            const to = payload.toUserId;
            const from = payload.fromUserId;

            if (!this.currentUser?.id) return;
            if (to != null && String(to) !== String(this.currentUser.id)) return;

            if (type === 'OFFER') {
                LOG.info('OFFER <-', { from });
                await this.handleOffer(from, payload.sdp);
                return;
            }

            if (type === 'ANSWER') {
                LOG.info('ANSWER <-', { from });
                await this.handleAnswer(from, payload.sdp);
                return;
            }

            if (type === 'ICE') {
                await this.handleIce(from, payload.candidate);
            }
        }

        async handleOffer(fromUserId, sdp) {
            this.ensurePeerConnection(fromUserId);
            const pc = this.peerConnections.get(fromUserId);
            if (!pc) return;

            await pc.setRemoteDescription({ type: 'offer', sdp });
            LOG.debug('SET_REMOTE(offer)', { fromUserId });

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            LOG.debug('SET_LOCAL(answer)', { fromUserId });

            this.stompClient.send('/app/voice/signal/answer', {}, JSON.stringify({
                channelId: this.channelId,
                fromUserId: this.currentUser.id,
                toUserId: fromUserId,
                sdp: answer.sdp
            }));

            // Flush pending ICE
            this.flushPendingIce(fromUserId);
        }

        async handleAnswer(fromUserId, sdp) {
            const pc = this.peerConnections.get(fromUserId);
            if (!pc) return;

            await pc.setRemoteDescription({ type: 'answer', sdp });
            LOG.debug('SET_REMOTE(answer)', { fromUserId });
            this.flushPendingIce(fromUserId);
        }

        async handleIce(fromUserId, candidate) {
            const pc = this.peerConnections.get(fromUserId);
            
            // Nếu chưa có kết nối hoặc kết nối chưa thiết lập Remote Description
            if (!pc || !pc.remoteDescription) {
                console.warn(`[WebRTC] Buffering ICE from ${fromUserId} (PC not ready)`);
                const list = this.pendingIce.get(fromUserId) || [];
                list.push(candidate);
                this.pendingIce.set(fromUserId, list);
                return;
            }
            
            try {
                await pc.addIceCandidate(candidate);
            } catch (e) {
                console.error('Error adding ICE:', e);
            }
        }

        async flushPendingIce(fromUserId) {
            const pc = this.peerConnections.get(fromUserId);
            const candidates = this.pendingIce.get(fromUserId);
            if (pc && candidates && candidates.length > 0) {
                console.log(`[WebRTC] Flushing ${candidates.length} buffered ICEs for ${fromUserId}`);
                for (const cand of candidates) {
                    try {
                        await pc.addIceCandidate(cand);
                    } catch (e) {
                        console.error('Error flushing ICE:', e);
                    }
                }
                this.pendingIce.delete(fromUserId);
            }
        }

        sendIce(remoteUserId, candidate) {
            if (!this.stompClient?.connected) return;
            LOG.debug('ICE ->', { to: remoteUserId });
            this.stompClient.send('/app/voice/signal/ice', {}, JSON.stringify({
                channelId: this.channelId,
                fromUserId: this.currentUser.id,
                toUserId: remoteUserId,
                candidate
            }));
        }

        ensureRemoteAudio(userId, stream) {
            if (!stream) return;
            let audio = document.getElementById(`audio-user-${userId}`);
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `audio-user-${userId}`;
                audio.autoplay = true;
                audio.playsInline = true;
                audio.style.display = 'none';
                document.body.appendChild(audio);
            }
            audio.srcObject = stream;
            audio.muted = false;
            audio.onloadedmetadata = () => {
                Promise.resolve(audio.play()).catch(() => { /* ignore */ });
            };
        }

        sendState(partial) {
            if (!this.stompClient?.connected || !this.channelId) return;
            this.stompClient.send('/app/voice/state', {}, JSON.stringify({
                channelId: this.channelId,
                micOn: partial?.micOn,
                camOn: partial?.camOn,
                screenOn: partial?.screenOn,
                speaking: partial?.speaking
            }));
        }

        toggleMic() {
            this.micOn = !this.micOn;
            const a = this.localStream?.getAudioTracks?.()[0];
            if (a) a.enabled = this.micOn;

            this.upsertUser({ userId: this.currentUser.id, micOn: this.micOn, speaking: this.micOn ? this.speaking : false });
            this.sendState({ micOn: this.micOn, speaking: this.micOn ? this.speaking : false });
            this.render();
            this.emitStateChange();
        }

        toggleCamera() {
            if (this.screenOn) {
                this.stopScreenShare();
            }
            this.camOn = !this.camOn;
            if (this.cameraTrack) this.cameraTrack.enabled = this.camOn;

            this.upsertUser({ userId: this.currentUser.id, camOn: this.camOn });
            this.sendState({ camOn: this.camOn, screenOn: false });
            this.render();
            this.emitStateChange();
        }

        async toggleScreenShare() {
            if (this.screenStream) {
                // Tắt share: Quay về Camera (hoặc tắt video nếu ko bật cam)
                this.stopScreenShare(); // Hàm tự viết để stop track
                
                // Lấy stream camera (nếu đang bật cam)
                const newStream = (this.localStream && this.camOn) ? this.localStream : null;
                const newVideoTrack = newStream ? newStream.getVideoTracks()[0] : null;

                this.replaceVideoTrackForAllPeers(newVideoTrack);
                this.sendState({ screenOn: false });
            } else {
                // Bật share
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                    this.screenStream = stream;
                    const screenTrack = stream.getVideoTracks()[0];

                    // Sự kiện khi người dùng ấn nút "Stop sharing" của trình duyệt
                    screenTrack.onended = () => this.toggleScreenShare();

                    // THAY THẾ TRACK (Magic happens here)
                    this.replaceVideoTrackForAllPeers(screenTrack);
                    this.sendState({ screenOn: true });
                } catch (e) {
                    console.error('Error sharing screen:', e);
                }
            }
        }
        replaceVideoTrackForAllPeers(newTrack) {
            for (const pc of this.peerConnections.values()) {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    if (newTrack) {
                        sender.replaceTrack(newTrack);
                    } else {
                        // Nếu không có track mới (ví dụ tắt share và không bật cam), có thể disable
                        // sender.replaceTrack(null); 
                    }
                }
            }
        }

        stopScreenShare() {
            if (!this.screenStream) {
                this.screenOn = false;
                return;
            }

            const screenTrack = this.screenStream.getVideoTracks?.()[0];
            try { this.screenStream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
            this.screenStream = null;
            this.screenOn = false;

            // Restore camera track if available
            if (this.cameraTrack) this.cameraTrack.enabled = this.camOn;

            // Replace senders back to camera track (or null)
            for (const pc of this.peerConnections.values()) {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (!sender) continue;
                try {
                    sender.replaceTrack(this.cameraTrack || null);
                } catch (e) { /* ignore */ }
            }

            // local preview: render() will pick camera vs screen stream
            void screenTrack;
        }

        setDeafen(isDeafened) {
            // handled in UI: mute all remote audio tags
            const shouldMute = !!isDeafened;
            document.querySelectorAll('audio[id^="audio-user-"]').forEach((a) => {
                a.muted = shouldMute;
            });
        }

        scheduleRender() {
            if (this._renderScheduled) return;
            this._renderScheduled = true;
            requestAnimationFrame(() => {
                this._renderScheduled = false;
                this.render();
            });
        }

        render() {
            const grid = document.getElementById('voiceParticipantsGrid');
            if (!grid) return;

            if (!this.channelId) {
                grid.setAttribute('data-count', '0');
                grid.innerHTML = '';
                return;
            }

            const list = Array.from(this.users.values())
                .sort((a, b) => {
                    if (String(a.userId) === String(this.currentUser?.id)) return -1;
                    if (String(b.userId) === String(this.currentUser?.id)) return 1;
                    return String(a.displayName || a.username || '').localeCompare(String(b.displayName || b.username || ''));
                });

            grid.setAttribute('data-count', String(list.length));

            const nextIds = new Set(list.map(u => String(u.userId)));

            const ensureEl = (parent, selector, createFn) => {
                const found = parent.querySelector(selector);
                if (found) return found;
                const el = createFn();
                parent.appendChild(el);
                return el;
            };

            const ensureVideo = (tile, userId) => {
                let video = tile.querySelector('video.voice-participant-video');
                if (video) return video;
                video = document.createElement('video');
                video.className = 'voice-participant-video';
                video.id = `video-user-${userId}`;
                video.autoplay = true;
                video.playsInline = true;
                tile.insertBefore(video, tile.firstChild);
                return video;
            };

            const attachStream = (video, stream, { muted = true } = {}) => {
                if (!video) return;
                if (!stream) {
                    if (video.srcObject) video.srcObject = null;
                    return;
                }
                if (video.srcObject !== stream) {
                    video.srcObject = stream;
                }
                video.muted = !!muted;
                video.onloadedmetadata = () => {
                    Promise.resolve(video.play()).catch(() => { /* ignore */ });
                };
            };

            // Create/update tiles in stable order without nuking the grid.
            for (const u of list) {
                const userId = u.userId;
                const userIdStr = String(userId);
                const isLocal = String(u.userId) === String(this.currentUser?.id);

                const name = u.displayName || u.username || 'User';
                const showMuted = !u.micOn;
                const showCamera = !!u.camOn;
                const showScreen = !!u.screenOn;
                const showSpeaking = !!u.speaking && u.micOn;
                const showVideo = showCamera || showScreen;

                let tile = document.getElementById(`voice-tile-user-${userIdStr}`);
                if (!tile) {
                    tile = document.createElement('div');
                    tile.id = `voice-tile-user-${userIdStr}`;
                    tile.className = 'voice-participant-tile';
                    tile.setAttribute('data-user-id', userIdStr);

                    // Badges
                    const badges = document.createElement('div');
                    badges.className = 'voice-tile-badges';
                    tile.appendChild(badges);

                    // Avatar wrapper
                    const avatarWrap = document.createElement('div');
                    avatarWrap.className = 'voice-avatar-wrapper';
                    tile.appendChild(avatarWrap);

                    // Info
                    const info = document.createElement('div');
                    info.className = 'voice-participant-info';
                    const nameEl = document.createElement('div');
                    nameEl.className = 'voice-participant-name';
                    info.appendChild(nameEl);
                    tile.appendChild(info);
                }

                // Reorder to match current list order
                grid.appendChild(tile);

                // Update classes
                tile.classList.toggle('self', isLocal);
                tile.classList.toggle('speaking', showSpeaking);
                tile.classList.toggle('camera-on', showCamera);
                tile.classList.toggle('screen-sharing', showScreen);

                // Update name
                const nameEl = ensureEl(tile, '.voice-participant-name', () => {
                    const el = document.createElement('div');
                    el.className = 'voice-participant-name';
                    return el;
                });
                if (nameEl.textContent !== String(name)) nameEl.textContent = String(name);

                // Update badges (small & cheap; only per-tile)
                const badges = ensureEl(tile, '.voice-tile-badges', () => {
                    const el = document.createElement('div');
                    el.className = 'voice-tile-badges';
                    return el;
                });
                const badgesKey = `${showScreen ? 's' : ''}${showCamera ? 'c' : ''}${showMuted ? 'm' : ''}`;
                if (tile.dataset.badgesKey !== badgesKey) {
                    tile.dataset.badgesKey = badgesKey;
                    badges.innerHTML = `${showScreen ? '<i class="bi bi-display"></i>' : ''}${showCamera ? '<i class="bi bi-camera-video-fill"></i>' : ''}${showMuted ? '<i class="bi bi-mic-mute-fill"></i>' : ''}`;
                }

                // Avatar
                const avatarWrap = ensureEl(tile, '.voice-avatar-wrapper', () => {
                    const el = document.createElement('div');
                    el.className = 'voice-avatar-wrapper';
                    return el;
                });

                avatarWrap.style.display = showVideo ? 'none' : '';

                const avatarKey = `${u.avatarUrl || ''}|${String(name).charAt(0).toUpperCase()}`;
                if (tile.dataset.avatarKey !== avatarKey) {
                    tile.dataset.avatarKey = avatarKey;
                    avatarWrap.innerHTML = '';
                    if (u.avatarUrl) {
                        const img = document.createElement('img');
                        img.className = 'voice-participant-avatar';
                        img.src = u.avatarUrl;
                        img.alt = String(name);
                        avatarWrap.appendChild(img);
                    } else {
                        const ph = document.createElement('div');
                        ph.className = 'voice-participant-avatar-placeholder';
                        ph.textContent = String(name).charAt(0).toUpperCase();
                        avatarWrap.appendChild(ph);
                    }
                }

                // Video element (only when needed)
                const existingVideo = tile.querySelector('video.voice-participant-video');
                if (!showVideo) {
                    if (existingVideo) {
                        existingVideo.srcObject = null;
                        existingVideo.remove();
                    }
                    continue;
                }

                const video = ensureVideo(tile, userIdStr);

                if (isLocal) {
                    if (showScreen && this.screenStream) {
                        attachStream(video, this.screenStream, { muted: true });
                    } else {
                        attachStream(video, this.localStream, { muted: true });
                    }
                } else {
                    const stream = this.streams.get(userId);
                    const hasVideo = !!(stream && stream.getVideoTracks && stream.getVideoTracks().length);
                    attachStream(video, hasVideo ? stream : null, { muted: true });
                }
            }

            // Remove tiles that are no longer present
            Array.from(grid.children).forEach((child) => {
                const uid = child?.getAttribute?.('data-user-id');
                if (!uid) return;
                if (!nextIds.has(String(uid))) {
                    child.remove();
                }
            });
        }

        emitStateChange() {
            try {
                this.options?.onStateChange?.({
                    channelId: this.channelId,
                    micOn: this.micOn,
                    camOn: this.camOn,
                    screenOn: this.screenOn,
                    speaking: this.speaking,
                    users: Array.from(this.users.values())
                });
            } catch (e) { /* ignore */ }
        }

        startSpeakingDetection() {
            if (this._speakingTimer) return;
            if (!this.localStream) return;

            try {
                this._audioCtx = this._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
                this._analyser = this._audioCtx.createAnalyser();
                this._analyser.fftSize = 512;
                this._analyser.smoothingTimeConstant = 0.85;

                this._analyserSrc = this._audioCtx.createMediaStreamSource(this.localStream);
                this._analyserSrc.connect(this._analyser);

                const buf = new Uint8Array(this._analyser.fftSize);
                let speaking = false;
                const startThreshold = 0.04;
                const stopThreshold = 0.02;

                this._speakingTimer = setInterval(() => {
                    if (!this._analyser) return;

                    if (!this.micOn) {
                        if (speaking) {
                            speaking = false;
                            this.setSpeaking(false);
                        }
                        return;
                    }

                    this._analyser.getByteTimeDomainData(buf);
                    let sum = 0;
                    for (let i = 0; i < buf.length; i++) {
                        const v = (buf[i] - 128) / 128;
                        sum += v * v;
                    }
                    const rms = Math.sqrt(sum / buf.length);

                    if (!speaking && rms >= startThreshold) {
                        speaking = true;
                        this.setSpeaking(true);
                    } else if (speaking && rms <= stopThreshold) {
                        speaking = false;
                        this.setSpeaking(false);
                    }
                }, 200);
            } catch (e) {
                this.stopSpeakingDetection();
            }
        }

        stopSpeakingDetection() {
            if (this._speakingTimer) {
                clearInterval(this._speakingTimer);
                this._speakingTimer = null;
            }
            if (this._analyserSrc) {
                try { this._analyserSrc.disconnect(); } catch (e) { /* ignore */ }
                this._analyserSrc = null;
            }
            if (this._audioCtx) {
                try { this._audioCtx.close(); } catch (e) { /* ignore */ }
                this._audioCtx = null;
            }
            this._analyser = null;
            this.speaking = false;
        }

        setSpeaking(isSpeaking) {
            const next = !!isSpeaking;
            if (next === this.speaking) return;
            this.speaking = next;

            this.upsertUser({ userId: this.currentUser.id, speaking: next });
            this.sendState({ speaking: next });
            this.render();
            this.emitStateChange();
        }

        getUsers() {
            return Array.from(this.users.values());
        }
        // --- CÁC HÀM BỔ SUNG CẦN THÊM VÀO ---

        // Hàm dừng chia sẻ màn hình
        stopScreenShare() {
            if (this.screenStream) {
                try {
                    this.screenStream.getTracks().forEach(t => t.stop());
                } catch (e) { /* ignore */ }
                this.screenStream = null;
            }
        }

        // Hàm thay thế track video cho tất cả kết nối (giúp chuyển đổi mượt mà)
        replaceVideoTrackForAllPeers(newTrack) {
            if (!this.peerConnections) return;
            
            for (const pc of this.peerConnections.values()) {
                try {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        if (newTrack) {
                            sender.replaceTrack(newTrack);
                        } else {
                            // Nếu không có track mới (ví dụ tắt cam), vẫn giữ sender nhưng replace null?
                            // Hoặc có thể thay bằng dummy track đen nếu cần.
                            // Ở đây ta cứ replace là được.
                            sender.replaceTrack(newTrack);
                        }
                    }
                } catch (e) {
                    console.error('[WebRTC] Replace track failed:', e);
                }
            }
        }
    }

    window.CocoCordVoiceManager = VoiceManager;
})();
