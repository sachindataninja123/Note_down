import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AlertTriangle, BarChart3, CalendarClock, CheckCircle2, ListChecks } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import StatTile from "../components/analytics/StatTile";
import ChartCard from "../components/analytics/ChartCard";
import ColumnChart from "../components/analytics/ColumnChart";
import SegmentedBar from "../components/analytics/SegmentedBar";
import HBars from "../components/analytics/HBars";
import useAnalytics from "../hooks/useAnalytics";
import { TASK_STATUSES } from "../features/tasks/taskStatus";
import { formatDateKey } from "../utils/dates";

const RANGES = [7, 30, 90];
const PRIORITIES = ["High", "Medium", "Low"];

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function SimpleTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-line text-(--viz-muted)">
            {columns.map((c, i) => (
              <th key={c} scope="col" className={`py-2 pr-4 font-semibold ${i > 0 ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-(--viz-ink-2)">
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-line last:border-0">
              {row.map((cell, i) => (
                <td key={i} className={`py-1.5 pr-4 ${i === 0 ? "text-(--viz-ink)" : "text-right tabular-nums"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Analytics() {
  const currentWorkspace = useSelector((s) => s.workspaces.currentWorkspace);
  const scope = currentWorkspace?._id || "personal";
  const [range, setRange] = useState(30);

  const { data, error, isInitialLoading, isRefetching, retry } = useAnalytics({ scope, range });

  const scopeName = currentWorkspace ? currentWorkspace.name : "Personal tasks";

  let body;
  if (isInitialLoading && !error) {
    body = (
      <p className="py-24 text-center text-sm text-ink-400" role="status">
        Loading analytics…
      </p>
    );
  } else if (error && !data) {
    body = (
      <div role="alert" className="rounded-2xl border border-danger-50 bg-danger-50 p-5 text-sm text-danger-600">
        <p className="font-semibold">Couldn't load analytics</p>
        <p className="mt-1 text-xs">{error}</p>
        <Button className="mt-3" variant="secondary" size="sm" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  } else if (data && data.totals.total === 0) {
    body = (
      <EmptyState
        icon={BarChart3}
        title="No tasks to analyse yet"
        description={`Create tasks in ${scopeName} and the numbers will appear here.`}
        action={
          <Link to="/" className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white hover:bg-brand-700">
            Go to Overview
          </Link>
        }
      />
    );
  } else if (data) {
    const { totals, byStatus, byPriority, trend, period, workload } = data;

    const statusParts = TASK_STATUSES.map((s) => ({
      key: s.value,
      label: s.label,
      value: byStatus[s.value],
      color: `var(--viz-st-${s.value})`,
    }));
    // The segmented bar needs concrete hex values to choose its text colour.
    const STATUS_HEX = { todo: "#86b6ef", in_progress: "#3987e5", in_review: "#1c5cab", done: "#0d366b" };
    const statusPartsHex = statusParts.map((p) => ({ ...p, color: STATUS_HEX[p.key] }));

    body = (
      <div className={`space-y-6 transition-opacity ${isRefetching ? "opacity-60" : ""}`} aria-busy={isRefetching}>
        {error && (
          <p role="alert" className="rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger-600">
            Couldn't refresh: {error} <button type="button" onClick={retry} className="font-semibold underline cursor-pointer">Retry</button>
          </p>
        )}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Right now</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Total tasks" value={totals.total} icon={ListChecks} iconColor="var(--viz-muted)" caption={`${totals.open} still open`} />
            <StatTile label="Completed" value={`${totals.completionRate}%`} icon={CheckCircle2} iconColor="var(--viz-muted)" caption={`${totals.done} of ${totals.total} done`} />
            <StatTile label="Overdue" value={totals.overdue} icon={AlertTriangle} iconColor="var(--viz-critical)" caption={totals.overdue ? "Open tasks past their due date" : "Nothing overdue"} />
            <StatTile label="Due today" value={totals.dueToday} icon={CalendarClock} iconColor="var(--viz-muted)" caption={`${plural(totals.upcoming, "task")} due in the next 7 days`} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            className="lg:col-span-2"
            title="Completed per day"
            subtitle={`Last ${data.range.days} days · ${period.completed} completed, ${period.created} created`}
            chart={<ColumnChart rows={trend} valueKey="completed" unit="completed" />}
            table={
              <div className="max-h-72 overflow-y-auto">
                <SimpleTable
                  columns={["Day", "Completed", "Created"]}
                  rows={[...trend].reverse().map((r) => [formatDateKey(r.date), r.completed, r.created])}
                />
              </div>
            }
          />

          <ChartCard
            title="Tasks by status"
            subtitle="All tasks in this view, as they are now"
            chart={<SegmentedBar parts={statusPartsHex} />}
            table={
              <SimpleTable
                columns={["Status", "Tasks", "Share"]}
                rows={statusParts.map((p) => [p.label, p.value, `${Math.round((p.value / totals.total) * 100)}%`])}
              />
            }
          />

          <ChartCard
            title="Tasks by priority"
            subtitle="All tasks in this view, as they are now"
            chart={<HBars rows={PRIORITIES.map((p) => ({ label: p, value: byPriority[p] }))} />}
            table={
              <SimpleTable
                columns={["Priority", "Tasks"]}
                rows={PRIORITIES.map((p) => [p, byPriority[p]])}
              />
            }
          />
        </div>

        {workload && (
          <section className="viz-root rounded-2xl border border-line bg-(--viz-surface) p-5 shadow-card">
            <h3 className="text-sm font-bold text-(--viz-ink)">Team workload</h3>
            <p className="mb-3 mt-0.5 text-xs text-(--viz-ink-2)">
              Tasks per assignee, listed alphabetically. A task with several assignees counts for each.
              These are workload figures, not a performance ranking.
            </p>
            <SimpleTable
              columns={["Member", "Open", "Done", "Overdue"]}
              rows={workload.map((w) => [w.name || "Unassigned", w.open, w.done, w.overdue])}
            />
          </section>
        )}
      </div>
    );
  }

  return (
    <AppShell title="Analytics">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink-900">{scopeName}</h2>
          <p className="text-sm text-ink-400 leading-4.5">
            Totals and distributions show every task right now; “Completed per day” follows the period you pick.
          </p>
        </div>

        <div role="radiogroup" aria-label="Period" className="inline-flex rounded-xl border border-line bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={range === r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                range === r ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-canvas"
              }`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {body}
    </AppShell>
  );
}
