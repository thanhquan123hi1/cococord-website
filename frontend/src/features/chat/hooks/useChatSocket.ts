import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import SockJS from "sockjs-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "../../../store/useAuthStore";
import {
  type ChatMessage,
  type MessageInfiniteData,
  upsertMessageInCache,
} from "../realtime/updateMessageCache";

export type ChatSocketStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "error";

export interface ChatSocketEnvelope<TPayload = unknown> {
  type: string;
  payload: TPayload;
}

export interface UseChatSocketResult {
  status: ChatSocketStatus;
  isConnected: boolean;
  error: string | null;
}

export interface ChatSendMessagePayload {
  channelId: number;
  content: string;
  replyToMessageId?: string | null;
  attachments?: readonly unknown[];
  type?: string;
  metadata?: string | null;
}

let activeChatClient: Client | null = null;

/** Publishes through the authenticated channel connection owned by useChatSocket. */
export function publishChatMessage(payload: ChatSendMessagePayload): void {
  if (!activeChatClient?.connected) {
    throw new Error("WebSocket not connected");
  }

  activeChatClient.publish({
    destination: "/app/chat.sendMessage",
    body: JSON.stringify(payload),
  });
}

const DEFAULT_WS_ENDPOINT = "http://localhost:8080/ws";

function getWebSocketEndpoint(): string {
  const configuredEndpoint = import.meta.env.VITE_WS_URL as string | undefined;
  if (configuredEndpoint) return configuredEndpoint;

  if (typeof window === "undefined") return DEFAULT_WS_ENDPOINT;
  return new URL("/ws", window.location.origin).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.channelId === "number" &&
    typeof value.userId === "number" &&
    typeof value.username === "string"
  );
}

function parseMessageEnvelope(
  frame: IMessage,
): ChatSocketEnvelope<ChatMessage> | null {
  try {
    const parsed: unknown = JSON.parse(frame.body);
    if (!isRecord(parsed) || typeof parsed.type !== "string") return null;

    const payload = parsed.payload;
    if (
      (parsed.type === "message.created" ||
        parsed.type === "message.updated") &&
      isChatMessage(payload)
    ) {
      return { type: parsed.type, payload };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Owns the STOMP lifecycle for one authenticated app shell and one active
 * channel. Mount this hook once at the authenticated layout boundary.
 */
export function useChatSocket(
  channelId: number | null,
  enabled = true,
): UseChatSocketResult {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore.getState().accessToken;
  const [status, setStatus] = useState<ChatSocketStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const channelIdRef = useRef<number | null>(channelId);
  const enabledRef = useRef(enabled);

  channelIdRef.current = channelId;
  enabledRef.current = enabled;

  const unsubscribe = useCallback(() => {
    const subscription = subscriptionRef.current;
    subscriptionRef.current = null;

    if (!subscription) return;
    try {
      subscription.unsubscribe();
    } catch {
      // Cleanup must be idempotent even when STOMP already removed it.
    }
  }, []);

  const subscribeToCurrentChannel = useCallback(() => {
    const client = clientRef.current;
    const currentChannelId = channelIdRef.current;

    unsubscribe();

    if (!client?.connected || !enabledRef.current || currentChannelId == null) {
      return;
    }

    subscriptionRef.current = client.subscribe(
      `/topic/channel/${currentChannelId}`,
      (frame) => {
        const envelope = parseMessageEnvelope(frame);
        if (!envelope) return;

        const message = envelope.payload;
        if (message.channelId !== channelIdRef.current) return;

        queryClient.setQueryData<MessageInfiniteData>(
          ["messages", currentChannelId],
          (oldData) => upsertMessageInCache(oldData, message),
        );
      },
    );
  }, [queryClient, unsubscribe]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      unsubscribe();
      setStatus("idle");
      setError(null);
      return;
    }

    let disposed = false;
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(getWebSocketEndpoint()) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: import.meta.env.DEV
        ? (message) => console.debug("[STOMP]", message)
        : undefined,
    });

    client.onConnect = () => {
      if (disposed) return;
      setError(null);
      setStatus("connected");
      subscribeToCurrentChannel();
    };

    client.onDisconnect = () => {
      if (!disposed) setStatus("idle");
    };

    client.onWebSocketClose = () => {
      if (!disposed) setStatus("reconnecting");
    };

    client.onWebSocketError = () => {
      if (!disposed) {
        setError("Realtime connection failed");
        setStatus("error");
      }
    };

    client.onStompError = (frame) => {
      if (!disposed) {
        setError(frame.headers.message ?? "STOMP broker error");
        setStatus("error");
      }
    };

    clientRef.current = client;
    activeChatClient = client;
    setError(null);
    setStatus("connecting");
    client.activate();

    return () => {
      disposed = true;
      unsubscribe();

      if (clientRef.current === client) {
        clientRef.current = null;
      }

      if (activeChatClient === client) {
        activeChatClient = null;
      }

      void client.deactivate();
      setStatus("idle");
    };
  }, [accessToken, enabled, subscribeToCurrentChannel, unsubscribe]);

  useEffect(() => {
    // The connection effect subscribes on CONNECT. This effect handles only
    // active-channel changes after a connection already exists.
    subscribeToCurrentChannel();

    return unsubscribe;
  }, [channelId, subscribeToCurrentChannel, unsubscribe]);

  return {
    status,
    isConnected: status === "connected",
    error,
  };
}
