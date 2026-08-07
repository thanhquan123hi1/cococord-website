import { useMemo } from "react";

import { useAppStore } from "../../../store/useAppStore";

interface MockServer {
  id: number;
  name: string;
  initials: string;
}

interface MockChannel {
  id: number;
  serverId: number;
  name: string;
  kind: "text" | "voice";
}

const MOCK_SERVERS: MockServer[] = [
  { id: 1, name: "Cococord", initials: "CO" },
  { id: 2, name: "Frontend Guild", initials: "FG" },
  { id: 3, name: "Design Lab", initials: "DL" },
];

const MOCK_CHANNELS: MockChannel[] = [
  { id: 101, serverId: 1, name: "general", kind: "text" },
  { id: 102, serverId: 1, name: "announcements", kind: "text" },
  { id: 103, serverId: 1, name: "voice-lounge", kind: "voice" },
  { id: 201, serverId: 2, name: "react", kind: "text" },
  { id: 202, serverId: 2, name: "typescript", kind: "text" },
  { id: 301, serverId: 3, name: "visuals", kind: "text" },
  { id: 302, serverId: 3, name: "critique", kind: "text" },
];

export function Sidebar() {
  const activeServerId = useAppStore((state) => state.activeServerId);
  const activeChannelId = useAppStore((state) => state.activeChannelId);
  const setActiveServerId = useAppStore((state) => state.setActiveServerId);
  const setActiveChannelId = useAppStore((state) => state.setActiveChannelId);

  const visibleServerId = activeServerId ?? MOCK_SERVERS[0].id;
  const visibleChannels = useMemo(
    () =>
      MOCK_CHANNELS.filter((channel) => channel.serverId === visibleServerId),
    [visibleServerId],
  );
  const visibleServer = MOCK_SERVERS.find(
    (server) => server.id === visibleServerId,
  );

  const selectServer = (serverId: number) => {
    setActiveServerId(serverId);
  };

  const selectChannel = (channel: MockChannel) => {
    setActiveServerId(channel.serverId);
    setActiveChannelId(channel.id);
  };

  return (
    <aside className="flex h-full w-full max-w-xs shrink-0 overflow-hidden border-r border-slate-800 bg-slate-900 text-slate-100">
      <nav
        aria-label="Servers"
        className="flex w-16 shrink-0 flex-col items-center gap-3 border-r border-slate-800 bg-slate-950 px-2 py-4"
      >
        {MOCK_SERVERS.map((server) => {
          const isActive = server.id === activeServerId;

          return (
            <button
              key={server.id}
              aria-label={server.name}
              aria-pressed={isActive}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold transition ${
                isActive
                  ? "rounded-xl bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:rounded-xl hover:bg-indigo-500/80 hover:text-white"
              }`}
              onClick={() => selectServer(server.id)}
              type="button"
            >
              {server.initials}
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-slate-800 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {visibleServer?.name ?? "Cococord"}
            </p>
            <p className="text-[11px] text-slate-500">Community channels</p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Text channels
          </p>
          <div className="mt-2 space-y-1">
            {visibleChannels
              .filter((channel) => channel.kind === "text")
              .map((channel) => {
                const isActive = channel.id === activeChannelId;

                return (
                  <button
                    key={channel.id}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                      isActive
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
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
            {visibleChannels
              .filter((channel) => channel.kind === "voice")
              .map((channel) => {
                const isActive = channel.id === activeChannelId;

                return (
                  <button
                    key={channel.id}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                      isActive
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
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
      </div>
    </aside>
  );
}
