import { usePresenceStore } from "../../../store/usePresenceStore";
import { useDMs } from "../hooks/useDMs";

export function HomeView() {
  const dmsQuery = useDMs();
  const statusByUserId = usePresenceStore((state) => state.statusByUserId);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-800 px-5">
        <h1 className="text-sm font-semibold">Friends</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Direct messages
        </h2>
        {dmsQuery.isPending && (
          <p className="mt-4 text-sm text-slate-500">Loading conversations…</p>
        )}
        {dmsQuery.isError && (
          <p className="mt-4 text-sm text-red-300">{dmsQuery.error.message}</p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(dmsQuery.data ?? []).map((dm) => {
            const status =
              dm.userId == null
                ? "OFFLINE"
                : (statusByUserId[String(dm.userId)] ?? "OFFLINE");
            const online = status !== "OFFLINE" && status !== "INVISIBLE";
            return (
              <button
                key={dm.dmGroupId}
                type="button"
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-slate-700 hover:bg-slate-800"
              >
                <span className="relative shrink-0">
                  {dm.avatarUrl ? (
                    <img
                      src={dm.avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
                      {(dm.displayName || dm.username || "?")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${online ? "bg-emerald-500" : "bg-slate-600"}`}
                    aria-label={status}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {dm.displayName || dm.username || "Unknown user"}
                  </span>
                  <span className="block text-xs capitalize text-slate-500">
                    {status.toLowerCase().replaceAll("_", " ")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
