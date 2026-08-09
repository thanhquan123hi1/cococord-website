import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../../store/useAuthStore";

export interface ChannelSummary {
  id: number;
  serverId: number;
  categoryId: number | null;
  categoryName: string | null;
  name: string;
  type: string;
  topic: string | null;
  position: number;
  isPrivate: boolean;
  isNsfw: boolean;
  isDefault: boolean;
  slowMode: number;
  bitrate: number;
  userLimit: number;
}

export interface ServerSummary {
  id: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  ownerId: number | null;
  memberCount: number;
  channelCount: number;
  isLocked: boolean;
  isSuspended: boolean;
  channels: ChannelSummary[];
}

async function fetchServers(
  accessToken: string,
  signal: AbortSignal,
): Promise<ServerSummary[]> {
  const response = await fetch("/api/servers", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Unable to load servers (${response.status})`);
  }

  return (await response.json()) as ServerSummary[];
}

export function useServers() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<ServerSummary[], Error>({
    queryKey: ["servers"],
    enabled: Boolean(accessToken),
    queryFn: ({ signal }) => {
      if (!accessToken) throw new Error("Authentication is required");
      return fetchServers(accessToken, signal);
    },
    staleTime: 60_000,
  });
}
