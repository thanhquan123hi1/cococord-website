import { type FormEvent, useState } from "react";

import { useCreateChannel } from "../../features/channels/hooks/useCreateChannel";

interface CreateChannelModalProps {
  open: boolean;
  serverId: number | null;
  onClose: () => void;
}

export function CreateChannelModal({
  open,
  serverId,
  onClose,
}: CreateChannelModalProps) {
  const createChannel = useCreateChannel();
  const [name, setName] = useState("");
  const [type, setType] = useState("TEXT");

  if (!open || serverId === null) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || createChannel.isPending) return;

    createChannel.mutate(
      { serverId, name, type },
      {
        onSuccess: () => {
          setName("");
          setType("TEXT");
          onClose();
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-channel-title"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2
              id="create-channel-title"
              className="text-lg font-semibold text-white"
            >
              Create a channel
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Add a place for this server’s conversations.
            </p>
          </div>
          <button
            type="button"
            className="text-xl text-slate-400 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Channel name
            <input
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-indigo-500 focus:ring-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Channel type
            <select
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-indigo-500 focus:ring-2"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="TEXT">Text</option>
              <option value="VOICE">Voice</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="STAGE">Stage</option>
            </select>
          </label>
          {createChannel.isError && (
            <p className="text-sm text-red-300" role="alert">
              {createChannel.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!name.trim() || createChannel.isPending}
            >
              {createChannel.isPending ? "Creating…" : "Create channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
