import { History } from "lucide-react";
import { describeActivity, timeAgo } from "../../utils/activityText";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

const initials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

/** Presentational timeline; data comes from useActivityFeed. */
export default function ActivityTimeline({
  feed,
  showTask = true,
  emptyTitle = "No activity yet",
  emptyDescription = "Actions on tasks will show up here.",
  compact = false,
}) {
  const { items, isLoading, error, hasMore, loadingMore, loadMoreError, loadMore } = feed;

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading activity">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex animate-pulse gap-3">
            <div className="h-8 w-8 rounded-full bg-canvas" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-3/4 rounded bg-canvas" />
              <div className="h-2.5 w-1/4 rounded bg-canvas" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <p role="alert" className="rounded-xl border border-danger-50 bg-danger-50 px-3 py-2 text-xs text-danger-600">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return compact ? (
      <p className="text-xs text-ink-400">{emptyDescription}</p>
    ) : (
      <EmptyState icon={History} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div>
      <ol className="space-y-3.5">
        {items.map((a) => {
          const name = a.actor?.name || "Someone";
          return (
            <li key={a._id} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-600"
              >
                {initials(a.actor?.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-ink-600 wrap-break-word">
                  <span className="font-semibold text-ink-900">{name}</span>{" "}
                  {describeActivity(a, { showTask })}
                </p>
                <time
                  dateTime={a.createdAt}
                  title={new Date(a.createdAt).toLocaleString()}
                  className="text-[11px] text-ink-400"
                >
                  {timeAgo(a.createdAt)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>

      {loadMoreError && (
        <p role="alert" className="mt-3 text-xs text-danger-600">{loadMoreError}</p>
      )}
      {hasMore && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>
            {loadMoreError ? "Retry" : "Show more"}
          </Button>
        </div>
      )}
    </div>
  );
}
