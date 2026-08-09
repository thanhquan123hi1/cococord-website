import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "../../../store/useAuthStore";
import { usePresenceStore } from "../../../store/usePresenceStore";

type PresenceStatus = { userId: string | number; status: string };

function websocketEndpoint(): string {
  const configured = import.meta.env.VITE_WS_URL as string | undefined;
  if (configured) return configured;
  if (typeof window === "undefined") return "http://localhost:8080/ws";
  return new URL("/ws", window.location.origin).toString();
}

function parsePresence(frame: IMessage): PresenceStatus | null {
  try {
    const data: unknown = JSON.parse(frame.body);
    if (!data || typeof data !== "object") return null;
    const record = data as Record<string, unknown>;
    const payload =
      record.payload && typeof record.payload === "object"
        ? (record.payload as Record<string, unknown>)
        : record;
    const userId = payload.userId;
    const status = payload.newStatus ?? payload.status;
    if (
      (typeof userId !== "string" && typeof userId !== "number") ||
      typeof status !== "string"
    )
      return null;
    if (record.type && record.type !== "user.status.changed") return null;
    return { userId, status };
  } catch {
    return null;
  }
}

export function usePresenceSocket(enabled = true) {
  const accessToken = useAuthStore.getState().accessToken;
  const setStatus = usePresenceStore((state) => state.setStatus);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setConnected(false);
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
    });

    const clearSubscriptions = () => {
      const subscriptions = subscriptionsRef.current.splice(0);
      subscriptions.forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch {
          // Cleanup is intentionally idempotent.
        }
      });
    };

    const handleFrame = (frame: IMessage) => {
      const presence = parsePresence(frame);
      if (presence) setStatus(presence.userId, presence.status);
    };

    client.onConnect = () => {
      if (disposed) return;
      setError(null);
      setConnected(true);
      subscriptionsRef.current = [
        client.subscribe("/topic/presence", handleFrame),
        client.subscribe("/user/queue/presence", handleFrame),
      ];
    };
    client.onDisconnect = () => {
      if (!disposed) setConnected(false);
    };
    client.onWebSocketError = () => {
      if (!disposed) {
        setError("Presence connection failed");
        setConnected(false);
      }
    };
    client.onStompError = (frame) => {
      if (!disposed) {
        setError(frame.headers.message ?? "Presence broker error");
        setConnected(false);
      }
    };

    client.activate();
    return () => {
      disposed = true;
      clearSubscriptions();
      setConnected(false);
      void client.deactivate();
    };
  }, [accessToken, enabled, setStatus]);

  return { connected, error };
}
