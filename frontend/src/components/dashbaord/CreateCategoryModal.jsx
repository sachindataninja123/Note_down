import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addCategory } from "../../features/categories/categorySlice";

export default function CreateCategoryModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#6366F1",
    icon: "tag",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    dispatch(addCategory(newCategory));
    setNewCategory({ name: "", color: "#6366F1", icon: "tag" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-white">New Category Tag</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tag Name</label>
            <input
              type="text"
              placeholder="e.g., Marketing, Personal, Client"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Color Palette</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-10 h-10 border-0 rounded-2xl cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-slate-400 uppercase">{newCategory.color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              Create Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}