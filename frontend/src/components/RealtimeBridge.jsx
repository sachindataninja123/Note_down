import { useEffect, useRef, useSyncExternalStore } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  getStatus,
  subscribeStatus,
} from "../lib/socket";
import { refreshTasks } from "../features/tasks/taskSlice";
import { fetchWorkspaces } from "../features/workspaces/workspaceSlice";
import { fetchComments } from "../features/comments/commentSlice";
import {
  fetchNotifications,
  notificationReceived,
} from "../features/notifications/notificationSlice";

const REFRESH_DEBOUNCE_MS = 300;
const BUSY_RETRY_MS = 600;
const BUSY_RETRIES = 5;
const POLL_WHEN_OFFLINE_MS = 60000;

/**
 * Keeps Redux in step with the server while the user is signed in.
 * Renders nothing. Events only say WHAT changed; the data is re-read over the
 * normal REST endpoints, so permissions and filters stay exactly as they are
 * without sockets. If the socket is down, REST polling takes over.
 */
export default function RealtimeBridge() {
  const dispatch = useDispatch();
  const store = useStore();
  const user = useSelector((s) => s.auth.user);
  const userId = user?._id || user?.id || null;
  const scopeId = useSelector((s) => s.workspaces.currentWorkspace?._id || null);
  const status = useSyncExternalStore(subscribeStatus, getStatus);

  const scopeRef = useRef(scopeId);
  const joinedRef = useRef(null);

  // ---- connection lifecycle + event wiring (one per signed-in user) ----
  useEffect(() => {
    if (!userId) return undefined;

    const socket = getSocket();
    let refreshTimer = null;
    let hasConnected = false;
    let lastAuthRetry = 0;

    const refreshList = (attempt = 0) => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        const result = await dispatch(refreshTasks());
        if (result.payload?.skipped === "busy" && attempt < BUSY_RETRIES) {
          refreshList(attempt + 1);
        }
      }, attempt === 0 ? REFRESH_DEBOUNCE_MS : BUSY_RETRY_MS);
    };

    const joinCurrent = () => {
      const want = scopeRef.current;
      const had = joinedRef.current;
      if (had && had !== want) socket.emit("workspace:leave", had);
      joinedRef.current = null;
      if (!want) return;
      socket.emit("workspace:join", want, (res) => {
        if (res?.ok) joinedRef.current = want;
      });
    };

    const onConnect = () => {
      joinCurrent();
      if (hasConnected) {
        // Back after a gap: anything may have changed. REST catches us up.
        dispatch(refreshTasks());
        dispatch(fetchNotifications());
        dispatch(fetchWorkspaces());
      }
      hasConnected = true;
    };

    const inCurrentScope = (ev) => (ev?.workspace || null) === scopeRef.current;

    const onTaskEvent = (ev) => {
      if (inCurrentScope(ev)) refreshList();
    };

    const onComment = (ev) => {
      if (!ev?.taskId) return;
      const loaded = store.getState().comments.commentsByTask[ev.taskId];
      if (loaded) dispatch(fetchComments(ev.taskId));
    };

    const onNotification = (notification) => {
      dispatch(notificationReceived(notification));
      toast(`${notification.title}: ${notification.message}`, { duration: 5000 });
    };

    const onWorkspaceChanged = () => {
      dispatch(fetchWorkspaces());
      refreshList();
    };

    const onConnectError = (err) => {
      // Access token expired: a harmless REST call lets the axios interceptor
      // refresh the cookie, then we try the socket once more.
      if (err?.message !== "unauthorized") return;
      if (Date.now() - lastAuthRetry < 30000) return;
      lastAuthRetry = Date.now();
      api
        .get("/auth/profile")
        .then(() => connectSocket())
        .catch(() => {});
    };

    // A network drop reconnects by itself. A disconnect initiated by the
    // server does not, so we ask again after a short pause.
    let reconnectTimer = null;
    const onDisconnect = (reason) => {
      joinedRef.current = null;
      if (reason === "io server disconnect") {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectSocket, 1500);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("task:upserted", onTaskEvent);
    socket.on("task:deleted", onTaskEvent);
    socket.on("comment:changed", onComment);
    socket.on("notification:new", onNotification);
    socket.on("workspace:changed", onWorkspaceChanged);
    connectSocket();

    return () => {
      clearTimeout(refreshTimer);
      clearTimeout(reconnectTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("task:upserted", onTaskEvent);
      socket.off("task:deleted", onTaskEvent);
      socket.off("comment:changed", onComment);
      socket.off("notification:new", onNotification);
      socket.off("workspace:changed", onWorkspaceChanged);
      joinedRef.current = null;
      disconnectSocket();
    };
  }, [userId, dispatch, store]);

  // ---- follow the workspace the user is looking at ----
  useEffect(() => {
    scopeRef.current = scopeId;
    const socket = getSocket();
    if (!userId || !socket.connected) return;
    const had = joinedRef.current;
    if (had && had !== scopeId) socket.emit("workspace:leave", had);
    joinedRef.current = null;
    if (!scopeId) return;
    socket.emit("workspace:join", scopeId, (res) => {
      if (res?.ok) joinedRef.current = scopeId;
    });
  }, [scopeId, userId]);

  // ---- REST fallback while the socket is not live ----
  useEffect(() => {
    if (!userId || status === "live") return undefined;
    const timer = setInterval(() => {
      dispatch(refreshTasks());
      dispatch(fetchNotifications());
    }, POLL_WHEN_OFFLINE_MS);
    return () => clearInterval(timer);
  }, [userId, status, dispatch]);

  return null;
}
