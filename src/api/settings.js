// Key used to persist the "database" in localStorage.
export const DATA_KEY = "station-ops-tasks-db-v1";

// Config for the simulated network of the fake API.
// Every request is a Promise that resolves after a random delay
// and may randomly reject with a server error.
export const API_CONFIG = {
  minDelay: 350, // ms — fast endpoints (list)
  maxDelay: 1400, // ms
  errorChance: 0.08, // 8% of requests fail with a simulated 500
};

// Detail payloads are "heavier" — they are slower on purpose so that
// race conditions are easy to reproduce by clicking items quickly.
export const DETAILS_CONFIG = {
  minDelay: 900, // ms
  maxDelay: 2600, // ms
};

// Error chance used when the "Unstable network" demo toggle is on.
export const UNSTABLE_ERROR_CHANCE = 0.4;
