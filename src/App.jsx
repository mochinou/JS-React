import { useEffect, useState } from "react";
import {
  createItem,
  deleteItem,
  getItemsList,
  resetData,
  setNetworkErrorChance,
  STATUS_LABELS,
  updateItem,
} from "./api/fakeApi.js";
import ListPanel from "./components/ListPanel.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";
import ItemFormModal from "./components/ItemFormModal.jsx";

const PAGE_LIMIT = 6;

// What the "advance status" action does to each status.
const NEXT_STATUS = { open: "in-progress", "in-progress": "done", done: "open" };

export default function App() {
  // ------------------------- list state -------------------------
  const [items, setItems] = useState([]);
  const [listStatus, setListStatus] = useState("loading"); // loading | success | error
  const [listError, setListError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created-desc");
  const [reloadKey, setReloadKey] = useState(0);

  // ------------------------- selection -------------------------
  const [selectedId, setSelectedId] = useState(null);

  // ------------------------- mutations -------------------------
  // Only ONE mutation may run at a time: this prevents conflicting actions
  // (e.g. "delete" while a status update of the same task is in flight).
  const [pendingAction, setPendingAction] = useState(null); // { kind, id? } | null
  // The last FINISHED mutation. DetailsPanel compares its own id with
  // lastUpdate.id and applies the change only if it shows that very task.
  const [lastUpdate, setLastUpdate] = useState({ type: null, id: null, item: null, seq: 0 });
  const [notice, setNotice] = useState(null); // { kind: "success" | "error" | "info", text }

  // ------------------------- form modal -------------------------
  const [formState, setFormState] = useState(null); // { mode: "create" } | { mode: "edit", item }
  const [formApiError, setFormApiError] = useState("");

  // ------------------------- demo toggle -------------------------
  const [unstable, setUnstable] = useState(false);

  // (1) Load the list whenever search / sort / page / reloadKey changes.
  //     The cleanup flag discards responses of superseded requests.
  useEffect(() => {
    let cancelled = false;
    setListStatus("loading");
    setListError("");

    const query = `?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}&limit=${PAGE_LIMIT}`;

    getItemsList(query)
      .then((result) => {
        if (cancelled) return; // a newer request already started — ignore
        setItems(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setListStatus("success");
        if (result.data.length === 0 && result.total > 0 && page > 1) {
          setPage(1); // e.g. after deleting the last item of a page
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setListError(error.message);
        setListStatus("error");
      });

    return () => {
      cancelled = true; // cleanup: this request is officially stale
    };
  }, [search, sort, page, reloadKey]);

  // (2) Auto-dismiss the toast after 5s; cleanup cancels a pending timer.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  // (3) Apply the "Unstable network" demo toggle to the simulated backend.
  useEffect(() => {
    setNetworkErrorChance(unstable ? 0.4 : null);
  }, [unstable]);

  function notify(kind, text) {
    setNotice({ kind, text });
  }

  function registerUpdate(type, id, item) {
    setLastUpdate({ type, id, item, seq: Date.now() });
  }

  function guardConflict() {
    if (pendingAction) {
      notify("info", "Please wait — another operation is still in flight.");
      return true;
    }
    return false;
  }

  // ------------------------- list handlers -------------------------
  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  function handleSortChange(value) {
    setSort(value);
    setPage(1);
  }

  function handleReload() {
    setReloadKey((key) => key + 1);
  }

  // ------------------------- create -------------------------
  function handleCreate(values) {
    if (guardConflict()) return;
    setPendingAction({ kind: "create" });
    setFormApiError("");

    createItem(values)
      .then((created) => {
        setFormState(null);
        setSearch("");
        setSearchInput("");
        setPage(1);
        setReloadKey((key) => key + 1); // pagination changed — refetch
        setSelectedId(created.id);
        notify("success", `Task #${created.id} "${created.name}" was created.`);
      })
      .catch((error) => {
        setFormApiError(error.message); // keep the modal open so user can retry
      })
      .finally(() => setPendingAction(null));
  }

  // ------------------------- edit -------------------------
  function handleSaveEdit(id, values) {
    if (guardConflict()) return;
    setPendingAction({ kind: "edit", id });
    setFormApiError("");

    updateItem(id, values)
      .then((updated) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updated } : item)),
        );
        registerUpdate("update", id, updated); // refresh the open details
        setFormState(null);
        notify("success", `Task #${id} was saved (server updatedAt bumped).`);
      })
      .catch((error) => {
        setFormApiError(error.message);
      })
      .finally(() => setPendingAction(null));
  }

  // ------------------------- status action -------------------------
  // Demonstrates stale-closure handling:
  //  * the id and the desired status are CAPTURED when the action starts;
  //  * the user may switch to another task while the request is in flight;
  //  * when the response arrives it always updates the CAPTURED id —
  //    in the list, in the toast and (only if still displayed) in details.
  function handleAdvanceStatus(id, currentStatus) {
    if (guardConflict()) return;

    const targetId = id; // captured NOW — never read from state later
    const nextStatus = NEXT_STATUS[currentStatus] || "open";

    setPendingAction({ kind: "status", id: targetId });

    updateItem(targetId, { status: nextStatus })
      .then((updated) => {
        // Functional update: always patches the right row, regardless of
        // what is selected by the time the response arrives.
        setItems((prev) =>
          prev.map((item) =>
            item.id === targetId ? { ...item, ...updated } : item,
          ),
        );
        // DetailsPanel applies this only if it still displays targetId.
        registerUpdate("status", targetId, updated);
        notify(
          "success",
          `Task #${targetId} is now "${STATUS_LABELS[updated.status]}".`,
        );
      })
      .catch((error) => {
        notify("error", `Could not update task #${targetId}: ${error.message}`);
      })
      .finally(() => setPendingAction(null));
  }

  // ------------------------- delete -------------------------
  function handleDelete(id) {
    if (guardConflict()) return;
    if (!window.confirm(`Delete task #${id}? This cannot be undone.`)) return;

    const targetId = id; // capture before the async round-trip
    setPendingAction({ kind: "delete", id: targetId });

    deleteItem(targetId)
      .then(() => {
        if (selectedId === targetId) setSelectedId(null);
        registerUpdate("delete", targetId, null);
        setReloadKey((key) => key + 1); // pagination shifts — refetch
        notify("success", `Task #${targetId} was deleted.`);
      })
      .catch((error) => {
        notify("error", `Could not delete task #${targetId}: ${error.message}`);
      })
      .finally(() => setPendingAction(null));
  }

  // ------------------------- demo: reset data -------------------------
  function handleResetData() {
    if (guardConflict()) return;
    if (!window.confirm("Restore the original demo data? All changes will be lost.")) return;

    setPendingAction({ kind: "reset" });
    resetData()
      .then((result) => {
        setSelectedId(null);
        setPage(1);
        setReloadKey((key) => key + 1);
        notify("success", `Demo data restored (${result.total} tasks).`);
      })
      .catch((error) => notify("error", `Reset failed: ${error.message}`))
      .finally(() => setPendingAction(null));
  }

  const mutationInFlight = pendingAction !== null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">
            🛰️
          </span>
          <div>
            <h1>Station Ops</h1>
            <p className="brand-subtitle">Async task board · Effects &amp; API</p>
          </div>
        </div>

        <div className="header-actions">
          <label className={`net-toggle${unstable ? " net-toggle--on" : ""}`}>
            <input
              type="checkbox"
              checked={unstable}
              onChange={(event) => setUnstable(event.target.checked)}
            />
            <span>Unstable network (40% errors)</span>
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleResetData}
            disabled={mutationInFlight}
            title="Restore the original seed data"
          >
            Reset data
          </button>
        </div>
      </header>

      <main className="layout">
        <ListPanel
          items={items}
          listStatus={listStatus}
          listError={listError}
          page={page}
          totalPages={totalPages}
          total={total}
          searchInput={searchInput}
          search={search}
          sort={sort}
          selectedId={selectedId}
          mutationInFlight={mutationInFlight}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onClearSearch={handleClearSearch}
          onSortChange={handleSortChange}
          onReload={handleReload}
          onCreate={() => {
            setFormApiError("");
            setFormState({ mode: "create" });
          }}
          onSelect={setSelectedId}
          onPageChange={setPage}
        />

        <DetailsPanel
          selectedId={selectedId}
          lastUpdate={lastUpdate}
          pendingAction={pendingAction}
          mutationInFlight={mutationInFlight}
          onAdvanceStatus={handleAdvanceStatus}
          onEdit={(item) => {
            setFormApiError("");
            setFormState({ mode: "edit", item });
          }}
          onDelete={handleDelete}
        />
      </main>

      {formState && (
        <ItemFormModal
          mode={formState.mode}
          initialItem={formState.item ?? null}
          apiError={formApiError}
          isSaving={
            pendingAction?.kind === "create" || pendingAction?.kind === "edit"
          }
          onSubmit={(values) =>
            formState.mode === "create"
              ? handleCreate(values)
              : handleSaveEdit(formState.item.id, values)
          }
          onClose={() => setFormState(null)}
        />
      )}

      {notice && (
        <div className={`toast toast--${notice.kind}`} role="status">
          {notice.text}
        </div>
      )}
    </div>
  );
}
