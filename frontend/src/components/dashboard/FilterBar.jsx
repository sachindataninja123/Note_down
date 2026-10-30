
import { useDispatch, useSelector } from "react-redux";
import {
  setStatusFilter,
  setAssignedToMeFilter,
} from "../../features/tasks/taskSlice";
import { setSelectedCategory } from "../../features/categories/categorySlice";
import { TASK_STATUSES } from "../../features/tasks/taskStatus";

const STATUS_TABS = [{ value: "all", label: "All" }, ...TASK_STATUSES];

// hideStatus: the Board shows every status as a column, so the tabs are hidden.
export default function FilterBar({ onOpenCategoryModal, hideStatus = false }) {
  const dispatch = useDispatch();
  const statusFilter = useSelector((state) => state.tasks.statusFilter);
  const { categories, selectedCategory } = useSelector(
    (state) => state.categories,
  );
  const assignedToMe = useSelector((state) => state.tasks.assignedToMe);
  const currentWorkspace = useSelector(
    (state) => state.workspaces.currentWorkspace);

  return (
    <div className="bg-[#FAFAF8] p-2.5 sm:p-3 rounded-2xl border border-line mb-5 sm:mb-6 flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between shadow-[0_2px_8px_rgba(20,21,26,0.015)]">
      {/* Status Segmented Control (Full width on mobile, auto on desktop) */}
      {(!hideStatus || currentWorkspace) && (
      <div className="flex items-center bg-white p-1 rounded-xl border border-line w-full md:w-auto shadow-xs overflow-x-auto">
        {!hideStatus &&
          STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => dispatch(setStatusFilter(tab.value))}
                className={`flex-1 md:flex-none whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.98] ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-sm shadow-[#432DD7]/25"
                    : "text-[#63656F] hover:text-ink-900 hover:bg-[#F7F7F5]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        {currentWorkspace && (
          <button
            type="button"
            onClick={() => dispatch(setAssignedToMeFilter(!assignedToMe))}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold shrink-0 transition-all cursor-pointer border select-none active:scale-95 ${
              assignedToMe
                ? "bg-[#2F5DFF] text-white border-[#2F5DFF]"
                : "bg-white text-[#63656F] border-line hover:border-[#D8D8D2]"
            }`}
          >
            Assigned to me
          </button>
        )}
      </div>
      )}

      {/* Category Pills (Touch-Friendly Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scroll-smooth [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
        {/* All Tags Pill */}
        <button
          type="button"
          onClick={() => dispatch(setSelectedCategory("All"))}
          className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold shrink-0 transition-all cursor-pointer border select-none active:scale-95 ${
            selectedCategory === "All"
              ? "bg-[#17181D] text-white border-[#17181D] shadow-xs"
              : "bg-white text-[#63656F] border-line hover:border-[#D8D8D2] hover:bg-[#F7F7F5]"
          }`}
        >
          All Tags
        </button>

        {/* Dynamic Category Pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat._id;
          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => dispatch(setSelectedCategory(cat._id))}
              style={{
                backgroundColor: isSelected ? cat.color : `${cat.color}12`,
                color: isSelected ? "#FFFFFF" : cat.color,
                borderColor: isSelected ? cat.color : `${cat.color}35`,
              }}
              className="px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5 cursor-pointer select-none active:scale-95"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? "#FFFFFF" : cat.color }}
              />
              <span className="truncate max-w-25 sm:max-w-35">{cat.name}</span>
            </button>
          );
        })}

        {/* Add Category Button */}
        <button
          type="button"
          onClick={onOpenCategoryModal}
          className="p-1.5 sm:p-2 rounded-lg bg-white border border-line text-ink-400 hover:text-brand-600 hover:border-brand-600/40 hover:bg-[#F7F7F5] transition shrink-0 cursor-pointer active:scale-95"
          title="Create custom category tag"
          aria-label="Add Category"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
