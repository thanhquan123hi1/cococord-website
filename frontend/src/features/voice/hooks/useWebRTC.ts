import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";

import { useAuthStore, type AuthUser } from "../../../store/useAuthStore";
import {
  useVoiceStore,
  type VoiceParticipant,
} from "../../../store/useVoiceStore";

export type VoiceConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export interface RemoteVoiceStream {
  userId: string;
  stream: MediaStream;
}

export interface UseWebRTCResult {
  status: VoiceConnectionStatus;
  isConnected: boolean;
  error: string | null;
  localStream: MediaStream | null;
  remoteStreams: RemoteVoiceStream[];
  leaveRoom: () => void;
  toggleMute: () => void;
}

interface StopOptions {
  deactivateClient?: boolean;
  publishLeave?: boolean;
}

type AudioContextConstructor = typeof AudioContext;

const DEFAULT_WS_ENDPOINT = "http://localhost:8080/ws";
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function websocketEndpoint(): string {
  const configured = import.meta.env.VITE_WS_URL as string | undefined;
  if (configured) return configured;
  if (typeof window === "undefined") return DEFAULT_WS_ENDPOINT;
  return new URL("/ws", window.location.origin).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonFrame(frame: IMessage): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(frame.body);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function idFrom(value: Record<string, unknown>): string | null {
  const rawId = value.userId ?? value.id;
  if (typeof rawId !== "string" && typeof rawId !== "number") return null;
  return String(rawId);
}

function payloadId(value: string | number | null | undefined): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : String(value ?? "");
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeParticipant(
  value: unknown,
  previous?: VoiceParticipant,
): VoiceParticipant | null {
  if (!isRecord(value)) return null;

  const userId = idFrom(value);
  if (!userId) return null;

  return {
    userId,
    username: stringOrNull(value.username) ?? previous?.username ?? null,
    displayName:
      stringOrNull(value.displayName) ?? previous?.displayName ?? null,
    avatarUrl: stringOrNull(value.avatarUrl) ?? previous?.avatarUrl ?? null,
    micOn:
      typeof value.micOn === "boolean"
        ? value.micOn
        : typeof value.isMuted === "boolean"
          ? !value.isMuted
          : previous?.micOn ?? true,
    camOn:
      typeof value.camOn === "boolean"
        ? value.camOn
        : typeof value.isCameraOn === "boolean"
          ? value.isCameraOn
          : previous?.camOn ?? false,
    screenOn:
      typeof value.screenOn === "boolean"
        ? value.screenOn
        : typeof value.isScreenSharing === "boolean"
          ? value.isScreenSharing
          : previous?.screenOn ?? false,
    speaking:
      typeof value.speaking === "boolean"
        ? value.speaking
        : typeof value.isSpeaking === "boolean"
          ? value.isSpeaking
          : previous?.speaking ?? false,
    joinedAt: stringOrNull(value.joinedAt) ?? previous?.joinedAt ?? null,
  };
}

function participantFromCurrentUser(
  user: AuthUser | null,
  muted: boolean,
  speaking: boolean,
): VoiceParticipant | null {
  if (user?.id == null) return null;

  return {
    userId: String(user.id),
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    micOn: !muted,
    camOn: false,
    screenOn: false,
    speaking,
  };
}

export function useWebRTC(
  channelId: string | number | null,
  enabled = true,
): UseWebRTCResult {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [status, setStatus] = useState<VoiceConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [streamRevision, setStreamRevision] = useState(0);

  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const speakingRef = useRef(false);
  const speakingTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const channelIdRef = useRef<string | null>(
    channelId == null ? null : String(channelId),
  );
  const currentUserRef = useRef<AuthUser | null>(currentUser);

  channelIdRef.current = channelId == null ? null : String(channelId);
  currentUserRef.current = currentUser;

  const refreshStreams = useCallback(() => {
    setStreamRevision((revision) => revision + 1);
  }, []);

  const selfUserId = useCallback(() => {
    const id = currentUserRef.current?.id;
    return id == null ? null : String(id);
  }, []);

  const publish = useCallback(
    (destination: string, payload: Record<string, unknown>) => {
      const client = clientRef.current;
      if (!client?.connected) return;

      client.publish({
        destination,
        body: JSON.stringify(payload),
      });
    },
    [],
  );

  const publishVoiceState = useCallback(
    (state: {
      micOn?: boolean;
      camOn?: boolean;
      screenOn?: boolean;
      speaking?: boolean;
    }) => {
      const activeChannelId = channelIdRef.current;
      if (!activeChannelId) return;

      publish("/app/voice/state", {
        channelId: payloadId(activeChannelId),
        micOn: state.micOn,
        camOn: state.camOn,
        screenOn: state.screenOn,
        speaking: state.speaking,
      });
    },
    [publish],
  );

  const cleanupSubscriptions = useCallback(() => {
    const subscriptions = subscriptionsRef.current.splice(0);

    subscriptions.forEach((subscription) => {
      try {
        subscription.unsubscribe();
      } catch {
        // STOMP unsubscribe cleanup is intentionally idempotent.
      }
    });
  }, []);

  const cleanupPeer = useCallback(
    (userId: string | number) => {
      const normalizedUserId = String(userId);
      const peer = peerConnectionsRef.current.get(normalizedUserId);

      if (peer) {
        try {
          peer.close();
        } catch {
          // Peer cleanup must not block room teardown.
        }
        peerConnectionsRef.current.delete(normalizedUserId);
      }

      pendingIceRef.current.delete(normalizedUserId);

      if (remoteStreamsRef.current.delete(normalizedUserId)) {
        refreshStreams();
      }
    },
    [refreshStreams],
  );

  const stopSpeakingDetection = useCallback(() => {
    if (speakingTimerRef.current !== null) {
      window.clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }

    try {
      audioSourceRef.current?.disconnect();
    } catch {
      // Already disconnected.
    }
    audioSourceRef.current = null;

    try {
      analyserRef.current?.disconnect();
    } catch {
      // Already disconnected.
    }
    analyserRef.current = null;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close().catch(() => undefined);
    }
  }, []);

  const updateParticipant = useCallback((rawParticipant: unknown) => {
    const store = useVoiceStore.getState();
    const currentParticipants = store.participants;
    const previousById = new Map(
      currentParticipants.map((participant) => [
        participant.userId,
        participant,
      ]),
    );
    const participant = normalizeParticipant(
      rawParticipant,
      isRecord(rawParticipant)
        ? previousById.get(idFrom(rawParticipant) ?? "")
        : undefined,
    );
    if (!participant) return null;

    const nextParticipants = currentParticipants.some(
      (item) => item.userId === participant.userId,
    )
      ? currentParticipants.map((item) =>
          item.userId === participant.userId ? participant : item,
        )
      : [...currentParticipants, participant];

    store.setParticipants(nextParticipants);
    return participant;
  }, []);

  const removeParticipant = useCallback(
    (userId: unknown) => {
      if (typeof userId !== "string" && typeof userId !== "number") return;

      const normalizedUserId = String(userId);
      const store = useVoiceStore.getState();
      store.setParticipants(
        store.participants.filter(
          (participant) => participant.userId !== normalizedUserId,
        ),
      );
      store.setSpeaking(normalizedUserId, false);
      cleanupPeer(normalizedUserId);
    },
    [cleanupPeer],
  );

  const updateSelfParticipant = useCallback(() => {
    const store = useVoiceStore.getState();
    const participant = participantFromCurrentUser(
      currentUserRef.current,
      store.isMuted,
      speakingRef.current,
    );
    if (participant) updateParticipant(participant);
  }, [updateParticipant]);

  const setLocalSpeaking = useCallback(
    (speaking: boolean) => {
      const muted = useVoiceStore.getState().isMuted;
      const nextSpeaking = muted ? false : speaking;
      if (speakingRef.current === nextSpeaking) return;

      speakingRef.current = nextSpeaking;
      const userId = selfUserId();
      if (userId) {
        useVoiceStore.getState().setSpeaking(userId, nextSpeaking);
      }
      updateSelfParticipant();
      publishVoiceState({ speaking: nextSpeaking });
    },
    [publishVoiceState, selfUserId, updateSelfParticipant],
  );

  const startSpeakingDetection = useCallback(
    (stream: MediaStream) => {
      stopSpeakingDetection();

      if (typeof window === "undefined") return;
      const AudioContextCtor =
        window.AudioContext ??
        (window as typeof window & {
          webkitAudioContext?: AudioContextConstructor;
        }).webkitAudioContext;
      if (!AudioContextCtor) return;

      try {
        const audioContext = new AudioContextCtor();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        audioSourceRef.current = source;

        const buffer = new Uint8Array(analyser.fftSize);
        const startThreshold = 0.04;
        const stopThreshold = 0.02;

        speakingTimerRef.current = window.setInterval(() => {
          const audioTracks = stream.getAudioTracks();
          const hasEnabledTrack = audioTracks.some((track) => track.enabled);

          if (useVoiceStore.getState().isMuted || !hasEnabledTrack) {
            setLocalSpeaking(false);
            return;
          }

          analyser.getByteTimeDomainData(buffer);
          let sum = 0;
          for (let index = 0; index < buffer.length; index += 1) {
            const centered = (buffer[index] - 128) / 128;
            sum += centered * centered;
          }

          const rms = Math.sqrt(sum / buffer.length);
          if (!speakingRef.current && rms >= startThreshold) {
            setLocalSpeaking(true);
          } else if (speakingRef.current && rms <= stopThreshold) {
            setLocalSpeaking(false);
          }
        }, 200);
      } catch {
        stopSpeakingDetection();
      }
    },
    [setLocalSpeaking, stopSpeakingDetection],
  );

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is unavailable in this browser");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    const muted = useVoiceStore.getState().isMuted;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });

    localStreamRef.current = stream;
    refreshStreams();
    startSpeakingDetection(stream);
    return stream;
  }, [refreshStreams, startSpeakingDetection]);

  const sendIce = useCallback(
    (remoteUserId: string, candidate: RTCIceCandidateInit) => {
      const activeChannelId = channelIdRef.current;
      const fromUserId = selfUserId();
      if (!activeChannelId || !fromUserId) return;

      publish("/app/voice/signal/ice", {
        channelId: payloadId(activeChannelId),
        fromUserId: payloadId(fromUserId),
        toUserId: payloadId(remoteUserId),
        candidate,
      });
    },
    [publish, selfUserId],
  );

  const createAndSendOffer = useCallback(
    async (remoteUserId: string) => {
      const activeChannelId = channelIdRef.current;
      const fromUserId = selfUserId();
      const peer = peerConnectionsRef.current.get(remoteUserId);
      if (!activeChannelId || !fromUserId || !peer) return;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      publish("/app/voice/signal/offer", {
        channelId: payloadId(activeChannelId),
        fromUserId: payloadId(fromUserId),
        toUserId: payloadId(remoteUserId),
        sdp: offer.sdp,
      });
    },
    [publish, selfUserId],
  );

  const shouldOfferTo = useCallback(
    (remoteUserId: string) => {
      const myId = Number(selfUserId());
      const otherId = Number(remoteUserId);
      if (!Number.isFinite(myId) || !Number.isFinite(otherId)) return false;
      return myId > otherId;
    },
    [selfUserId],
  );

  const ensurePeerConnection = useCallback(
    (remoteUserId: string | number) => {
      const normalizedUserId = String(remoteUserId);
      if (!normalizedUserId || normalizedUserId === selfUserId()) return;
      if (peerConnectionsRef.current.has(normalizedUserId)) return;

      const peer = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(normalizedUserId, peer);

      const localStream = localStreamRef.current;
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            peer.addTrack(track, localStream);
          } catch {
            // Ignore duplicate sender edge cases during reconnection.
          }
        });
      }

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        sendIce(
          normalizedUserId,
          event.candidate.toJSON
            ? event.candidate.toJSON()
            : (event.candidate as RTCIceCandidateInit),
        );
      };

      peer.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        remoteStreamsRef.current.set(normalizedUserId, stream);
        event.track.onended = () => {
          if (remoteStreamsRef.current.get(normalizedUserId) === stream) {
            remoteStreamsRef.current.delete(normalizedUserId);
            refreshStreams();
          }
        };
        refreshStreams();
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed" || peer.connectionState === "closed") {
          cleanupPeer(normalizedUserId);
        }
      };

      if (shouldOfferTo(normalizedUserId)) {
        void createAndSendOffer(normalizedUserId).catch(() => undefined);
      }
    },
    [
      cleanupPeer,
      createAndSendOffer,
      refreshStreams,
      selfUserId,
      sendIce,
      shouldOfferTo,
    ],
  );

  const flushPendingIce = useCallback(async (remoteUserId: string) => {
    const peer = peerConnectionsRef.current.get(remoteUserId);
    const candidates = pendingIceRef.current.get(remoteUserId);
    if (!peer || !candidates?.length) return;

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        // Ignore malformed or already-applied candidates.
      }
    }

    pendingIceRef.current.delete(remoteUserId);
  }, []);

  const handleOffer = useCallback(
    async (fromUserId: string, sdp: string) => {
      ensurePeerConnection(fromUserId);
      const peer = peerConnectionsRef.current.get(fromUserId);
      const activeChannelId = channelIdRef.current;
      const currentUserId = selfUserId();
      if (!peer || !activeChannelId || !currentUserId) return;

      await peer.setRemoteDescription({ type: "offer", sdp });
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      publish("/app/voice/signal/answer", {
        channelId: payloadId(activeChannelId),
        fromUserId: payloadId(currentUserId),
        toUserId: payloadId(fromUserId),
        sdp: answer.sdp,
      });

      await flushPendingIce(fromUserId);
    },
    [ensurePeerConnection, flushPendingIce, publish, selfUserId],
  );

  const handleAnswer = useCallback(
    async (fromUserId: string, sdp: string) => {
      const peer = peerConnectionsRef.current.get(fromUserId);
      if (!peer) return;

      await peer.setRemoteDescription({ type: "answer", sdp });
      await flushPendingIce(fromUserId);
    },
    [flushPendingIce],
  );

  const handleIce = useCallback(
    async (fromUserId: string, candidate: RTCIceCandidateInit) => {
      const peer = peerConnectionsRef.current.get(fromUserId);

      if (!peer || !peer.remoteDescription) {
        const pending = pendingIceRef.current.get(fromUserId) ?? [];
        pending.push(candidate);
        pendingIceRef.current.set(fromUserId, pending);
        return;
      }

      try {
        await peer.addIceCandidate(candidate);
      } catch {
        // Ignore duplicate or stale candidates from reconnects.
      }
    },
    [],
  );

  const replaceParticipants = useCallback(
    (rawParticipants: unknown[]) => {
      const store = useVoiceStore.getState();
      const previousById = new Map(
        store.participants.map((participant) => [
          participant.userId,
          participant,
        ]),
      );
      const participants = rawParticipants
        .map((rawParticipant) =>
          normalizeParticipant(
            rawParticipant,
            isRecord(rawParticipant)
              ? previousById.get(idFrom(rawParticipant) ?? "")
              : undefined,
          ),
        )
        .filter((participant): participant is VoiceParticipant =>
          Boolean(participant),
        );

      const self = participantFromCurrentUser(
        currentUserRef.current,
        store.isMuted,
        speakingRef.current,
      );
      if (self) {
        const selfIndex = participants.findIndex(
          (participant) => participant.userId === self.userId,
        );
        if (selfIndex >= 0) {
          participants[selfIndex] = {
            ...participants[selfIndex],
            micOn: self.micOn,
            speaking: self.speaking,
          };
        } else {
          participants.push(self);
        }
      }

      store.setParticipants(participants);

      const activeRemoteIds = new Set(
        participants
          .map((participant) => participant.userId)
          .filter((userId) => userId !== self?.userId),
      );

      Array.from(peerConnectionsRef.current.keys()).forEach((userId) => {
        if (!activeRemoteIds.has(userId)) cleanupPeer(userId);
      });
      activeRemoteIds.forEach((userId) => ensurePeerConnection(userId));
    },
    [cleanupPeer, ensurePeerConnection],
  );

  const handlePresenceEvent = useCallback(
    (payload: Record<string, unknown>) => {
      const type = payload.type;
      if (typeof type !== "string") return;

      const eventChannelId = payload.channelId;
      if (
        (typeof eventChannelId === "string" ||
          typeof eventChannelId === "number") &&
        channelIdRef.current !== String(eventChannelId)
      ) {
        return;
      }

      if (type === "VOICE_USERS" || type === "PARTICIPANTS_UPDATE") {
        const rawParticipants =
          Array.isArray(payload.users) ? payload.users : payload.participants;
        if (Array.isArray(rawParticipants)) replaceParticipants(rawParticipants);
        return;
      }

      if (type === "USER_JOIN" || type === "USER_JOINED") {
        const rawUser = isRecord(payload.user) ? payload.user : payload;
        const participant = updateParticipant(rawUser);
        if (participant && participant.userId !== selfUserId()) {
          ensurePeerConnection(participant.userId);
        }
        return;
      }

      if (type === "USER_LEAVE" || type === "USER_LEFT") {
        removeParticipant(payload.userId);
        return;
      }

      if (type === "VOICE_STATE_UPDATE") {
        const userId = payload.userId;
        if (userId == null || String(userId) === selfUserId()) return;

        updateParticipant({
          userId,
          micOn: payload.micOn,
          camOn: payload.camOn,
          screenOn: payload.screenOn,
          speaking: payload.speaking,
        });
        return;
      }

      if (type === "USER_SPEAKING") {
        const userId = payload.userId;
        if (userId == null || String(userId) === selfUserId()) return;

        const speaking =
          typeof payload.isSpeaking === "boolean"
            ? payload.isSpeaking
            : Boolean(payload.speaking);
        updateParticipant({ userId, speaking });
        useVoiceStore.getState().setSpeaking(userId as string | number, speaking);
        return;
      }

      if (type === "USER_MUTE") {
        const userId = payload.userId;
        if (userId == null || String(userId) === selfUserId()) return;
        if (typeof payload.isMuted !== "boolean") return;

        updateParticipant({
          userId,
          micOn: !payload.isMuted,
          speaking: payload.isMuted ? false : undefined,
        });
        if (payload.isMuted) {
          useVoiceStore.getState().setSpeaking(userId as string | number, false);
        }
        return;
      }

      if (type === "USER_CAMERA" || type === "USER_SCREEN") {
        const userId = payload.userId;
        if (userId == null || String(userId) === selfUserId()) return;

        updateParticipant({
          userId,
          camOn: payload.isCameraOn,
          screenOn: payload.isScreenSharing,
        });
      }
    },
    [
      ensurePeerConnection,
      removeParticipant,
      replaceParticipants,
      selfUserId,
      updateParticipant,
    ],
  );

  const handlePresenceFrame = useCallback(
    (frame: IMessage) => {
      const payload = parseJsonFrame(frame);
      if (payload) handlePresenceEvent(payload);
    },
    [handlePresenceEvent],
  );

  const handleSignalFrame = useCallback(
    (frame: IMessage) => {
      const payload = parseJsonFrame(frame);
      if (!payload || typeof payload.type !== "string") return;

      const eventChannelId = payload.channelId;
      if (
        (typeof eventChannelId === "string" ||
          typeof eventChannelId === "number") &&
        channelIdRef.current !== String(eventChannelId)
      ) {
        return;
      }

      const fromUserId =
        typeof payload.fromUserId === "string" ||
        typeof payload.fromUserId === "number"
          ? String(payload.fromUserId)
          : null;
      const toUserId =
        typeof payload.toUserId === "string" ||
        typeof payload.toUserId === "number"
          ? String(payload.toUserId)
          : null;
      const currentUserId = selfUserId();

      if (!fromUserId || !currentUserId) return;
      if (fromUserId === currentUserId) return;
      if (toUserId != null && toUserId !== currentUserId) return;

      if (payload.type === "OFFER" && typeof payload.sdp === "string") {
        void handleOffer(fromUserId, payload.sdp).catch(() => undefined);
        return;
      }

      if (payload.type === "ANSWER" && typeof payload.sdp === "string") {
        void handleAnswer(fromUserId, payload.sdp).catch(() => undefined);
        return;
      }

      if (payload.type === "ICE" && isRecord(payload.candidate)) {
        void handleIce(
          fromUserId,
          payload.candidate as RTCIceCandidateInit,
        ).catch(() => undefined);
      }
    },
    [handleAnswer, handleIce, handleOffer, selfUserId],
  );

  const stopVoice = useCallback(
    (options: StopOptions = {}) => {
      const client = clientRef.current;
      const activeChannelId = channelIdRef.current;

      if (options.publishLeave !== false && client?.connected && activeChannelId) {
        try {
          client.publish({
            destination: "/app/voice/leave",
            body: JSON.stringify({ channelId: payloadId(activeChannelId) }),
          });
        } catch {
          // Leave is best-effort during navigation and socket teardown.
        }
      }

      cleanupSubscriptions();

      Array.from(peerConnectionsRef.current.keys()).forEach(cleanupPeer);
      peerConnectionsRef.current.clear();
      pendingIceRef.current.clear();

      if (remoteStreamsRef.current.size > 0) {
        remoteStreamsRef.current.clear();
        refreshStreams();
      }

      stopSpeakingDetection();
      speakingRef.current = false;

      const localStream = localStreamRef.current;
      localStreamRef.current = null;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        refreshStreams();
      }

      useVoiceStore.getState().leaveRoom();

      if (options.deactivateClient !== false && client) {
        if (clientRef.current === client) {
          clientRef.current = null;
        }
        void client.deactivate();
      }

      setStatus("idle");
    },
    [
      cleanupPeer,
      cleanupSubscriptions,
      refreshStreams,
      stopSpeakingDetection,
    ],
  );

  const joinConnectedClient = useCallback(
    async (client: Client, activeChannelId: string) => {
      await ensureLocalMedia();
      if (!client.connected || clientRef.current !== client) return;

      cleanupSubscriptions();
      subscriptionsRef.current = [
        client.subscribe(`/topic/voice/${activeChannelId}`, handlePresenceFrame),
        client.subscribe(
          `/topic/voice/${activeChannelId}/signal`,
          handleSignalFrame,
        ),
      ];

      const store = useVoiceStore.getState();
      store.joinRoom(activeChannelId);
      updateSelfParticipant();

      client.publish({
        destination: "/app/voice/join",
        body: JSON.stringify({ channelId: payloadId(activeChannelId) }),
      });

      publishVoiceState({
        micOn: !store.isMuted,
        camOn: false,
        screenOn: false,
        speaking: false,
      });
      setStatus("connected");
      setError(null);
    },
    [
      cleanupSubscriptions,
      ensureLocalMedia,
      handlePresenceFrame,
      handleSignalFrame,
      publishVoiceState,
      updateSelfParticipant,
    ],
  );

  const leaveRoom = useCallback(() => {
    stopVoice({ deactivateClient: true, publishLeave: true });
  }, [stopVoice]);

  const toggleMute = useCallback(() => {
    const store = useVoiceStore.getState();
    const nextMuted = !store.isMuted;
    store.toggleMute();

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    if (nextMuted) {
      speakingRef.current = false;
      const userId = selfUserId();
      if (userId) store.setSpeaking(userId, false);
    }

    updateSelfParticipant();
    publishVoiceState({
      micOn: !nextMuted,
      camOn: false,
      screenOn: false,
      speaking: nextMuted ? false : speakingRef.current,
    });
  }, [publishVoiceState, selfUserId, updateSelfParticipant]);

  useEffect(() => {
    const activeChannelId = channelId == null ? null : String(channelId);
    if (!enabled || !accessToken || !currentUser?.id || !activeChannelId) {
      stopVoice({ deactivateClient: true, publishLeave: false });
      setError(null);
      return;
    }

    let disposed = false;
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(websocketEndpoint()) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: import.meta.env.DEV
        ? (message) => console.debug("[VOICE:STOMP]", message)
        : undefined,
    });

    client.onConnect = () => {
      if (disposed) return;

      void joinConnectedClient(client, activeChannelId).catch((cause) => {
        if (disposed) return;
        setError(
          cause instanceof Error ? cause.message : "Unable to join voice room",
        );
        setStatus("error");
        stopVoice({ deactivateClient: true, publishLeave: false });
      });
    };

    client.onDisconnect = () => {
      if (!disposed) setStatus("idle");
    };

    client.onWebSocketClose = () => {
      if (!disposed) setStatus("reconnecting");
    };

    client.onWebSocketError = () => {
      if (!disposed) {
        setError("Voice realtime connection failed");
        setStatus("error");
      }
    };

    client.onStompError = (frame) => {
      if (!disposed) {
        setError(frame.headers.message ?? "Voice broker error");
        setStatus("error");
      }
    };

    clientRef.current = client;
    setError(null);
    setStatus("connecting");
    client.activate();

    return () => {
      disposed = true;
      stopVoice({ deactivateClient: true, publishLeave: true });
    };
  }, [
    accessToken,
    channelId,
    currentUser?.id,
    enabled,
    joinConnectedClient,
    stopVoice,
  ]);

  const remoteStreams = useMemo(
    () =>
      Array.from(remoteStreamsRef.current.entries()).map(
        ([userId, stream]) => ({ userId, stream }),
      ),
    [streamRevision],
  );

  const localStream = useMemo(() => localStreamRef.current, [streamRevision]);

  return {
    status,
    isConnected: status === "connected",
    error,
    localStream,
    remoteStreams,
    leaveRoom,
    toggleMute,
  };
}
