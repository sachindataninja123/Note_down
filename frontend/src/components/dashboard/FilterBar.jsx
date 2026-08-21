import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setStatusFilter } from "../../features/tasks/taskSlice";
import { setSelectedCategory } from "../../features/categories/categorySlice";

export default function FilterBar({ onOpenCategoryModal }) {
  const dispatch = useDispatch();
  const { statusFilter } = useSelector((state) => state.tasks);
  const { categories, selectedCategory } = useSelector((state) => state.categories);

  return (
    <div className="bg-[#FAFAF8] p-3 rounded-2xl border border-[#ECECE6] mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
      {/* Status Segmented Control */}
      <div className="flex items-center bg-white p-1 rounded-xl border border-[#ECECE6] w-full md:w-auto">
        {["all", "active", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => dispatch(setStatusFilter(tab))}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === tab
                ? "bg-blue-600 text-white"
                : "text-[#63656F] hover:text-[#14151A]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
        <button
          onClick={() => dispatch(setSelectedCategory("All"))}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
            selectedCategory === "All"
              ? "bg-blue-600 text-white"
              : "bg-white text-[#63656F] border-[#ECECE6] hover:border-[#D8D8D2]"
          }`}
        >
          All Tags
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat._id;
          return (
            <button
              key={cat._id}
              onClick={() => dispatch(setSelectedCategory(cat._id))}
              style={{
                backgroundColor: isSelected ? cat.color : `${cat.color}0F`,
                color: isSelected ? "#FFFFFF" : cat.color,
                borderColor: isSelected ? cat.color : `${cat.color}35`,
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? "#FFFFFF" : cat.color }} />
              {cat.name}
            </button>
          );
        })}
        <button
          onClick={onOpenCategoryModal}
          className="p-1.5 rounded-lg bg-white border border-[#ECECE6] text-[#8B8D98] hover:text-[#2F5DFF] hover:border-[#2F5DFF]/40 transition shrink-0 cursor-pointer"
          title="Create custom category tag"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}