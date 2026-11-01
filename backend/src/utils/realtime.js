// Thin, never-throwing wrapper around the Socket.IO server.
//
// Controllers call these helpers AFTER the database write succeeded. If the
// socket server isn't running (tests, a failed start) every helper is a no-op,
// and REST keeps working exactly as before.
//
// Events carry ids only. A client that is allowed to see the task fetches it
// over the normal, permission-checked REST endpoint, so a socket event can
// never leak data the REST API would refuse.

let io = null;

export const setIo = (instance) => {
  io = instance;
};

export const userRoom = (userId) => `user:${userId}`;
export const workspaceRoom = (workspaceId) => `ws:${workspaceId}`;

const safeEmit = (room, event, payload, exceptSocketId) => {
  if (!io) return;
  try {
    let target = io.to(room);
    if (exceptSocketId && typeof exceptSocketId === "string") {
      target = target.except(exceptSocketId);
    }
    target.emit(event, payload);
  } catch (err) {
    console.error("Realtime emit failed:", err.message);
  }
};

export const emitToUser = (userId, event, payload, exceptSocketId) =>
  safeEmit(userRoom(userId.toString()), event, payload, exceptSocketId);

// A task change goes to the workspace room, or to the owner's own devices for
// a personal task. The originating socket is skipped: that tab already has the
// result from its own REST response.
export const emitTaskEvent = (req, task, event) => {
  if (!io || !task) return;
  const room = task.workspace
    ? workspaceRoom(task.workspace.toString())
    : userRoom(task.owner.toString());
  safeEmit(
    room,
    event,
    {
      taskId: task._id.toString(),
      workspace: task.workspace ? task.workspace.toString() : null,
      actorId: req.user?._id?.toString() || null,
      at: new Date().toISOString(),
    },
    req.header?.("x-socket-id"),
  );
};

// Used when someone stops being a member / the workspace is deleted: their
// sockets leave the room immediately and are told to refresh their list.
export const ejectFromWorkspace = (userId, workspaceId) => {
  if (!io) return;
  try {
    io.in(userRoom(userId.toString())).socketsLeave(
      workspaceRoom(workspaceId.toString()),
    );
    emitToUser(userId, "workspace:changed", {
      workspace: workspaceId.toString(),
      reason: "removed",
    });
  } catch (err) {
    console.error("Realtime eject failed:", err.message);
  }
};

export const emitWorkspaceChanged = (workspaceId, reason) => {
  if (!workspaceId) return;
  safeEmit(workspaceRoom(workspaceId.toString()), "workspace:changed", {
    workspace: workspaceId.toString(),
    reason,
  });
};