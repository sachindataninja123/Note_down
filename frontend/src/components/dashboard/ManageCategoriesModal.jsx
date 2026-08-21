import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { addCategory, editCategory, removeCategory } from "../../features/categories/categorySlice";
import Modal, { ModalHeader } from "../Modal";

export default function ManageCategoriesModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);

  const [newCategory, setNewCategory] = useState({ name: "", color: "#2F5DFF" });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", color: "" });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    setIsCreating(true);
    try {
      await dispatch(addCategory(newCategory)).unwrap();
      toast.success(`Category "${newCategory.name}" created`);
      setNewCategory({ name: "", color: "#2F5DFF" });
    } catch (err) {
      toast.error(err || "Failed to create category");
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditFormData({ name: cat.name, color: cat.color });
  };

  const handleSaveEdit = async (categoryId) => {
    if (!editFormData.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    try {
      await dispatch(editCategory({ categoryId, categoryData: editFormData })).unwrap();
      toast.success("Category updated");
      setEditingId(null);
    } catch (err) {
      toast.error(err || "Failed to update category");
    }
  };

  const handleDelete = async (categoryId, catName) => {
    try {
      await dispatch(removeCategory(categoryId)).unwrap();
      toast.success(`Category "${catName}" deleted`);
    } catch (err) {
      toast.error(err || "Failed to delete category");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title="Manage Category Tags" onClose={onClose} />
      <div className="px-6 pb-6 space-y-5">
        <form onSubmit={handleCreate} className="flex items-center gap-2 bg-[#FAFAF8] p-2 rounded-xl border border-[#ECECE6]">
          <input
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
            className="w-7 h-7 border-0 rounded-lg cursor-pointer bg-transparent shrink-0 ml-1"
          />
          <input
            type="text"
            placeholder="New tag name..."
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="w-full bg-transparent text-xs text-[#14151A] placeholder-[#B4B5BD] outline-none px-2"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isCreating ? "Adding..." : "Add"}
          </button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="text-xs text-[#B4B5BD] text-center py-6">No custom categories created yet.</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between bg-[#FAFAF8] p-2.5 rounded-xl border border-[#ECECE6]"
              >
                {editingId === cat._id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="color"
                      value={editFormData.color}
                      onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                      className="w-6 h-6 border-0 rounded-md cursor-pointer bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full bg-white border border-[#ECECE6] rounded-lg px-2 py-1 text-xs text-[#14151A] outline-none focus:border-[#2F5DFF]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat._id)}
                      className="text-[#178A4C] hover:text-[#12703C] text-xs font-semibold px-2 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-[#8B8D98] hover:text-[#14151A] text-xs px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs font-medium text-[#14151A] truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-[#B4B5BD] hover:text-[#14151A] p-1.5 rounded-lg hover:bg-[#ECECE6] transition cursor-pointer"
                        title="Edit tag"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id, cat.name)}
                        className="text-[#B4B5BD] hover:text-[#E14A2C] p-1.5 rounded-lg hover:bg-[#FFF1EC] transition cursor-pointer"
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
    </Modal>
  );
}