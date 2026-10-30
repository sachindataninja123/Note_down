const VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-[0_5px_16px_rgba(67,45,215,0.20)]",
  secondary:
    "bg-surface text-ink-900 border border-line hover:bg-canvas",
  ghost: "text-ink-600 hover:bg-canvas hover:text-ink-900",
  danger: "bg-danger-600 text-white hover:bg-red-700",
};

const SIZES = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-[13px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      ) : (
        Icon && <Icon size={16} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
