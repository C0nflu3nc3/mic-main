import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const bootstrapData = window.__BOOTSTRAP__ || {};

createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <App bootstrapData={bootstrapData} />
  </React.StrictMode>
);
