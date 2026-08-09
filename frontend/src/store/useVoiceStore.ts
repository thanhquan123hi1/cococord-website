import { create } from "zustand";

export interface VoiceParticipant {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  speaking: boolean;
  joinedAt?: string | null;
}

export interface VoiceState {
  connectedChannelId: string | null;
  participants: VoiceParticipant[];
  speakingUsers: Set<string>;
  isMuted: boolean;

  joinRoom: (channelId: string | number) => void;
  leaveRoom: () => void;
  setParticipants: (participants: VoiceParticipant[]) => void;
  setSpeaking: (userId: string | number, speaking: boolean) => void;
  toggleMute: () => void;
}

function speakingSet(participants: VoiceParticipant[]): Set<string> {
  return new Set(
    participants
      .filter((participant) => participant.speaking)
      .map((participant) => participant.userId),
  );
}

export const useVoiceStore = create<VoiceState>((set) => ({
  connectedChannelId: null,
  participants: [],
  speakingUsers: new Set<string>(),
  isMuted: false,

  joinRoom: (channelId) =>
    set((state) => {
      const nextChannelId = String(channelId);
      if (state.connectedChannelId === nextChannelId) return state;

      return {
        connectedChannelId: nextChannelId,
        participants: [],
        speakingUsers: new Set<string>(),
      };
    }),

  leaveRoom: () =>
    set({
      connectedChannelId: null,
      participants: [],
      speakingUsers: new Set<string>(),
    }),

  setParticipants: (participants) =>
    set({
      participants,
      speakingUsers: speakingSet(participants),
    }),

  setSpeaking: (userId, speaking) =>
    set((state) => {
      const normalizedUserId = String(userId);
      const speakingUsers = new Set(state.speakingUsers);

      if (speaking) {
        speakingUsers.add(normalizedUserId);
      } else {
        speakingUsers.delete(normalizedUserId);
      }

      return {
        speakingUsers,
        participants: state.participants.map((participant) =>
          participant.userId === normalizedUserId
            ? { ...participant, speaking }
            : participant,
        ),
      };
    }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}));
