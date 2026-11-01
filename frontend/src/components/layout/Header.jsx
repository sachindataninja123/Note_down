import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LogOut, Menu, Plus, Search, User } from "lucide-react";
import { setSearchQuery } from "../../features/tasks/taskSlice";
import { logout } from "../../features/auth/authSlice";
import NotificationDropdown from "../dashboard/NotificationDropdown";
import LiveStatus from "./LiveStatus";
import Button from "../ui/Button";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Task search (debounced into Redux) and the create button only render when
 * the page supplies them, so pages like Settings don't show dead controls.
 */
export default function Header({
  title,
  onOpenMenu,
  onCreateTask,
  showSearch,
}) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const currentWorkspace = useSelector((s) => s.workspaces.currentWorkspace);
  const reduxQuery = useSelector((s) => s.tasks.searchQuery);

  const [searchInput, setSearchInput] = useState(reduxQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!showSearch) return;
    const t = setTimeout(
      () => dispatch(setSearchQuery(searchInput)),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [searchInput, showSearch, dispatch]);

  useEffect(() => {
    const onKey = (e) => {
      if (
        showSearch &&
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "k"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSearch]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const name = user?.name;
  const initials = useMemo(() => {
    if (!name) return "TP";
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [name]);

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logout());
    toast.success("Logged out successfully");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-xl lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="rounded-xl p-2 text-ink-600 hover:bg-canvas lg:hidden cursor-pointer"
      >
        <Menu size={21} strokeWidth={2} />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-bold text-ink-900">{title}</h1>
        <p className="truncate text-[11px] text-ink-400">
          {currentWorkspace ? currentWorkspace.name : "Personal"}
        </p>
      </div>

      {showSearch && (
        <div className="relative mx-auto hidden w-full max-w-md md:block">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            ref={searchRef}
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-xl border border-transparent bg-canvas pl-10 pr-14 text-[13px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-600/25 focus:bg-surface focus:ring-4 focus:ring-brand-600/[0.07]"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-400 lg:block">
            Ctrl K
          </kbd>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {onCreateTask && (
          <Button icon={Plus} onClick={onCreateTask}>
            <span className="hidden sm:inline">New Task</span>
            <span className="sr-only sm:hidden">New Task</span>
          </Button>
        )}

        <LiveStatus />
        <NotificationDropdown />

        <div ref={profileRef} className="relative">
          {user?.profilePic?.url ? (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-brand-600 to-brand-500 text-[11px] font-bold text-white cursor-pointer"
            >
              <img
                src={user.profilePic.url}
                alt="Profile"
                className="h-full w-full object-cover rounded-full"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-600 to-brand-500 text-[11px] font-bold text-white cursor-pointer"
            >
              {initials}
            </button>
          )}

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 rounded-2xl border border-line bg-surface p-2 shadow-pop"
            >
              <div className="rounded-xl bg-canvas p-3">
                <p className="truncate text-[12px] font-bold text-ink-900">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-[10px] text-ink-400">
                  {user?.email}
                </p>
              </div>
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-ink-600 hover:bg-canvas hover:text-ink-900"
              >
                <User size={16} /> Profile & password
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-danger-600 hover:bg-danger-50 cursor-pointer"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
