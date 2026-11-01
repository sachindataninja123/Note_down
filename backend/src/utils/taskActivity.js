const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const idStr = (v) => (v ? String(v._id || v) : "");

/**
 * Compares a task as it was BEFORE an edit with the fields being applied and
 * returns the activity entries to record: one per meaningful change
 * (status / priority / due date), plus a single "task.updated" listing any
 * title, description or category edits. Unchanged fields produce nothing, so
 * re-saving a form without changes records nothing.
 *
 * `before`  : { title, description, category, priority, status, dueDate }
 * `updates` : the $set object (only keys the client actually sent)
 */
export const diffTaskUpdate = (before, updates) => {
  const events = [];

  if (updates.status !== undefined && updates.status !== before.status) {
    events.push({
      action: "task.status_changed",
      details: { from: before.status, to: updates.status },
    });
  }

  if (updates.priority !== undefined && updates.priority !== before.priority) {
    events.push({
      action: "task.priority_changed",
      details: { from: before.priority, to: updates.priority },
    });
  }

  if (
    updates.dueDate !== undefined &&
    dayKey(updates.dueDate) !== dayKey(before.dueDate)
  ) {
    events.push({
      action: "task.due_date_changed",
      details: { from: dayKey(before.dueDate), to: dayKey(updates.dueDate) },
    });
  }

  const fields = [];
  if (updates.title !== undefined && updates.title !== before.title)
    fields.push("title");
  if (
    updates.description !== undefined &&
    updates.description !== (before.description || "")
  )
    fields.push("description");
  if (
    updates.category !== undefined &&
    idStr(updates.category) !== idStr(before.category)
  )
    fields.push("category");

  if (fields.length) {
    events.push({
      action: "task.updated",
      details: {
        fields,
        ...(fields.includes("title") ? { previousTitle: before.title } : {}),
      },
    });
  }

  return events;
};