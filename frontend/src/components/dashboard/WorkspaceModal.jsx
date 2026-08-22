import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  addWorkspace,
  inviteMember,
  deleteMember,
  removeWorkspace,
  setCurrentWorkspace,
} from "../../features/workspaces/workspaceSlice";
import Modal, { ModalHeader } from "../Modal";

const inputClass =
  "w-full bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#14151A] outline-none focus:border-[#432DD7] focus:bg-white focus:ring-2 focus:ring-[#432DD7]/10 transition";
const labelClass = "block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5";

export default function WorkspaceModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspaces);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("create");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync selected workspace when modal opens or active workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      setSelectedWorkspaceId(currentWorkspace._id);
    } else if (workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0]._id);
    }
  }, [currentWorkspace, workspaces, isOpen]);

  // Target workspace being actively managed in this modal
  const targetWorkspace = workspaces.find((w) => w._id === selectedWorkspaceId) || currentWorkspace;
  const isOwner = targetWorkspace?.owner?._id === user?._id || targetWorkspace?.owner === user?._id;

  const resetAndClose = () => {
    setConfirmingDelete(false);
    onClose();
  };

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
      resetAndClose();
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
    if (!targetWorkspace) return;

    const promise = dispatch(
      inviteMember({ workspaceId: targetWorkspace._id, email: inviteEmail.trim(), role: inviteRole })
    ).unwrap();

    toast.promise(promise, {
      loading: `Inviting ${inviteEmail}...`,
      success: `User invited to ${targetWorkspace.name}!`,
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
    if (!targetWorkspace) return;
    const promise = dispatch(deleteMember({ workspaceId: targetWorkspace._id, memberId })).unwrap();
    toast.promise(promise, {
      loading: "Removing member...",
      success: `Removed from ${targetWorkspace.name}`,
      error: (err) => err || "Failed to remove member",
    });
  };

  const handleDeleteWorkspace = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    if (!targetWorkspace) return;

    setIsDeleting(true);
    const promise = dispatch(removeWorkspace(targetWorkspace._id)).unwrap();

    toast.promise(promise, {
      loading: `Deleting "${targetWorkspace.name}"...`,
      success: `"${targetWorkspace.name}" and its tasks were deleted`,
      error: (err) => err || "Failed to delete workspace",
    });

    try {
      await promise;
      resetAndClose();
    } catch {
      // Handled by toast
    } finally {
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} size="md">
      <ModalHeader title="Workspace Settings" onClose={resetAndClose} />
      <div className="px-6 pb-6 space-y-5">
        
        {/* Tab Controls */}
        <div className="flex bg-[#FAFAF8] p-1 rounded-xl border border-[#ECECE6]">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "create" ? "bg-[#432DD7] text-white shadow-xs" : "text-[#63656F] hover:text-[#14151A]"
            }`}
          >
            Create Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              if (workspaces.length === 0) {
                toast.error("No workspaces found. Create one first!");
                return;
              }
              setActiveTab("members");
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "members" ? "bg-[#432DD7] text-white shadow-xs" : "text-[#63656F] hover:text-[#14151A]"
            }`}
          >
            Manage Team
          </button>
        </div>

        {/* TAB 1: Create Workspace */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <label className={labelClass}>Workspace Name</label>
              <input
                type="text"
                placeholder="e.g., Engineering Team, Product Launch"
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
                onClick={resetAndClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#63656F] bg-[#F2F2EE] hover:bg-[#ECECE6] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#432DD7] hover:bg-[#3824C2] transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Workspace"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Manage Workspace & Team */}
        {activeTab === "members" && (
          <div className="space-y-4">
            {/* Workspace Selector Dropdown (Allows switching which workspace to manage even when starting from Personal) */}
            <div>
              <label className={labelClass}>Select Workspace to Manage</label>
              <select
                value={selectedWorkspaceId}
                onChange={(e) => {
                  setSelectedWorkspaceId(e.target.value);
                  setConfirmingDelete(false);
                }}
                className={inputClass}
              >
                {workspaces.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} {w._id === currentWorkspace?._id ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {targetWorkspace && (
              <>
                {/* Invite Form (Owner Only) */}
                {isOwner && (
                  <form onSubmit={handleInviteMember} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="teammate@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3 py-2 text-xs text-[#14151A] outline-none focus:border-[#432DD7] focus:bg-white"
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
                      className="bg-[#432DD7] hover:bg-[#3824C2] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shrink-0"
                    >
                      Invite
                    </button>
                  </form>
                )}

                {/* Member List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  <span className="text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide block">
                    Members ({targetWorkspace.members?.length || 1})
                  </span>
                  {targetWorkspace.members?.map((m) => (
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
                            type="button"
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

                {/* Danger Zone: Delete Workspace */}
                {isOwner && (
                  <div className="border border-[#FFD9CB] bg-[#FFF8F6] rounded-xl p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-[#E14A2C]">Danger zone</p>
                    <p className="text-[11px] text-[#8B8D98] leading-relaxed">
                      Permanently removes <span className="font-semibold text-[#63656F]">"{targetWorkspace.name}"</span> and all tasks within it.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleDeleteWorkspace}
                        disabled={isDeleting}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                          confirmingDelete
                            ? "bg-[#E14A2C] text-white hover:bg-[#C93E22]"
                            : "bg-white border border-[#FFD9CB] text-[#E14A2C] hover:bg-[#FFF1EC]"
                        }`}
                      >
                        {isDeleting
                          ? "Deleting..."
                          : confirmingDelete
                          ? `Confirm Delete`
                          : "Delete workspace"}
                      </button>
                      {confirmingDelete && !isDeleting && (
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(false)}
                          className="text-xs font-semibold text-[#8B8D98] hover:text-[#14151A] cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}