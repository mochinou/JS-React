import { useEffect, useState } from "react";
import {
  getItem,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "../api/fakeApi.js";

const STATUS_ACTION_LABELS = {
  open: "▶ Start progress",
  "in-progress": "✔ Mark as done",
  done: "↺ Reopen",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({ label, children }) {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function DetailsPanel({
  selectedId,
  lastUpdate,
  pendingAction,
  mutationInFlight,
  onAdvanceStatus,
  onEdit,
  onDelete,
}) {
  // Local state machine for the details pane.
  // `id` always remembers WHICH task the loaded/loading data belongs to,
  // so a late response can never be shown for the wrong task.
  const [details, setDetails] = useState({
    status: "idle", // idle | loading | success | error | deleted
    id: null,
    item: null,
    error: "",
  });
  const [retryKey, setRetryKey] = useState(0);

  // (A) Load details whenever the selection changes.
  //
  // Race-condition protection: the effect closes over `requestedId` and a
  // `cancelled` flag. When the user clicks another task (or the component
  // unmounts / StrictMode remounts) the cleanup runs FIRST and marks the
  // previous request as stale — its late response is then silently dropped.
  useEffect(() => {
    if (selectedId === null || selectedId === undefined) {
      setDetails({ status: "idle", id: null, item: null, error: "" });
      return undefined;
    }

    let cancelled = false;
    const requestedId = selectedId; // freeze the id for this request

    setDetails({ status: "loading", id: requestedId, item: null, error: "" });

    getItem(requestedId)
      .then((item) => {
        if (cancelled) return; // user already moved on — never show stale data
        setDetails({ status: "success", id: requestedId, item, error: "" });
      })
      .catch((error) => {
        if (cancelled) return;
        setDetails({ status: "error", id: requestedId, item: null, error: error.message });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, retryKey]);

  // (B) Apply finished async mutations — but ONLY if they concern the task
  // currently displayed here. An update for task A must never overwrite the
  // details of task B (stale-closure conflict resolution).
  useEffect(() => {
    if (!lastUpdate || lastUpdate.id === null) return;

    setDetails((prev) => {
      if (prev.id !== lastUpdate.id) return prev; // not our task — ignore
      if (lastUpdate.type === "delete") {
        return { status: "deleted", id: prev.id, item: null, error: "" };
      }
      if (prev.status === "success" && lastUpdate.item) {
        return { ...prev, item: lastUpdate.item };
      }
      return prev;
    });
  }, [lastUpdate]);

  const isPendingHere =
    pendingAction !== null &&
    pendingAction.id !== undefined &&
    pendingAction.id === details.id;

  // ------------------------------- render -------------------------------
  if (details.status === "idle") {
    return (
      <section className="panel details-panel" aria-label="Task details">
        <div className="state-box state-box--empty state-box--fill">
          <p className="state-emoji" aria-hidden="true">
            👈
          </p>
          <p className="state-title">No task selected</p>
          <p>
            Pick a task on the left — its full record will be loaded
            asynchronously (with a simulated network delay).
          </p>
          <p className="hint">
            Tip: click several tasks quickly — the list will never show stale
            details, thanks to the effect cleanup.
          </p>
        </div>
      </section>
    );
  }

  if (details.status === "loading") {
    return (
      <section className="panel details-panel" aria-label="Task details">
        <div className="details-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>
            Loading full record for task #{details.id}…
            <span className="hint"> (simulated delay up to 2.6 s)</span>
          </p>
          <div className="details-skeleton">
            <span className="skeleton skeleton-line skeleton-line--wide" />
            <span className="skeleton skeleton-line" />
            <span className="skeleton skeleton-line skeleton-line--narrow" />
            <span className="skeleton skeleton-block" />
          </div>
        </div>
      </section>
    );
  }

  if (details.status === "error") {
    return (
      <section className="panel details-panel" aria-label="Task details">
        <div className="state-box state-box--error state-box--fill" role="alert">
          <p className="state-title">Could not load task #{details.id}</p>
          <p>{details.error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setRetryKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (details.status === "deleted") {
    return (
      <section className="panel details-panel" aria-label="Task details">
        <div className="state-box state-box--empty state-box--fill">
          <p className="state-emoji" aria-hidden="true">
            🗑️
          </p>
          <p className="state-title">Task #{details.id} was deleted</p>
          <p>The record you were viewing no longer exists on the server.</p>
        </div>
      </section>
    );
  }

  const item = details.item;

  return (
    <section className="panel details-panel" aria-label="Task details">
      <header className="details-header">
        <div className="details-title-row">
          <h2>
            #{item.id} · {item.name}
          </h2>
          {isPendingHere && (
            <span className="pending-chip" role="status">
              <span className="spinner spinner--small" aria-hidden="true" />{" "}
              {pendingAction.kind === "status" ? "Updating…" : "Saving…"}
            </span>
          )}
        </div>
        <div className="details-badges">
          <span className={`badge badge--status-${item.status}`}>
            {STATUS_LABELS[item.status]}
          </span>
          <span className={`badge badge--priority-${item.priority}`}>
            {PRIORITY_LABELS[item.priority]}
          </span>
          <span className="badge badge--category">{item.category}</span>
        </div>
      </header>

      <p className="details-description">{item.description || "No description."}</p>

      <dl className="fields-grid">
        <Field label="Assignee">👤 {item.assignee}</Field>
        <Field label="Due date">📅 {formatDateTime(item.dueDate)}</Field>
        <Field label="Estimate">⏱ {item.estimateHours} h</Field>
        <Field label="Status">{STATUS_LABELS[item.status]}</Field>
        <Field label="Created">{formatDateTime(item.createdAt)}</Field>
        <Field label="Last updated">{formatDateTime(item.updatedAt)}</Field>
      </dl>

      <p className="details-hint">
        Full record loaded via <code>getItem({item.id})</code> — description,
        category, estimate and timestamps are not part of the list summaries.
      </p>

      <footer className="details-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onAdvanceStatus(item.id, item.status)}
          disabled={mutationInFlight}
          title={
            mutationInFlight
              ? "Another operation is in flight — conflicting actions are blocked"
              : undefined
          }
        >
          {isPendingHere && pendingAction?.kind === "status"
            ? "Updating…"
            : STATUS_ACTION_LABELS[item.status]}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onEdit(item)}
          disabled={mutationInFlight}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDelete(item.id)}
          disabled={mutationInFlight}
        >
          Delete
        </button>
      </footer>
    </section>
  );
}
