export default function StatTile({ label, value, caption, icon: Icon, iconColor }) {
  return (
    <div className="viz-root rounded-2xl border border-line bg-(--viz-surface) p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-(--viz-muted)">
          {label}
        </span>
        {Icon && <Icon size={15} aria-hidden="true" style={{ color: iconColor }} />}
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-none text-(--viz-ink)">{value}</p>
      {caption && <p className="mt-2 text-xs text-(--viz-ink-2)">{caption}</p>}
    </div>
  );
}
