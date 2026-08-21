import React, { useState } from "react";
import Modal from "../Modal";

export default function DeleteConfirmModal({ isOpen, taskTitle, onConfirm, onCancel }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className="p-6 space-y-4">
        <div className="w-11 h-11 rounded-xl bg-[#FFF1EC] text-[#E14A2C] flex items-center justify-center border border-[#FFD9CB]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold text-[#14151A]">Delete task?</h3>
          <p className="text-xs text-[#63656F] mt-1.5 leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-[#14151A]">"{taskTitle}"</span>? This
            action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#63656F] bg-[#F2F2EE] hover:bg-[#ECECE6] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#E14A2C] hover:bg-[#C93E22] transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}