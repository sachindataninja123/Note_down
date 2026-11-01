import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cursor-paged feed loader.
 *
 *  scope        identifies what is being listed (workspace id, task id...).
 *               Changing it clears the list.
 *  refreshKey   changing it reloads the first page IN PLACE (old rows stay on
 *               screen), used by the task drawer after edits.
 *  fetchPage    (cursor) => Promise<{ items, nextCursor }>
 *
 * Loading is derived (the loaded scope/key differs from the requested one), so
 * the effect never calls setState synchronously.
 */
export default function useActivityFeed({ scope, refreshKey = "", fetchPage }) {
  const [state, setState] = useState({
    loadedKey: null,
    scope: null,
    items: [],
    nextCursor: null,
    error: null,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const fetchRef = useRef(fetchPage);

  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const requestKey = `${scope}|${refreshKey}`;

  useEffect(() => {
    let cancelled = false;
    fetchRef
      .current(undefined)
      .then((page) => {
        if (cancelled) return;
        setState({
          loadedKey: requestKey,
          scope,
          items: page.items,
          nextCursor: page.nextCursor,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loadedKey: requestKey,
          scope,
          items: prev.scope === scope ? prev.items : [],
          nextCursor: prev.scope === scope ? prev.nextCursor : null,
          error:
            err.response?.data?.message || err.message || "Failed to load activity",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, scope]);

  const sameScope = state.scope === scope;
  const items = sameScope ? state.items : [];
  const nextCursor = sameScope ? state.nextCursor : null;

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await fetchRef.current(nextCursor);
      setState((prev) => {
        // Cursor paging shouldn't overlap, but never render a row twice.
        const known = new Set(prev.items.map((i) => i._id));
        return {
          ...prev,
          items: [...prev.items, ...page.items.filter((i) => !known.has(i._id))],
          nextCursor: page.nextCursor,
        };
      });
    } catch (err) {
      setLoadMoreError(
        err.response?.data?.message || err.message || "Failed to load more",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  return {
    items,
    hasMore: Boolean(nextCursor),
    // First load of this scope only; in-place refreshes don't blank the list.
    isLoading: !sameScope || (state.loadedKey === null && !state.error),
    error: sameScope || state.error ? state.error : null,
    loadingMore,
    loadMoreError,
    loadMore,
  };
}