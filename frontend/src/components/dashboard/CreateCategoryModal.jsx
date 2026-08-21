import React, { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { addCategory } from "../../features/categories/categorySlice";
import Modal, { ModalHeader } from "../Modal";

export default function CreateCategoryModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#2F5DFF", icon: "tag" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    setIsSubmitting(true);
    try {
      await dispatch(addCategory(newCategory)).unwrap();
      toast.success(`Category "${newCategory.name}" created`);
      setNewCategory({ name: "", color: "#2F5DFF", icon: "tag" });
      onClose();
    } catch (err) {
      toast.error(err || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title="New Category Tag" onClose={onClose} />
      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5">
            Tag Name
          </label>
          <input
            type="text"
            placeholder="e.g., Marketing, Personal, Client"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            required
            autoFocus
            className="w-full bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#14151A] outline-none focus:border-[#2F5DFF] focus:bg-white focus:ring-2 focus:ring-[#2F5DFF]/10 transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              className="w-10 h-10 border border-[#ECECE6] rounded-xl cursor-pointer bg-transparent"
            />
            <span className="text-xs font-mono text-[#63656F] uppercase">{newCategory.color}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#63656F] bg-[#F2F2EE] hover:bg-[#ECECE6] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Tag"}
          </button>
        </div>
      </form>
    </Modal>
  );
}