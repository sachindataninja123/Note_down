import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchComments, createComment, removeComment } from "../../features/comments/commentSlice";

export default function TaskComments({ taskId }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const comments = useSelector((state) => state.comments.commentsByTask[taskId] || []);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchComments(taskId));
  }, [dispatch, taskId]);

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(createComment({ taskId, text: input.trim() })).unwrap();
      setInput("");
    } catch (err) {
      toast.error(err || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await dispatch(removeComment({ taskId, commentId })).unwrap();
    } catch (err) {
      toast.error(err || "Failed to delete comment");
    }
  };

  return (
    <div>
      <span className="text-[10px] sm:text-[10.5px] font-semibold text-[#8B8D98] uppercase tracking-wide">
        Comments
      </span>

      <div className="mt-2.5 space-y-2">
        {comments.map((c) => (
          <div key={c._id} className="bg-white p-2.5 rounded-xl border border-[#ECECE6]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#ECECE6] flex items-center justify-center font-bold text-[9px] text-[#63656F] shrink-0">
                  {c.author?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-xs font-semibold text-[#14151A] truncate">
                  {c.author?.name || "User"}
                </span>
                <span className="text-[10px] text-[#B4B5BD] shrink-0">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>

              {c.author?._id === user?._id && (
                <button
                  onClick={() => handleDelete(c._id)}
                  className="text-[#B4B5BD] hover:text-[#E14A2C] text-xs shrink-0 cursor-pointer"
                  aria-label="Delete comment"
                >
                  &times;
                </button>
              )}
            </div>
            <p className="text-[12px] text-[#14151A] mt-1.5 wrap-break-word">{c.text}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-[11px] text-[#B4B5BD] py-1">No comments yet.</p>
        )}
      </div>

      <div className="flex gap-2 mt-2.5">
        <input
          type="text"
          placeholder="Add a comment... (@Name to mention)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full min-w-0 bg-white border border-[#ECECE6] rounded-xl px-3 py-2.5 text-[11.5px] sm:text-xs text-[#14151A] placeholder-[#B4B5BD] outline-none focus:border-[#2F5DFF] focus:ring-2 focus:ring-[#2F5DFF]/10 transition"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#432DD7] hover:bg-[#3622bd] active:scale-[0.98] text-white text-[11.5px] sm:text-xs px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer shrink-0 disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  );
}