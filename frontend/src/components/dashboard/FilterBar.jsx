import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setStatusFilter,
  setAssignedToMeFilter,
} from "../../features/tasks/taskSlice";
import { setSelectedCategory } from "../../features/categories/categorySlice";

export default function FilterBar({ onOpenCategoryModal }) {
  const dispatch = useDispatch();
  const statusFilter = useSelector((state) => state.tasks.statusFilter);
  const { categories, selectedCategory } = useSelector(
    (state) => state.categories,
  );
  const assignedToMe = useSelector((state) => state.tasks.assignedToMe);
  const currentWorkspace = useSelector(
    (state) => state.workspaces.currentWorkspace);

  return (
    <div className="bg-[#FAFAF8] p-2.5 sm:p-3 rounded-2xl border border-[#ECECE6] mb-5 sm:mb-6 flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between shadow-[0_2px_8px_rgba(20,21,26,0.015)]">
      {/* Status Segmented Control (Full width on mobile, auto on desktop) */}
      <div className="flex items-center bg-white p-1 rounded-xl border border-[#ECECE6] w-full md:w-auto shadow-xs">
        {["all", "active", "completed"].map((tab) => {
          const isActive = statusFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => dispatch(setStatusFilter(tab))}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold capitalize transition-all cursor-pointer select-none active:scale-[0.98] ${
                isActive
                  ? "bg-indigo-500 text-white shadow-sm shadow-[#432DD7]/25"
                  : "text-[#63656F] hover:text-[#14151A] hover:bg-[#F7F7F5]"
              }`}
            >
              {tab}
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
                : "bg-white text-[#63656F] border-[#ECECE6] hover:border-[#D8D8D2]"
            }`}
          >
            Assigned to me
          </button>
        )}
      </div>

      {/* Category Pills (Touch-Friendly Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scroll-smooth [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
        {/* All Tags Pill */}
        <button
          type="button"
          onClick={() => dispatch(setSelectedCategory("All"))}
          className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold shrink-0 transition-all cursor-pointer border select-none active:scale-95 ${
            selectedCategory === "All"
              ? "bg-[#17181D] text-white border-[#17181D] shadow-xs"
              : "bg-white text-[#63656F] border-[#ECECE6] hover:border-[#D8D8D2] hover:bg-[#F7F7F5]"
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
          className="p-1.5 sm:p-2 rounded-lg bg-white border border-[#ECECE6] text-[#8B8D98] hover:text-[#432DD7] hover:border-[#432DD7]/40 hover:bg-[#F7F7F5] transition shrink-0 cursor-pointer active:scale-95"
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
