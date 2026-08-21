import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { setCurrentWorkspace } from "../../features/workspaces/workspaceSlice";

export default function WorkspaceSwitcher({ onOpenSettings }) {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspaces);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (workspace) => {
    dispatch(setCurrentWorkspace(workspace));
    toast.success(workspace ? `Switched to "${workspace.name}"` : "Switched to Personal");
    setIsOpen(false);
  };

  const activeLabel = currentWorkspace ? currentWorkspace.name : "Personal";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2F5DFF] hover:text-[#1E46E0] transition cursor-pointer"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${currentWorkspace ? "bg-[#2F5DFF]" : "bg-[#FF5D3A]"}`}
        />
        {activeLabel}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl border border-[#ECECE6] shadow-[0_20px_60px_-15px_rgba(20,21,26,0.25)] p-1.5 z-50">
          {/* Personal is always present and always selectable — this is
              the fix: it used to disappear from the UI once you had any
              workspace, so there was no way back to your own tasks. */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition cursor-pointer ${
              !currentWorkspace ? "bg-[#EEF2FF]" : "hover:bg-[#FAFAF8]"
            }`}
          >
            <span className="w-6 h-6 rounded-md bg-[#FFF1EC] text-[#FF5D3A] flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v16H4V4z" />
              </svg>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-[#14151A]">Personal</span>
              <span className="block text-[10px] text-[#8B8D98]">Only visible to you</span>
            </span>
            {!currentWorkspace && (
              <svg className="w-3.5 h-3.5 text-[#2F5DFF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {workspaces.length > 0 && (
            <>
              <div className="h-px bg-[#ECECE6] my-1.5 mx-1" />
              <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-semibold text-[#B4B5BD] uppercase tracking-wide">
                Workspaces
              </p>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {workspaces.map((w) => {
                  const isActive = currentWorkspace?._id === w._id;
                  return (
                    <button
                      key={w._id}
                      onClick={() => handleSelect(w)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition cursor-pointer ${
                        isActive ? "bg-[#EEF2FF]" : "hover:bg-[#FAFAF8]"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-md bg-[#EEF2FF] text-[#2F5DFF] flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {w.name?.[0]?.toUpperCase() || "W"}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold text-[#14151A] truncate">{w.name}</span>
                        <span className="block text-[10px] text-[#8B8D98]">
                          {w.members?.length || 1} member{(w.members?.length || 1) === 1 ? "" : "s"}
                        </span>
                      </span>
                      {isActive && (
                        <svg className="w-3.5 h-3.5 text-[#2F5DFF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="h-px bg-[#ECECE6] my-1.5 mx-1" />
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-[#FAFAF8] transition cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-[#F2F2EE] text-[#63656F] flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-[#63656F]">New workspace / manage</span>
          </button>
        </div>
      )}
    </div>
  );
}