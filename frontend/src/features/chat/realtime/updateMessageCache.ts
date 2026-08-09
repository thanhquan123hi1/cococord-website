import type { InfiniteData } from "@tanstack/react-query";

export type MongoId = string;
export type MysqlId = number;

export interface ChatMessage {
  id: MongoId;
  channelId: MysqlId;
  serverId?: MysqlId | null;
  userId: MysqlId;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  content?: string | null;
  type?: string | null;
  parentMessageId?: MongoId | null;
  threadId?: MongoId | null;
  metadata?: string | null;
  attachments?: readonly unknown[];
  mentionedUserIds?: readonly MysqlId[];
  isEdited?: boolean;
  editedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Spring Data's page shape used by the messages REST endpoint. */
export interface MessagePage {
  content: ChatMessage[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
  [key: string]: unknown;
}

export type MessageInfiniteData = InfiniteData<MessagePage, number>;

function createInitialCache(message: ChatMessage): MessageInfiniteData {
  return {
    pages: [
      {
        content: [message],
        number: 0,
        size: 1,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        numberOfElements: 1,
        empty: false,
      },
    ],
    pageParams: [0],
  };
}

/**
 * Immutably applies one realtime message to an infinite-query cache.
 *
 * Existing IDs are replaced in their current page. Duplicate copies of that
 * ID are removed from later pages. New IDs are prepended to the first page,
 * matching the backend's newest-first message ordering.
 */
export function upsertMessageInCache(
  oldData: MessageInfiniteData | undefined,
  newMessage: ChatMessage,
): MessageInfiniteData {
  if (!oldData || oldData.pages.length === 0) {
    return createInitialCache(newMessage);
  }

  let replaced = false;
  const pages = oldData.pages.map((page) => {
    const content: ChatMessage[] = [];

    for (const message of page.content) {
      if (message.id !== newMessage.id) {
        content.push(message);
        continue;
      }

      // Keep the first occurrence in its original position and discard any
      // duplicate copies that may have been introduced by reconnects.
      if (!replaced) {
        content.push(newMessage);
        replaced = true;
      }
    }

    return content.length === page.content.length && !replaced
      ? page
      : { ...page, content };
  });

  if (replaced) {
    return { ...oldData, pages };
  }

  const firstPage = oldData.pages[0];
  const firstContent = [
    newMessage,
    ...firstPage.content.filter((message) => message.id !== newMessage.id),
  ];

  return {
    ...oldData,
    pages: pages.map((page, index) => {
      if (index !== 0) return page;

      return {
        ...page,
        content: firstContent,
        numberOfElements: page.numberOfElements + 1,
        totalElements: page.totalElements + 1,
        empty: false,
      };
    }),
  };
}
