import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import notificationService from "../../features/notifications/notificationService";

const OPTIONS = [
  { key: "ASSIGNED", label: "Task assigned to me", hint: "When someone assigns you to a task." },
  { key: "MENTION", label: "Mentions", hint: "When someone @mentions you in a comment." },
  { key: "COMMENT", label: "Comments on my tasks", hint: "New comments on tasks assigned to you." },
  { key: "DUE_SOON", label: "Due-soon reminders", hint: "A heads-up when your task is due within 24 hours." },
];

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    let cancelled = false;
    notificationService
      .getPreferences()
      .then((res) => !cancelled && setPrefs(res.data))
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Couldn't load preferences");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (key) => {
    if (!prefs || saving[key]) return;
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next })); // optimistic
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const res = await notificationService.updatePreferences({ [key]: next });
      setPrefs(res.data);
    } catch (err) {
      setPrefs((p) => ({ ...p, [key]: !next })); // roll back
      toast.error(err.response?.data?.message || "Couldn't save that change");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  return (
    <section
      aria-labelledby="notif-prefs-title"
      className="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
    >
      <h2 id="notif-prefs-title" className="text-sm font-bold text-ink-900">
        Notifications
      </h2>
      <p className="mt-1 text-xs text-ink-400">
        Choose what you want to be told about. Workspace invitations always arrive.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger-600">
          {error}
        </p>
      )}

      {!prefs && !error && <p className="mt-4 text-xs text-ink-400">Loading…</p>}

      {prefs && (
        <ul className="mt-4 divide-y divide-line">
          {OPTIONS.map((o) => (
            <li key={o.key} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p id={`pref-${o.key}`} className="text-[13px] font-semibold text-ink-900">
                  {o.label}
                </p>
                <p className="text-xs text-ink-400">{o.hint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[o.key]}
                aria-labelledby={`pref-${o.key}`}
                disabled={Boolean(saving[o.key])}
                onClick={() => toggle(o.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 ${
                  prefs[o.key] ? "bg-brand-600" : "bg-ink-400/50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    prefs[o.key] ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
