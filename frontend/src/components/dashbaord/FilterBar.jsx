import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setStatusFilter } from "../../features/tasks/taskSlice";
import { setSelectedCategory } from "../../features/categories/categorySlice";

export default function FilterBar({ onOpenCategoryModal }) {
  const dispatch = useDispatch();
  const { statusFilter } = useSelector((state) => state.tasks);
  const { categories, selectedCategory } = useSelector((state) => state.categories);

  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-3xl border border-slate-800/80 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* Status Segmented Control */}
      <div className="flex items-center bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80 w-full md:w-auto">
        {["all", "active", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => dispatch(setStatusFilter(tab))}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === tab
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:text-slate-200"
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
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
            selectedCategory === "All"
              ? "bg-slate-100 text-slate-900 border-slate-100"
              : "bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700"
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
                backgroundColor: isSelected ? cat.color : `${cat.color}15`,
                color: isSelected ? "#FFFFFF" : cat.color,
                borderColor: `${cat.color}40`,
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isSelected ? "#FFFFFF" : cat.color }}
              ></span>
              {cat.name}
            </button>
          );
        })}
        <button
          onClick={onOpenCategoryModal}
          className="p-1.5 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition shrink-0 cursor-pointer"
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