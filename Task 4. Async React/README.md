# Station Ops — Async Tasks (Task 4: Async React — Effects & API)

A React + Vite single-page app built on top of a **simulated asynchronous API**
(extended version of the [leravanna/fake-api](https://github.com/leravanna/fake-api)
starter): Promises, random delays, random server errors and persistence in
`localStorage`. No backend and no fetching libraries are required.

![tech](https://img.shields.io/badge/react-18-blue) ![hooks](https://img.shields.io/badge/hooks-useState%20%2B%20useEffect-green)

---

## 1. How the requirements are met

| Requirement | Where |
| --- | --- |
| **≥ 7 meaningful fields in details** | Task model has 11 fields: `id, name, status, priority, assignee, dueDate, description, category, estimateHours, createdAt, updatedAt` — all displayed in the details panel |
| **List loaded with `useEffect`** | `App.jsx` — effect (1) depends on `[search, sort, page, reloadKey]` |
| **Create / Edit / Remove** | `+ New task` modal, `Edit` button (details), `Delete` button with confirm |
| **Select item → async details, more is loaded** | List endpoint returns small *summaries* (6 fields); `getItem(id)` returns the full record (11 fields) with a longer simulated delay |
| **Action updating the selected item via API** | Status action: *Start progress → Mark as done → Reopen* (`updateItem`) |
| **Loading / error / empty / success states** | Skeletons + spinner, error boxes with **Retry**, empty states for list & search, success toasts |
| **Reload button** | Toolbar `↻ Reload` (increments `reloadKey`) |
| **Correct `useEffect` dependencies & cleanup** | 5 effects, each with full deps; cleanups cancel stale work (see §4) |
| **Race-condition prevention** | `cancelled` flag set in cleanup — quickly switching tasks never shows outdated details (`DetailsPanel`, effect A) |
| **Stale-closure handling** | The status action *captures* the task id when it starts; the response always updates **that** id in the list; the details panel applies a server update only if `lastUpdate.id === displayedId`; conflicting mutations are blocked while one is in flight |
| **Clean responsive UI** | Custom CSS, 2-column grid → 1 column below 900 px, sticky details panel |

**Restrictions honoured**

- Only `useState` and `useEffect` (grep the sources — no `useRef`, `useMemo`,
  `useCallback`, no custom hooks).
- No debouncing — search runs on submit.
- No fetching libraries — everything goes through `src/api/fakeApi.js`.
- Components never access `localStorage` directly; only the API module does.

---

## 2. Run locally

```bash
npm install
npm run dev        # development server
# or
npm run build && npm run preview   # production build + local preview
```

> Note: `npm run dev` uses React StrictMode, which runs every effect **twice**
> on purpose. The app stays correct thanks to the cleanup flags — a nice live
> proof during the defense.

---

## 3. Deploy

Any static host works. Quickest options:

### Vercel (recommended)
1. Push this repo to GitHub (see below).
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset **Vite** is auto-detected (`build` / `dist`). Click **Deploy**.

### Netlify
1. Push to GitHub.
2. Netlify → **Add new site → Import an existing project**.
3. Build command `npm run build`, publish directory `dist`.

### GitHub Pages
`vite.config.js` already uses `base: "./"`, so the build works from a sub-path:

```bash
npm run build
# then publish the dist/ folder (e.g. with the gh-pages package or GitHub Actions)
```

### First time pushing to GitHub

```bash
git init
git add .
git commit -m "Task 4 — Async React: Effects & API"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

---

## 4. Defense notes

### How `useEffect` works here
An effect runs **after render**, whenever a value in its **dependency
array** changed since the previous render. Before running the effect again,
React first calls the **cleanup** function returned by the previous run.
This app has five effects:

1. `App` — list loading, deps `[search, sort, page, reloadKey]`;
2. `App` — toast auto-dismiss after 5 s, dep `[notice]`;
3. `App` — applies the "Unstable network" toggle to the simulated API, dep `[unstable]`;
4. `DetailsPanel` — details loading, deps `[selectedId, retryKey]`;
5. `DetailsPanel` — applies finished mutations, dep `[lastUpdate]`;
   (+ an Escape-key listener in the modal with `removeEventListener` cleanup.)

### Race conditions
`getItem(id)` resolves after 0.9–2.6 **random** seconds. If you click task A
and quickly switch to task B, the request for A may finish **after** the one
for B. Without protection the UI would end up showing A while B is selected.

Solution (effect A in `DetailsPanel`):

```js
useEffect(() => {
  let cancelled = false;
  const requestedId = selectedId;      // freeze the id for this request
  getItem(requestedId).then(item => {
    if (cancelled) return;             // response arrived too late → drop it
    setDetails({ status: "success", id: requestedId, item, error: "" });
  });
  return () => { cancelled = true; };  // runs before the next effect
}, [selectedId]);
```

When the selection changes, cleanup flips the flag of the *old* request, so
its late response is discarded. Additionally the details state stores `id`
of the record it shows — the UI can never display "details of A" under the
heading "B".

**Live demo:** click several tasks fast — the loader always follows the last
click and the panel never flashes stale data.

### Stale closures
An event handler "remembers" the values from the render in which it was
created. The status action therefore **captures the id on start**:

```js
const targetId = id;              // captured NOW
setPendingAction({ kind: "status", id: targetId });
updateItem(targetId, { status: nextStatus }).then(updated => {
  setItems(prev => prev.map(it => it.id === targetId ? { ...it, ...updated } : it));
  registerUpdate("status", targetId, updated); // details apply it only if they still show targetId
});
```

While the request is in flight the user may select another task. When the
response arrives it still updates the **captured** id (functional state
update), and the details panel ignores the update if it is already showing
a different task. Starting a second mutation while one is in flight is
blocked (`pendingAction` guard + disabled buttons) — this prevents
conflicting actions such as *delete while completing*.

**Live demo:**
1. Select a task → press *Start progress* → immediately select another task.
   The toast still reports the **original** task id and the correct row is
   updated.
2. Turn on **Unstable network** (40 % errors) and update a status — every
   failure shows an error toast; loading stays consistent.
3. Delete all items of a search result to see the empty state; press
   **Reset data** to restore the seed.

---

## 5. Project structure

```
src/
├── api/
│   ├── settings.js        # localStorage key, delays, error chance
│   ├── initial-data.js    # seed: 14 fully-described tasks
│   └── fakeApi.js         # Promises + random delay/errors + localStorage
│       # getItemsList · getItem · createItem · updateItem · deleteItem · resetData
├── components/
│   ├── ListPanel.jsx      # toolbar, list states, pagination
│   ├── DetailsPanel.jsx   # async details, race-condition & stale-update guards
│   └── ItemFormModal.jsx  # create/edit form (Escape listener cleanup)
├── App.jsx                # list effect, mutations, pendingAction guard, toasts
├── main.jsx               # StrictMode
└── styles.css             # responsive custom CSS (no UI libraries)
```

---

