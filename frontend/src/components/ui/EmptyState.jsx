export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D8D8D2] bg-[#FAFAF8] px-6 py-16 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600">
          <Icon size={20} aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 text-xs text-ink-400">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
