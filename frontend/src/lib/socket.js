import { io } from "socket.io-client";

// Socket.IO lives on the same server as the REST API. The API base URL ends in
// /api/v1, the socket does not.
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://note-down-gtto.onrender.com/api/v1";
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

let socket = null;
let status = "offline"; // "offline" | "connecting" | "live"
const listeners = new Set();

const setStatus = (next) => {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l());
};

// Tiny external store so components can read the connection state
// (useSyncExternalStore(subscribeStatus, getStatus)).
export const subscribeStatus = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getStatus = () => status;

export const getSocket = () => {
  if (!socket) {
    // The access-token cookie travels with the handshake (withCredentials).
    socket = io(SOCKET_URL, { withCredentials: true, autoConnect: false });
    socket.on("connect", () => setStatus("live"));
    socket.on("disconnect", () => setStatus("offline"));
    socket.on("connect_error", () => setStatus("offline"));
    socket.io.on("reconnect_attempt", () => setStatus("connecting"));
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected && !s.active) {
    setStatus("connecting");
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    setStatus("offline");
  }
};

// Sent as a header on every REST call so the server can skip echoing a change
// back to the tab that made it (that tab already has the response).
export const getSocketId = () => (socket?.connected ? socket.id : undefined);