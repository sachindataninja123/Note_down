import { useId, useState } from "react";
import { BarChart3, Table2 } from "lucide-react";

/**
 * Card with a title and a chart/table switch. Every chart has a table twin so
 * no value is reachable only through color, hover or tooltip.
 */
export default function ChartCard({ title, subtitle, chart, table, className = "" }) {
  const [asTable, setAsTable] = useState(false);
  const bodyId = useId();

  return (
    <section className={`viz-root rounded-2xl border border-line bg-(--viz-surface) p-5 shadow-card ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-(--viz-ink)">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-(--viz-ink-2)">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          aria-controls={bodyId}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-(--viz-ink-2) hover:bg-canvas cursor-pointer"
        >
          {asTable ? <BarChart3 size={13} aria-hidden="true" /> : <Table2 size={13} aria-hidden="true" />}
          {asTable ? "Chart" : "Table"}
        </button>
      </header>
      <div id={bodyId}>{asTable ? table : chart}</div>
    </section>
  );
}
