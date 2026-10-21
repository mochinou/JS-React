import { useEffect, useState } from "react";
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS } from "../api/fakeApi.js";

const EMPTY_VALUES = {
  name: "",
  description: "",
  assignee: "",
  priority: "medium",
  category: CATEGORIES[0],
  dueDate: "",
  estimateHours: 4,
};

function toDateInputValue(iso) {
  if (!iso) return "";
  return iso.slice(0, 10); // YYYY-MM-DD
}

export default function ItemFormModal({
  mode,
  initialItem,
  apiError,
  isSaving,
  onSubmit,
  onClose,
}) {
  const [values, setValues] = useState(() =>
    mode === "edit" && initialItem
      ? {
          name: initialItem.name,
          description: initialItem.description,
          assignee: initialItem.assignee,
          priority: initialItem.priority,
          category: initialItem.category,
          dueDate: toDateInputValue(initialItem.dueDate),
          estimateHours: initialItem.estimateHours,
        }
      : EMPTY_VALUES,
  );
  const [formError, setFormError] = useState("");

  // Close with Escape — an effect with a proper listener cleanup.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (values.name.trim().length < 3) {
      setFormError("Name must be at least 3 characters.");
      return;
    }
    if (values.assignee.trim().length < 2) {
      setFormError("Assignee is required.");
      return;
    }
    setFormError("");

    onSubmit({
      ...values,
      dueDate: values.dueDate
        ? new Date(`${values.dueDate}T12:00:00`).toISOString()
        : null,
      estimateHours: Number(values.estimateHours) || 0,
    });
  }

  const error = formError || apiError;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "Create task" : "Edit task"}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{mode === "create" ? "New task" : `Edit task #${initialItem?.id}`}</h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Close"
            disabled={isSaving}
          >
            ✕
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <label className="form-field">
            <span>Name *</span>
            <input
              className="input"
              type="text"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              maxLength={80}
              autoFocus
              required
            />
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea
              className="input"
              rows={3}
              value={values.description}
              onChange={(event) => setField("description", event.target.value)}
              maxLength={600}
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Assignee *</span>
              <input
                className="input"
                type="text"
                value={values.assignee}
                onChange={(event) => setField("assignee", event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span>Priority</span>
              <select
                className="input"
                value={values.priority}
                onChange={(event) => setField("priority", event.target.value)}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Category</span>
              <select
                className="input"
                value={values.category}
                onChange={(event) => setField("category", event.target.value)}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Due date</span>
              <input
                className="input"
                type="date"
                value={values.dueDate}
                onChange={(event) => setField("dueDate", event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Estimate (hours)</span>
              <input
                className="input"
                type="number"
                min="0"
                max="500"
                value={values.estimateHours}
                onChange={(event) => setField("estimateHours", event.target.value)}
              />
            </label>
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving…" : mode === "create" ? "Create task" : "Save changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
