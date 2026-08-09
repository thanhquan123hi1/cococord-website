import { create } from "zustand";

export interface PresenceState {
  statusByUserId: Record<string, string>;
  setStatus: (userId: string | number, status: string) => void;
  setStatuses: (statuses: Record<string, string>) => void;
  clear: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  statusByUserId: {},
  setStatus: (userId, status) =>
    set((state) => ({
      statusByUserId: {
        ...state.statusByUserId,
        [String(userId)]: status.toUpperCase(),
      },
    })),
  setStatuses: (statuses) => set({ statusByUserId: { ...statuses } }),
  clear: () => set({ statusByUserId: {} }),
}));
