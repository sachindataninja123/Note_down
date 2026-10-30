import { TASK_STATUSES } from "../../features/tasks/taskStatus";

/** Keyboard/touch-friendly alternative to dragging a card between columns. */
export default function StatusSelect({ value, onChange, disabled, className = "" }) {
  return (
    <select
      value={value}
      disabled={disabled}
      aria-label="Task status"
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-md border border-line bg-surface px-1.5 py-1 text-[11px] font-semibold text-ink-600 outline-none focus:border-brand-600 disabled:opacity-60 cursor-pointer ${className}`}
    >
      {TASK_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
