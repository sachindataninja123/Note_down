import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LayoutDashboard, Settings, Plus, User, X } from "lucide-react";
import { setCurrentWorkspace } from "../../features/workspaces/workspaceSlice";

// Only pages that really exist belong here. Add My Tasks / Calendar /
// Analytics / Activity entries in the phase that builds each page.
const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/profile", label: "Settings", icon: Settings },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition ${
    isActive
      ? "bg-brand-50 text-brand-600"
      : "text-ink-600 hover:bg-canvas hover:text-ink-900"
  }`;

export default function Sidebar({ onManageWorkspaces, onNavigate, onClose }) {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector((s) => s.workspaces);

  const select = (workspace) => {
    dispatch(setCurrentWorkspace(workspace));
    onNavigate?.();
  };

  const itemClass = (active) =>
    `w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition cursor-pointer ${
      active
        ? "bg-brand-50 text-brand-600"
        : "text-ink-600 hover:bg-canvas hover:text-ink-900"
    }`;

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
        <span className="text-[20px] font-bold tracking-[-0.02em] text-ink-900">
          Task<span className="text-brand-600">Pulse</span>
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-canvas cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav
        aria-label="Main"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={linkClass}
              onClick={onNavigate}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>

        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Workspaces
          </p>
          <div className="space-y-0.5">
            <NavLink
              to="/"
              onClick={() => select(null)}
              className={() => itemClass(!currentWorkspace)}
            >
              <User size={17} aria-hidden="true" />
              <span className="truncate">Personal</span>
            </NavLink>

            {workspaces.map((w) => (
              <NavLink
                key={w._id}
                to="/"
                onClick={() => select(w)}
                className={() => itemClass(currentWorkspace?._id === w._id)}
              >
                <span className="flex h-4.25 w-4.25 shrink-0 items-center justify-center rounded bg-brand-100 text-[10px] font-bold text-brand-600">
                  {w.name?.[0]?.toUpperCase() || "W"}
                </span>
                <span className="truncate">{w.name}</span>
              </NavLink>
            ))}

            <button
              type="button"
              onClick={() => {
                onManageWorkspaces();
                onNavigate?.();
              }}
              className={itemClass(false)}
            >
              <Plus size={17} aria-hidden="true" />
              New / manage workspaces
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
