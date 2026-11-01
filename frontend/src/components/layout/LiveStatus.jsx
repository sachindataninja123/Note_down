import { useSyncExternalStore } from "react";
import { getStatus, subscribeStatus } from "../../lib/socket";

const COPY = {
  live: { label: "Live", hint: "Changes from teammates appear instantly.", dot: "bg-success-600" },
  connecting: { label: "Reconnecting", hint: "Trying to reconnect. The page refreshes itself every minute meanwhile.", dot: "bg-warning-600" },
  offline: { label: "Offline", hint: "Live updates are paused. The page refreshes itself every minute.", dot: "bg-ink-400" },
};

export default function LiveStatus() {
  const status = useSyncExternalStore(subscribeStatus, getStatus);
  const c = COPY[status];
  return (
    <span
      title={c.hint}
      role="status"
      aria-label={`Live updates: ${c.label}. ${c.hint}`}
      className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink-600 sm:inline-flex"
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
