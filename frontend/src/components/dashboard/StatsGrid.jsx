import { useMemo } from "react";

export default function StatsGrid({ stats }) {
  const cards = useMemo(
    () => [
      {
        label: "Total Tasks",
        value: stats.total,
        badge: "All",
        valueColor: "text-[#14151A]",
        badgeClass: "bg-[#F2F2EE] text-[#63656F]",
      },
      {
        label: "To Do",
        value: stats.todo,
        badge: "Not started",
        valueColor: "text-[#63656F]",
        badgeClass: "bg-[#F2F2EE] text-[#63656F]",
      },
      {
        label: "In Progress",
        value: stats.inProgress,
        badge: stats.inReview ? `${stats.inReview} in review` : "Active",
        valueColor: "text-[#B7791F]",
        badgeClass: "bg-[#FFF7E6] text-[#B7791F] border border-[#FDE7B8]",
      },
      {
        label: "Done",
        badge: `${stats.progressPercent}%`,
        value: stats.completed,
        valueColor: "text-[#178A4C]",
        badgeClass: "bg-[#EFFAF3] text-[#178A4C] border border-[#CDEFDC]",
        progress: stats.progressPercent,
      },
    ],
    [stats]
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 mb-5 sm:mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="
            group
            relative
            flex
            flex-col
            justify-between
            bg-white
            p-3
            sm:p-4
            lg:p-5
            rounded-xl
            sm:rounded-2xl
            border
            border-[#ECECE6]
            shadow-[0_2px_8px_rgba(20,21,26,0.02)]
            hover:border-[#D8D8D2]
            hover:shadow-[0_6px_20px_rgba(20,21,26,0.04)]
            transition-all
            duration-200
            overflow-hidden
          "
        >
          {/* Top border accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-[#F7F7F5] group-hover:bg-[#E4E4DF] transition-colors" />

          {/* Card Header: Label & Status Badge */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8B8D98] uppercase tracking-[0.06em] truncate">
              {card.label}
            </span>

            <span
              className={`
                shrink-0
                text-[8px]
                sm:text-[9.5px]
                font-semibold
                px-1.5
                py-0.5
                rounded-md
                leading-none
                ${card.badgeClass}
              `}
            >
              {card.badge}
            </span>
          </div>

          {/* Card Body: Metric Counter & Progress Bar */}
          <div className="mt-2.5 sm:mt-3.5 lg:mt-4 flex items-baseline justify-between gap-2">
            <span
              className={`
                text-[22px]
                sm:text-[26px]
                lg:text-[28px]
                font-extrabold
                tracking-tight
                leading-none
                truncate
                ${card.valueColor}
              `}
            >
              {card.value}
            </span>

            {/* Optional Progress Track for Completion Rate */}
            {card.progress !== undefined && (
              <div className="w-10 sm:w-14 lg:w-16 shrink-0 self-center">
                <div className="w-full bg-[#F2F2EE] h-1.5 sm:h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#178A4C] h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(Math.max(card.progress, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}