/* CoCoCord /app page: persistent sidebar + dynamic main (friends) */

(() => {
  "use strict";
  let isInitializing = false;

  const state = {
    currentUser: null,
    friendsState: {},
    friends: [],
    requests: [],
    blocked: [],
    dmItems: [],
    dmMessages: [],
    activeDmGroupId: null,
    activeDmUser: null,
    activeTab: "online",
    activeView: "friends", // 'friends', 'dm', 'nitro', 'shop', 'quests'
    activeMainView: "friends", // for SPA navigation: 'friends', 'nitro', 'shop', 'quests'
    friendsSearch: "",
    dmSearch: "",
  };

  // WebSocket for DM
  let stompClient = null;
  let dmSubscription = null;
  let callSubscription = null;

  // ==================== CALL (WebRTC + WebSocket signaling) ====================
  const call = {
    active: false,
    roomId: null,
    isCaller: false,
    video: false,
    pc: null,
    localStream: null,
    remoteStream: null,

    callId: null,
    connectedAtMs: null,
    loggedCall: false,

    incomingPending: false,
    incomingFrom: null,
    incomingVideo: false,

    pendingOfferSdp: null,
    pendingCandidates: [],
  };

  const els = {
    globalSearch: () => document.getElementById("globalSearch"),
    dmList: () => document.getElementById("dmList"),

    // Friends view
    mainArea: () => document.querySelector(".main-area"),
    friendsList: () => document.getElementById("friendsList"),
    friendsSearch: () => document.getElementById("friendsSearch"),
    addFriendBtn: () => document.getElementById("addFriendBtn"),
    addFriendView: () => document.getElementById("addFriendView"),
    addFriendInput: () => document.getElementById("addFriendInput"),
    sendFriendRequestBtn: () => document.getElementById("sendFriendRequestBtn"),
    addFriendHint: () => document.getElementById("addFriendHint"),
    toolbar: () => document.querySelector(".toolbar"),
    topBar: () => document.querySelector(".top-bar"),

    // DM Chat view
    dmChatArea: () => document.getElementById("dmChatArea"),
    dmChatTitle: () => document.getElementById("dmChatTitle"),
    dmStartAvatar: () => document.getElementById("dmStartAvatar"),
    dmStartName: () => document.getElementById("dmStartName"),
    dmStartInfo: () => document.getElementById("dmStartInfo"),
    dmMessagesList: () => document.getElementById("dmMessagesList"),
    dmComposer: () => document.getElementById("dmComposer"),
    dmMessageInput: () => document.getElementById("dmMessageInput"),
  };

  const callEls = {
    voiceBtn: () => document.getElementById("dmVoiceCallBtn"),
    videoBtn: () => document.getElementById("dmVideoCallBtn"),
    overlay: () => document.getElementById("dmCallOverlay"),
    title: () => document.getElementById("dmCallTitle"),
    prompt: () => document.getElementById("dmCallPrompt"),
    promptText: () => document.getElementById("dmCallPromptText"),
    acceptBtn: () => document.getElementById("dmCallAcceptBtn"),
    declineBtn: () => document.getElementById("dmCallDeclineBtn"),
    hangupBtn: () => document.getElementById("dmCallHangupBtn"),
    localVideo: () => document.getElementById("dmCallLocalVideo"),
    remoteVideo: () => document.getElementById("dmCallRemoteVideo"),
    remoteAudio: () => document.getElementById("dmCallRemoteAudio"),
  };

  function safeText(value) {
    return (value ?? "").toString();
  }

  function escapeHtml(str) {
    return safeText(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function discriminatorFromId(id) {
    const n = Number(id);
    if (!Number.isFinite(n)) return "0000";
    return String(n % 10000).padStart(4, "0");
  }

  function displayName(user) {
    return user?.displayName || user?.username || "Unknown";
  }

  function fullUsername(user) {
    const username = user?.username || "unknown";
    const discriminator = discriminatorFromId(user?.id);
    return `${username}#${discriminator}`;
  }

  function statusText(user) {
    return user?.customStatus || user?.bio || "";
  }

  function userIdOf(user) {
    return user?.userId ?? user?.id ?? null;
  }

  function normalizeRelationshipStatus(raw) {
    return String(raw || "").toUpperCase() || "NONE";
  }

  function setRelationshipEntry(otherUserId, patch) {
    if (otherUserId == null) return;
    const key = String(otherUserId);
    const prev = state.friendsState[key] || { userId: Number(otherUserId) };
    state.friendsState[key] = {
      ...prev,
      ...patch,
      userId: Number(otherUserId),
    };
  }

  function removeRelationshipEntry(otherUserId) {
    if (otherUserId == null) return;
    const key = String(otherUserId);
    if (Object.prototype.hasOwnProperty.call(state.friendsState, key)) {
      delete state.friendsState[key];
    }
  }

  function rebuildFriendsStateFromSnapshots() {
    state.friendsState = {};

    // Friends
    (state.friends || []).forEach((f) => {
      const id = userIdOf(f);
      if (id == null) return;
      setRelationshipEntry(id, {
        username: f.username,
        displayName: f.displayName,
        avatarUrl: f.avatarUrl,
        relationshipStatus: "FRIEND",
        requestId: null,
      });
    });

    // Blocked
    (state.blocked || []).forEach((u) => {
      const id = userIdOf(u);
      if (id == null) return;
      setRelationshipEntry(id, {
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        relationshipStatus: "BLOCKED",
        requestId: null,
      });
    });

    // Pending requests (both directions)
    (state.requests || []).forEach((r) => {
      const isSentByMe =
        state.currentUser && r.senderUsername === state.currentUser.username;
      const otherId = isSentByMe ? r.receiverId : r.senderId;
      if (otherId == null) return;
      setRelationshipEntry(otherId, {
        username: isSentByMe ? r.receiverUsername : r.senderUsername,
        displayName: isSentByMe ? r.receiverDisplayName : r.senderDisplayName,
        avatarUrl: isSentByMe ? r.receiverAvatarUrl : r.senderAvatarUrl,
        relationshipStatus: isSentByMe
          ? "OUTGOING_REQUEST"
          : "INCOMING_REQUEST",
        requestId: r.id,
      });
    });
  }

  function listRelationshipsByStatus(statuses) {
    const wanted = new Set(
      (statuses || []).map((s) => normalizeRelationshipStatus(s))
    );
    return Object.values(state.friendsState || {})
      .filter((e) =>
        wanted.has(normalizeRelationshipStatus(e.relationshipStatus))
      )
      .filter((e) => e && e.userId != null);
  }

  function isOnline(user) {
    const id = userIdOf(user);
    const store = window.CoCoCordPresence;
    if (store && typeof store.isOnline === "function" && id != null) {
      const v = store.isOnline(id);
      if (typeof v === "boolean") return v;
    }
    const s = user?.status;
    return String(s || "").toUpperCase() === "ONLINE";
  }

  function onlineStatusOfUserId(userId, fallbackStatus) {
    const store = window.CoCoCordPresence;
    const s =
      store && typeof store.getStatus === "function"
        ? store.getStatus(userId)
        : null;
    return String(s || fallbackStatus || "").toUpperCase();
  }

  function updatePresenceDotsForUserId(userId) {
    const id = String(userId);
    const store = window.CoCoCordPresence;
    const online =
      store && typeof store.isOnline === "function" ? store.isOnline(id) : null;
    if (typeof online !== "boolean") return;

    // DM sidebar dots
    document
      .querySelectorAll(`.dm-row[data-user-id="${CSS.escape(id)}"] .status-dot`)
      .forEach((dot) => {
        dot.classList.toggle("online", online);
      });

    // Friends list dots
    document
      .querySelectorAll(
        `.friend-row[data-user-id="${CSS.escape(id)}"] .status-dot`
      )
      .forEach((dot) => {
        dot.classList.toggle("online", online);
      });
  }

  function getCallRoomId() {
    return state.activeDmGroupId ? String(state.activeDmGroupId) : null;
  }

  function getActiveDmTargetUserId() {
    const fromActive = state.activeDmUser?.userId || state.activeDmUser?.id;
    if (fromActive) return fromActive;
    if (state.activeDmGroupId) {
      const dmItem = state.dmItems.find(
        (it) => String(it.dmGroupId) === String(state.activeDmGroupId)
      );
      return dmItem?.userId || dmItem?.id || null;
    }
    return null;
  }

  function otherUserName() {
    const u = state.activeDmUser;
    return u?.displayName || u?.username || "Unknown";
  }

  function showCallOverlay({
    video,
    title,
    showPrompt = false,
    promptText = "",
    showAccept = false,
    showDecline = false,
  } = {}) {
    const overlay = callEls.overlay();
    if (!overlay) return;

    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");

    const t = callEls.title();
    if (t && title) t.textContent = title;

    const prompt = callEls.prompt();
    const pt = callEls.promptText();
    if (prompt) prompt.style.display = showPrompt ? "flex" : "none";
    if (pt) pt.textContent = promptText || "";

    const acceptBtn = callEls.acceptBtn();
    const declineBtn = callEls.declineBtn();
    if (acceptBtn) acceptBtn.style.display = showAccept ? "" : "none";
    if (declineBtn) declineBtn.style.display = showDecline ? "" : "none";

    const localVideo = callEls.localVideo();
    const remoteVideo = callEls.remoteVideo();
    if (localVideo) localVideo.style.display = video ? "" : "none";
    if (remoteVideo) remoteVideo.style.display = video ? "" : "none";
  }

  function hideCallOverlay() {
    const overlay = callEls.overlay();
    if (!overlay) return;
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
  }

  function attachStreamToVideo(videoEl, stream, { muted = false } = {}) {
    if (!videoEl || !stream) return;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.muted = !!muted;
    videoEl.srcObject = stream;
    videoEl.onloadedmetadata = () => {
      Promise.resolve(videoEl.play()).catch(() => {
        /* ignore */
      });
    };
  }

  function attachStreamToAudio(audioEl, stream) {
    if (!audioEl || !stream) return;
    audioEl.autoplay = true;
    audioEl.srcObject = stream;
    Promise.resolve(audioEl.play()).catch(() => {
      /* ignore */
    });
  }

  function stopStream(stream) {
    if (!stream) return;
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch (_) {
      /* ignore */
    }
  }

  function sendCallSignal(payload) {
    if (!stompClient || !stompClient.connected) return;
    try {
      stompClient.send("/app/call.signal", {}, JSON.stringify(payload));
    } catch (_) {
      /* ignore */
    }
  }

  function createPeerConnection() {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (e) => {
      if (!e.candidate || !call.roomId) return;
      sendCallSignal({
        roomId: call.roomId,
        type: "ICE",
        candidate: e.candidate.candidate,
        sdpMid: e.candidate.sdpMid,
        sdpMLineIndex: e.candidate.sdpMLineIndex,
        video: call.video,
      });
    };

    pc.ontrack = (e) => {
      if (!call.remoteStream) {
        call.remoteStream = new MediaStream();
      }
      call.remoteStream.addTrack(e.track);
      attachStreamToAudio(callEls.remoteAudio(), call.remoteStream);

      const hasVideo = call.remoteStream.getVideoTracks().length > 0;
      if (call.video && hasVideo) {
        attachStreamToVideo(callEls.remoteVideo(), call.remoteStream, {
          muted: false,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "failed" || s === "closed" || s === "disconnected") {
        endCall({ sendHangup: false });
      }
    };

    return pc;
  }

  async function ensureLocalMedia(video) {
    if (call.localStream) return call.localStream;

    call.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });

    if (video) {
      attachStreamToVideo(callEls.localVideo(), call.localStream, {
        muted: true,
      });
    }

    return call.localStream;
  }

  function resetCallState() {
    call.active = false;
    call.roomId = null;
    call.isCaller = false;
    call.video = false;
    call.incomingPending = false;
    call.incomingFrom = null;
    call.incomingVideo = false;
    call.pendingOfferSdp = null;
    call.pendingCandidates = [];

    call.callId = null;
    call.connectedAtMs = null;
    call.loggedCall = false;
  }

  function newCallId() {
    try {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        return crypto.randomUUID();
      }
    } catch (_) {
      /* ignore */
    }
    return "call_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  async function logCallToTimeline({
    dmGroupId,
    callId,
    video,
    durationSeconds,
  }) {
    if (!dmGroupId || !callId) return;
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return;
    await apiJson(
      `/api/direct-messages/${encodeURIComponent(dmGroupId)}/call-log`,
      {
        method: "POST",
        body: JSON.stringify({
          callId,
          video: !!video,
          durationSeconds: Math.max(1, Math.floor(durationSeconds)),
        }),
      }
    );
  }

  function endCall({ sendHangup } = { sendHangup: true }) {
    if (!call.active && !call.incomingPending) {
      hideCallOverlay();
      return;
    }

    // Best-effort: write a Discord-like call log row into the DM timeline.
    // Both sides may attempt; backend dedupes by callId.
    if (
      call.active &&
      call.callId &&
      call.connectedAtMs &&
      !call.loggedCall &&
      call.roomId
    ) {
      call.loggedCall = true;
      const durationSeconds = Math.round(
        (Date.now() - call.connectedAtMs) / 1000
      );
      void logCallToTimeline({
        dmGroupId: call.roomId,
        callId: call.callId,
        video: call.video,
        durationSeconds,
      });
    }

    if (sendHangup && call.roomId) {
      sendCallSignal({
        roomId: call.roomId,
        type: "HANGUP",
        video: call.video,
      });
    }

    try {
      if (call.pc) {
        call.pc.onicecandidate = null;
        call.pc.ontrack = null;
        call.pc.close();
      }
    } catch (_) {
      /* ignore */
    }

    stopStream(call.localStream);
    stopStream(call.remoteStream);

    call.pc = null;
    call.localStream = null;
    call.remoteStream = null;

    const lv = callEls.localVideo();
    const rv = callEls.remoteVideo();
    const ra = callEls.remoteAudio();
    if (lv) lv.srcObject = null;
    if (rv) rv.srcObject = null;
    if (ra) ra.srcObject = null;

    resetCallState();
    hideCallOverlay();
  }

  async function acceptIncomingCall() {
    if (!call.incomingPending || !call.roomId) return;
    call.incomingPending = false;
    sendCallSignal({
      roomId: call.roomId,
      type: "CALL_ACCEPT",
      video: call.video,
    });

    const typeLabel = call.video ? "Video Call" : "Voice Call";
    showCallOverlay({
      video: call.video,
      title: `Đang kết nối: ${otherUserName()} • ${typeLabel}`,
      showPrompt: true,
      promptText: "Đang thiết lập kết nối…",
      showAccept: false,
      showDecline: false,
    });

    call.pc = createPeerConnection();
    const stream = await ensureLocalMedia(call.video);
    stream.getTracks().forEach((t) => call.pc.addTrack(t, stream));

    // If offer already arrived, handle it now
    if (call.pendingOfferSdp) {
      await handleRemoteOffer(call.pendingOfferSdp);
      call.pendingOfferSdp = null;
    }

    // Flush queued ICE
    if (call.pendingCandidates.length) {
      const queued = call.pendingCandidates.slice();
      call.pendingCandidates = [];
      for (const c of queued) {
        try {
          await call.pc.addIceCandidate(c);
        } catch (_) {
          /* ignore */
        }
      }
    }
  }

  function declineIncomingCall() {
    if (!call.incomingPending || !call.roomId) {
      endCall({ sendHangup: false });
      return;
    }
    sendCallSignal({
      roomId: call.roomId,
      type: "CALL_DECLINE",
      video: call.video,
    });
    endCall({ sendHangup: false });
  }

  async function startOutgoingCall({ video }) {
    const roomId = getCallRoomId();
    if (!roomId || !stompClient || !stompClient.connected) return;
    if (call.active || call.incomingPending) return;

    call.active = true;
    call.roomId = roomId;
    call.isCaller = true;
    call.video = !!video;
    call.callId = newCallId();
    call.connectedAtMs = null;
    call.loggedCall = false;

    const typeLabel = call.video ? "Video Call" : "Voice Call";
    showCallOverlay({
      video: call.video,
      title: `Đang gọi: ${otherUserName()} • ${typeLabel}`,
      showPrompt: true,
      promptText: "Đang chờ đối phương chấp nhận…",
      showAccept: false,
      showDecline: false,
    });

    // Send invite first; only open devices after callee accepts.
    // Include targetUserId so backend can notify callee even if they haven't opened DM chat.
    const targetUserId = getActiveDmTargetUserId();
    sendCallSignal({
      roomId: call.roomId,
      type: "CALL_START",
      video: call.video,
      targetUserId,
      callId: call.callId,
    });
  }

  async function beginCallerNegotiation() {
    if (!call.active || !call.isCaller || !call.roomId) return;
    if (call.pc) return;

    const typeLabel = call.video ? "Video Call" : "Voice Call";
    showCallOverlay({
      video: call.video,
      title: `Đang kết nối: ${otherUserName()} • ${typeLabel}`,
      showPrompt: true,
      promptText: "Đang thiết lập kết nối…",
      showAccept: false,
      showDecline: false,
    });

    call.pc = createPeerConnection();
    const stream = await ensureLocalMedia(call.video);
    stream.getTracks().forEach((t) => call.pc.addTrack(t, stream));

    const offer = await call.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: call.video,
    });
    await call.pc.setLocalDescription(offer);
    sendCallSignal({
      roomId: call.roomId,
      type: "OFFER",
      sdp: offer.sdp,
      video: call.video,
    });
  }

  async function handleRemoteOffer(sdp) {
    if (!call.pc || !sdp) return;
    await call.pc.setRemoteDescription({ type: "offer", sdp });
    const answer = await call.pc.createAnswer();
    await call.pc.setLocalDescription(answer);
    sendCallSignal({
      roomId: call.roomId,
      type: "ANSWER",
      sdp: answer.sdp,
      video: call.video,
    });

    if (!call.connectedAtMs) {
      call.connectedAtMs = Date.now();
    }

    // Once we have SDP exchange, hide the prompt
    showCallOverlay({
      video: call.video,
      title: `${otherUserName()} • ${call.video ? "Video Call" : "Voice Call"}`,
      showPrompt: false,
      showAccept: false,
      showDecline: false,
    });
  }

  // Handle incoming call from global subscription (when DM not opened yet)
  async function handleGlobalIncomingCall(evt) {
    if (!evt || evt.type !== "CALL_START") return;
    if (call.active || call.incomingPending) return;

    const selfId = state.currentUser?.id;
    if (selfId && evt.fromUserId && String(evt.fromUserId) === String(selfId))
      return;

    // Auto-open the DM chat if not already open
    const incomingRoomId = evt.roomId;
    if (!incomingRoomId) return;

    // If DM is already open to this room, route through the same handler so we
    // still show the accept/decline UI even if the per-room call subscription
    // isn't active for some reason.
    if (
      state.activeDmGroupId &&
      String(state.activeDmGroupId) === String(incomingRoomId)
    ) {
      await handleCallSignal(evt);
      return;
    }

    // Find the DM item matching this roomId
    const dmItem = state.dmItems.find(
      (dm) => String(dm.dmGroupId) === String(incomingRoomId)
    );
    if (dmItem) {
      // Open the DM chat first
      await openDmChat(incomingRoomId, dmItem);
    }

    // Now set up the incoming call state
    call.active = true;
    call.roomId = String(incomingRoomId);
    call.isCaller = false;
    call.video = !!evt.video;
    call.callId = evt.callId || call.callId || newCallId();
    call.connectedAtMs = null;
    call.loggedCall = false;
    call.incomingPending = true;
    call.incomingFrom = evt.fromUsername || null;
    call.incomingVideo = !!evt.video;

    const typeLabel = call.video ? "Video Call" : "Voice Call";
    const callerName =
      evt.fromUsername || dmItem?.displayName || dmItem?.username || "Unknown";
    showCallOverlay({
      video: call.video,
      title: `Cuộc gọi đến: ${callerName} • ${typeLabel}`,
      showPrompt: true,
      promptText: "Chọn Chấp nhận hoặc Từ chối để tiếp tục.",
      showAccept: true,
      showDecline: true,
    });
  }

  async function handleCallSignal(evt) {
    if (!evt || !evt.type) return;

    const roomId = getCallRoomId();
    if (!roomId || String(evt.roomId) !== String(roomId)) return;

    const selfId = state.currentUser?.id;
    if (selfId && evt.fromUserId && String(evt.fromUserId) === String(selfId))
      return;

    switch (evt.type) {
      case "CALL_START": {
        if (call.active || call.incomingPending) return;

        call.active = true;
        call.roomId = roomId;
        call.isCaller = false;
        call.video = !!evt.video;
        call.callId = evt.callId || call.callId || newCallId();
        call.connectedAtMs = null;
        call.loggedCall = false;
        call.incomingPending = true;
        call.incomingFrom = evt.fromUsername || null;
        call.incomingVideo = !!evt.video;

        const typeLabel = call.video ? "Video Call" : "Voice Call";
        showCallOverlay({
          video: call.video,
          title: `Cuộc gọi đến: ${otherUserName()} • ${typeLabel}`,
          showPrompt: true,
          promptText: "Chọn Chấp nhận hoặc Từ chối để tiếp tục.",
          showAccept: true,
          showDecline: true,
        });
        break;
      }
      case "CALL_ACCEPT": {
        if (!call.active || !call.isCaller) return;
        await beginCallerNegotiation();
        break;
      }
      case "CALL_DECLINE": {
        if (!call.active || !call.isCaller) return;
        endCall({ sendHangup: false });
        if (window.ToastManager) {
          ToastManager.info("Đối phương đã từ chối cuộc gọi");
        } else {
          alert("Đối phương đã từ chối cuộc gọi");
        }
        break;
      }
      case "OFFER": {
        // Callee receives offer only after accepting, but be defensive.
        if (!call.active) {
          call.active = true;
          call.roomId = roomId;
          call.isCaller = false;
          call.video = !!evt.video;
          call.incomingPending = true;
          showCallOverlay({
            video: call.video,
            title: `Cuộc gọi đến: ${otherUserName()} • ${
              call.video ? "Video Call" : "Voice Call"
            }`,
            showPrompt: true,
            promptText: "Chọn Chấp nhận hoặc Từ chối để tiếp tục.",
            showAccept: true,
            showDecline: true,
          });
        }

        if (call.incomingPending) {
          call.pendingOfferSdp = evt.sdp || null;
          return;
        }

        if (!call.pc) {
          call.pc = createPeerConnection();
          const stream = await ensureLocalMedia(!!evt.video);
          stream.getTracks().forEach((t) => call.pc.addTrack(t, stream));
        }

        await handleRemoteOffer(evt.sdp);
        break;
      }
      case "ANSWER": {
        if (!call.pc || !evt.sdp) return;
        await call.pc.setRemoteDescription({ type: "answer", sdp: evt.sdp });

        if (!call.connectedAtMs) {
          call.connectedAtMs = Date.now();
        }
        // Once connected, hide prompt
        showCallOverlay({
          video: call.video,
          title: `${otherUserName()} • ${
            call.video ? "Video Call" : "Voice Call"
          }`,
          showPrompt: false,
          showAccept: false,
          showDecline: false,
        });
        break;
      }
      case "ICE": {
        if (!evt.candidate) return;
        const ice = {
          candidate: evt.candidate,
          sdpMid: evt.sdpMid,
          sdpMLineIndex: evt.sdpMLineIndex,
        };

        if (!call.pc) {
          call.pendingCandidates.push(ice);
          return;
        }

        try {
          await call.pc.addIceCandidate(ice);
        } catch (_) {
          /* ignore */
        }
        break;
      }
      case "HANGUP": {
        endCall({ sendHangup: false });
        break;
      }
    }
  }

  async function apiJson(url, options = {}) {
    const token = localStorage.getItem("accessToken");
    const headers = {
      ...options.headers,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Only set JSON content type when we send a body.
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, { ...options, headers });
    if (!response) throw new Error("Không thể kết nối tới máy chủ");
    if (response.status === 204) return null;

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        return null;
      }

      const contentType = (
        response.headers.get("content-type") || ""
      ).toLowerCase();
      let payload = null;
      let text = "";

      if (contentType.includes("application/json")) {
        payload = await response.json().catch(() => null);
      } else {
        text = await response.text().catch(() => "");
        payload = (() => {
          try {
            return JSON.parse(text);
          } catch (_) {
            return null;
          }
        })();
      }

      const message =
        (payload &&
          typeof payload === "object" &&
          (payload.message || payload.error)) ||
        (typeof payload === "string" ? payload : "") ||
        (text && text.trim().startsWith("{") ? "" : text) ||
        `Request failed: ${response.status}`;

      throw new Error(
        String(message).trim() || "Có lỗi xảy ra. Vui lòng thử lại sau."
      );
    }

    const okContentType = (
      response.headers.get("content-type") || ""
    ).toLowerCase();
    if (okContentType.includes("application/json")) {
      return response.json();
    }
    return null;
  }

  async function loadCurrentUser() {
    // Prefer the cached user from global app shell (app.js)
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      if (cached && cached.id) {
        state.currentUser = cached;
        return;
      }
    } catch (_) {
      // ignore
    }

    state.currentUser = await apiJson("/api/auth/me", { method: "GET" });
    try {
      localStorage.setItem("user", JSON.stringify(state.currentUser || {}));
    } catch (_) {
      // ignore
    }
  }

  async function loadFriends() {
    state.friends = (await apiJson("/api/friends", { method: "GET" })) || [];
    
    // Hide friends list skeleton after loading
    const friendsSkeleton = document.getElementById('friendsListSkeleton');
    if (friendsSkeleton) {
      friendsSkeleton.style.opacity = '0';
      setTimeout(() => friendsSkeleton.style.display = 'none', 300);
    }
  }

  async function loadRequests() {
    state.requests =
      (await apiJson("/api/friends/requests", { method: "GET" })) || [];
  }

  async function loadBlocked() {
    state.blocked =
      (await apiJson("/api/friends/blocked", { method: "GET" })) || [];
  }

  async function loadDmSidebar() {
    state.dmItems =
      (await apiJson("/api/direct-messages/sidebar", { method: "GET" })) || [];
    
    // Hide DM list skeleton after loading
    const dmSkeleton = document.getElementById('dmListSkeleton');
    if (dmSkeleton) {
      dmSkeleton.style.opacity = '0';
      setTimeout(() => dmSkeleton.style.display = 'none', 300);
    }
  }

  function emptyState(message) {
    return `<div style="padding: 24px; color: var(--text-muted);">${escapeHtml(
      message
    )}</div>`;
  }

  function renderDmList() {
    const container = els.dmList();
    if (!container) return;

    const q = state.dmSearch.trim().toLowerCase();
    const items = (state.dmItems || [])
      .filter((it) => {
        if (!q) return true;
        const key = `${it.displayName || ""} ${
          it.username || ""
        }`.toLowerCase();
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
          : `<span>${escapeHtml(
              (it.displayName || it.username || "U").charAt(0).toUpperCase()
            )}</span>`;
        const unread = Number(it.unreadCount || 0);
        const unreadText = unread > 99 ? "99+" : String(unread);
        return `
                    <div class="dm-row" role="listitem" data-dm-group-id="${escapeHtml(
                      it.dmGroupId
                    )}" data-user-id="${escapeHtml(it.userId)}">
                        <div class="avatar">${avatar}<span class="status-dot ${
          isOnline(it) ? "online" : ""
        }"></span></div>
                        <span class="dm-name">${escapeHtml(
                          it.displayName || it.username || "Unknown"
                        )}</span>
                        <div class="dm-right">
                            <span class="unread-pill ${
                              unread > 0 ? "show" : ""
                            }">${escapeHtml(unreadText)}</span>
                        </div>
                    </div>
                `;
      })
      .join("");

    container.querySelectorAll(".dm-row").forEach((row) => {
      row.addEventListener("click", () => {
        const dmGroupId = row.getAttribute("data-dm-group-id");
        const userId = row.getAttribute("data-user-id");
        if (dmGroupId) {
          // Load DM chat inline instead of redirecting
          const dmItem = state.dmItems.find(
            (it) => String(it.dmGroupId) === String(dmGroupId)
          );
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
    if (state.activeTab === "pending") {
      renderPendingRequests();
      return;
    }
    if (state.activeTab === "blocked") {
      renderBlockedUsers();
      return;
    }

    let list = listRelationshipsByStatus(["FRIEND"]);

    // Never show self in friends list (defensive).
    const me = state.currentUser?.id;
    if (me != null) {
      list = list.filter((f) => String(userIdOf(f)) !== String(me));
    }

    if (state.activeTab === "online") {
      list = list.filter((f) => {
        const status = onlineStatusOfUserId(userIdOf(f), f?.status);
        return (
          status === "ONLINE" ||
          status === "IDLE" ||
          status === "DO_NOT_DISTURB"
        );
      });
    }
    // 'all' tab shows all friends regardless of status

    if (q) {
      list = list.filter((f) => {
        const key = `${displayName(f)} ${f.username || ""} ${statusText(
          f
        )}`.toLowerCase();
        return key.includes(q);
      });
    }

    if (!list.length) {
      const emptyMsg =
        state.activeTab === "online"
          ? "Không có bạn bè nào trực tuyến"
          : listRelationshipsByStatus(["FRIEND"]).length === 0
          ? "Bạn chưa có bạn bè nào"
          : "Không tìm thấy bạn bè";
      container.innerHTML = emptyState(emptyMsg);
      return;
    }

    const headerText =
      state.activeTab === "online" ? "TRỰC TUYẾN" : "TẤT CẢ BẠN BÈ";

    container.innerHTML = `
            <div class="friend-group-header">${headerText} — ${
      list.length
    }</div>
            ${list
              .map((f) => {
                const friendId = userIdOf(f);
                const avatar = f.avatarUrl
                  ? `<img src="${escapeHtml(f.avatarUrl)}" alt="">`
                  : `<span>${escapeHtml(
                      displayName(f).charAt(0).toUpperCase()
                    )}</span>`;
                const subtitle =
                  statusText(f) || (isOnline(f) ? "Đang trực tuyến" : "");
                return `
                        <div class="friend-row" data-user-id="${escapeHtml(
                          friendId
                        )}">
                            <div class="friend-left">
                                <div class="avatar">${avatar}<span class="status-dot ${
                  isOnline(f) ? "online" : ""
                }"></span></div>
                                <div class="friend-meta">
                                    <div class="friend-title">${escapeHtml(
                                      displayName(f)
                                    )}</div>
                                    <div class="friend-subtitle">${escapeHtml(
                                      subtitle
                                    )}</div>
                                </div>
                            </div>
                            <div class="friend-actions">
                                <button class="icon-btn" type="button" title="Nhắn tin" data-action="chat" data-user-id="${escapeHtml(
                                  friendId
                                )}"><i class="bi bi-chat-fill"></i></button>
                                <button class="icon-btn" type="button" title="Thêm" data-action="more" data-user-id="${escapeHtml(
                                  friendId
                                )}"><i class="bi bi-three-dots-vertical"></i></button>
                            </div>
                        </div>
                    `;
              })
              .join("")}
        `;

    container.querySelectorAll('button[data-action="chat"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const userId = btn.getAttribute("data-user-id");
        if (userId) openDM(userId);
      });
    });

    container.querySelectorAll('button[data-action="more"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const userId = btn.getAttribute("data-user-id");
        const friend = state.friendsState[String(userId)] || null;
        if (friend) showFriendContextMenu(e, friend);
      });
    });

    container.querySelectorAll(".friend-row").forEach((row) => {
      row.addEventListener("click", () => {
        const userId = row.getAttribute("data-user-id");
        if (userId) openDM(userId);
      });
      // Right-click context menu
      row.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const userId = row.getAttribute("data-user-id");
        const friend = state.friendsState[String(userId)] || null;
        if (friend) showFriendContextMenu(e, friend);
      });
    });
  }

  function renderPendingRequests() {
    const container = els.friendsList();
    if (!container) return;

    const q = state.friendsSearch.trim().toLowerCase();
    const requests = listRelationshipsByStatus([
      "INCOMING_REQUEST",
      "OUTGOING_REQUEST",
    ]);

    const filtered = q
      ? requests.filter((r) => {
          const key = `${r.username || ""} ${r.displayName || ""} ${
            r.relationshipStatus || ""
          }`.toLowerCase();
          return key.includes(q);
        })
      : requests;

    if (!filtered.length) {
      container.innerHTML = emptyState("Không có lời mời kết bạn đang chờ");
      return;
    }

    container.innerHTML = `
            <div class="friend-group-header">ĐANG CHỜ — ${filtered.length}</div>
            ${filtered
              .map((r) => {
                const isSentByMe =
                  normalizeRelationshipStatus(r.relationshipStatus) ===
                  "OUTGOING_REQUEST";
                const name = r.displayName || r.username || "Unknown";
                const subtitle = isSentByMe
                  ? "Đã gửi yêu cầu"
                  : "Yêu cầu kết bạn";
                const reqId = r.requestId;

                return `
                        <div class="friend-row" data-request-id="${escapeHtml(
                          reqId
                        )}">
                            <div class="friend-left">
                                <div class="avatar"><span>${escapeHtml(
                                  String(name).charAt(0).toUpperCase()
                                )}</span></div>
                                <div class="friend-meta">
                                    <div class="friend-title">${escapeHtml(
                                      name
                                    )}</div>
                                    <div class="friend-subtitle">${escapeHtml(
                                      subtitle
                                    )}</div>
                                </div>
                            </div>
                            <div class="friend-actions">
                                ${
                                  isSentByMe
                                    ? `<button class="icon-btn" type="button" title="Hủy" data-action="cancel" data-request-id="${escapeHtml(
                                        reqId
                                      )}"><i class="bi bi-x-lg"></i></button>`
                                    : `
                                        <button class="icon-btn" type="button" title="Chấp nhận" data-action="accept" data-request-id="${escapeHtml(
                                          reqId
                                        )}"><i class="bi bi-check-lg"></i></button>
                                        <button class="icon-btn" type="button" title="Từ chối" data-action="decline" data-request-id="${escapeHtml(
                                          reqId
                                        )}"><i class="bi bi-x-lg"></i></button>
                                      `
                                }
                            </div>
                        </div>
                    `;
              })
              .join("")}
        `;

    container.querySelectorAll("button[data-request-id]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const action = btn.getAttribute("data-action");
        const reqId = btn.getAttribute("data-request-id");
        if (!action || !reqId) return;

        // Disable button to prevent double-click
        btn.disabled = true;

        try {
          if (action === "accept")
            await apiJson(
              `/api/friends/requests/${encodeURIComponent(reqId)}/accept`,
              { method: "POST" }
            );
          if (action === "decline")
            await apiJson(
              `/api/friends/requests/${encodeURIComponent(reqId)}/decline`,
              { method: "POST" }
            );
          if (action === "cancel")
            await apiJson(
              `/api/friends/requests/${encodeURIComponent(reqId)}/cancel`,
              { method: "POST" }
            );

          // Update local state immediately (server will also broadcast realtime events).
          const entry = Object.values(state.friendsState).find(
            (x) => String(x.requestId) === String(reqId)
          );
          if (entry?.userId != null) {
            if (action === "accept") {
              setRelationshipEntry(entry.userId, {
                relationshipStatus: "FRIEND",
                requestId: null,
              });
            } else {
              removeRelationshipEntry(entry.userId);
            }
          }
          render();
        } catch (err) {
          // If request already handled, just refresh the list
          if (err?.message?.includes("already been handled")) {
            // Best-effort: remove the pending entry so UI doesn't get stuck.
            const entry = Object.values(state.friendsState).find(
              (x) => String(x.requestId) === String(reqId)
            );
            if (entry?.userId != null) removeRelationshipEntry(entry.userId);
            render();
          } else {
            if (window.ToastManager) {
              ToastManager.error(err?.message || "Thao tác thất bại");
            } else {
              alert(err?.message || "Thao tác thất bại");
            }
            btn.disabled = false;
          }
        }
      });
    });
  }

  async function openDM(userId) {
    try {
      const dmGroup = await apiJson(
        `/api/direct-messages/create-dm/${encodeURIComponent(userId)}`,
        { method: "POST" }
      );
      if (dmGroup?.id) {
        // Reload DM sidebar to get the new/updated item
        await loadDmSidebar();
        renderDmList();

        // Find the DM item for this group
        const dmItem = state.dmItems.find(
          (it) => String(it.dmGroupId) === String(dmGroup.id)
        );

        // Open DM chat inline
        openDmChat(
          dmGroup.id,
          dmItem || {
            dmGroupId: dmGroup.id,
            userId: userId,
            displayName: dmGroup.displayName,
            username: dmGroup.username,
            avatarUrl: dmGroup.avatarUrl,
          }
        );
      }
    } catch (err) {
      if (window.ToastManager) {
        ToastManager.error(err?.message || "Không thể mở DM");
      } else {
        alert(err?.message || "Không thể mở DM");
      }
    }
  }

  function renderBlockedUsers() {
    const container = els.friendsList();
    if (!container) return;

    const q = state.friendsSearch.trim().toLowerCase();
    const blocked = listRelationshipsByStatus(["BLOCKED"]);

    const filtered = q
      ? blocked.filter((u) => {
          const key = `${displayName(u)} ${u.username || ""}`.toLowerCase();
          return key.includes(q);
        })
      : blocked;

    if (!filtered.length) {
      container.innerHTML = emptyState("Không có người dùng bị chặn");
      return;
    }

    container.innerHTML = `
            <div class="friend-group-header">BỊ CHẶN — ${filtered.length}</div>
            ${filtered
              .map((u) => {
                const userId = userIdOf(u);
                const avatar = u.avatarUrl
                  ? `<img src="${escapeHtml(u.avatarUrl)}" alt="">`
                  : `<span>${escapeHtml(
                      displayName(u).charAt(0).toUpperCase()
                    )}</span>`;
                return `
                        <div class="friend-row" data-user-id="${escapeHtml(
                          userId
                        )}">
                            <div class="friend-left">
                                <div class="avatar">${avatar}</div>
                                <div class="friend-meta">
                                    <div class="friend-title">${escapeHtml(
                                      displayName(u)
                                    )}</div>
                                    <div class="friend-subtitle">Đã bị chặn</div>
                                </div>
                            </div>
                            <div class="friend-actions">
                                <button class="icon-btn" type="button" title="Bỏ chặn" data-action="unblock" data-user-id="${escapeHtml(
                                  userId
                                )}"><i class="bi bi-x-lg"></i></button>
                            </div>
                        </div>
                    `;
              })
              .join("")}
        `;

    container
      .querySelectorAll('button[data-action="unblock"]')
      .forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const userId = btn.getAttribute("data-user-id");
          if (!userId) return;
          if (!confirm("Bạn có chắc chắn muốn bỏ chặn người dùng này?")) return;
          try {
            await apiJson(
              `/api/friends/blocked/${encodeURIComponent(userId)}`,
              { method: "DELETE" }
            );
            removeRelationshipEntry(userId);
            render();
          } catch (err) {
            if (window.ToastManager) {
              ToastManager.error(err?.message || "Không thể bỏ chặn người dùng");
            } else {
              alert(err?.message || "Không thể bỏ chặn người dùng");
            }
          }
        });
      });
  }

  function showFriendContextMenu(e, friend) {
    closeContextMenu();

    const friendId = userIdOf(friend);
    if (friendId == null) return;

    const menu = document.createElement("div");
    menu.className = "friend-context-menu";
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
    menu.style.left = x + "px";
    menu.style.top = y + "px";

    document.body.appendChild(menu);

    menu.querySelectorAll(".context-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const action = item.getAttribute("data-action");
        closeContextMenu();

        if (action === "dm") {
          openDM(friendId);
        } else if (action === "profile") {
          if (window.CoCoCordUserProfileModal?.show) {
            window.CoCoCordUserProfileModal.show(friendId);
          }
        } else if (action === "remove") {
          if (
            !confirm(
              `Bạn có chắc chắn muốn xóa ${displayName(
                friend
              )} khỏi danh sách bạn bè?`
            )
          )
            return;
          try {
            await apiJson(`/api/friends/${encodeURIComponent(friendId)}`, {
              method: "DELETE",
            });
            removeRelationshipEntry(friendId);
            render();
          } catch (err) {
            if (window.ToastManager) {
              ToastManager.error(err?.message || "Không thể xóa bạn bè");
            } else {
              alert(err?.message || "Không thể xóa bạn bè");
            }
          }
        } else if (action === "block") {
          if (!confirm(`Bạn có chắc chắn muốn chặn ${displayName(friend)}?`))
            return;
          try {
            await apiJson(
              `/api/friends/blocked/${encodeURIComponent(friendId)}`,
              { method: "POST" }
            );
            setRelationshipEntry(friendId, {
              relationshipStatus: "BLOCKED",
              requestId: null,
            });
            render();
          } catch (err) {
            if (window.ToastManager) {
              ToastManager.error(err?.message || "Không thể chặn người dùng");
            } else {
              alert(err?.message || "Không thể chặn người dùng");
            }
          }
        }
      });
    });

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener("click", closeContextMenuOnClick);
      document.addEventListener("contextmenu", closeContextMenuOnClick);
    }, 0);
  }

  function closeContextMenu() {
    document
      .querySelectorAll(".friend-context-menu")
      .forEach((m) => m.remove());
    document.removeEventListener("click", closeContextMenuOnClick);
    document.removeEventListener("contextmenu", closeContextMenuOnClick);
  }

  function closeContextMenuOnClick(e) {
    if (!e.target.closest(".friend-context-menu")) {
      closeContextMenu();
    }
  }

  function setActiveTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll(".tab").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    hideAddFriendView();
    render();
  }

  function showAddFriendView() {
    const list = els.friendsList();
    const view = els.addFriendView();
    const toolbar = els.toolbar();
    if (list) list.style.display = "none";
    if (view) view.style.display = "block";
    if (toolbar) toolbar.style.display = "none";
    const hint = els.addFriendHint();
    if (hint) {
      hint.textContent = "";
      hint.className = "add-friend-hint";
    }
    setTimeout(() => els.addFriendInput()?.focus(), 0);
  }

  function hideAddFriendView() {
    const list = els.friendsList();
    const view = els.addFriendView();
    const toolbar = els.toolbar();
    if (list) list.style.display = "block";
    if (view) view.style.display = "none";
    if (toolbar) toolbar.style.display = "block";
  }

  async function sendFriendRequest() {
    const input = els.addFriendInput();
    const hint = els.addFriendHint();
    const btn =
      els.sendFriendRequestBtn?.() ||
      document.getElementById("sendFriendRequestBtn");
    const value = (input?.value || "").trim();

    if (hint) {
      hint.textContent = "";
      hint.className = "add-friend-hint";
    }

    if (!value) return;

    try {
      if (btn) {
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
      }
      const results = await apiJson(
        `/api/users/search?query=${encodeURIComponent(value)}`,
        { method: "GET" }
      );
      const users = Array.isArray(results) ? results : [];
      const exact =
        users.find(
          (u) => String(u.username || "").toLowerCase() === value.toLowerCase()
        ) ||
        users.find(
          (u) => String(u.email || "").toLowerCase() === value.toLowerCase()
        );

      const target = exact || (users.length === 1 ? users[0] : null);
      if (!target?.id) {
        if (hint) {
          hint.textContent = users.length
            ? "Có nhiều kết quả. Hãy nhập chính xác username."
            : "Không tìm thấy người dùng.";
          hint.className = "add-friend-hint error";
        }
        return;
      }

      const created = await apiJson("/api/friends/requests", {
        method: "POST",
        body: JSON.stringify({ receiverUserId: target.id }),
      });

      // Update local relationship state immediately.
      if (created?.id) {
        setRelationshipEntry(target.id, {
          username: target.username,
          displayName: target.displayName,
          avatarUrl: target.avatarUrl,
          relationshipStatus: "OUTGOING_REQUEST",
          requestId: created.id,
        });
      }

      // Show success feedback briefly before switching tab
      if (hint) {
        hint.textContent = `Đã gửi lời mời kết bạn tới ${
          target.displayName || target.username
        }!`;
        hint.className = "add-friend-hint success";
      }
      if (input) input.value = "";

      // Wait a bit for user to see the success message, then switch tab
      setTimeout(() => setActiveTab("pending"), 1500);
    } catch (err) {
      if (hint) {
        hint.textContent = err?.message || "Gửi lời mời thất bại";
        hint.className = "add-friend-hint error";
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
      }
    }
  }

  // ===== DM Chat Functions =====

  async function openDmChat(dmGroupId, dmItem) {
    state.activeDmGroupId = dmGroupId;
    state.activeDmUser = dmItem || null;
    state.activeView = "dm";
    state.dmMessages = [];

    // Show DM chat area, hide friends view
    const mainArea = els.mainArea();
    const dmChatArea = els.dmChatArea();
    const topBar = els.topBar();

    if (mainArea) mainArea.style.display = "none";
    if (topBar) topBar.style.display = "none";
    if (dmChatArea) dmChatArea.style.display = "flex";

    // Update header
    const title = els.dmChatTitle();
    const startAvatar = els.dmStartAvatar();
    const startName = els.dmStartName();
    const startInfo = els.dmStartInfo();
    const msgInput = els.dmMessageInput();

    const userName = dmItem?.displayName || dmItem?.username || "Unknown";

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
    document.querySelectorAll(".dm-row").forEach((row) => {
      row.classList.toggle(
        "active",
        row.getAttribute("data-dm-group-id") === String(dmGroupId)
      );
    });

    // Update URL without reload
    const newUrl = `/app?dmGroupId=${encodeURIComponent(dmGroupId)}`;
    history.pushState({ dmGroupId }, "", newUrl);

    // Load messages
    await loadDmMessages();

    // Connect WebSocket for real-time
    connectDmWebSocket();

    // Initialize ChatInputManager for file/GIF/sticker/emoji buttons
    initChatInputManager();

    // Focus input
    setTimeout(() => els.dmMessageInput()?.focus(), 100);
  }

  function closeDmChat() {
    state.activeDmGroupId = null;
    state.activeDmUser = null;
    state.activeView = "friends";
    state.dmMessages = [];

    // Disconnect WebSocket
    disconnectDmWebSocket();

    // Show friends view, hide DM chat
    const mainArea = els.mainArea();
    const dmChatArea = els.dmChatArea();
    const topBar = els.topBar();

    if (mainArea) mainArea.style.display = "flex";
    if (topBar) topBar.style.display = "flex";
    if (dmChatArea) dmChatArea.style.display = "none";

    // Remove active highlight
    document
      .querySelectorAll(".dm-row.active")
      .forEach((row) => row.classList.remove("active"));

    // Update URL
    history.pushState({}, "", "/app");
  }

  async function loadDmMessages() {
    if (!state.activeDmGroupId) return;
    try {
      const response = await apiJson(
        `/api/direct-messages/${encodeURIComponent(
          state.activeDmGroupId
        )}/messages?page=0&size=50`,
        { method: "GET" }
      );
      // API returns Page object with content array
      const messages = response?.content || response || [];
      state.dmMessages = Array.isArray(messages) ? messages.reverse() : [];
      renderDmMessages();
    } catch (err) {
      state.dmMessages = [];
      renderDmMessages();
    }
  }

  function renderDmMessages() {
    const container = els.dmMessagesList();
    if (!container) return;

    if (!state.dmMessages.length) {
      container.innerHTML = "";
      return;
    }

    const currentUserId = state.currentUser?.id;

    let lastDateKey = null;
    const parts = [];

    for (const msg of state.dmMessages) {
      const createdAt = msg?.createdAt;
      const dateKey = messageDateKey(createdAt);
      if (dateKey && dateKey !== lastDateKey) {
        lastDateKey = dateKey;
        parts.push(renderDateSeparator(createdAt));
      }

      const msgType = String(msg?.type || "TEXT").toUpperCase();
      if (msgType === "SYSTEM") {
        parts.push(renderSystemDmRow(msg));
        continue;
      }

      const avatar = msg.senderAvatarUrl
        ? `<img src="${escapeHtml(msg.senderAvatarUrl)}" alt="">`
        : `<span>${escapeHtml(
            (msg.senderDisplayName || msg.senderUsername || "U")
              .charAt(0)
              .toUpperCase()
          )}</span>`;
      const time = formatMessageTime(createdAt);
      const senderName =
        msg.senderDisplayName || msg.senderUsername || "Unknown";
      const isOwn = String(msg.senderId) === String(currentUserId);
      const isDeleted = msg.deleted === true || msg.isDeleted === true;

      // Render content based on message type
      let contentHtml;
      if (isDeleted) {
        contentHtml = `<div class="dm-message-body deleted"><i class="bi bi-slash-circle"></i> Tin nhắn đã bị xóa</div>`;
      } else {
        contentHtml = renderDmMessageContent(msg, msgType);
      }

      const actionsHtml =
        !isDeleted && isOwn
          ? `<div class="dm-message-actions">
                       <button class="msg-action-btn" type="button" title="Xóa tin nhắn" data-action="delete" data-msg-id="${escapeHtml(
                         msg.id
                       )}">
                           <i class="bi bi-trash"></i>
                       </button>
                   </div>`
          : "";

      parts.push(`
                <div class="dm-message-row ${
                  isDeleted ? "deleted" : ""
                }" data-msg-id="${escapeHtml(msg.id)}">
                    <div class="avatar">${avatar}</div>
                    <div class="dm-message-content">
                        <div class="dm-message-header">
                            <span class="dm-sender-name">${escapeHtml(
                              senderName
                            )}</span>
                            <span class="dm-message-time">${escapeHtml(
                              time
                            )}</span>
                        </div>
                        ${contentHtml}
                    </div>
                    ${actionsHtml}
                </div>
            `);
    }

    container.innerHTML = parts.join("");

    // Wire delete buttons
    container
      .querySelectorAll('.msg-action-btn[data-action="delete"]')
      .forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const msgId = btn.getAttribute("data-msg-id");
          if (!msgId) return;
          if (!confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;
          await deleteDmMessage(msgId);
        });
      });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Render DM message content based on type (TEXT, STICKER, GIF, IMAGE, FILE, etc.)
   */
  function renderDmMessageContent(msg, type) {
    const content = msg.content || '';
    let bodyHtml = '';

    switch (type) {
      case 'STICKER':
        bodyHtml = `<img src="${escapeHtml(content)}" class="message-sticker" alt="Sticker" loading="lazy" />`;
        break;

      case 'GIF':
        bodyHtml = renderGifContent(content, msg.metadata);
        break;

      case 'IMAGE':
        if (content && !msg.attachments?.length) {
          bodyHtml = `<a href="${escapeHtml(content)}" target="_blank"><img src="${escapeHtml(content)}" class="message-image" alt="Image" loading="lazy" /></a>`;
        } else {
          bodyHtml = renderTextWithMarkdown(content);
        }
        break;

      case 'VIDEO':
        if (content && content.match(/\.(mp4|webm|ogg)$/i)) {
          bodyHtml = `<video src="${escapeHtml(content)}" controls class="message-video" preload="metadata"></video>`;
        } else {
          bodyHtml = renderTextWithMarkdown(content);
        }
        break;

      case 'AUDIO':
        if (content && content.match(/\.(mp3|wav|ogg|m4a)$/i)) {
          bodyHtml = `<audio src="${escapeHtml(content)}" controls class="message-audio"></audio>`;
        } else {
          bodyHtml = renderTextWithMarkdown(content);
        }
        break;

      case 'TEXT':
      case 'FILE':
      default:
        bodyHtml = renderTextWithMarkdown(content);
        break;
    }

    // Add attachments if any
    const attachmentsHtml = renderDmAttachments(msg);

    return `<div class="dm-message-body markdown-content">${bodyHtml}${attachmentsHtml}</div>`;
  }

  /**
   * Render text with markdown support
   */
  function renderTextWithMarkdown(content) {
    if (!content || !content.trim()) return '';
    return window.CocoCordMarkdown 
      ? window.CocoCordMarkdown.render(content)
      : escapeHtml(content);
  }

  /**
   * Render GIF content - supports both .gif images and .mp4 videos
   */
  function renderGifContent(url, metadata) {
    if (!url) return '';
    
    // Parse metadata
    let gifData = null;
    if (metadata) {
      try {
        gifData = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      } catch (_) {}
    }
    
    // Check if mp4/webm (Tenor/Giphy often use video)
    const isMp4 = url.toLowerCase().includes('.mp4');
    const isWebm = url.toLowerCase().includes('.webm');
    
    if (isMp4 || isWebm) {
      return `<video src="${escapeHtml(url)}" class="message-gif" autoplay loop muted playsinline></video>`;
    } else {
      return `<img src="${escapeHtml(url)}" class="message-gif" alt="GIF" loading="lazy" />`;
    }
  }

  /**
   * Render attachments (images, files)
   */
  function renderDmAttachments(msg) {
    // Try to parse attachments from metadata if not directly available
    let attachments = msg.attachments;
    
    if (!attachments?.length && msg.metadata) {
      try {
        const meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
        attachments = meta?.files || [];
      } catch (_) {}
    }

    // Also check attachmentUrls
    if (!attachments?.length && msg.attachmentUrls?.length) {
      attachments = msg.attachmentUrls.map(url => ({
        fileUrl: url,
        fileName: url.split('/').pop(),
        fileType: guessFileType(url)
      }));
    }

    if (!attachments?.length) return '';

    let html = '<div class="message-attachments">';
    for (const att of attachments) {
      const fileUrl = escapeHtml(att.fileUrl || att.url || '');
      const fileName = escapeHtml(att.fileName || att.name || 'file');
      const fileType = att.fileType || att.type || '';

      if (fileType.startsWith('image/')) {
        html += `<div class="attachment-item"><a href="${fileUrl}" target="_blank"><img src="${fileUrl}" alt="${fileName}" class="attachment-image" loading="lazy"></a></div>`;
      } else if (fileType.startsWith('video/')) {
        html += `<div class="attachment-item"><video src="${fileUrl}" controls class="attachment-video"></video></div>`;
      } else {
        html += `<div class="attachment-item"><a href="${fileUrl}" target="_blank" class="attachment-file"><i class="bi bi-file-earmark"></i> ${fileName}</a></div>`;
      }
    }
    html += '</div>';
    return html;
  }

  /**
   * Guess file type from URL extension
   */
  function guessFileType(url) {
    if (!url) return '';
    const ext = url.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a'];
    
    if (imageExts.includes(ext)) return 'image/' + ext;
    if (videoExts.includes(ext)) return 'video/' + ext;
    if (audioExts.includes(ext)) return 'audio/' + ext;
    return 'application/octet-stream';
  }

  async function deleteDmMessage(messageId) {
    try {
      await apiJson(
        `/api/direct-messages/messages/${encodeURIComponent(messageId)}`,
        { method: "DELETE" }
      );
      // Update local state
      const msg = state.dmMessages.find((m) => m.id === messageId);
      if (msg) {
        msg.deleted = true;
        msg.content = "";
      }
      renderDmMessages();
    } catch (err) {
      if (window.ToastManager) {
        ToastManager.error(err?.message || "Không thể xóa tin nhắn");
      } else {
        alert(err?.message || "Không thể xóa tin nhắn");
      }
    }
  }

  function formatMessageTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return (
        "Hôm qua " +
        date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      );
    }

    return (
      date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function messageDateKey(timestamp) {
    if (!timestamp) return null;
    const d = new Date(timestamp);
    if (!Number.isFinite(d.getTime())) return null;
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function formatDateSeparatorLabel(timestamp) {
    const d = new Date(timestamp);
    const now = new Date();
    if (!Number.isFinite(d.getTime())) return "";

    if (d.toDateString() === now.toDateString()) return "Hôm nay";

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";

    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function renderDateSeparator(timestamp) {
    const label = formatDateSeparatorLabel(timestamp);
    return `
            <div class="dm-date-separator" role="separator" aria-label="${escapeHtml(
              label
            )}">
                <span>${escapeHtml(label)}</span>
            </div>
        `;
  }

  function renderSystemDmRow(msg) {
    const eventType = String(msg?.systemEventType || "").toUpperCase();
    let icon = "bi-info-circle";
    if (eventType === "CALL") {
      icon = msg?.callVideo ? "bi-camera-video" : "bi-telephone";
    }
    const text = msg?.content || "";
    return `
            <div class="dm-system-row" data-msg-id="${escapeHtml(
              msg?.id || ""
            )}">
                <div class="dm-system-message">
                    <i class="bi ${escapeHtml(icon)}"></i>
                    <span>${escapeHtml(text)}</span>
                </div>
            </div>
        `;
  }

  function connectDmWebSocket() {
    disconnectDmWebSocket();

    const token = localStorage.getItem("accessToken");
    if (!token || !state.activeDmGroupId) return;

    const socket = new SockJS("/ws");
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Disable debug

    stompClient.connect(
      { Authorization: "Bearer " + token },
      () => {
        dmSubscription = stompClient.subscribe(
          `/topic/dm/${state.activeDmGroupId}`,
          (message) => {
            const msg = JSON.parse(message.body);
            if (!state.dmMessages.find((m) => m.id === msg.id)) {
              state.dmMessages.push(msg);
              renderDmMessages();
            }
          }
        );

        // Call signaling for this DM
        callSubscription = stompClient.subscribe(
          `/topic/call/${state.activeDmGroupId}`,
          (message) => {
            const evt = JSON.parse(message.body);
            handleCallSignal(evt);
            
          }
        );
      },
    );
  }

  function disconnectDmWebSocket() {
    // End any active call when leaving DM view
    if (call.active || call.incomingPending) {
      endCall({ sendHangup: true });
    }

    if (callSubscription) {
      try {
        callSubscription.unsubscribe();
      } catch (_) {}
      callSubscription = null;
    }
    if (dmSubscription) {
      try {
        dmSubscription.unsubscribe();
      } catch (_) {}
      dmSubscription = null;
    }
    if (stompClient) {
      try {
        stompClient.disconnect();
      } catch (_) {}
      stompClient = null;
    }
  }

  async function sendDmMessage() {
    const input = els.dmMessageInput();
    const content = (input?.value || "").trim();
    if (!content || !state.activeDmGroupId) return;

    try {
      const message = await apiJson(
        `/api/direct-messages/${encodeURIComponent(
          state.activeDmGroupId
        )}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ 
            content,
            attachmentUrls: [],
            type: 'TEXT',
            metadata: null
          }),
        }
      );
      if (input) input.value = "";
      // Message will arrive via WebSocket, but add optimistically if not duplicate
      if (message && !state.dmMessages.find((m) => m.id === message.id)) {
        state.dmMessages.push(message);
        renderDmMessages();
      }
    } catch (err) {
      if (window.ToastManager) {
        ToastManager.error(err?.message || "Không thể gửi tin nhắn");
      } else {
        alert(err?.message || "Không thể gửi tin nhắn");
      }
    }
  }

  // ===== ChatInputManager for DM (file/sticker/GIF/emoji) =====
  let chatInputManager = null;

  function initChatInputManager() {
    if (chatInputManager) {
      try { chatInputManager.destroy(); } catch (_) {}
    }

    if (typeof ChatInputManager === 'undefined') {
      console.warn('[AppHome] ChatInputManager not loaded');
      return;
    }

    const composerEl = document.getElementById('dmComposer');
    const inputEl = document.getElementById('dmMessageInput');

    if (!composerEl || !inputEl) {
      console.warn('[AppHome] Composer elements not found');
      return;
    }

    console.log('[AppHome] Initializing ChatInputManager');

    chatInputManager = new ChatInputManager({
      composerSelector: '#dmComposer',
      inputSelector: '#dmMessageInput',
      attachBtnSelector: '#attachBtn',
      emojiBtnSelector: '#emojiBtn',
      gifBtnSelector: '#gifBtn',
      stickerBtnSelector: '#stickerBtn',

      // Send text/file message
      onSendMessage: async (text, files) => {
        const filesToSend = files || (chatInputManager?.getAttachedFiles() || []);
        if (filesToSend.length > 0) {
          await uploadAndSendDmFiles(filesToSend, text);
        } else if (text?.trim()) {
          await sendDmMessageWithType(text, 'TEXT');
        }
      },
      // Send GIF
      onSendGif: async (gifUrl, gifData) => {
        await sendDmRichMessage(gifUrl, 'GIF', gifData);
      },
      // Send Sticker
      onSendSticker: async (stickerId, stickerUrl) => {
        await sendDmRichMessage(stickerUrl, 'STICKER', { stickerId });
      },
      // Typing events (optional - can implement later)
      onTypingStart: () => {},
      onTypingEnd: () => {}
    });

    console.log('[AppHome] ChatInputManager initialized successfully');
  }

  /**
   * Send DM message with specific type
   */
  async function sendDmMessageWithType(content, type, metadata = null) {
    if (!state.activeDmGroupId || !content?.trim()) return;

    try {
      const message = await apiJson(
        `/api/direct-messages/${encodeURIComponent(state.activeDmGroupId)}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            content: content,
            attachmentUrls: [],
            type: type,
            metadata: metadata ? JSON.stringify(metadata) : null
          }),
        }
      );

      // Clear input after success
      const input = els.dmMessageInput();
      if (input) input.value = "";
      if (chatInputManager) chatInputManager.clearAttachments?.();

      // Add to messages if not duplicate
      if (message && !state.dmMessages.find((m) => m.id === message.id)) {
        state.dmMessages.push(message);
        renderDmMessages();
      }
    } catch (err) {
      ToastManager?.error?.(err?.message || "Không thể gửi tin nhắn");
    }
  }

  /**
   * Send rich message (GIF/Sticker)
   */
  async function sendDmRichMessage(content, type, metadata = null) {
    if (!state.activeDmGroupId) return;

    try {
      const message = await apiJson(
        `/api/direct-messages/${encodeURIComponent(state.activeDmGroupId)}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            content: content,
            attachmentUrls: [],
            type: type,
            metadata: metadata ? JSON.stringify(metadata) : null
          }),
        }
      );

      if (message && !state.dmMessages.find((m) => m.id === message.id)) {
        state.dmMessages.push(message);
        renderDmMessages();
      }
    } catch (err) {
      console.error(`[AppHome] Error sending ${type}:`, err);
    }
  }

  /**
   * Upload files and send DM with attachments
   */
  async function uploadAndSendDmFiles(files, textContent) {
    if (!state.activeDmGroupId || !files?.length) return;

    try {
      const uploadedAttachments = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

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

      // Determine message type
      let messageType = 'TEXT';
      if (uploadedAttachments.length > 0) {
        const hasImage = uploadedAttachments.some(att => att.fileType?.startsWith('image/'));
        const hasVideo = uploadedAttachments.some(att => att.fileType?.startsWith('video/'));
        messageType = hasImage ? 'IMAGE' : hasVideo ? 'VIDEO' : 'FILE';
      }

      const attachmentUrls = uploadedAttachments.map(att => att.fileUrl);
      const metadata = uploadedAttachments.length > 0 
        ? JSON.stringify({ files: uploadedAttachments })
        : null;

      const message = await apiJson(
        `/api/direct-messages/${encodeURIComponent(state.activeDmGroupId)}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            content: textContent || '',
            attachmentUrls: attachmentUrls,
            type: messageType,
            metadata: metadata
          }),
        }
      );

      // Clear input
      const input = els.dmMessageInput();
      if (input) input.value = "";
      if (chatInputManager) chatInputManager.clearAttachments?.();

      if (message && !state.dmMessages.find((m) => m.id === message.id)) {
        state.dmMessages.push(message);
        renderDmMessages();
      }
    } catch (err) {
      console.error('[AppHome] Upload error:', err);
      ToastManager?.error?.("Lỗi khi gửi file!");
    }
  }

  // ===== End DM Chat Functions =====

  // ==================== SINGLE PAGE NAVIGATION ====================
  /**
   * Switch between main views (Friends, Nitro, Shop, Quests)
   * @param {string} viewName - 'friends', 'nitro', 'shop', 'quests'
   */
  function switchMainView(viewName) {
    const validViews = ['friends', 'nitro', 'shop', 'quests'];
    if (!validViews.includes(viewName)) {
      return;
    }

    // Update state
    state.activeMainView = viewName;

    // Update sidebar nav items
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      const itemView = item.getAttribute('data-view');
      if (itemView === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Hide all view contents
    document.querySelectorAll('.view-content').forEach(view => {
      view.style.display = 'none';
    });

    // Show selected view
    const targetView = document.querySelector(`.view-content[data-view="${viewName}"]`);
    if (targetView) {
      targetView.style.display = 'flex';
    }

    // Update top bar based on view
    updateTopBarForView(viewName);

    // Close DM chat if open
    if (state.activeView === 'dm') {
      closeDmChat();
    }
  }

  /**
   * Update top bar content based on current view
   * @param {string} viewName
   */
  function updateTopBarForView(viewName) {
    const topBar = document.querySelector('.top-bar');
    if (!topBar) return;

    const topLeft = topBar.querySelector('.top-left');
    if (!topLeft) return;

    // Get elements
    const topIcon = topLeft.querySelector('i');
    const topTitle = topLeft.querySelector('.top-title');
    const topDivider = topLeft.querySelector('.top-divider');
    const topTabs = topLeft.querySelector('.top-tabs');
    const addFriendBtn = topLeft.querySelector('#addFriendBtn');

    // View configurations
    const viewConfig = {
      friends: {
        icon: 'bi-people-fill',
        title: 'Bạn bè',
        showTabs: true,
        showAddFriend: true
      },
      nitro: {
        icon: 'bi-lightning-charge-fill',
        title: 'Nitro',
        showTabs: false,
        showAddFriend: false
      },
      shop: {
        icon: 'bi-bag-fill',
        title: 'Cửa hàng',
        showTabs: false,
        showAddFriend: false
      },
      quests: {
        icon: 'bi-compass-fill',
        title: 'Nhiệm vụ',
        showTabs: false,
        showAddFriend: false
      }
    };

    const config = viewConfig[viewName] || viewConfig.friends;

    // Update icon
    if (topIcon) {
      topIcon.className = `bi ${config.icon}`;
    }

    // Update title
    if (topTitle) {
      topTitle.textContent = config.title;
    }

    // Show/hide tabs and divider
    if (topDivider) {
      topDivider.style.display = config.showTabs ? '' : 'none';
    }
    if (topTabs) {
      topTabs.style.display = config.showTabs ? '' : 'none';
    }
    if (addFriendBtn) {
      addFriendBtn.style.display = config.showAddFriend ? '' : 'none';
    }
  }

  /**
   * Initialize Shop tab switching
   */
  function initShopTabs() {
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-shop-tab');
        
        // Update tab active state
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show/hide sections
        document.querySelectorAll('.shop-section').forEach(section => {
          const sectionName = section.getAttribute('data-shop-content');
          section.style.display = sectionName === tabName ? '' : 'none';
        });
      });
    });
  }

  /**
   * Initialize Quest interactions
   */
  function initQuestInteractions() {
    document.querySelectorAll('.quest-card:not(.completed)').forEach(card => {
      card.addEventListener('click', () => {
        const questId = card.getAttribute('data-quest-id');
      });
    });
    updateQuestStats();
  }

  /**
   * Update quest statistics display
   */
  function updateQuestStats() {
    const completedEl = document.getElementById('completedQuests');
    const activeEl = document.getElementById('activeQuests');
    
    const completed = document.querySelectorAll('.quest-card.completed').length;
    const active = document.querySelectorAll('.quest-card:not(.completed)').length;
    
    if (completedEl) completedEl.textContent = completed;
    if (activeEl) activeEl.textContent = active;
  }

  function wireEvents() {
    // Sidebar navigation - Single Page Navigation
    document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = item.getAttribute('data-view');
        switchMainView(viewName);
      });
    });

    // Tabs
    document.querySelectorAll(".tab").forEach((b) => {
      b.addEventListener("click", () => {
        closeDmChat();
        setActiveTab(b.dataset.tab);
      });
    });

    // Search inputs
    els.globalSearch()?.addEventListener("input", (e) => {
      state.dmSearch = e.target.value || "";
      renderDmList();
    });

    els.friendsSearch()?.addEventListener("input", (e) => {
      state.friendsSearch = e.target.value || "";
      renderFriendsList();
    });

    // Add friend
    els.addFriendBtn()?.addEventListener("click", showAddFriendView);
    els.sendFriendRequestBtn()?.addEventListener("click", sendFriendRequest);
    els.addFriendInput()?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendFriendRequest();
      if (e.key === "Escape") hideAddFriendView();
    });

    // DM Chat close button
    document
      .getElementById("closeDmChatBtn")
      ?.addEventListener("click", closeDmChat);

    // DM Call buttons
    callEls.voiceBtn()?.addEventListener("click", async () => {
      if (!state.activeDmGroupId) return;
      try {
        await startOutgoingCall({ video: false });
      } catch (err) {
        const msg = err?.name === "NotAllowedError"
            ? "Vui lòng cho phép microphone"
            : err?.message || "Không thể gọi thoại";
        if (window.ToastManager) {
          ToastManager.error(msg);
        } else {
          alert(msg);
        }
        endCall({ sendHangup: false });
      }
    });

    callEls.videoBtn()?.addEventListener("click", async () => {
      if (!state.activeDmGroupId) return;
      try {
        await startOutgoingCall({ video: true });
      } catch (err) {
        let msg;
        if (err?.name === "NotAllowedError") {
          msg = "Vui lòng cho phép camera/microphone";
        } else if (err?.name === "NotReadableError") {
          msg = "Camera đang được ứng dụng/tab khác sử dụng";
        } else {
          msg = err?.message || "Không thể gọi video";
        }
        if (window.ToastManager) {
          ToastManager.error(msg);
        } else {
          alert(msg);
        }
        endCall({ sendHangup: false });
      }
    });

    callEls
      .hangupBtn()
      ?.addEventListener("click", () => endCall({ sendHangup: true }));
    callEls.acceptBtn()?.addEventListener("click", async () => {
      try {
        await acceptIncomingCall();
      } catch (err) {
        const msg = err?.name === "NotAllowedError"
            ? "Vui lòng cho phép microphone/camera"
            : err?.message || "Không thể tham gia cuộc gọi";
        if (window.ToastManager) {
          ToastManager.error(msg);
        } else {
          alert(msg);
        }
        endCall({ sendHangup: true });
      }
    });
    callEls
      .declineBtn()
      ?.addEventListener("click", () => declineIncomingCall());

    // DM Composer form
    els.dmComposer()?.addEventListener("submit", (e) => {
      e.preventDefault();
      sendDmMessage();
    });

    // DM input Enter key
    els.dmMessageInput()?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendDmMessage();
      }
    });

    // Handle browser back/forward
    window.addEventListener("popstate", (e) => {
      if (e.state?.dmGroupId) {
        const dmItem = state.dmItems.find(
          (it) => String(it.dmGroupId) === String(e.state.dmGroupId)
        );
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
    document.querySelectorAll(".tab").forEach((b) => {
          b.onclick = () => { // Dùng onclick trực tiếp để chắc chắn chạy
              setActiveTab(b.dataset.tab);
          };
  });
  const btnAdd = document.getElementById("addFriendBtn");
      if(btnAdd) btnAdd.onclick = showAddFriendView;
  }
  async function initPresence() {
    const store = window.CoCoCordPresence;
    if (!store || typeof store.ensureConnected !== "function") return;

    await store.ensureConnected();

    // Subscribe first so snapshot hydration events won't be missed.
    store.subscribe((evt) => {
      if (!evt?.userId) return;
      updatePresenceDotsForUserId(evt.userId);

      // Online tab depends on presence filtering; re-render only when needed.
      if (state.activeView === "friends" && state.activeTab === "online") {
        renderFriendsList();
      }
    });

    const ids = [];
    listRelationshipsByStatus(["FRIEND"]).forEach((f) => {
      if (f?.userId != null) ids.push(f.userId);
    });
    (state.dmItems || []).forEach((d) => {
      if (d?.userId != null) ids.push(d.userId);
    });

    if (typeof store.hydrateSnapshot === "function") {
      await store.hydrateSnapshot(ids);
    }

    // Ensure UI reflects snapshot immediately (even if no realtime change happens).
    ids.forEach((id) => updatePresenceDotsForUserId(id));
    if (state.activeView === "friends" && state.activeTab === "online") {
      renderFriendsList();
    }
  }

  async function initFriendsRealtime() {
    if (window.__cococordFriendsRealtimeSubscribed) return;
    if (!state.currentUser?.id) return;
    const rt = window.CoCoCordRealtime;
    if (!rt || typeof rt.subscribe !== "function") return;

    await rt.ensureConnected?.();

    window.__cococordFriendsRealtimeSubscribed = true;
    rt.subscribe(`/topic/user.${state.currentUser.id}.friends`, async (msg) => {
      let data;
      try {
        data = JSON.parse(msg.body);
      } catch (_) {
        return;
      }
      if (!data || data.userId == null) return;

      const otherUserId = data.userId;
      const relationshipStatus = normalizeRelationshipStatus(
        data.relationshipStatus
      );

      if (relationshipStatus === "NONE") {
        removeRelationshipEntry(otherUserId);
      } else {
        setRelationshipEntry(otherUserId, {
          username: data.username,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          relationshipStatus,
          requestId: data.requestId || null,
        });

        // If we just became friends, hydrate presence snapshot for the new friend.
        if (relationshipStatus === "FRIEND") {
          const store = window.CoCoCordPresence;
          try {
            await store?.hydrateSnapshot?.([otherUserId]);
          } catch (_) {
            /* ignore */
          }
        }
      }

      if (state.activeView === "friends") {
        renderFriendsList();
      }
    });
  }

  async function init() {
    if (isInitializing) return;
    isInitializing = true;

    try {
      const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-view]');
        navItems.forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                switchMainView(item.getAttribute('data-view'));
            };
        });
      if (!window.__cococordIncomingCallListenerAttached) {
        window.__cococordIncomingCallListenerAttached = true;
        window.addEventListener("incomingCall", (e) => {
          const evt = e.detail;
          if (evt && evt.type === "CALL_START") {
            handleGlobalIncomingCall(evt);
          }
        });
      }

      wireEvents();
      await loadCurrentUser();
      await Promise.all([
        loadFriends(),
        loadRequests(),
        loadBlocked(),
        loadDmSidebar(),
      ]);
      rebuildFriendsStateFromSnapshots();
      render();
  } catch (err) {
    throw err;
  }
    // Friends realtime updates (no polling)
    await initFriendsRealtime();

    // Presence realtime (no polling)
    await initPresence();

    if (
      Array.isArray(window.__cococordIncomingCallQueue) &&
      window.__cococordIncomingCallQueue.length
    ) {
      const queued = window.__cococordIncomingCallQueue.slice();
      window.__cococordIncomingCallQueue.length = 0;
      for (const evt of queued) {
        if (evt && evt.type === "CALL_START") {
          handleGlobalIncomingCall(evt);
        }
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const dmGroupId = urlParams.get("dmGroupId");
    if (dmGroupId) {
      const dmItem = state.dmItems.find(
        (it) => String(it.dmGroupId) === String(dmGroupId)
      );
      openDmChat(dmGroupId, dmItem);
    }

    const friendsTab = urlParams.get("friendsTab");
    if (friendsTab) {
      setActiveTab(String(friendsTab));
    }

    const viewParam = urlParams.get("view");
    if (viewParam && ['friends', 'nitro', 'shop', 'quests'].includes(viewParam)) {
      switchMainView(viewParam);
    }
    initShopTabs();
    initQuestInteractions();
    initPrimarySidebarResize();
  }
  window.reInitAppHome = function() {
      const homeRoot = document.getElementById("cococordHome");
      if (!homeRoot) return;
      if (typeof wireEvents === 'function') {
          wireEvents(); 
      }
      if (typeof render === 'function') {
           render();
      }
  };
  // ==================== PRIMARY SIDEBAR RESIZE ====================
  function initPrimarySidebarResize() {
    const resizer = document.getElementById("primarySidebarResizer");
    const sidebar = document.querySelector(".primary-sidebar");
    if (!resizer || !sidebar) return;

    const MIN_WIDTH = 180;
    const MAX_WIDTH = 420;
    const STORAGE_KEY = "cococord.primarySidebarWidth";

    function clampWidth(w) {
      const n = Number(w);
      if (!Number.isFinite(n)) return null;
      return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n));
    }

    function getCurrentWidth() {
      const css = getComputedStyle(document.documentElement).getPropertyValue(
        "--primary-sidebar-width"
      );
      const fromCss = parseFloat(css);
      if (Number.isFinite(fromCss) && fromCss > 0) return fromCss;
      const rect = sidebar.getBoundingClientRect();
      return rect.width;
    }

    function applyWidth(px) {
      const w = clampWidth(px);
      if (w == null) return;
      document.documentElement.style.setProperty(
        "--primary-sidebar-width",
        `${w}px`
      );
      // Also set active-sidebar-width so user-panel follows this width
      document.documentElement.style.setProperty(
        "--active-sidebar-width",
        `${w}px`
      );
    }

    // Restore saved width
    try {
      const saved = clampWidth(localStorage.getItem(STORAGE_KEY));
      if (saved != null) {
        applyWidth(saved);
      } else {
        // Set default active-sidebar-width
        document.documentElement.style.setProperty(
          "--active-sidebar-width",
          "240px"
        );
      }
    } catch (_) {
      document.documentElement.style.setProperty(
        "--active-sidebar-width",
        "240px"
      );
    }

    let dragging = false;
    let startX = 0;
    let startW = 0;

    function onMove(e) {
      if (!dragging) return;
      const x = e.clientX;
      const next = startW + (x - startX);
      applyWidth(next);
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      resizer.classList.remove("active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      try {
        const w = clampWidth(getCurrentWidth());
        if (w != null) localStorage.setItem(STORAGE_KEY, String(w));
      } catch (_) {
        /* ignore */
      }
    }

    resizer.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startW = getCurrentWidth();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      resizer.classList.add("active");
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      e.preventDefault();
    });
  }

  

  // ===== Expose API for Quick Switcher =====
  window.AppHome = {
    getDmItems: () => [...state.dmItems],
    getFriends: () =>
      listRelationshipsByStatus(["FRIEND"]).map((x) => ({
        id: x.userId,
        userId: x.userId,
        username: x.username,
        displayName: x.displayName,
        avatarUrl: x.avatarUrl,
      })),
    getServers: () => [], // TODO: implement when servers are added
    openDmChat,
    openDmWithUser: async (userId) => {
      // Find existing DM or create new one
      const existingDm = state.dmItems.find(
        (dm) => dm.recipientId === userId || dm.id === userId
      );
      if (existingDm) {
        openDmChat(existingDm.dmGroupId, existingDm);
        return;
      }
      // If no existing DM, create one via openDM
      await openDM(userId);
    },
  };

  // ==========================================
  // APP HOME INITIALIZATION
  // ==========================================

  function forceInit() {
      const root = document.getElementById("cococordHome");
      if (!root) return;
      
      isInitializing = false; 

      // Set up sidebar navigation with capture phase listener
      const sidebarNav = root.querySelector(".sidebar-nav");
      if (sidebarNav) {
          sidebarNav.addEventListener('click', (e) => {
              const navItem = e.target.closest('.nav-item');
              if (navItem) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation(); 

                  // Update active state
                  root.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                  navItem.classList.add('active');

                  // Switch view
                  const view = navItem.getAttribute("data-view");
                  if (view && typeof switchMainView === 'function') {
                      switchMainView(view);
                  }
              }
          }, true); // Capture phase
      }

      // Wire events and initialize
      try {
          if (typeof wireEvents === 'function') {
              wireEvents(); 
          }
      } catch (e) {
          console.error('[AppHome] Wire events failed:', e);
      }
      
      if (typeof init === 'function') {
          init().catch(err => console.error('[AppHome] Init failed:', err));
      }
  }
  window.forceInitAppHome = forceInit;
})();
