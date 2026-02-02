/**
 * Features Index
 *
 * Feature-First Architecture (Section 7)
 * Each feature is self-contained with:
 * - api/     → API layer (TanStack Query)
 * - hooks/   → Custom hooks
 * - components/ → UI components
 * - pages/   → Page components
 * - stores/  → Zustand stores (UI state only)
 */

// Re-export feature modules
export * from "./auth";
export * from "./trips";
export * from "./planner";
export * from "./map";
export * from "./assistant";
export * from "./ui";

// Page exports for router (default exports can't be re-exported)
// Use lazy() imports in router instead
