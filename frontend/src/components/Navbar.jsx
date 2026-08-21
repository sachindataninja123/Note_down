import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { setSearchQuery } from "../features/tasks/taskSlice";
import { logout } from "../features/auth/authSlice";
import { fetchWorkspaces } from "../features/workspaces/workspaceSlice";
import NotificationDropdown from "./dashboard/NotificationDropdown";
import WorkspaceModal from "./dashboard/WorkspaceModal";
import WorkspaceSwitcher from "./dashboard/WorkspaceSwitcher";
import PulseMark from "./PulseMark";

export default function Navbar({ onOpenTaskModal }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { searchQuery } = useSelector((state) => state.tasks);

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const getInitials = (name) => {
    if (!name) return "TP";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#ECECE6]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-4">
          {/* Brand & Workspace Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-[#432DD7] flex items-center justify-center text-white shrink-0">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[24px] font-bold tracking-tight text-[#432DD7]">TaskPulse</span>
                <PulseMark variant="brand" className="w-9 h-4 hidden sm:block" />
              </div>
              {/* FIX: this used to be a native <select> populated only from
                  `workspaces`, so "Personal" had no entry in the list once
                  the user belonged to any workspace — there was no way to
                  switch back. WorkspaceSwitcher always lists Personal first. */}
              <WorkspaceSwitcher onOpenSettings={() => setIsWorkspaceModalOpen(true)} />
            </div>
          </div>

          {/* Global Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full group">
              <svg
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B4B5BD] group-focus-within:text-[#2F5DFF] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#F7F7F5] border border-transparent rounded-lg text-[#14151A] placeholder-[#B4B5BD] focus:outline-none focus:bg-white focus:border-[#2F5DFF]/40 focus:ring-2 focus:ring-[#2F5DFF]/10 transition-all"
              />
            </div>
          </div>

          {/* Actions & Notifications */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenTaskModal}
              className="bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white text-[13px] font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Task</span>
            </button>

            <NotificationDropdown />

            <div className="h-6 w-px bg-[#ECECE6] hidden sm:block" />

            <div className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-[#F7F7F5] transition">
              <div className="w-7 h-7 rounded-lg bg-[#2F5DFF] flex items-center justify-center font-bold text-white text-[11px] shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[12px] font-semibold text-[#14151A] leading-tight">{user?.name || "User"}</p>
                <p className="text-[10px] text-[#8B8D98] leading-tight truncate max-w-28">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  dispatch(logout());
                  toast.success("Logged out successfully");
                }}
                title="Log out"
                className="text-[#B4B5BD] hover:text-[#E14A2C] p-1.5 rounded-md hover:bg-[#FFF1EC] transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <WorkspaceModal isOpen={isWorkspaceModalOpen} onClose={() => setIsWorkspaceModalOpen(false)} />
    </>
  );
}