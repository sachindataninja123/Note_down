import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchWorkspaces } from "../../features/workspaces/workspaceSlice";
import WorkspaceModal from "../dashboard/WorkspaceModal";
import Header from "./Header";
import SideBar from "./SideBar";

export default function AppShell({ title, onCreateTask, showSearch = false, children }) {
  const dispatch = useDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink-900 antialiased selection:bg-brand-600 selection:text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line lg:block">
        <SideBar onManageWorkspaces={() => setWorkspaceModalOpen(true)} />
      </aside>

      {/* Mobile / tablet drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-pop">
            <SideBar
              onManageWorkspaces={() => setWorkspaceModalOpen(true)}
              onNavigate={() => setDrawerOpen(false)}
              onClose={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <Header
          title={title}
          showSearch={showSearch}
          onCreateTask={onCreateTask}
          onOpenMenu={() => setDrawerOpen(true)}
        />
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <WorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
      />
    </div>
  );
}
