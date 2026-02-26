/**
 * planner.controller.ts — Re-export shim
 *
 * Logic has been split into focused controllers:
 * - trip.controller.ts   → generateTrip, getTripById, getUserTrips, deleteTripById
 * - job.controller.ts    → getJobStatus, retryJob
 *
 * This file re-exports everything so routes.ts imports remain unchanged.
 */
export {
  generateTrip,
  getTripById,
  getUserTrips,
  deleteTripById,
} from "./trip.controller";
export { getJobStatus, retryJob } from "./job.controller";
