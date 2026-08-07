import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";

import type {
  ChatMessage,
  MessageInfiniteData,
  MessagePage,
} from "../realtime/updateMessageCache";

const DEFAULT_API_URL = "http://localhost:8080";
const DEFAULT_PAGE_SIZE = 50;

export type MessagesQueryKey = readonly ["messages", number | null];

function buildMessagesUrl(
  channelId: number,
  page: number,
  size: number,
): string {
  const baseUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    (typeof window === "undefined" ? DEFAULT_API_URL : window.location.origin);
  const url = new URL(`/api/messages/channel/${channelId}`, baseUrl);

  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));
  return url.toString();
}

async function fetchMessagePage(
  channelId: number,
  page: number,
  signal: AbortSignal,
): Promise<MessagePage> {
  const response = await fetch(
    buildMessagesUrl(channelId, page, DEFAULT_PAGE_SIZE),
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    },
  );

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      message || `Unable to load channel messages (${response.status})`,
    );
  }

  return (await response.json()) as MessagePage;
}

/**
 * Fetches newest-first message pages for the active channel.
 *
 * The query key intentionally matches useChatSocket exactly so STOMP events
 * can update this cache without a second source of truth.
 */
export function useMessages(channelId: number | null) {
  return useInfiniteQuery<
    MessagePage,
    Error,
    InfiniteData<MessagePage, number>,
    MessagesQueryKey,
    number
  >({
    queryKey: ["messages", channelId],
    enabled: channelId !== null,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      if (channelId === null) {
        throw new Error("Cannot load messages without a channel ID");
      }

      return fetchMessagePage(channelId, pageParam, signal);
    },
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    staleTime: 30_000,
  });
}

export type MessagesData = MessageInfiniteData | undefined;
export type MessagesItem = ChatMessage;
