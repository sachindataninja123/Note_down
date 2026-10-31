import { useState } from "react";
import { formatDateKey } from "../../utils/dates";

const HEIGHT = 168; // plot height in px; the x-axis band is added below it

const niceMax = (m) => {
  if (m <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(m));
  return [1, 2, 5, 10].map((f) => f * mag).find((c) => c >= m);
};

const shortDate = (key) => formatDateKey(key, { month: "short", day: "numeric" });
const longDate = (key) =>
  formatDateKey(key, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

/**
 * One series of columns (value per day). Marks are capped at 24px with a
 * rounded top and a square baseline; every day's full-height slot is the
 * hover/focus target, so tiny or zero days are still easy to inspect.
 * Keyboard: focus the chart, then use the left/right arrow keys.
 */
export default function ColumnChart({ rows, valueKey, unit }) {
  const [active, setActive] = useState(null);

  const max = niceMax(Math.max(0, ...rows.map((r) => r[valueKey])));
  const ticks = [max, ...(Number.isInteger(max / 2) ? [max / 2] : []), 0];
  const labelStep = Math.ceil(rows.length / 6);
  const activeRow = active === null ? null : rows[active];

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((i) => (i === null ? 0 : Math.min(rows.length - 1, i + 1)));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => (i === null ? rows.length - 1 : Math.max(0, i - 1)));
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  const total = rows.reduce((sum, r) => sum + r[valueKey], 0);

  const dense = rows.length > 45; // 90-day view: slots are only a few px wide

  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={`${unit} per day. ${total} in total. Use the left and right arrow keys to read each day.`}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
      onMouseLeave={() => setActive(null)}
      className="relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
    >
      <div className="flex" style={{ height: HEIGHT }}>
        {/* y-axis ticks */}
        <div className="relative w-8 shrink-0" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-(--viz-muted) tabular-nums"
              style={{ top: `${(1 - t / max) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* plot */}
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden="true"
              className="absolute inset-x-0"
              style={{
                top: `${(1 - t / max) * 100}%`,
                borderTop: `1px solid ${t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}`,
              }}
            />
          ))}

          <div className="absolute inset-0 flex">
            {rows.map((row, i) => {
              const v = row[valueKey];
              const isActive = i === active;
              return (
                <div
                  key={row.date}
                  onMouseEnter={() => setActive(i)}
                  className={`flex h-full min-w-0 flex-1 items-end justify-center ${dense ? "" : "px-px"}`}
                  data-testid="slot"
                >
                  {v > 0 && (
                    <div
                      aria-hidden="true"
                      className="w-full max-w-6 transition-[filter,opacity]"
                      style={{
                        height: `${(v / max) * 100}%`,
                        background: "var(--viz-series)",
                        borderRadius: dense ? "1px 1px 0 0" : "4px 4px 0 0",
                        filter: isActive ? "brightness(0.85)" : "none",
                        opacity: active !== null && !isActive ? 0.55 : 1,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {activeRow && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-(--viz-surface) px-2.5 py-1.5 shadow-pop"
              style={{
                left: `${((active + 0.5) / rows.length) * 100}%`,
                bottom: `calc(${(activeRow[valueKey] / max) * 100}% + 8px)`,
              }}
            >
              <div className="text-sm font-semibold leading-tight text-(--viz-ink)">
                {activeRow[valueKey]} {unit}
              </div>
              <div className="text-[11px] text-(--viz-ink-2)">{longDate(activeRow.date)}</div>
            </div>
          )}
        </div>
      </div>

      {/* x-axis labels (inside the container, so nothing clips) */}
      <div className="ml-8 mt-1.5 flex" aria-hidden="true">
        {rows.map((row, i) => (
          <div key={row.date} className="relative h-4 min-w-0 flex-1">
            {i % labelStep === 0 && (
              <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-(--viz-muted)">
                {shortDate(row.date)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
