/**
 * Application Entry Point
 *
 * This is the root of the React application
 * All providers and routing are handled via AppProviders and AppRouter
 */

import { createRoot } from "react-dom/client";
import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";
import "./index.css";
import "mapbox-gl/dist/mapbox-gl.css";

createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <AppRouter />
  </AppProviders>,
);
