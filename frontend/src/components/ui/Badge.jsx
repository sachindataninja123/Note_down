const TONES = {
  neutral: "bg-canvas text-ink-600 border-line",
  brand: "bg-brand-50 text-brand-600 border-brand-100",
  success: "bg-success-50 text-success-600 border-success-50",
  warning: "bg-warning-50 text-warning-600 border-warning-50",
  danger: "bg-danger-50 text-danger-600 border-danger-50",
  info: "bg-info-50 text-info-600 border-info-50",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
