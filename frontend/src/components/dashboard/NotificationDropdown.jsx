import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getStatus, subscribeStatus } from "../../lib/socket";
import { setCurrentWorkspace } from "../../features/workspaces/workspaceSlice";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../features/notifications/notificationSlice";

export default function NotificationDropdown() {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspaces);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const socketStatus = useSyncExternalStore(subscribeStatus, getStatus);
  const live = socketStatus === "live";

  // Live: the socket pushes new ones, so this only re-syncs every 5 minutes.
  // Not live: poll every minute (the old behaviour).
  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(
      () => dispatch(fetchNotifications()),
      live ? 300000 : 60000,
    );
    return () => clearInterval(interval);
  }, [dispatch, live]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Opens the thing the notification is about: switches to the task's
  // workspace if needed, then the dashboard opens the task's drawer.
  const handleOpen = async (n) => {
    if (!n.isRead) {
      dispatch(markNotificationAsRead(n._id))
        .unwrap()
        .catch(() => {});
    }
    if (!n.task) {
      toast.error("That task no longer exists");
      return;
    }
    const targetId = n.task.workspace || null;
    const currentId = currentWorkspace?._id || null;
    if (targetId !== currentId) {
      const target = targetId ? workspaces.find((w) => w._id === targetId) : null;
      if (targetId && !target) {
        toast.error("You no longer have access to that workspace");
        return;
      }
      dispatch(setCurrentWorkspace(target));
    }
    setIsOpen(false);
    navigate(`/?task=${n.task._id}`);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err || "Failed to clear notifications");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg bg-[#F7F7F5] border border-transparent text-[#63656F] hover:text-ink-900 hover:border-line transition cursor-pointer"
        title="Notifications"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5D3A] text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white border border-line shadow-[0_20px_60px_-15px_rgba(20,21,26,0.25)] p-4 z-50 animate-[modalIn_0.15s_ease-out]">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#EEF2FF] text-[#2F5DFF] font-semibold px-2 py-0.5 rounded-full border border-[#DCE3FF]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#2F5DFF] hover:text-[#1E46E0] font-medium cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[#B4B5BD]">
                <p className="text-xs">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpen(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpen(n);
                    }
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                    n.isRead
                      ? "bg-white border-line text-ink-400"
                      : "bg-[#FAFAF8] border-[#DCE3FF] text-ink-900"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold">{n.title}</p>
                    <p className="text-[11px] text-ink-400 leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-[#B4B5BD] block pt-1 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#2F5DFF] shrink-0 mt-1" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  );
}