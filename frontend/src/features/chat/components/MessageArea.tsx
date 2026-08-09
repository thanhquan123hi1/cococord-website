import { useMemo } from "react";

import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import {
  useServers,
  type ChannelSummary,
} from "../../navigation/hooks/useServers";
import { VoiceChannelArea } from "../../voice/components/VoiceChannelArea";
import { useChatSocket } from "../hooks/useChatSocket";
import { useMessages } from "../hooks/useMessages";
import { MessageInput } from "./MessageInput";

export interface MessageAreaProps {
  channelName?: string | null;
}

function formatMessageTime(timestamp?: string | null): string {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function initials(displayName?: string | null, username?: string): string {
  const value = displayName?.trim() || username?.trim() || "?";
  return value.slice(0, 2).toUpperCase();
}

function isTextChannel(channel: ChannelSummary | null): boolean {
  if (!channel) return false;
  return ["TEXT", "ANNOUNCEMENT", "FORUM"].includes(channel.type.toUpperCase());
}

function isVoiceChannel(channel: ChannelSummary | null): boolean {
  if (!channel) return false;
  return ["VOICE", "STAGE"].includes(channel.type.toUpperCase());
}

export function MessageArea({ channelName }: MessageAreaProps) {
  const activeChannelId = useAppStore((state) => state.activeChannelId);
  const serversQuery = useServers();
  const accessToken = useAuthStore.getState().accessToken;
  const activeChannel = useMemo(() => {
    const servers = serversQuery.data ?? [];
    for (const server of servers) {
      const found = server.channels.find((channel) => channel.id === activeChannelId);
      if (found) return found;
    }
    return null;
  }, [activeChannelId, serversQuery.data]);

  const textChannelId =
    activeChannelId !== null && isTextChannel(activeChannel)
      ? activeChannelId
      : null;
  const messagesQuery = useMessages(textChannelId);
  const socket = useChatSocket(
    textChannelId,
    textChannelId !== null && accessToken !== null,
  );
  const isVoiceRoom = isVoiceChannel(activeChannel);

  const messages = useMemo(
    () =>
      messagesQuery.data?.pages
        .flatMap((page) => page.content)
        .slice()
        .reverse() ?? [],
    [messagesQuery.data],
  );

  if (activeChannelId === null) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 px-6 text-center text-slate-400">
        <div>
          <p className="text-sm font-medium text-slate-200">
            Select a channel to start chatting
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Your servers and conversations will appear here.
          </p>
        </div>
      </section>
    );
  }

  if (isVoiceRoom) {
    return (
      <VoiceChannelArea
        channelId={activeChannelId}
        channelName={activeChannel?.name ?? channelName ?? null}
      />
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-800 px-5 shadow-sm">
        <span className="mr-2 text-slate-500">#</span>
        <h1 className="truncate text-sm font-semibold">
          {channelName || `Channel ${activeChannelId}`}
        </h1>
        <span
          className={`ml-auto text-xs ${
            socket.isConnected ? "text-emerald-400" : "text-slate-500"
          }`}
          aria-live="polite"
        >
          {socket.isConnected ? "Live" : socket.status}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {messagesQuery.isPending && (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading messages…
          </div>
        )}

        {messagesQuery.isError && (
          <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
            {messagesQuery.error.message || "Unable to load messages."}
          </div>
        )}

        {!messagesQuery.isPending &&
          !messagesQuery.isError &&
          messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No messages yet. Start the conversation.
            </div>
          )}

        <div className="space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className="group flex gap-3 rounded-md px-2 py-1 transition-colors hover:bg-slate-900/70"
            >
              {message.avatarUrl ? (
                <img
                  src={message.avatarUrl}
                  alt=""
                  className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
                  aria-hidden="true"
                >
                  {initials(message.displayName, message.username)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-semibold text-slate-100">
                    {message.displayName || message.username}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatMessageTime(message.createdAt)}
                  </span>
                  {message.isEdited && (
                    <span className="text-[10px] text-slate-500">(edited)</span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                  {message.content || ""}
                </p>
              </div>
            </article>
          ))}
        </div>

        {messagesQuery.hasNextPage && (
          <button
            type="button"
            onClick={() => void messagesQuery.fetchNextPage()}
            disabled={messagesQuery.isFetchingNextPage}
            className="mx-auto mt-6 block rounded-md px-3 py-2 text-xs font-medium text-indigo-300 transition hover:bg-slate-900 hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {messagesQuery.isFetchingNextPage
              ? "Loading older messages…"
              : "Load older messages"}
          </button>
        )}
      </div>
      <MessageInput />
    </section>
  );
}
