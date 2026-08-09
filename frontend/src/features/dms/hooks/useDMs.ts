import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../../store/useAuthStore";

export interface DMItem {
  dmGroupId: number;
  userId: number | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
}

async function fetchDMs(
  accessToken: string,
  signal: AbortSignal,
): Promise<DMItem[]> {
  const response = await fetch("/api/direct-messages/sidebar", {
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
    throw new Error(
      message || `Unable to load direct messages (${response.status})`,
    );
  }
  return (await response.json()) as DMItem[];
}

export function useDMs() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery<DMItem[], Error>({
    queryKey: ["dms"],
    enabled: Boolean(accessToken),
    queryFn: ({ signal }) => {
      if (!accessToken) throw new Error("Authentication is required");
      return fetchDMs(accessToken, signal);
    },
    staleTime: 30_000,
  });
}
