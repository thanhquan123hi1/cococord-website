import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useState,
} from "react";

import { useAppStore } from "../../../store/useAppStore";

export function MessageInput() {
  const activeChannelId = useAppStore((state) => state.activeChannelId);
  const [content, setContent] = useState("");

  const handleSendMessage = useCallback(
    (messageContent: string) => {
      console.info("[MessageInput] message queued", {
        channelId: activeChannelId,
        content: messageContent,
      });
    },
    [activeChannelId],
  );

  const handleSubmit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const trimmedContent = content.trim();
      if (!trimmedContent || activeChannelId === null) return;

      handleSendMessage(trimmedContent);
      setContent("");
    },
    [activeChannelId, content, handleSendMessage],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey) return;

      event.preventDefault();
      handleSubmit();
    },
    [handleSubmit],
  );

  if (activeChannelId === null) return null;

  return (
    <form
      className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-4 sm:px-6"
      onSubmit={handleSubmit}
    >
      <div className="flex items-end gap-3 rounded-xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700/80 transition focus-within:ring-indigo-500/70">
        <textarea
          aria-label="Message"
          className="max-h-40 min-h-6 flex-1 resize-none bg-transparent text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${activeChannelId}`}
          rows={1}
          value={content}
        />
        <button
          className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          disabled={!content.trim()}
          type="submit"
        >
          Send
        </button>
      </div>
      <p className="mt-2 px-1 text-[11px] text-slate-600">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}
