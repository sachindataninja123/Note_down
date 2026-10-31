/**
 * Horizontal bars for an ORDERED set of categories (e.g. High/Medium/Low), one
 * colour, value at the tip. The categories keep their natural order rather than
 * being sorted by size.
 */
export default function HBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-(--viz-ink-2)">{r.label}</span>
          <div className="relative h-5 flex-1" style={{ borderLeft: "1px solid var(--viz-axis)" }}>
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0"
              style={{
                width: `${(r.value / max) * 85}%`,
                background: "var(--viz-series)",
                borderRadius: "0 4px 4px 0",
              }}
            />
            <span
              className="absolute inset-y-0 flex items-center pl-2 text-xs font-semibold text-(--viz-ink)"
              style={{ left: `${(r.value / max) * 85}%` }}
            >
              {r.value}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
