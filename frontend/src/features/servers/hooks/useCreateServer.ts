import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../../store/useAuthStore";
import type { ServerSummary } from "../../navigation/hooks/useServers";

export interface CreateServerInput {
  name: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  isPublic?: boolean;
  maxMembers?: number;
}

async function createServer(input: CreateServerInput): Promise<ServerSummary> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error("Authentication is required");

  const response = await fetch("/api/servers", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      iconUrl: input.iconUrl?.trim() || null,
      bannerUrl: input.bannerUrl?.trim() || null,
      isPublic: input.isPublic ?? false,
      maxMembers: input.maxMembers ?? 100000,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Unable to create server (${response.status})`);
  }

  return (await response.json()) as ServerSummary;
}

export function useCreateServer() {
  const queryClient = useQueryClient();

  return useMutation<ServerSummary, Error, CreateServerInput>({
    mutationFn: createServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}
