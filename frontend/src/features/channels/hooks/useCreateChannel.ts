import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../../store/useAuthStore";
import type { ChannelSummary } from "../../navigation/hooks/useServers";

export interface CreateChannelInput {
  serverId: number;
  name: string;
  type: string;
  categoryId?: number | null;
  topic?: string;
  position?: number;
  isPrivate?: boolean;
  isNsfw?: boolean;
  slowMode?: number;
}

async function createChannel(
  input: CreateChannelInput,
): Promise<ChannelSummary> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error("Authentication is required");

  const response = await fetch(`/api/servers/${input.serverId}/channels`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: input.name.trim(),
      type: input.type,
      categoryId: input.categoryId ?? null,
      topic: input.topic?.trim() || null,
      position: input.position ?? 0,
      isPrivate: input.isPrivate ?? false,
      isNsfw: input.isNsfw ?? false,
      slowMode: input.slowMode ?? 0,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Unable to create channel (${response.status})`);
  }

  return (await response.json()) as ChannelSummary;
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation<ChannelSummary, Error, CreateChannelInput>({
    mutationFn: createChannel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}
