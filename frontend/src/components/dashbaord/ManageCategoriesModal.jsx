import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addCategory, editCategory, removeCategory } from "../../features/categories/categorySlice";

export default function ManageCategoriesModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);

  const [newCategory, setNewCategory] = useState({ name: "", color: "#6366F1" });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", color: "" });

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    dispatch(addCategory(newCategory));
    setNewCategory({ name: "", color: "#6366F1" });
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditFormData({ name: cat.name, color: cat.color });
  };

  const handleSaveEdit = (categoryId) => {
    if (!editFormData.name.trim()) return;
    dispatch(editCategory({ categoryId, categoryData: editFormData }));
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Manage Category Tags</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl font-bold cursor-pointer">
            &times;
          </button>
        </div>

        {/* Create New Category Inline */}
        <form onSubmit={handleCreate} className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
          <input
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
            className="w-7 h-7 border-0 rounded-xl cursor-pointer bg-transparent shrink-0 ml-1"
          />
          <input
            type="text"
            placeholder="New tag name..."
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none px-2"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0"
          >
            Add
          </button>
        </form>

        {/* List & Edit Existing Categories */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No custom categories created yet.</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800/80"
              >
                {editingId === cat._id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="color"
                      value={editFormData.color}
                      onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                      className="w-6 h-6 border-0 rounded-lg cursor-pointer bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat._id)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold px-2 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-slate-400 hover:text-slate-200 text-xs px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-xs font-medium text-slate-200 truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title="Edit tag"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => dispatch(removeCategory(cat._id))}
                        className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                        title="Delete tag"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}