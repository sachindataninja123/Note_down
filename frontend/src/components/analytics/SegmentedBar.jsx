import { useEffect, useRef, useState } from "react";

const GAP = 2;
const MIN_LABEL_PX = 44; // "100%" at 11px plus padding

// White or near-black text, whichever reads better on the segment's fill.
const luminance = (hex) => {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const textOn = (hex) => {
  const l = luminance(hex);
  const white = 1.05 / (l + 0.05);
  const dark = (l + 0.05) / (luminance("#0b0b0b") + 0.05);
  return white >= dark ? "#ffffff" : "#0b0b0b";
};

/**
 * One whole split into parts (tall segmented bar, <= 6 parts).
 * parts: [{ key, label, value, color }] in display order. A share is printed on
 * a block only when it fits; every value is also in the tooltip and the table.
 */
export default function SegmentedBar({ parts }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const total = parts.reduce((s, p) => s + p.value, 0);
  const visible = parts.filter((p) => p.value > 0);
  const usable = Math.max(0, width - GAP * Math.max(0, visible.length - 1));
  const pct = (v) => `${Math.round((v / total) * 100)}%`;
  const summary = parts.map((p) => `${p.label}: ${p.value}`).join(", ");

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          role="group"
          aria-label={`Tasks by status. ${summary}.`}
          className="flex h-7"
          style={{ gap: GAP }}
          onMouseLeave={() => setActive(null)}
        >
          {visible.map((p) => {
            const px = (p.value / total) * usable;
            return (
              <div
                key={p.key}
                tabIndex={0}
                onMouseEnter={() => setActive(p.key)}
                onFocus={() => setActive(p.key)}
                onBlur={() => setActive(null)}
                aria-label={`${p.label}: ${p.value} (${pct(p.value)})`}
                className="flex min-w-0 items-center overflow-hidden rounded text-[11px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-600"
                style={{
                  flex: `${p.value} 1 0`,
                  background: p.color,
                  color: textOn(p.color),
                  filter: active === p.key ? "brightness(0.9)" : "none",
                }}
              >
                {px >= MIN_LABEL_PX ? <span className="px-2">{pct(p.value)}</span> : null}
              </div>
            );
          })}
        </div>

        {active && (
          <div
            role="status"
            className="pointer-events-none absolute top-9 z-10 whitespace-nowrap rounded-lg border border-line bg-(--viz-surface) px-2.5 py-1.5 shadow-pop"
            style={{ left: 0 }}
          >
            {(() => {
              const p = parts.find((x) => x.key === active);
              return (
                <>
                  <div className="text-sm font-semibold text-(--viz-ink)">
                    {p.value} {p.value === 1 ? "task" : "tasks"} · {pct(p.value)}
                  </div>
                  <div className="text-[11px] text-(--viz-ink-2)">{p.label}</div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* names only; the numbers live on the bar, in the tooltip and in the table */}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5 text-xs text-(--viz-ink-2)">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
