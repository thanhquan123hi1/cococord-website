import { useMutation } from "@tanstack/react-query";

import { publishChatMessage } from "./useChatSocket";

export interface SendMessageVariables {
  channelId: number;
  content: string;
  replyToMessageId?: string | null;
  attachments?: readonly unknown[];
  type?: string;
  metadata?: string | null;
}

/** Sends a channel message using the same STOMP destination and envelope as chat.js. */
export function useSendMessage() {
  return useMutation<void, Error, SendMessageVariables>({
    mutationFn: async ({ channelId, content, ...message }) => {
      const trimmedContent = content.trim();
      if (!trimmedContent && !message.attachments?.length) return;

      publishChatMessage({
        channelId,
        content: trimmedContent,
        ...message,
      });
    },
  });
}
