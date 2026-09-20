import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/manrope";
import "@fontsource-variable/plus-jakarta-sans";
import "./styles.css";
import "./ui-fixes.css";
import App from "./App";

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL || "http://127.0.0.1:3210",
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexProvider>
  </React.StrictMode>,
);
