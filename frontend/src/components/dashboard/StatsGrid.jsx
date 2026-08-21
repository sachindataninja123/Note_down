import React from "react";

export default function StatsGrid({ stats }) {
  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      badge: "Workspace",
      valueColor: "text-[#14151A]",
      badgeClass: "bg-[#F2F2EE] text-[#63656F]",
    },
    {
      label: "Pending",
      value: stats.pending,
      badge: "In Progress",
      valueColor: "text-[#B7791F]",
      badgeClass: "bg-[#FFF7E6] text-[#B7791F] border border-[#FDE7B8]",
    },
    {
      label: "Completed",
      value: stats.completed,
      badge: "Done",
      valueColor: "text-[#178A4C]",
      badgeClass: "bg-[#EFFAF3] text-[#178A4C] border border-[#CDEFDC]",
    },
    {
      label: "Completion Rate",
      value: `${stats.progressPercent}%`,
      badge: "Velocity",
      valueColor: "text-[#2F5DFF]",
      badgeClass: "bg-[#EEF2FF] text-[#2F5DFF] border border-[#DCE3FF]",
      progress: stats.progressPercent,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white p-5 rounded-2xl border border-[#ECECE6] hover:border-[#D8D8D2] transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide">{c.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${c.badgeClass}`}>{c.badge}</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-[28px] font-bold tracking-tight font-mono ${c.valueColor}`}>{c.value}</span>
            {c.progress !== undefined && (
              <div className="w-20 bg-[#F2F2EE] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#2F5DFF] h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${c.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}