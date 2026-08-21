import React, { useEffect } from "react";

/**
 * Shared modal shell. Every modal in the app should render through this
 * instead of duplicating the fixed/backdrop/panel markup.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - size: "sm" | "md" | "lg"  (max-width preset, default "md")
 *  - children: modal body content (you own the padding/layout inside)
 */
export default function Modal({ isOpen, onClose, size = "md", children }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size] || "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 bg-[#14151A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${sizeClass} bg-white rounded-2xl border border-[#E7E7E2] shadow-[0_20px_60px_-15px_rgba(20,21,26,0.25)] animate-[modalIn_0.18s_ease-out]`}
      >
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(6px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

/** Standard modal header — title + close button, used across all modals. */
export function ModalHeader({ title, onClose }) {
  return (
    <div className="flex justify-between items-center px-6 pt-6 pb-4">
      <h2 className="text-[15px] font-semibold text-[#14151A] tracking-tight">{title}</h2>
      <button
        onClick={onClose}
        aria-label="Close"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8B8D98] hover:text-[#14151A] hover:bg-[#F2F2EE] transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}