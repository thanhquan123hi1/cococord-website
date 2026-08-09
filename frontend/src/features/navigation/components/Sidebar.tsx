import { useEffect, useMemo } from "react";

import { useAppStore } from "../../../store/useAppStore";
import { useDMs } from "../../dms/hooks/useDMs";
import {
  useServers,
  type ChannelSummary,
  type ServerSummary,
} from "../hooks/useServers";

export interface SidebarProps {
  onCreateServer?: () => void;
  onCreateChannel?: (serverId: number) => void;
}

function serverInitials(server: ServerSummary): string {
  const initials = server.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "CO";
}

function isTextChannel(channel: ChannelSummary): boolean {
  return ["TEXT", "ANNOUNCEMENT", "FORUM"].includes(channel.type.toUpperCase());
}

function isVoiceChannel(channel: ChannelSummary): boolean {
  return ["VOICE", "STAGE"].includes(channel.type.toUpperCase());
}

export function Sidebar({ onCreateServer, onCreateChannel }: SidebarProps) {
  const activeServerId = useAppStore((state) => state.activeServerId);
  const activeChannelId = useAppStore((state) => state.activeChannelId);
  const setActiveServerId = useAppStore((state) => state.setActiveServerId);
  const setActiveChannelId = useAppStore((state) => state.setActiveChannelId);
  const serversQuery = useServers();
  const dmsQuery = useDMs();
  const servers = serversQuery.data ?? [];
  const isHome = activeServerId === null;

  useEffect(() => {
    if (servers.length === 0 || activeServerId === null) return;
    if (!servers.some((server) => server.id === activeServerId)) {
      setActiveServerId(servers[0].id);
    }
  }, [activeServerId, servers, setActiveServerId]);

  const visibleServer = useMemo(
    () => servers.find((server) => server.id === activeServerId) ?? servers[0],
    [activeServerId, servers],
  );
  const visibleChannels = visibleServer?.channels ?? [];

  const selectChannel = (channel: ChannelSummary) => {
    setActiveServerId(channel.serverId);
    setActiveChannelId(channel.id);
  };

  return (
    <aside className="flex h-full w-full max-w-xs shrink-0 overflow-hidden border-r border-slate-800 bg-slate-900 text-slate-100">
      <nav
        aria-label="Servers"
        className="flex w-16 shrink-0 flex-col items-center gap-3 border-r border-slate-800 bg-slate-950 px-2 py-4"
      >
        <button
          type="button"
          aria-label="Home"
          aria-pressed={isHome}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg transition ${isHome ? "rounded-xl bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:rounded-xl hover:bg-indigo-500/80 hover:text-white"}`}
          onClick={() => {
            setActiveServerId(null);
            setActiveChannelId(null);
          }}
        >
          <span aria-hidden="true">⌂</span>
        </button>
        <div className="h-px w-8 bg-slate-800" />
        {serversQuery.isPending && (
          <span className="text-xs text-slate-500">…</span>
        )}
        {servers.map((server) => {
          const isActive = server.id === activeServerId;
          return (
            <button
              key={server.id}
              aria-label={server.name}
              aria-pressed={isActive}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold transition ${isActive ? "rounded-xl bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:rounded-xl hover:bg-indigo-500/80 hover:text-white"}`}
              onClick={() => setActiveServerId(server.id)}
              type="button"
            >
              {serverInitials(server)}
            </button>
          );
        })}
        {onCreateServer && (
          <button
            type="button"
            aria-label="Create server"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-xl text-slate-400 transition hover:rounded-xl hover:bg-emerald-600 hover:text-white"
            onClick={onCreateServer}
          >
            +
          </button>
        )}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {isHome ? (
          <>
            <header className="flex h-14 shrink-0 items-center border-b border-slate-800 px-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  Direct Messages
                </p>
                <p className="text-[11px] text-slate-500">
                  Friends & conversations
                </p>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
              <div className="mb-4 flex items-center justify-between px-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Direct messages
                </p>
                <button
                  type="button"
                  className="text-lg leading-none text-slate-500 hover:text-white"
                  title="New conversation"
                >
                  +
                </button>
              </div>
              {dmsQuery.isPending && (
                <p className="px-2 text-xs text-slate-500">
                  Loading conversations…
                </p>
              )}
              {dmsQuery.isError && (
                <p className="px-2 text-xs text-red-300">
                  {dmsQuery.error.message}
                </p>
              )}
              <div className="space-y-1">
                {(dmsQuery.data ?? []).map((dm) => (
                  <button
                    key={dm.dmGroupId}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  >
                    {dm.avatarUrl ? (
                      <img
                        src={dm.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">
                        {(dm.displayName || dm.username || "?")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {dm.displayName || dm.username || "Unknown user"}
                    </span>
                    {dm.unreadCount > 0 && (
                      <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">
                        {dm.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <header className="flex h-14 shrink-0 items-center border-b border-slate-800 px-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {visibleServer?.name ?? "Cococord"}
                </p>
                <p className="text-[11px] text-slate-500">Community channels</p>
              </div>
              {visibleServer && onCreateChannel && (
                <button
                  type="button"
                  className="ml-auto text-lg leading-none text-slate-500 hover:text-white"
                  title="Create channel"
                  onClick={() => onCreateChannel(visibleServer.id)}
                >
                  +
                </button>
              )}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
              {serversQuery.isError && (
                <p className="px-2 text-xs text-red-300">
                  {serversQuery.error.message}
                </p>
              )}
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Text channels
              </p>
              <div className="mt-2 space-y-1">
                {visibleChannels.filter(isTextChannel).map((channel) => {
                  const isActive = channel.id === activeChannelId;
                  return (
                    <button
                      key={channel.id}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${isActive ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                      onClick={() => selectChannel(channel)}
                      type="button"
                    >
                      <span className="text-slate-500">#</span>
                      <span className="truncate">{channel.name}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Voice channels
              </p>
              <div className="mt-2 space-y-1">
                {visibleChannels.filter(isVoiceChannel).map((channel) => {
                  const isActive = channel.id === activeChannelId;
                  return (
                    <button
                      key={channel.id}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${isActive ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                      onClick={() => selectChannel(channel)}
                      type="button"
                    >
                      <span className="text-slate-500">◉</span>
                      <span className="truncate">{channel.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
