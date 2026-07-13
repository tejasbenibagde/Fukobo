// src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import "@fontsource/fira-code/400.css";
import "@fontsource/fira-code/500.css";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// window.ipcRenderer.on("main-process-message", (_event, message) => {
//   console.log(message);
// });