import { LayoutList, Columns3 } from "lucide-react";

const VIEWS = [
  { value: "list", label: "List", icon: LayoutList },
  { value: "board", label: "Board", icon: Columns3 },
];

export default function ViewSwitcher({ value, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Task view"
      className="inline-flex rounded-xl border border-line bg-surface p-1"
    >
      {VIEWS.map(({ value: v, label, icon: Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-ink-600 hover:bg-canvas hover:text-ink-900"
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
