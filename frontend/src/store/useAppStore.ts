import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** Numeric identifier used by the MySQL-backed Cococord domain. */
export type MysqlId = number;

export interface AppState {
  /** Server selected in the left navigation. */
  activeServerId: MysqlId | null;
  /** Channel selected inside the active server. */
  activeChannelId: MysqlId | null;

  /**
   * Select a server. A server switch always clears the channel selection so
   * stale channel data cannot be rendered under a different server.
   */
  setActiveServerId: (serverId: MysqlId | null) => void;
  setActiveChannelId: (channelId: MysqlId | null) => void;
  resetNavigation: () => void;
}

const initialNavigation = {
  activeServerId: null,
  activeChannelId: null,
} satisfies Pick<AppState, 'activeServerId' | 'activeChannelId'>;

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      ...initialNavigation,

      setActiveServerId: (serverId) =>
        set(
          (state) => ({
            activeServerId: serverId,
            activeChannelId:
              serverId !== null && state.activeServerId === serverId
                ? state.activeChannelId
                : null,
          }),
          false,
          'navigation/setActiveServerId',
        ),

      setActiveChannelId: (channelId) =>
        set(
          { activeChannelId: channelId },
          false,
          'navigation/setActiveChannelId',
        ),

      resetNavigation: () =>
        set(initialNavigation, false, 'navigation/resetNavigation'),
    }),
    { name: 'cococord-app-store' },
  ),
);
