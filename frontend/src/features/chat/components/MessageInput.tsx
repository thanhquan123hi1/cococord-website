import { type FormEvent, type KeyboardEvent, useState } from "react";

import { useAppStore } from "../../../store/useAppStore";
import { useSendMessage } from "../hooks/useSendMessage";

export function MessageInput() {
  const activeChannelId = useAppStore((state) => state.activeChannelId);
  const sendMessage = useSendMessage();
  const [content, setContent] = useState("");

  if (activeChannelId === null) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || sendMessage.isPending) return;

    sendMessage.mutate(
      {
        channelId: activeChannelId,
        content: trimmedContent,
        replyToMessageId: null,
      },
      { onSuccess: () => setContent("") },
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form
      className="chat-composer"
      id="chatComposer"
      autoComplete="off"
      onSubmit={handleSubmit}
    >
      <div className="composer-box">
        <button
          type="button"
          className="composer-btn"
          id="attachBtn"
          title="Đính kèm file"
        >
          <i className="bi bi-plus-circle" />
        </button>
        <input
          className="composer-input"
          id="chatInput"
          type="text"
          placeholder="Nhắn tin vào #kênh"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sendMessage.isPending}
        />
        <div className="composer-tools">
          <button
            type="button"
            className="composer-btn"
            id="gifBtn"
            title="GIF"
          >
            <i className="bi bi-filetype-gif" />
          </button>
          <button
            type="button"
            className="composer-btn"
            id="stickerBtn"
            title="Sticker"
          >
            <i className="bi bi-stickies" />
          </button>
          <button
            type="button"
            className="composer-btn"
            id="emojiBtn"
            title="Emoji"
          >
            <i className="bi bi-emoji-smile" />
          </button>
        </div>
      </div>
    </form>
  );
}
