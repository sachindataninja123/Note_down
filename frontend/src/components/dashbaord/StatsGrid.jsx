import React from "react";

export default function StatsGrid({ stats }) {
  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      badge: "Workspace",
      color: "text-slate-100",
      bgBadge: "bg-slate-800/80 text-slate-400",
    },
    {
      label: "Pending",
      value: stats.pending,
      badge: "In Progress",
      color: "text-amber-400",
      bgBadge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    {
      label: "Completed",
      value: stats.completed,
      badge: "Done",
      color: "text-emerald-400",
      bgBadge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    {
      label: "Completion Rate",
      value: `${stats.progressPercent}%`,
      badge: "Velocity",
      color: "text-indigo-400",
      bgBadge: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
      progress: stats.progressPercent,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-slate-900/60 backdrop-blur-md p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm"
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${c.bgBadge}`}>{c.badge}</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold tracking-tight ${c.color}`}>{c.value}</span>
            {c.progress !== undefined && (
              <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${c.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}