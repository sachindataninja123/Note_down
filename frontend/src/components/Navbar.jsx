import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { setSearchQuery } from "../features/tasks/taskSlice";
import { logout } from "../features/auth/authSlice";
import { fetchWorkspaces } from "../features/workspaces/workspaceSlice";
import NotificationDropdown from "./dashboard/NotificationDropdown";
import WorkspaceModal from "./dashboard/WorkspaceModal";
import WorkspaceSwitcher from "./dashboard/WorkspaceSwitcher";
import { Link } from "react-router-dom";
import { User } from "lucide-react";

const SEARCH_DEBOUNCE_MS = 400;

export default function Navbar({ onOpenTaskModal }) {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const searchQuery = useSelector((state) => state.tasks.searchQuery);

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // CHANGED: local, immediate state for the input's displayed value.
  // `searchQuery` in Redux — the thing that actually triggers a
  // fetchTasks call — only updates after typing pauses. Shared by both
  // the desktop and mobile search fields so they stay in sync with each
  // other and with Redux.
  const [searchInput, setSearchInput] = useState(searchQuery);

  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initial workspaces fetch
  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  // CHANGED: debounce — only dispatch to Redux (and therefore only refetch
  // tasks) 400ms after the user stops typing, instead of on every
  // keystroke. Matters more now since search results aren't cached at all
  // on the backend (see taskCache.js) — every dispatched search is a live,
  // uncached DB query.
  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(setSearchQuery(searchInput));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput, dispatch]);

  // Global Cmd/Ctrl + K hotkey listener to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsMobileSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Outside click listener for profile dropdown
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  // Memoize user initials to prevent redundant regex string operations
  const userInitials = useMemo(() => {
    if (!user?.name) return "TP";
    return user.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name]);

  // CHANGED: updates local state only — the debounce effect above is what
  // actually dispatches to Redux.
  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  const handleLogout = useCallback(() => {
    setIsProfileMenuOpen(false);
    dispatch(logout());
    toast.success("Logged out successfully");
  }, [dispatch]);

  const handleOpenWorkspaceSettings = useCallback(() => {
    setIsProfileMenuOpen(false);
    setIsWorkspaceModalOpen(true);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#EAEAE5] bg-white/90 backdrop-blur-xl">
        <div className="max-w-330 mx-auto px-3 sm:px-5 lg:px-8">
          <div className="h-17 flex items-center gap-3">
            {/* BRAND */}
            <div className="flex items-center md:gap-2 gap-1.5 shrink-0">
              <div className="relative w-10 h-10 sm:w-10 sm:h-10 rounded-[13px] bg-[#432DD7] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(67,45,215,0.20)] overflow-hidden">
                <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                <svg
                  className="relative w-4.25 h-4.25 sm:w-4.75 sm:h-4.75"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[19px] sm:text-[20px] font-bold tracking-[-0.02em] text-[#17181D] leading-none">
                    Task<span className="text-[#432DD7]">Pulse</span>
                  </span>
                </div>
                <div className="mt-1">
                  <WorkspaceSwitcher
                    onOpenSettings={handleOpenWorkspaceSettings}
                  />
                </div>
              </div>
            </div>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:block flex-1 max-w-120 mx-auto px-4 lg:px-8">
              <div className="relative group">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7A8B0] group-focus-within:text-[#432DD7] transition-colors pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tasks..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full h-10 pl-10 pr-16 rounded-xl bg-[#F7F7F5] border border-transparent text-[13px] text-[#17181D] placeholder:text-[#A7A8B0] outline-none transition-all duration-200 hover:bg-[#F4F4F2] focus:bg-white focus:border-[#432DD7]/25 focus:ring-4 focus:ring-[#432DD7]/[0.07]"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-[#E7E7E2] text-[9px] font-medium text-[#A7A8B0] shadow-sm select-none pointer-events-none">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </div>
            </div>

            {/* RIGHT ACTIONS */}
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* Mobile Search Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen((prev) => !prev)}
                aria-label="Toggle Search"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-[#686A74] hover:text-[#17181D] hover:bg-[#F5F5F3] active:scale-95 transition cursor-pointer"
              >
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileSearchOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  )}
                </svg>
              </button>

              {/* New Task Button */}
              <button
                type="button"
                onClick={onOpenTaskModal}
                className="group h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl bg-[#432DD7] hover:bg-[#3824C2] text-white text-[12px] sm:text-[13px] font-semibold flex items-center gap-1.5 shadow-[0_5px_16px_rgba(67,45,215,0.20)] hover:shadow-[0_7px_20px_rgba(67,45,215,0.25)] active:scale-[0.97] transition-all duration-200 cursor-pointer"
              >
                <svg
                  className="w-3.75 h-3.75"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">New Task</span>
              </button>

              <div className="hidden sm:block w-px h-7 bg-[#E8E8E3] mx-1" />

              {/* Notifications */}
              <div className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F7F7F5] transition">
                <NotificationDropdown />
              </div>

              {/* PROFILE MENU */}
              <div ref={profileRef} className="relative ml-0.5">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F7F7F5] transition cursor-pointer outline-none"
                >
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br from-[#432DD7] to-[#6654E8] flex items-center justify-center text-white text-[10px] sm:text-[11px] font-bold shadow-[0_3px_10px_rgba(67,45,215,0.20)] select-none">
                    {userInitials}
                    <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-white" />
                  </div>

                  <div className="hidden lg:block text-left max-w-30">
                    <p className="text-[11px] font-semibold text-[#17181D] truncate leading-tight">
                      {user?.name || "User"}
                    </p>
                    <p className="text-[9px] text-[#9899A2] truncate leading-tight">
                      {user?.email || ""}
                    </p>
                  </div>

                  <svg
                    className={`hidden sm:block w-3 h-3 text-[#9A9BA3] transition-transform duration-200 ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown Panel */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-62.5 bg-white border border-[#E7E7E2] rounded-2xl shadow-[0_18px_50px_rgba(20,20,30,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 rounded-xl bg-[#F8F8F6] border border-[#EEEEEA]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#432DD7] to-[#6654E8] flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                          {userInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-[#17181D] truncate leading-tight">
                            {user?.name || "User"}
                          </p>
                          <p className="text-[10px] text-[#9899A2] truncate mt-0.5 leading-tight">
                            {user?.email || ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-0.3">
                      <Link to="/profile" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#555761] hover:text-[#17181D] hover:bg-[#F7F7F5] transition cursor-pointer">
                        <User size={17} />
                        Profile{" "}
                      </Link>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleOpenWorkspaceSettings}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#555761] hover:text-[#17181D] hover:bg-[#F7F7F5] transition cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4 text-[#8C8E98]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M3 7.5L12 3l9 4.5M4.5 9.5v7L12 20l7.5-3.5v-7M8 5l9 4.5"
                          />
                        </svg>
                        Workspace Settings
                      </button>

                      <div className="h-px bg-[#ECECE7] my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold text-[#E14A2C] hover:bg-[#FFF2EE] transition cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH COLLAPSIBLE */}
        {isMobileSearchOpen && (
          <div className="md:hidden px-3 pb-3 border-t border-[#ECECE6] bg-white animate-in slide-in-from-top-2 fade-in duration-150">
            <div className="relative pt-3">
              <svg
                className="absolute left-3.5 top-[calc(50%+6px)] -translate-y-1/2 w-4 h-4 text-[#A7A8B0]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                autoFocus
                placeholder="Search your tasks..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F7F7F5] border border-transparent text-[13px] text-[#17181D] placeholder:text-[#A7A8B0] outline-none focus:bg-white focus:border-[#432DD7]/25 focus:ring-4 focus:ring-[#432DD7]/[0.07] transition-all"
              />
            </div>
          </div>
        )}
      </header>

      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />
    </>
  );
}
