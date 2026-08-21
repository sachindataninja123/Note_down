import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { addWorkspace, inviteMember, deleteMember } from "../../features/workspaces/workspaceSlice";
import Modal, { ModalHeader } from "../Modal";

const inputClass =
  "w-full bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#14151A] outline-none focus:border-[#2F5DFF] focus:bg-white focus:ring-2 focus:ring-[#2F5DFF]/10 transition";
const labelClass = "block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5";

export default function WorkspaceModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("create");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentWorkspace?.owner?._id === user?._id || currentWorkspace?.owner === user?._id;

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsSubmitting(true);
    const promise = dispatch(addWorkspace({ name: name.trim(), description })).unwrap();

    toast.promise(promise, {
      loading: "Creating workspace...",
      success: (data) => `Workspace "${data.data.name}" created!`,
      error: (err) => err || "Failed to create workspace",
    });

    try {
      await promise;
      setName("");
      setDescription("");
      onClose();
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please provide a valid email");
      return;
    }

    const promise = dispatch(
      inviteMember({ workspaceId: currentWorkspace._id, email: inviteEmail.trim(), role: inviteRole })
    ).unwrap();

    toast.promise(promise, {
      loading: `Inviting ${inviteEmail}...`,
      success: `User invited to ${currentWorkspace.name}!`,
      error: (err) => err || "Failed to invite user",
    });

    try {
      await promise;
      setInviteEmail("");
    } catch {
      // Handled by toast
    }
  };

  const handleRemoveMember = async (memberId) => {
    const promise = dispatch(deleteMember({ workspaceId: currentWorkspace._id, memberId })).unwrap();
    toast.promise(promise, {
      loading: "Removing member...",
      success: `Removed from ${currentWorkspace.name}`,
      error: (err) => err || "Failed to remove member",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title="Workspace Management" onClose={onClose} />
      <div className="px-6 pb-6 space-y-5">
        <div className="flex bg-[#FAFAF8] p-1 rounded-xl border border-[#ECECE6]">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "create" ? "bg-blue-600 text-white" : "text-[#63656F] hover:text-[#14151A]"
            }`}
          >
            Create New Workspace
          </button>
          <button
            onClick={() => setActiveTab("members")}
            disabled={!currentWorkspace}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40 ${
              activeTab === "members" ? "bg-blue-600 text-white" : "text-[#63656F] hover:text-[#14151A]"
            }`}
          >
            Manage Team
          </button>
        </div>

        {activeTab === "create" && (
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <label className={labelClass}>Workspace Name</label>
              <input
                type="text"
                placeholder="e.g., Engineering Team, Side Projects"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description (Optional)</label>
              <textarea
                rows="2"
                placeholder="Brief purpose of this team workspace..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-1">
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
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Workspace"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "members" && currentWorkspace && (
          <div className="space-y-4">
            {isOwner && (
              <form onSubmit={handleInviteMember} className="flex gap-2">
                <input
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3 py-2 text-xs text-[#14151A] outline-none focus:border-[#2F5DFF] focus:bg-white"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-2 py-2 text-xs text-[#14151A] outline-none"
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shrink-0"
                >
                  Invite
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide block">
                Members in "{currentWorkspace.name}"
              </span>
              {currentWorkspace.members?.map((m) => (
                <div
                  key={m.user?._id || m._id}
                  className="flex items-center justify-between bg-[#FAFAF8] p-2.5 rounded-xl border border-[#ECECE6]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#ECECE6] flex items-center justify-center font-bold text-[10px] text-[#63656F]">
                      {m.user?.name ? m.user.name[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#14151A]">{m.user?.name || "Member"}</p>
                      <p className="text-[10px] text-[#8B8D98]">{m.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#ECECE6] text-[#63656F]">
                      {m.role}
                    </span>
                    {isOwner && m.user?._id !== user?._id && (
                      <button
                        onClick={() => handleRemoveMember(m.user?._id)}
                        className="text-[#B4B5BD] hover:text-[#E14A2C] text-xs px-1 cursor-pointer"
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}