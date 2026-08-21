import React from "react";

/**
 * The "Pulse" in TaskPulse — a heartbeat line used two places:
 *  - small + static next to the wordmark (variant="brand")
 *  - larger + animated as the page loading state (variant="loading")
 */
export default function PulseMark({ variant = "brand", className = "" }) {
  const isLoading = variant === "loading";

  return (
    <svg
      viewBox="0 0 120 28"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 14 H32 L40 3 L50 25 L58 14 L64 14 L70 20 L76 8 L82 14 H120"
        stroke="#FF5D3A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        strokeDasharray={isLoading ? "0.28 1" : "none"}
      >
        {isLoading && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-1"
            dur="1.1s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
}