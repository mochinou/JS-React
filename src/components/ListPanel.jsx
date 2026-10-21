import { PRIORITY_LABELS, STATUS_LABELS } from "../api/fakeApi.js";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function StatusBadge({ status }) {
  return (
    <span className={`badge badge--status-${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`badge badge--priority-${priority}`}>
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}

function SkeletonRows() {
  return (
    <ul className="item-list" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((n) => (
        <li className="item-card item-card--skeleton" key={n}>
          <span className="skeleton skeleton-line skeleton-line--wide" />
          <span className="skeleton skeleton-line skeleton-line--narrow" />
        </li>
      ))}
    </ul>
  );
}

export default function ListPanel({
  items,
  listStatus,
  listError,
  page,
  totalPages,
  total,
  searchInput,
  search,
  sort,
  selectedId,
  mutationInFlight,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  onSortChange,
  onReload,
  onCreate,
  onSelect,
  onPageChange,
}) {
  const isLoading = listStatus === "loading";

  return (
    <section className="panel list-panel" aria-label="Task list">
      <div className="panel-toolbar">
        <form className="search-form" onSubmit={onSearchSubmit} role="search">
          <input
            type="text"
            className="input"
            placeholder="Search name, description, assignee…"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            aria-label="Search tasks"
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClearSearch}
              title="Clear the search filter"
            >
              ✕
            </button>
          )}
        </form>

        <div className="toolbar-row">
          <select
            className="input select"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Sort tasks"
          >
            <option value="created-desc">Newest first</option>
            <option value="name">Name A→Z</option>
            <option value="name-desc">Name Z→A</option>
            <option value="due">Due date</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReload}
            disabled={isLoading}
            title="Reload the list from the server"
          >
            <span className={isLoading ? "icon icon--spin" : "icon"}>↻</span>
            Reload
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onCreate}
            disabled={mutationInFlight}
          >
            + New task
          </button>
        </div>
      </div>

      <div className="panel-body">
        {listStatus === "loading" && <SkeletonRows />}

        {listStatus === "error" && (
          <div className="state-box state-box--error" role="alert">
            <p className="state-title">Failed to load the task list</p>
            <p>{listError}</p>
            <button type="button" className="btn btn-primary" onClick={onReload}>
              Retry
            </button>
          </div>
        )}

        {listStatus === "success" && items.length === 0 && (
          <div className="state-box state-box--empty">
            <p className="state-emoji" aria-hidden="true">
              🛸
            </p>
            <p className="state-title">
              {search ? `Nothing found for “${search}”` : "No tasks yet"}
            </p>
            <p>
              {search
                ? "Try a different search query or clear the filter."
                : "Create the first task for the station crew."}
            </p>
            {search ? (
              <button type="button" className="btn btn-secondary" onClick={onClearSearch}>
                Clear search
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCreate}
                disabled={mutationInFlight}
              >
                + Create a task
              </button>
            )}
          </div>
        )}

        {listStatus === "success" && items.length > 0 && (
          <ul className="item-list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`item-card${
                    item.id === selectedId ? " item-card--active" : ""
                  }`}
                  onClick={() => onSelect(item.id)}
                  aria-current={item.id === selectedId ? "true" : undefined}
                >
                  <span className="item-card-top">
                    <span className="item-name">#{item.id} · {item.name}</span>
                    <StatusBadge status={item.status} />
                  </span>
                  <span className="item-card-meta">
                    <PriorityBadge priority={item.priority} />
                    <span className="meta-text">👤 {item.assignee}</span>
                    <span className="meta-text">📅 {formatDate(item.dueDate)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="panel-footer">
        <span className="footer-total">
          {listStatus === "success" ? `${total} task${total === 1 ? "" : "s"}` : "…"}
        </span>
        <div className="pagination">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={isLoading || page <= 1}
          >
            ← Prev
          </button>
          <span className="pagination-label">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={isLoading || page >= totalPages}
          >
            Next →
          </button>
        </div>
      </footer>
    </section>
  );
}
