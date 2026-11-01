import { useEffect, useState } from "react";
import analyticsService from "../features/analytics/analyticsService";

/**
 * Loads analytics for a scope (workspace id or "personal") and range.
 * - Changing the RANGE keeps the previous numbers on screen (isRefetching).
 * - Changing the SCOPE drops them, so one workspace's numbers are never shown
 *   under another's name (isInitialLoading).
 * Loading flags are derived, so the effect never calls setState synchronously.
 */
export default function useAnalytics({ scope, range }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, scope: null, data: null, error: null });

  const key = `${scope}|${range}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    analyticsService
      .getAnalytics(scope, { range })
      .then((data) => {
        if (!cancelled) setState({ key, scope, data, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({
          key,
          scope,
          data: prev.scope === scope ? prev.data : null,
          error: err.response?.data?.message || err.message || "Failed to load analytics",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [key, scope, range]);

  const sameScope = state.scope === scope;
  return {
    data: sameScope ? state.data : null,
    error: sameScope ? state.error : null,
    isInitialLoading: !sameScope,
    isRefetching: sameScope && state.key !== key,
    retry: () => setAttempt((n) => n + 1),
  };
}