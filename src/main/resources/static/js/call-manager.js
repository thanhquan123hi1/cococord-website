/**
 * CallManager - Global 1:1 Voice/Video Call Manager
 * 
 * This module handles:
 * - Global incoming call notifications (works on any page)
 * - WebRTC signaling with proper ICE candidate buffering
 * - Incoming/Outgoing call overlays
 * - Ringtone playback
 * 
 * Uses the global CoCoCordRealtime WebSocket connection from app.js
 */

(function initCallManager() {
    'use strict';

    if (window.CoCoCordCallManager) return;

    // ==================== STATE ====================
    const state = {
        currentUser: null,
        // Call state
        active: false,
        incoming: false,      // True when receiving an incoming call (not yet accepted)
        outgoing: false,      // True when we initiated and waiting for answer
        roomId: null,
        callId: null,
        isCaller: false,
        video: false,
        // WebRTC
        pc: null,
        localStream: null,
        remoteStream: null,
        // ICE candidate buffer (for candidates arriving before setRemoteDescription)
        iceCandidateBuffer: [],
        remoteDescriptionSet: false,
        // Target user info (for displaying in overlay)
        targetUser: null,
        // Subscription handles
        userCallSub: null,
        roomCallSub: null,
        // Ringtone
        ringtoneAudio: null,
        ringtoneInterval: null
    };

    // ==================== CONSTANTS ====================
    const ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ];

    // ==================== UTILITIES ====================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function log(...args) {
        console.log('[CallManager]', ...args);
    }

    function warn(...args) {
        console.warn('[CallManager]', ...args);
    }

    function error(...args) {
        console.error('[CallManager]', ...args);
    }

    // ==================== AUDIO HELPERS ====================
    function attachStreamToVideo(videoEl, stream, options = {}) {
        if (!videoEl || !stream) return;
        videoEl.srcObject = stream;
        videoEl.muted = !!options.muted;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        Promise.resolve(videoEl.play()).catch(() => { /* ignore */ });
    }

    function attachStreamToAudio(audioEl, stream) {
        if (!audioEl || !stream) return;
        audioEl.srcObject = stream;
        audioEl.autoplay = true;
        Promise.resolve(audioEl.play()).catch(() => { /* ignore */ });
    }

    /**
     * Attach remote audio stream - mirrors voice-manager.js ensureRemoteAudio()
     * Creates/reuses a hidden <audio> element for reliable audio playback
     */
    function attachRemoteAudio(stream) {
        if (!stream) return;
        
        const audioId = 'callRemoteAudioHidden';
        let audio = document.getElementById(audioId);
        
        if (!audio) {
            log('Creating hidden audio element for remote audio');
            audio = document.createElement('audio');
            audio.id = audioId;
            audio.autoplay = true;
            audio.playsInline = true;
            audio.style.display = 'none';
            document.body.appendChild(audio);
        }
        
        audio.srcObject = stream;
        audio.muted = false; // Important: don't mute!
        
        // Force play with multiple strategies
        audio.onloadedmetadata = () => {
            log('Remote audio metadata loaded, attempting play...');
            audio.play()
                .then(() => log('Remote audio playing successfully'))
                .catch(err => {
                    warn('Remote audio play failed:', err);
                    // Retry on user interaction
                    document.addEventListener('click', function retryPlay() {
                        audio.play().catch(() => {});
                        document.removeEventListener('click', retryPlay);
                    }, { once: true });
                });
        };
        
        // Also try immediate play
        audio.play().catch(() => { /* will retry on metadata */ });
        
        log('Remote audio element attached, srcObject:', !!audio.srcObject);
    }

    /**
     * Clean up remote audio element
     */
    function removeRemoteAudio() {
        const audio = document.getElementById('callRemoteAudioHidden');
        if (audio) {
            audio.srcObject = null;
            audio.remove();
            log('Remote audio element removed');
        }
    }

    function stopStream(stream) {
        if (!stream) return;
        try {
            stream.getTracks().forEach(t => t.stop());
        } catch (_) { /* ignore */ }
    }

    // ==================== RINGTONE ====================
    function playRingtone() {
        stopRingtone();
        try {
            // Try to use existing audio element or create one
            let audio = document.getElementById('callRingtone');
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = 'callRingtone';
                audio.src = '/audio/ringtone.mp3';
                audio.loop = true;
                audio.volume = 0.5;
                document.body.appendChild(audio);
            }
            state.ringtoneAudio = audio;
            audio.currentTime = 0;
            audio.play().catch(() => {
                // Fallback: try playing with a simple beep pattern
                playFallbackRingtone();
            });
        } catch (_) {
            playFallbackRingtone();
        }
    }

    function playFallbackRingtone() {
        // Simple oscillator-based ringtone
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            
            function beep() {
                if (!state.incoming && !state.outgoing) {
                    ctx.close();
                    return;
                }
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 440;
                gain.gain.value = 0.1;
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }

            beep();
            state.ringtoneInterval = setInterval(beep, 1000);
        } catch (_) { /* ignore */ }
    }

    function stopRingtone() {
        if (state.ringtoneAudio) {
            try {
                state.ringtoneAudio.pause();
                state.ringtoneAudio.currentTime = 0;
            } catch (_) { /* ignore */ }
        }
        if (state.ringtoneInterval) {
            clearInterval(state.ringtoneInterval);
            state.ringtoneInterval = null;
        }
    }

    // ==================== OVERLAY UI ====================
    function createOverlayIfNeeded() {
        log('=== createOverlayIfNeeded() called ===');
        
        if (document.getElementById('globalCallOverlay')) {
            log('Overlay already exists, skipping creation');
            return;
        }

        log('Creating new overlay...');
        
        // Ensure body exists
        if (!document.body) {
            error('document.body not ready yet!');
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'globalCallOverlay';
        overlay.className = 'global-call-overlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div class="call-overlay-backdrop"></div>
            <div class="call-overlay-content">
                <!-- Incoming Call View -->
                <div class="call-incoming-view" id="callIncomingView" style="display:none;">
                    <div class="call-avatar-container">
                        <div class="call-avatar-ring"></div>
                        <img class="call-avatar" id="callIncomingAvatar" src="/images/default-avatar.png" alt="">
                    </div>
                    <div class="call-user-name" id="callIncomingName">Người dùng</div>
                    <div class="call-status">Cuộc gọi đến...</div>
                    <div class="call-type" id="callIncomingType">
                        <i class="bi bi-telephone-fill"></i>
                        <span>Cuộc gọi thoại</span>
                    </div>
                    <div class="call-actions">
                        <button class="call-btn call-btn-decline" id="callDeclineBtn" title="Từ chối">
                            <i class="bi bi-telephone-x-fill"></i>
                        </button>
                        <button class="call-btn call-btn-accept" id="callAcceptBtn" title="Chấp nhận">
                            <i class="bi bi-telephone-fill"></i>
                        </button>
                    </div>
                </div>

                <!-- Outgoing Call View -->
                <div class="call-outgoing-view" id="callOutgoingView" style="display:none;">
                    <div class="call-avatar-container">
                        <div class="call-avatar-ring pulsing"></div>
                        <img class="call-avatar" id="callOutgoingAvatar" src="/images/default-avatar.png" alt="">
                    </div>
                    <div class="call-user-name" id="callOutgoingName">Người dùng</div>
                    <div class="call-status">Đang đổ chuông...</div>
                    <div class="call-type" id="callOutgoingType">
                        <i class="bi bi-telephone-fill"></i>
                        <span>Cuộc gọi thoại</span>
                    </div>
                    <div class="call-actions">
                        <button class="call-btn call-btn-end" id="callCancelBtn" title="Hủy cuộc gọi">
                            <i class="bi bi-telephone-x-fill"></i>
                        </button>
                    </div>
                </div>

                <!-- Active Call View (Video) -->
                <div class="call-active-view" id="callActiveView" style="display:none;">
                    <div class="call-video-container">
                        <video class="call-remote-video" id="callRemoteVideo" autoplay playsinline></video>
                        <video class="call-local-video" id="callLocalVideo" autoplay playsinline muted></video>
                        <audio id="callRemoteAudio" autoplay></audio>
                    </div>
                    <div class="call-active-header">
                        <span class="call-active-name" id="callActiveName">Cuộc gọi</span>
                        <span class="call-duration" id="callDuration">00:00</span>
                    </div>
                    <div class="call-active-controls">
                        <button class="call-control-btn" id="callToggleMute" title="Tắt tiếng">
                            <i class="bi bi-mic-fill"></i>
                        </button>
                        <button class="call-control-btn" id="callToggleVideo" title="Bật/Tắt camera">
                            <i class="bi bi-camera-video-fill"></i>
                        </button>
                        <button class="call-control-btn call-btn-end" id="callEndBtn" title="Kết thúc">
                            <i class="bi bi-telephone-x-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        log('Global call overlay created and mounted');
        
        // Bind events
        document.getElementById('callAcceptBtn')?.addEventListener('click', acceptIncomingCall);
        document.getElementById('callDeclineBtn')?.addEventListener('click', declineIncomingCall);
        document.getElementById('callCancelBtn')?.addEventListener('click', cancelOutgoingCall);
        document.getElementById('callEndBtn')?.addEventListener('click', () => endCall(true));
        document.getElementById('callToggleMute')?.addEventListener('click', toggleMute);
        document.getElementById('callToggleVideo')?.addEventListener('click', toggleVideo);
    }

    function showOverlay() {
        log('=== showOverlay() called ===');
        createOverlayIfNeeded();
        const overlay = document.getElementById('globalCallOverlay');
        if (overlay) {
            log('Setting overlay display to flex');
            overlay.style.display = 'flex';
            document.body.classList.add('call-active');
            log('Overlay shown, classList:', overlay.classList.toString());
            log('Computed display:', getComputedStyle(overlay).display);
        } else {
            error('Overlay element not found in showOverlay()!');
        }
    }

    function hideOverlay() {
        const overlay = document.getElementById('globalCallOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        document.body.classList.remove('call-active');
        // Hide all views
        ['callIncomingView', 'callOutgoingView', 'callActiveView'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    function showIncomingCallView(callerInfo, isVideo) {
        createOverlayIfNeeded();
        
        // Add/remove voice-call class based on call type
        const overlay = document.getElementById('globalCallOverlay');
        if (overlay) {
            if (isVideo) {
                overlay.classList.remove('voice-call');
            } else {
                overlay.classList.add('voice-call');
            }
        }
        
        // Update UI
        const avatar = document.getElementById('callIncomingAvatar');
        const name = document.getElementById('callIncomingName');
        const type = document.getElementById('callIncomingType');
        
        if (avatar) {
            const avatarUrl = callerInfo?.avatarUrl || '/images/default-avatar.png';
            log('Setting incoming call avatar:', avatarUrl);
            avatar.src = avatarUrl;
            avatar.onerror = () => {
                log('Avatar failed to load, using default');
                avatar.src = '/images/default-avatar.png';
            };
        }
        if (name) name.textContent = callerInfo?.displayName || callerInfo?.username || 'Người dùng';
        if (type) {
            type.innerHTML = isVideo 
                ? '<i class="bi bi-camera-video-fill"></i><span>Cuộc gọi video</span>'
                : '<i class="bi bi-telephone-fill"></i><span>Cuộc gọi thoại</span>';
        }
        
        // Show incoming view
        document.getElementById('callIncomingView').style.display = 'flex';
        document.getElementById('callOutgoingView').style.display = 'none';
        document.getElementById('callActiveView').style.display = 'none';
        
        showOverlay();
        playRingtone();
    }

    function showOutgoingCallView(targetInfo, isVideo) {
        log('=== showOutgoingCallView() called ===');
        log('targetInfo:', targetInfo);
        log('isVideo:', isVideo);
        
        createOverlayIfNeeded();
        
        // Verify overlay exists and add/remove voice-call class
        const overlay = document.getElementById('globalCallOverlay');
        if (!overlay) {
            error('globalCallOverlay not found after createOverlayIfNeeded()');
            return;
        }
        log('Overlay found:', overlay);
        
        // Add/remove voice-call class based on call type
        if (isVideo) {
            overlay.classList.remove('voice-call');
        } else {
            overlay.classList.add('voice-call');
        }
        
        // Update UI
        const avatar = document.getElementById('callOutgoingAvatar');
        const name = document.getElementById('callOutgoingName');
        const type = document.getElementById('callOutgoingType');
        
        log('Elements found:', { avatar: !!avatar, name: !!name, type: !!type });
        
        if (avatar) {
            const avatarUrl = targetInfo?.avatarUrl || '/images/default-avatar.png';
            log('Setting outgoing call avatar:', avatarUrl);
            avatar.src = avatarUrl;
            avatar.onerror = () => {
                log('Avatar failed to load, using default');
                avatar.src = '/images/default-avatar.png';
            };
        }
        if (name) name.textContent = targetInfo?.displayName || targetInfo?.username || 'Người dùng';
        if (type) {
            type.innerHTML = isVideo 
                ? '<i class="bi bi-camera-video-fill"></i><span>Cuộc gọi video</span>'
                : '<i class="bi bi-telephone-fill"></i><span>Cuộc gọi thoại</span>';
        }
        
        // Show outgoing view
        const incomingView = document.getElementById('callIncomingView');
        const outgoingView = document.getElementById('callOutgoingView');
        const activeView = document.getElementById('callActiveView');
        
        log('Views found:', { incoming: !!incomingView, outgoing: !!outgoingView, active: !!activeView });
        
        if (incomingView) incomingView.style.display = 'none';
        if (outgoingView) {
            outgoingView.style.display = 'flex';
            log('Outgoing view display set to flex');
        } else {
            error('callOutgoingView element not found!');
        }
        if (activeView) activeView.style.display = 'none';
        if (activeView) activeView.style.display = 'none';
        
        log('Calling showOverlay()');
        showOverlay();
        log('showOverlay() completed, overlay.style.display:', overlay.style.display);
        playRingtone();
        log('=== showOutgoingCallView() completed ===');
    }

    function showActiveCallView(isVideo) {
        createOverlayIfNeeded();
        stopRingtone();
        
        // Add/remove voice-call class based on call type
        const overlay = document.getElementById('globalCallOverlay');
        if (overlay) {
            if (isVideo) {
                overlay.classList.remove('voice-call');
            } else {
                overlay.classList.add('voice-call');
            }
        }
        
        // Update UI
        const name = document.getElementById('callActiveName');
        if (name) name.textContent = state.targetUser?.displayName || state.targetUser?.username || 'Cuộc gọi';
        
        // Show/hide video elements based on call type
        const remoteVideo = document.getElementById('callRemoteVideo');
        const localVideo = document.getElementById('callLocalVideo');
        
        if (remoteVideo) remoteVideo.style.display = isVideo ? 'block' : 'none';
        if (localVideo) {
            localVideo.style.display = isVideo ? 'block' : 'none';
            // Ensure local stream is attached to local video
            if (isVideo && state.localStream && !localVideo.srcObject) {
                log('Attaching local stream to local video in showActiveCallView');
                attachStreamToVideo(localVideo, state.localStream, { muted: true });
            }
        }
        
        // If we have remote stream, make sure it's attached
        if (state.remoteStream) {
            if (remoteVideo && isVideo && !remoteVideo.srcObject) {
                log('Attaching remote stream to remote video in showActiveCallView');
                remoteVideo.srcObject = state.remoteStream;
                remoteVideo.muted = false;
                remoteVideo.play().catch(() => {});
            }
            // Ensure remote audio is attached
            attachRemoteAudio(state.remoteStream);
        }
        
        // Show active view
        document.getElementById('callIncomingView').style.display = 'none';
        document.getElementById('callOutgoingView').style.display = 'none';
        document.getElementById('callActiveView').style.display = 'flex';
        
        showOverlay();
        startCallDurationTimer();
    }

    // ==================== CALL DURATION TIMER ====================
    let callStartTime = null;
    let durationInterval = null;

    function startCallDurationTimer() {
        callStartTime = Date.now();
        durationInterval = setInterval(updateCallDuration, 1000);
    }

    function updateCallDuration() {
        if (!callStartTime) return;
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        const el = document.getElementById('callDuration');
        if (el) el.textContent = `${mins}:${secs}`;
    }

    function stopCallDurationTimer() {
        if (durationInterval) {
            clearInterval(durationInterval);
            durationInterval = null;
        }
        callStartTime = null;
    }

    // ==================== WEBRTC ====================
    function createPeerConnection() {
        log('Creating new RTCPeerConnection');
        
        try {
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

            pc.onicecandidate = (e) => {
                if (!e.candidate) {
                    log('ICE gathering complete');
                    return;
                }
                if (!state.roomId) return;
                
                log('Sending ICE candidate');
                sendSignal({
                    roomId: state.roomId,
                    callId: state.callId,
                    type: 'ICE',
                    candidate: e.candidate.candidate,
                    sdpMid: e.candidate.sdpMid,
                    sdpMLineIndex: e.candidate.sdpMLineIndex,
                    video: state.video
                });
            };

            pc.ontrack = (e) => {
                log('============ Remote track received ============');
                log('Track kind:', e.track.kind);
                log('Track id:', e.track.id);
                log('Track enabled:', e.track.enabled);
                log('Track muted:', e.track.muted);
                log('Track readyState:', e.track.readyState);
                log('Streams available:', e.streams?.length || 0);
                
                // Use the stream from the event directly (like voice-manager.js does)
                // This is more reliable than creating a new MediaStream
                const stream = e.streams?.[0];
                if (stream) {
                    log('✅ Using stream from event.streams[0], id:', stream.id);
                    log('Stream tracks in event:', stream.getTracks().map(t => t.kind));
                    state.remoteStream = stream;
                } else {
                    // Fallback: create new stream and add track
                    log('No stream in event, creating new MediaStream');
                    if (!state.remoteStream) {
                        state.remoteStream = new MediaStream();
                    }
                    state.remoteStream.addTrack(e.track);
                }
                
                const currentTracks = state.remoteStream.getTracks();
                log('Remote stream current tracks:', currentTracks.map(t => ({
                    kind: t.kind, 
                    enabled: t.enabled,
                    muted: t.muted,
                    readyState: t.readyState
                })));

                // Attach audio - critical for hearing the other person
                // Use the working pattern from voice-manager.js
                if (e.track.kind === 'audio' || state.remoteStream.getAudioTracks().length > 0) {
                    log('Attaching remote audio stream');
                    attachRemoteAudio(state.remoteStream);
                }

                // Attach video element if video call
                const remoteVideo = document.getElementById('callRemoteVideo');
                log('Remote video element found:', !!remoteVideo, 'state.video:', state.video);
                
                if (remoteVideo && state.video && state.remoteStream.getVideoTracks().length > 0) {
                    log('Attaching video stream to <video> element');
                    remoteVideo.srcObject = state.remoteStream;
                    remoteVideo.muted = false; // Important: don't mute the video element's audio
                    remoteVideo.autoplay = true;
                    remoteVideo.playsInline = true;
                    remoteVideo.play().catch(err => warn('Video play failed:', err));
                    log('✅ Remote video attached, srcObject:', !!remoteVideo.srcObject);
                } else {
                    if (!remoteVideo) error('❌ callRemoteVideo element not found!');
                    if (!state.video) log('ℹ️ Not a video call, skipping video attachment');
                    if (state.remoteStream.getVideoTracks().length === 0) {
                        warn('No video tracks in remote stream yet');
                    }
                }
                
                log('============ ontrack handler complete ============');
            };

        pc.oniceconnectionstatechange = () => {
            log('ICE connection state:', pc.iceConnectionState);
            log('Current call state:', { incoming: state.incoming, outgoing: state.outgoing, active: state.active });
            
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                log('Call connected successfully!');
                // Transition to active call view if still in incoming/outgoing
                if (state.incoming || state.outgoing) {
                    log('Transitioning to active call view via ICE connection');
                    state.incoming = false;
                    state.outgoing = false;
                    showActiveCallView(state.video);
                } else {
                    log('Already in active state, not transitioning');
                }
            }
            
            if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                warn('ICE connection failed or disconnected');
                // Give it some time to recover before ending
                setTimeout(() => {
                    if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                        endCall(false);
                    }
                }, 3000);
            }
        };

        pc.onconnectionstatechange = () => {
            log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                endCall(false);
            }
        };

        return pc;
        } catch (err) {
            error('Failed to create RTCPeerConnection:', err);
            return null;
        }
    }

    async function ensureLocalMedia(video) {
        if (state.localStream) {
            log('Using existing local stream');
            const tracks = state.localStream.getTracks();
            log('Existing stream tracks:', tracks.map(t => ({
                kind: t.kind,
                enabled: t.enabled,
                muted: t.muted,
                readyState: t.readyState,
                label: t.label
            })));
            
            // Verify and re-enable tracks if needed
            tracks.forEach(track => {
                if (!track.enabled) {
                    log('Re-enabling disabled track:', track.kind);
                    track.enabled = true;
                }
            });
            
            return state.localStream;
        }

        log('Requesting user media:', { audio: true, video });

        try {
            state.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
            });

            log('getUserMedia successful!');
            const tracks = state.localStream.getTracks();
            log('New stream tracks:', tracks.map(t => ({
                kind: t.kind,
                enabled: t.enabled,
                muted: t.muted,
                readyState: t.readyState,
                label: t.label
            })));

            // Verify tracks are enabled and not muted
            tracks.forEach(track => {
                if (!track.enabled) {
                    error('Track is disabled:', track.kind);
                    track.enabled = true; // Force enable
                    log('Force enabled track:', track.kind);
                }
                if (track.muted) {
                    warn('Track is muted (browser/OS level):', track.kind);
                }
                if (track.readyState !== 'live') {
                    error('Track is not live:', track.kind, track.readyState);
                }
            });

            // Attach to local video element if video call
            const localVideo = document.getElementById('callLocalVideo');
            if (localVideo && video) {
                attachStreamToVideo(localVideo, state.localStream, { muted: true });
                log('Local video attached to DOM');
            }

            return state.localStream;
        } catch (err) {
            error('Failed to get user media:', err);
            error('Error name:', err.name);
            error('Error message:', err.message);
            throw err;
        }
    }

    // Process buffered ICE candidates
    async function processIceCandidateBuffer() {
        if (!state.pc || !state.remoteDescriptionSet) return;
        
        log(`Processing ${state.iceCandidateBuffer.length} buffered ICE candidates`);
        
        for (const candidate of state.iceCandidateBuffer) {
            try {
                await state.pc.addIceCandidate(candidate);
                log('Added buffered ICE candidate');
            } catch (err) {
                warn('Failed to add buffered ICE candidate:', err);
            }
        }
        state.iceCandidateBuffer = [];
    }

    // ==================== SIGNALING ====================
    function sendSignal(payload) {
        const rt = window.CoCoCordRealtime;
        if (!rt) {
            error('CoCoCordRealtime not available');
            return;
        }
        
        log('Sending signal:', payload.type);
        rt.send('/app/call.signal', {}, JSON.stringify(payload));
    }

    async function handleSignal(evt) {
        if (!evt || !evt.type) return;
        
        const selfId = state.currentUser?.id;
        
        // Log ALL signals before filtering
        log('Raw signal received:', {
            type: evt.type,
            fromUserId: evt.fromUserId,
            selfId: selfId,
            roomId: evt.roomId,
            isSelf: selfId && evt.fromUserId && String(evt.fromUserId) === String(selfId)
        });
        
        // Ignore our own signals
        if (selfId && evt.fromUserId && String(evt.fromUserId) === String(selfId)) {
            log('Ignoring own signal:', evt.type);
            return;
        }

        log('=== Processing signal:', evt.type, 'from:', evt.fromUserId, '===');

        switch (evt.type) {
            case 'CALL_START':
                await handleCallStart(evt);
                break;
            case 'CALL_ACCEPT':
                await handleCallAccept(evt);
                break;
            case 'OFFER':
                await handleOffer(evt);
                break;
            case 'ANSWER':
                await handleAnswer(evt);
                break;
            case 'ICE':
                await handleIceCandidate(evt);
                break;
            case 'HANGUP':
                handleHangup(evt);
                break;
            case 'DECLINE':
                handleDecline(evt);
                break;
            default:
                log('Unknown signal type:', evt.type);
        }
    }

    async function handleCallAccept(evt) {
        log('=== Callee accepted the call! ===');
        log('Current state:', { outgoing: state.outgoing, incoming: state.incoming, active: state.active });
        
        // If we are the caller waiting for accept
        if (state.outgoing && !state.incoming) {
            log('Caller received accept, transitioning to active view');
            state.outgoing = false;
            
            // Show active call view immediately
            // OFFER was already sent in startCall(), we just wait for ANSWER now
            showActiveCallView(state.video);
            log('Active view shown, waiting for ANSWER from callee');
        } else {
            log('Received accept in unexpected state, ignoring');
        }
    }

    async function handleCallStart(evt) {
        // Incoming call!
        if (state.active || state.incoming) {
            log('Already in a call, ignoring incoming call');
            // Send busy signal
            sendSignal({
                roomId: evt.roomId,
                callId: evt.callId,
                type: 'DECLINE',
                reason: 'busy'
            });
            return;
        }

        log('Incoming call from', evt.fromUsername);

        state.incoming = true;
        state.roomId = evt.roomId;
        state.callId = evt.callId || generateCallId();
        state.video = !!evt.video;
        state.isCaller = false;
        state.targetUser = {
            id: evt.fromUserId,
            username: evt.fromUsername,
            displayName: evt.fromDisplayName || evt.fromUsername,
            avatarUrl: evt.fromAvatarUrl
        };

        // Buffer the OFFER if included in CALL_START
        if (evt.sdp) {
            log('OFFER included in CALL_START, buffering for when user accepts');
            state.pendingOffer = evt;
        } else {
            log('No OFFER in CALL_START, will wait for separate OFFER message');
        }

        // Fetch target user info if not provided
        if (!state.targetUser.avatarUrl) {
            await fetchUserInfo(evt.fromUserId);
        }

        // Subscribe to room-specific topic for this call
        subscribeToRoomTopic(evt.roomId);

        showIncomingCallView(state.targetUser, state.video);
    }

    async function handleOffer(evt) {
        log('=== Processing OFFER ===');
        log('evt:', { fromUserId: evt.fromUserId, roomId: evt.roomId, video: evt.video, hasSdp: !!evt.sdp });
        log('Current state:', { active: state.active, incoming: state.incoming, outgoing: state.outgoing, hasPc: !!state.pc });

        // If we received offer but haven't set up call yet (direct offer without CALL_START)
        if (!state.active && !state.incoming) {
            log('Setting up incoming call from OFFER');
            state.incoming = true;
            state.roomId = evt.roomId;
            state.callId = evt.callId || generateCallId();
            state.video = !!evt.video;
            state.isCaller = false;
            state.targetUser = {
                id: evt.fromUserId,
                username: evt.fromUsername
            };
            
            subscribeToRoomTopic(evt.roomId);
            showIncomingCallView(state.targetUser, state.video);
        }

        // If still waiting for accept, don't process offer yet
        if (state.incoming && !state.active) {
            log('Offer received, waiting for user to accept - buffering offer');
            // Store the offer for when they accept
            state.pendingOffer = evt;
            return;
        }

        log('Ready to process offer');

        // Peer connection and media MUST already be set up by acceptIncomingCall()
        if (!state.pc) {
            error('❌ CRITICAL: No peer connection when processing OFFER! This should not happen.');
            error('handleOffer should only be called AFTER acceptIncomingCall sets up PC and media');
            endCall(true);
            return;
        }

        // Verify tracks are already added
        const senders = state.pc.getSenders();
        const audioSender = senders.find(s => s.track?.kind === 'audio');
        const videoSender = senders.find(s => s.track?.kind === 'video');
        log('Peer connection state before setRemoteDescription:');
        log('  - Audio track added:', !!audioSender);
        log('  - Video track added:', !!videoSender);
        log('  - Total senders:', senders.length);
        
        if (!audioSender) {
            error('No audio track in peer connection! Check acceptIncomingCall()');
        }
        if (state.video && !videoSender) {
            error('No video track in peer connection! Check acceptIncomingCall()');
        }

        // Set remote description (the offer)
        try {
            log('Setting remote description (offer)...');
            await state.pc.setRemoteDescription({ type: 'offer', sdp: evt.sdp });
            state.remoteDescriptionSet = true;
            log('Remote description (offer) set successfully');
            
            // Process any buffered ICE candidates
            await processIceCandidateBuffer();
        } catch (err) {
            error('Failed to set remote description:', err);
            endCall(true);
            return;
        }

        // Create and send answer
        try {
            log('Creating answer...');
            const answer = await state.pc.createAnswer();
            await state.pc.setLocalDescription(answer);
            log('Sending ANSWER signal');
            
            sendSignal({
                roomId: state.roomId,
                callId: state.callId,
                type: 'ANSWER',
                sdp: answer.sdp,
                video: state.video
            });
            log('ANSWER sent successfully');
        } catch (err) {
            error('Failed to create/send answer:', err);
            endCall(true);
        }
    }

    async function handleAnswer(evt) {
        log('=== Processing ANSWER ===');
        log('evt:', { fromUserId: evt.fromUserId, roomId: evt.roomId, video: evt.video });
        log('state.pc exists:', !!state.pc);

        if (!state.pc) {
            warn('No peer connection for answer');
            return;
        }

        try {
            log('Setting remote description (answer)...');
            await state.pc.setRemoteDescription({ type: 'answer', sdp: evt.sdp });
            state.remoteDescriptionSet = true;
            log('Remote description (answer) set successfully');
            
            // Process any buffered ICE candidates
            await processIceCandidateBuffer();
            
            // Transition to active state
            log('Before transition - state:', { outgoing: state.outgoing, incoming: state.incoming, active: state.active });
            state.outgoing = false;
            log('Transitioning from outgoing to active call view');
            showActiveCallView(state.video);
            log('After transition - state:', { outgoing: state.outgoing, incoming: state.incoming, active: state.active });
        } catch (err) {
            error('Failed to set remote description (answer):', err);
            endCall(true);
        }
    }

    async function handleIceCandidate(evt) {
        if (!evt.candidate) return;

        const candidate = {
            candidate: evt.candidate,
            sdpMid: evt.sdpMid,
            sdpMLineIndex: evt.sdpMLineIndex
        };

        // Buffer ICE candidates if remote description not set yet
        if (!state.remoteDescriptionSet || !state.pc) {
            log('Buffering ICE candidate (remote description not set yet)');
            state.iceCandidateBuffer.push(candidate);
            return;
        }

        try {
            await state.pc.addIceCandidate(candidate);
            log('Added ICE candidate');
        } catch (err) {
            warn('Failed to add ICE candidate:', err);
        }
    }

    function handleHangup(evt) {
        log('Remote party hung up');
        endCall(false);
    }

    function handleDecline(evt) {
        log('Call declined:', evt.reason);
        stopRingtone();
        state.outgoing = false;
        showToast('Cuộc gọi bị từ chối', 'error');
        resetCallState();
        hideOverlay();
    }

    // ==================== CALL ACTIONS ====================
    function generateCallId() {
        return 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async function startCall(targetUserId, dmGroupId, targetUser, video = false) {
        log('=== startCall() called ===' );
        log('targetUserId:', targetUserId, 'dmGroupId:', dmGroupId, 'video:', video);
        log('Current state:', { active: state.active, outgoing: state.outgoing, incoming: state.incoming });
        
        if (state.active || state.outgoing || state.incoming) {
            warn('Already in a call');
            return false;
        }

        log('Starting call to', targetUserId, 'video:', video);

        state.active = true;
        state.outgoing = true;
        state.isCaller = true;
        state.roomId = String(dmGroupId);
        state.callId = generateCallId();
        state.video = video;
        state.targetUser = targetUser;
        state.remoteDescriptionSet = false;
        state.iceCandidateBuffer = [];

        // Create peer connection
        state.pc = createPeerConnection();
        if (!state.pc) {
            error('Failed to create peer connection');
            showToast('Không thể tạo kết nối', 'error');
            resetCallState();
            return false;
        }

        // Get local media first
        try {
            const stream = await ensureLocalMedia(video);
            log('Local stream tracks:', stream.getTracks().map(t => `${t.kind} (${t.label})`));
            stream.getTracks().forEach(track => {
                state.pc.addTrack(track, stream);
                log('Added track to peer connection:', track.kind);
            });
        } catch (err) {
            error('Failed to get local media:', err);
            showToast('Không thể truy cập micro/camera', 'error');
            resetCallState();
            return false;
        }

        // Create OFFER immediately after adding tracks (WebRTC standard flow)
        try {
            log('Creating OFFER immediately after addTrack...');
            
            // Verify tracks before creating offer
            const senders = state.pc.getSenders();
            log('Verify before createOffer:');
            log('  - Total senders:', senders.length);
            log('  - Audio sender:', !!senders.find(s => s.track?.kind === 'audio'));
            log('  - Video sender:', video ? !!senders.find(s => s.track?.kind === 'video') : 'N/A');
            
            const offer = await state.pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: video
            });
            await state.pc.setLocalDescription(offer);
            log('Local description (offer) set successfully');
            log('SDP has video:', offer.sdp.includes('m=video'));
            log('SDP has audio:', offer.sdp.includes('m=audio'));
        } catch (err) {
            error('Failed to create offer:', err);
            showToast('Không thể tạo offer', 'error');
            resetCallState();
            return false;
        }

        // Show outgoing call UI
        log('Showing outgoing call view');
        showOutgoingCallView(targetUser, video);

        // Subscribe to room topic for this call
        subscribeToRoomTopic(state.roomId);

        // Send CALL_START with the OFFER included
        sendSignal({
            roomId: state.roomId,
            callId: state.callId,
            type: 'CALL_START',
            sdp: state.pc.localDescription.sdp,
            video: video,
            targetUserId: targetUserId
        });

        log('CALL_START with OFFER sent, waiting for ANSWER from callee');

        return true;
    }

    async function acceptIncomingCall() {
        if (!state.incoming) return;

        log('=== Accepting incoming call ===');
        log('Current state:', { roomId: state.roomId, callId: state.callId, video: state.video });
        stopRingtone();

        state.active = true;
        state.incoming = false;

        // Send CALL_ACCEPT signal first
        log('Sending CALL_ACCEPT signal');
        sendSignal({
            roomId: state.roomId,
            callId: state.callId,
            type: 'CALL_ACCEPT',
            video: state.video
        });

        // Create peer connection
        if (!state.pc) {
            log('Creating peer connection for callee');
            state.pc = createPeerConnection();
            if (!state.pc) {
                error('Failed to create peer connection');
                showToast('Không thể tạo kết nối', 'error');
                endCall(true);
                return;
            }
        }

        // Get local media and add tracks FIRST
        try {
            log('Getting local media for callee (receiver)...');
            const stream = await ensureLocalMedia(state.video);
            log('Callee stream tracks:', stream.getTracks().map(t => `${t.kind} (${t.label})`));
            
            stream.getTracks().forEach(track => {
                if (!state.pc.getSenders().find(s => s.track === track)) {
                    state.pc.addTrack(track, stream);
                    log('Callee added track:', track.kind);
                }
            });
            
            // Verify all tracks are added
            const senders = state.pc.getSenders();
            log('Callee peer connection ready:');
            log('  - Audio track:', !!senders.find(s => s.track?.kind === 'audio'));
            log('  - Video track:', !!senders.find(s => s.track?.kind === 'video'));
            log('  - Total senders:', senders.length);
        } catch (err) {
            error('Failed to get local media:', err);
            showToast('Không thể truy cập micro/camera', 'error');
            endCall(true);
            return;
        }

        // NOW process pending offer (PC and tracks are ready)
        log('Checking for pending offer:', !!state.pendingOffer);
        if (state.pendingOffer) {
            log('Processing pending OFFER from CALL_START');
            await handleOffer(state.pendingOffer);
            state.pendingOffer = null;
        } else {
            log('No pending offer, will wait for OFFER to arrive');
        }

        showActiveCallView(state.video);
    }

    function declineIncomingCall() {
        if (!state.incoming) return;

        log('Declining incoming call');
        stopRingtone();

        // Send decline signal
        sendSignal({
            roomId: state.roomId,
            callId: state.callId,
            type: 'DECLINE',
            reason: 'declined'
        });

        resetCallState();
        hideOverlay();
    }

    function cancelOutgoingCall() {
        if (!state.outgoing) return;

        log('Cancelling outgoing call');
        endCall(true);
    }

    function endCall(sendHangup = true) {
        // Ensure sendHangup is boolean (in case event object is passed)
        sendHangup = Boolean(sendHangup) && sendHangup !== false;
        
        log('Ending call, sendHangup:', sendHangup);
        stopRingtone();
        stopCallDurationTimer();

        if (sendHangup && state.roomId) {
            sendSignal({
                roomId: state.roomId,
                callId: state.callId,
                type: 'HANGUP'
            });
        }

        // Close peer connection
        if (state.pc) {
            try {
                state.pc.onicecandidate = null;
                state.pc.ontrack = null;
                state.pc.oniceconnectionstatechange = null;
                state.pc.onconnectionstatechange = null;
                state.pc.close();
            } catch (_) { /* ignore */ }
        }

        // Stop streams
        stopStream(state.localStream);
        stopStream(state.remoteStream);

        // Clean up remote audio element
        removeRemoteAudio();

        // Clear video elements
        ['callRemoteVideo', 'callLocalVideo', 'callRemoteAudio'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.srcObject = null;
        });

        resetCallState();
        hideOverlay();
    }

    function resetCallState() {
        state.active = false;
        state.incoming = false;
        state.outgoing = false;
        state.roomId = null;
        state.callId = null;
        state.isCaller = false;
        state.video = false;
        state.pc = null;
        state.localStream = null;
        state.remoteStream = null;
        state.iceCandidateBuffer = [];
        state.remoteDescriptionSet = false;
        state.targetUser = null;
        state.pendingOffer = null;

        // Unsubscribe from room topic
        if (state.roomCallSub) {
            state.roomCallSub();
            state.roomCallSub = null;
        }
    }

    // ==================== MUTE/VIDEO TOGGLE ====================
    let isMuted = false;
    let isVideoOff = false;

    function toggleMute() {
        if (!state.localStream) return;

        isMuted = !isMuted;
        state.localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);

        const btn = document.getElementById('callToggleMute');
        if (btn) {
            btn.innerHTML = isMuted 
                ? '<i class="bi bi-mic-mute-fill"></i>' 
                : '<i class="bi bi-mic-fill"></i>';
            btn.classList.toggle('muted', isMuted);
        }
    }

    function toggleVideo() {
        if (!state.localStream) return;

        isVideoOff = !isVideoOff;
        state.localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);

        const btn = document.getElementById('callToggleVideo');
        if (btn) {
            btn.innerHTML = isVideoOff 
                ? '<i class="bi bi-camera-video-off-fill"></i>' 
                : '<i class="bi bi-camera-video-fill"></i>';
            btn.classList.toggle('video-off', isVideoOff);
        }
    }

    // ==================== SUBSCRIPTIONS ====================
    async function subscribeToUserCalls() {
        const rt = window.CoCoCordRealtime;
        if (!rt || !state.currentUser) return;

        const userId = state.currentUser.id;
        log('Subscribing to user call topic for user:', userId);

        // Subscribe to user-specific call notifications
        state.userCallSub = await rt.subscribe(`/topic/user.${userId}.calls`, (msg) => {
            try {
                const evt = JSON.parse(msg.body);
                handleSignal(evt);
            } catch (err) {
                error('Failed to parse call signal:', err);
            }
        });
    }

    async function subscribeToRoomTopic(roomId) {
        const rt = window.CoCoCordRealtime;
        if (!rt) return;

        // Unsubscribe from previous room if any
        if (state.roomCallSub) {
            state.roomCallSub();
        }

        log('Subscribing to room call topic:', roomId);

        state.roomCallSub = await rt.subscribe(`/topic/call/${roomId}`, (msg) => {
            try {
                const evt = JSON.parse(msg.body);
                handleSignal(evt);
            } catch (err) {
                error('Failed to parse room call signal:', err);
            }
        });
    }

    // ==================== HELPERS ====================
    async function fetchUserInfo(userId) {
        try {
            const token = localStorage.getItem('accessToken');
            const resp = await fetch(`/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const user = await resp.json();
                log('Fetched user info:', { id: user.id, username: user.username, hasAvatar: !!user.avatarUrl });
                if (state.targetUser && String(state.targetUser.id) === String(userId)) {
                    state.targetUser = { ...state.targetUser, ...user };
                    // Update UI - check both incoming and outgoing avatar elements
                    const incomingAvatar = document.getElementById('callIncomingAvatar');
                    const outgoingAvatar = document.getElementById('callOutgoingAvatar');
                    const incomingName = document.getElementById('callIncomingName');
                    const outgoingName = document.getElementById('callOutgoingName');
                    
                    if (incomingAvatar) {
                        incomingAvatar.src = user.avatarUrl || '/images/default-avatar.png';
                        log('Updated incoming avatar');
                    }
                    if (outgoingAvatar) {
                        outgoingAvatar.src = user.avatarUrl || '/images/default-avatar.png';
                        log('Updated outgoing avatar');
                    }
                    if (incomingName) incomingName.textContent = user.displayName || user.username;
                    if (outgoingName) outgoingName.textContent = user.displayName || user.username;
                }
            }
        } catch (err) {
            log('Failed to fetch user info:', err);
        }
    }

    function showToast(message, type = 'info') {
        if (window.ToastManager) {
            window.ToastManager.show(message, type);
        } else {
            console.log('[Toast]', message);
        }
    }

    // ==================== INITIALIZATION ====================
    async function init() {
        log('Initializing CallManager');

        // Get current user
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                state.currentUser = JSON.parse(userStr);
            }
            
            if (!state.currentUser) {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    const resp = await fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resp.ok) {
                        state.currentUser = await resp.json();
                    }
                }
            }
        } catch (_) { /* ignore */ }

        if (!state.currentUser) {
            warn('No current user, call features disabled');
            return;
        }

        // Create overlay
        createOverlayIfNeeded();

        // Subscribe to user-specific call notifications
        await subscribeToUserCalls();

        log('CallManager initialized for user:', state.currentUser.username);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for CoCoCordRealtime to be ready
            setTimeout(init, 500);
        });
    } else {
        setTimeout(init, 500);
    }

    // ==================== PUBLIC API ====================
    window.CoCoCordCallManager = {
        startCall,
        acceptIncomingCall,
        declineIncomingCall,
        endCall,
        toggleMute,
        toggleVideo,
        isInCall: () => state.active || state.incoming || state.outgoing,
        getState: () => ({ ...state })
    };

})();
