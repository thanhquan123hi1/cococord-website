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
            // deterministic anti-glare: larger userId becomes offerer
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
                this.createAndSendOffer(remoteUserId).catch((e) => LOG.error('Offer failed', e));
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
            if (!pc || !pc.remoteDescription) {
                const list = this.pendingIce.get(fromUserId) || [];
                list.push(candidate);
                this.pendingIce.set(fromUserId, list);
                LOG.debug('ICE buffered', { fromUserId });
                return;
            }

            try {
                await pc.addIceCandidate(candidate);
                LOG.debug('ICE added', { fromUserId });
            } catch (e) {
                LOG.warn('ICE add failed', { fromUserId, err: e?.message });
            }
        }

        async flushPendingIce(fromUserId) {
            const pc = this.peerConnections.get(fromUserId);
            if (!pc || !pc.remoteDescription) return;

            const list = this.pendingIce.get(fromUserId);
            if (!list?.length) return;

            this.pendingIce.delete(fromUserId);

            for (const c of list) {
                try {
                    await pc.addIceCandidate(c);
                } catch (e) { /* ignore */ }
            }
            LOG.debug('ICE flush', { fromUserId, count: list.length });
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
            if (this.screenOn) {
                this.stopScreenShare();
                this.upsertUser({ userId: this.currentUser.id, screenOn: false });
                this.sendState({ screenOn: false });
                this.render();
                this.emitStateChange();
                return;
            }

            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
                const screenTrack = screenStream.getVideoTracks?.()[0];
                if (!screenTrack) {
                    try { screenStream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
                    return;
                }

                // turn off camera if enabled
                if (this.cameraTrack) this.cameraTrack.enabled = false;
                this.camOn = false;

                this.screenStream = screenStream;
                this.screenOn = true;

                // Replace video track for all RTCRtpSenders
                for (const pc of this.peerConnections.values()) {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        await sender.replaceTrack(screenTrack);
                    } else {
                        try { pc.addTrack(screenTrack, screenStream); } catch (e) { /* ignore */ }
                    }
                }

                screenTrack.onended = () => {
                    this.stopScreenShare();
                    this.upsertUser({ userId: this.currentUser.id, screenOn: false });
                    this.sendState({ screenOn: false });
                    this.render();
                    this.emitStateChange();
                };

                this.upsertUser({ userId: this.currentUser.id, camOn: false, screenOn: true });
                this.sendState({ camOn: false, screenOn: true });
                this.render();
                this.emitStateChange();
            } catch (e) {
                // user cancelled or browser blocked
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

            grid.innerHTML = list.map((u) => {
                const isLocal = String(u.userId) === String(this.currentUser?.id);

                const name = u.displayName || u.username || 'User';
                const avatarHtml = u.avatarUrl
                    ? `<img class="voice-participant-avatar" src="${escapeHtml(u.avatarUrl)}" alt="${escapeHtml(name)}">`
                    : `<div class="voice-participant-avatar-placeholder">${escapeHtml(String(name).charAt(0).toUpperCase())}</div>`;

                const showMuted = !u.micOn;
                const showCamera = !!u.camOn;
                const showScreen = !!u.screenOn;
                const showSpeaking = !!u.speaking && u.micOn;

                const videoHtml = (showCamera || showScreen)
                    ? `<video class="voice-participant-video" id="video-user-${u.userId}" autoplay playsinline ${isLocal ? 'muted' : ''}></video>`
                    : '';

                return `
                    <div class="voice-participant-tile ${isLocal ? 'self' : ''} ${showSpeaking ? 'speaking' : ''} ${showCamera ? 'camera-on' : ''} ${showScreen ? 'screen-sharing' : ''}" id="voice-tile-user-${u.userId}" data-user-id="${u.userId}">
                        ${videoHtml}
                        <div class="voice-tile-badges">
                            ${showScreen ? '<i class="bi bi-display"></i>' : ''}
                            ${showCamera ? '<i class="bi bi-camera-video-fill"></i>' : ''}
                            ${showMuted ? '<i class="bi bi-mic-mute-fill"></i>' : ''}
                        </div>
                        <div class="voice-avatar-wrapper" style="${(showCamera || showScreen) ? 'display:none' : ''}">
                            ${avatarHtml}
                        </div>
                        <div class="voice-participant-info">
                            <div class="voice-participant-name">${escapeHtml(name)}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // attach video streams
            list.forEach((u) => {
                if (!u.camOn && !u.screenOn) return;
                const video = document.getElementById(`video-user-${u.userId}`);
                if (!video) return;

                if (String(u.userId) === String(this.currentUser?.id)) {
                    if (u.screenOn && this.screenStream) {
                        video.srcObject = this.screenStream;
                        video.muted = true;
                        video.onloadedmetadata = () => {
                            Promise.resolve(video.play()).catch(() => { /* ignore */ });
                        };
                        return;
                    }
                    if (this.localStream) {
                        video.srcObject = this.localStream;
                        video.muted = true;
                        video.onloadedmetadata = () => {
                            Promise.resolve(video.play()).catch(() => { /* ignore */ });
                        };
                    }
                    return;
                }

                const stream = this.streams.get(u.userId);
                if (!stream) return;

                video.srcObject = stream;
                video.muted = true;
                video.onloadedmetadata = () => {
                    Promise.resolve(video.play()).catch(() => { /* ignore */ });
                };
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
    }

    window.CocoCordVoiceManager = VoiceManager;
})();
