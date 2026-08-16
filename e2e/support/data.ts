/**
 * Every spec that creates a trip must scope its list/detail assertions to a
 * title generated here — specs run with fullyParallel:true against one
 * shared Clerk user and one shared Mongo database, so without this,
 * concurrent specs would see each other's trips.
 */
export function uniqueTitle(prefix = "E2E"): string {
  return `${prefix} ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
