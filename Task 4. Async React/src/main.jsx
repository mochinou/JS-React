import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// StrictMode intentionally mounts effects twice in development.
// Thanks to the cleanup flags used in App/DetailsPanel this is harmless —
// which is exactly the point of the assignment (correct cleanup).
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
