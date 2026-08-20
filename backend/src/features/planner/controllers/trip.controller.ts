/**
 * Barrel re-export — trip.controller.ts was split into use-case-scoped
 * files to satisfy Rule of 200 (was 882 lines). Kept as a barrel so
 * routes.ts doesn't need to change. See the individual files for logic:
 * trip-create, trip-read, trip-mutate, trip-reorder, trip-regen,
 * trip-lifecycle, trip-regeocode.
 */
export { generateTrip } from "./trip-create.controller";
export {
  getTripById,
  getUserTrips,
  getTripChunk,
} from "./trip-read.controller";
export {
  deleteTripById,
  updateTripById,
  undoTrip,
} from "./trip-mutate.controller";
export { reorderActivities } from "./trip-reorder.controller";
export { regenActivity } from "./trip-regen.controller";
export { updateTripLifecycle, cancelTrip } from "./trip-lifecycle.controller";
export { reGeocodeTrip } from "./trip-regeocode.controller";
