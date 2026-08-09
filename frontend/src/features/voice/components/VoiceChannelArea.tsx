import { useMemo } from "react";

import { useAppStore } from "../../../store/useAppStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { useVoiceStore } from "../../../store/useVoiceStore";
import { AudioTrack } from "./AudioTrack";
import { useWebRTC } from "../hooks/useWebRTC";

export interface VoiceChannelAreaProps {
  channelId: number | string | null;
  channelName?: string | null;
}

function initials(displayName?: string | null, username?: string | null): string {
  const value = displayName?.trim() || username?.trim() || "?";
  return value.slice(0, 2).toUpperCase();
}

export function VoiceChannelArea({
  channelId,
  channelName,
}: VoiceChannelAreaProps) {
  const participants = useVoiceStore((state) => state.participants);
  const speakingUsers = useVoiceStore((state) => state.speakingUsers);
  const isMuted = useVoiceStore((state) => state.isMuted);
  const currentUser = useAuthStore((state) => state.currentUser);
  const setActiveChannelId = useAppStore((state) => state.setActiveChannelId);

  const { status, error, remoteStreams, leaveRoom, toggleMute } = useWebRTC(
    channelId,
    channelId != null && currentUser?.id != null,
  );

  const remoteStreamByUserId = useMemo(
    () => new Map(remoteStreams.map(({ userId, stream }) => [userId, stream])),
    [remoteStreams],
  );

  const sortedParticipants = useMemo(() => {
    const currentUserId = currentUser?.id == null ? null : String(currentUser.id);

    return [...participants].sort((left, right) => {
      const leftIsSelf = currentUserId !== null && left.userId === currentUserId;
      const rightIsSelf =
        currentUserId !== null && right.userId === currentUserId;
      if (leftIsSelf !== rightIsSelf) return leftIsSelf ? -1 : 1;

      const leftSpeaking = speakingUsers.has(left.userId);
      const rightSpeaking = speakingUsers.has(right.userId);
      if (leftSpeaking !== rightSpeaking) return leftSpeaking ? -1 : 1;

      return (left.displayName || left.username || "").localeCompare(
        right.displayName || right.username || "",
      );
    });
  }, [currentUser?.id, participants, speakingUsers]);

  const handleDisconnect = () => {
    leaveRoom();
    setActiveChannelId(null);
  };

  const connectionLabel =
    status === "connected"
      ? "Live"
      : status === "connecting"
        ? "Joining"
        : status === "reconnecting"
          ? "Reconnecting"
          : status === "error"
            ? "Offline"
            : "Idle";

  const currentChannelLabel =
    channelName || (channelId == null ? "Voice channel" : `Voice ${channelId}`);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-800 px-5">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">
            {currentChannelLabel}
          </h1>
          <p className="text-[11px] text-slate-500">{connectionLabel}</p>
        </div>
        <span
          className={`ml-auto text-xs ${
            status === "connected"
              ? "text-emerald-400"
              : status === "error"
                ? "text-rose-400"
                : "text-slate-500"
          }`}
          aria-live="polite"
        >
          {error || connectionLabel}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition ${
              isMuted
                ? "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                : "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            }`}
          >
            {isMuted ? "Unmute Microphone" : "Mute Microphone"}
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            Disconnect
          </button>
        </div>

        {status === "error" && error && (
          <p className="mt-4 rounded-md border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        <div className="mt-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Participants
          </h2>

          {sortedParticipants.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Waiting for the room to fill.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {sortedParticipants.map((participant) => {
                const isSpeaking = speakingUsers.has(participant.userId);
                const isSelf =
                  currentUser?.id != null &&
                  participant.userId === String(currentUser.id);
                const hasStream = remoteStreamByUserId.has(participant.userId);

                return (
                  <div
                    key={participant.userId}
                    className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    <div className="relative shrink-0">
                      {participant.avatarUrl ? (
                        <img
                          src={participant.avatarUrl}
                          alt=""
                          className={`h-11 w-11 rounded-full object-cover transition ${
                            isSpeaking
                              ? "ring-2 ring-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.65)]"
                              : "ring-1 ring-slate-700"
                          }`}
                        />
                      ) : (
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-semibold transition ${
                            isSpeaking
                              ? "bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.65)]"
                              : "bg-slate-800 text-slate-200 ring-1 ring-slate-700"
                          }`}
                          aria-hidden="true"
                        >
                          {initials(participant.displayName, participant.username)}
                        </div>
                      )}
                      {isSpeaking && (
                        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {participant.displayName || participant.username || "Unknown user"}
                        </span>
                        {isSelf && (
                          <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                            you
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {participant.micOn ? "Microphone on" : "Microphone muted"}
                        {hasStream ? " - audio live" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden" aria-hidden="true">
          {remoteStreams.map(({ userId, stream }) => (
            <AudioTrack key={userId} stream={stream} />
          ))}
        </div>
      </div>
    </section>
  );
}
