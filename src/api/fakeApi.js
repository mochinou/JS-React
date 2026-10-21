import {
  API_CONFIG,
  DATA_KEY,
  DETAILS_CONFIG,
  UNSTABLE_ERROR_CHANCE,
} from "./settings.js";
import { buildInitialData } from "./initial-data.js";

/**
 * Simulated asynchronous API (extended version of the "fake-api" starter).
 *
 * - Every call returns a Promise that resolves after a RANDOM delay.
 * - A random share of calls REJECTS with a simulated server error.
 * - The "database" lives in localStorage, so changes survive a reload.
 * - Components never touch localStorage directly — only this module does.
 */

export const STATUSES = ["open", "in-progress", "done"];
export const PRIORITIES = ["low", "medium", "high", "critical"];
export const CATEGORIES = [
  "Engineering",
  "Science",
  "Medical",
  "Comms",
  "Safety",
  "Maintenance",
  "Software",
  "HR",
];

export const STATUS_LABELS = {
  open: "Open",
  "in-progress": "In progress",
  done: "Done",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

// ---------------------------------------------------------------------------
// Demo helper: lets the UI raise the simulated failure rate
// ("Unstable network" toggle) without touching localStorage from components.
// ---------------------------------------------------------------------------
let errorChanceOverride = null;

export function setNetworkErrorChance(value) {
  errorChanceOverride =
    value === null || value === undefined
      ? null
      : Math.min(0.95, Math.max(0, Number(value)));
}

export function getNetworkErrorChance() {
  return errorChanceOverride ?? API_CONFIG.errorChance;
}

// ---------------------------------------------------------------------------
// Core: a fake network request.
// ---------------------------------------------------------------------------
function fakeRequest(operation, options = {}) {
  const {
    minDelay = API_CONFIG.minDelay,
    maxDelay = API_CONFIG.maxDelay,
    errorChance = getNetworkErrorChance(),
  } = options;

  return new Promise((resolve, reject) => {
    const delayMS =
      Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    setTimeout(() => {
      if (Math.random() < errorChance) {
        reject(new Error("Simulated server error (500). Please retry."));
        return;
      }

      try {
        resolve(operation());
      } catch (error) {
        reject(error); // business-logic errors (404, validation, ...)
      }
    }, delayMS);
  });
}

// ---------------------------------------------------------------------------
// "Database" layer — the ONLY place in the app that touches localStorage.
// ---------------------------------------------------------------------------
function initializeDatabase() {
  if (!localStorage.getItem(DATA_KEY)) {
    localStorage.setItem(DATA_KEY, JSON.stringify(buildInitialData()));
  }
}

function readData() {
  return JSON.parse(localStorage.getItem(DATA_KEY) || "[]");
}

function writeData(items) {
  localStorage.setItem(DATA_KEY, JSON.stringify(items));
}

initializeDatabase();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// The list endpoint returns a deliberately SMALL summary.
// The rest of the fields is only delivered by getItem(id) — that is what
// "extend details so more is loaded" means in this app.
const SUMMARY_FIELDS = [
  "id",
  "name",
  "status",
  "priority",
  "assignee",
  "dueDate",
];

function toSummary(item) {
  const summary = {};
  for (const field of SUMMARY_FIELDS) {
    summary[field] = item[field] ?? null;
  }
  return summary;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateTaskData(data, { partial = false } = {}) {
  const errors = [];

  if (!partial || "name" in data) {
    const name = (data.name ?? "").trim();
    if (name.length < 3) errors.push("Name must be at least 3 characters");
    if (name.length > 80) errors.push("Name must be at most 80 characters");
  }

  if (!partial || "assignee" in data) {
    const assignee = (data.assignee ?? "").trim();
    if (assignee.length < 2) errors.push("Assignee is required");
  }

  if ("description" in data && (data.description ?? "").length > 600) {
    errors.push("Description must be at most 600 characters");
  }

  if ("priority" in data && !PRIORITIES.includes(data.priority)) {
    errors.push("Unknown priority");
  }

  if ("category" in data && !CATEGORIES.includes(data.category)) {
    errors.push("Unknown category");
  }

  if ("status" in data && !STATUSES.includes(data.status)) {
    errors.push("Unknown status");
  }

  if ("estimateHours" in data) {
    const hours = Number(data.estimateHours);
    if (Number.isNaN(hours) || hours < 0 || hours > 500) {
      errors.push("Estimate must be a number between 0 and 500");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** GET /items — list with search, sorting and pagination. Returns summaries. */
export async function getItemsList(query = "") {
  return fakeRequest(() => {
    const params = new URLSearchParams(query);
    const search = (params.get("search") || "").trim().toLowerCase();
    const sort = params.get("sort") || "created-desc";
    const page = Math.max(1, Number(params.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.get("limit")) || 10));

    let items = readData();

    if (search) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          item.assignee.toLowerCase().includes(search),
      );
    }

    const byDueDate = (a, b) =>
      (a.dueDate || "9999").localeCompare(b.dueDate || "9999");

    items = [...items].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "due":
          return byDueDate(a, b);
        case "created-desc":
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;

    return {
      data: items.slice(start, start + limit).map(toSummary),
      total,
      page,
      limit,
      totalPages,
    };
  });
}

/** GET /items/:id — full detailed record. Intentionally slower ("heavy"). */
export async function getItem(id) {
  return fakeRequest(
    () => {
      const numericId = Number(id);
      const item = readData().find((it) => it.id === numericId);

      if (!item) {
        throw new Error(`Task #${numericId} was not found (maybe deleted).`);
      }

      return clone(item);
    },
    {
      minDelay: DETAILS_CONFIG.minDelay,
      maxDelay: DETAILS_CONFIG.maxDelay,
    },
  );
}

/** POST /items — create a task. */
export async function createItem(data) {
  return fakeRequest(() => {
    validateTaskData(data);

    const items = readData();
    const nextId =
      items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;

    const now = new Date().toISOString();
    const newItem = {
      id: nextId,
      name: data.name.trim(),
      description: (data.description ?? "").trim(),
      status: "open",
      priority: data.priority || "medium",
      assignee: data.assignee.trim(),
      category: data.category || CATEGORIES[0],
      dueDate: data.dueDate || null,
      estimateHours: Number(data.estimateHours) || 0,
      createdAt: now,
      updatedAt: now,
    };

    writeData([...items, newItem]);
    return clone(newItem);
  });
}

/** PATCH /items/:id — update fields; always bumps `updatedAt`. */
export async function updateItem(id, changes) {
  return fakeRequest(() => {
    const numericId = Number(id);
    const items = readData();

    if (!items.some((item) => item.id === numericId)) {
      throw new Error(
        `Task #${numericId} was not found (maybe deleted).`,
      );
    }

    validateTaskData(changes, { partial: true });

    const { id: _ignored, ...safeChanges } = changes; // id can never change
    const now = new Date().toISOString();

    const updatedItems = items.map((item) =>
      item.id === numericId
        ? { ...item, ...safeChanges, id: numericId, updatedAt: now }
        : item,
    );

    writeData(updatedItems);
    return clone(updatedItems.find((item) => item.id === numericId));
  });
}

/** DELETE /items/:id */
export async function deleteItem(id) {
  return fakeRequest(() => {
    const numericId = Number(id);
    const items = readData();

    if (!items.some((item) => item.id === numericId)) {
      throw new Error(
        `Task #${numericId} was not found (maybe deleted).`,
      );
    }

    writeData(items.filter((item) => item.id !== numericId));
    return { success: true, id: numericId };
  });
}

/** Utility for demos: restore the original seed data. */
export async function resetData() {
  return fakeRequest(() => {
    const seed = buildInitialData();
    writeData(seed);
    return { success: true, total: seed.length };
  });
}
