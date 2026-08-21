import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../features/notifications/notificationSlice";

export default function NotificationDropdown() {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

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

  const handleMarkRead = async (id, title) => {
    try {
      await dispatch(markNotificationAsRead(id)).unwrap();
      toast.success(`Marked "${title}" as read`);
    } catch (err) {
      toast.error(err || "Failed to update notification");
    }
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
        className="relative p-2.5 rounded-lg bg-[#F7F7F5] border border-transparent text-[#63656F] hover:text-[#14151A] hover:border-[#ECECE6] transition cursor-pointer"
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
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white border border-[#ECECE6] shadow-[0_20px_60px_-15px_rgba(20,21,26,0.25)] p-4 z-50 animate-[modalIn_0.15s_ease-out]">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECE6]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#14151A]">Notifications</span>
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
                  onClick={() => !n.isRead && handleMarkRead(n._id, n.title)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    n.isRead
                      ? "bg-white border-[#ECECE6] text-[#8B8D98]"
                      : "bg-[#FAFAF8] border-[#DCE3FF] text-[#14151A]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold">{n.title}</p>
                    <p className="text-[11px] text-[#8B8D98] leading-relaxed">{n.message}</p>
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