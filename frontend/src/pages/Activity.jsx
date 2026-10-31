import { useCallback } from "react";
import { useSelector } from "react-redux";
import AppShell from "../components/layout/AppShell";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import useActivityFeed from "../hooks/useActivityFeed";
import activityService from "../features/activity/activityService";

export default function Activity() {
  const currentWorkspace = useSelector((s) => s.workspaces.currentWorkspace);
  const scope = currentWorkspace?._id || "personal";

  const fetchPage = useCallback(
    (cursor) => activityService.getFeed(scope, { before: cursor, limit: 20 }),
    [scope],
  );
  const feed = useActivityFeed({ scope, fetchPage });

  return (
    <AppShell title="Activity">
      <div className="max-w-3xl">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-ink-900">
            {currentWorkspace ? currentWorkspace.name : "Personal"} activity
          </h2>
          <p className="text-sm text-ink-400">
            {currentWorkspace
              ? "Everything that happened in this workspace, newest first."
              : "Your own personal-task history. Only you can see this."}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <ActivityTimeline
            feed={feed}
            emptyTitle="Nothing here yet"
            emptyDescription="Create, edit or complete a task and it will show up here."
          />
        </div>
      </div>
    </AppShell>
  );
}
