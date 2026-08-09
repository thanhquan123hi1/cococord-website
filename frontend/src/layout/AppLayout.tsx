import { useState } from "react";

import { CreateChannelModal } from "../components/modals/CreateChannelModal";
import { CreateServerModal } from "../components/modals/CreateServerModal";
import { HomeView } from "../features/dms/components/HomeView";
import { Sidebar } from "../features/navigation/components/Sidebar";
import { MessageArea } from "../features/chat/components/MessageArea";
import { usePresenceSocket } from "../features/presence/hooks/usePresenceSocket";
import { useAppStore } from "../store/useAppStore";

export function AppLayout() {
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createChannelServerId, setCreateChannelServerId] = useState<
    number | null
  >(null);
  const activeServerId = useAppStore((state) => state.activeServerId);
  usePresenceSocket();

  const openCreateChannel = (serverId: number) => {
    setCreateChannelServerId(serverId);
    setCreateChannelOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        onCreateServer={() => setCreateServerOpen(true)}
        onCreateChannel={openCreateChannel}
      />
      <main className="flex min-w-0 flex-1 overflow-hidden">
        {activeServerId === null ? <HomeView /> : <MessageArea />}
      </main>
      <CreateServerModal
        open={createServerOpen}
        onClose={() => setCreateServerOpen(false)}
      />
      <CreateChannelModal
        open={createChannelOpen}
        serverId={createChannelServerId ?? activeServerId}
        onClose={() => setCreateChannelOpen(false)}
      />
    </div>
  );
}
