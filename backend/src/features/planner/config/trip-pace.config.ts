/**
 * PACE_CONFIG
 *
 * Maps user-selected travel pace to concrete planning parameters.
 * Used by trip-generation.prompt.ts to instruct the AI.
 */

export type TripPace = "relaxed" | "balanced" | "packed";

export interface PaceConfig {
  /** Max activities injected into the AI day skeleton */
  activitiesPerDay: number;
  /** Minimum minutes per spot injected into prompt */
  minMinutesPerSpot: number;
  /** Whether to include a mid-afternoon rest/coffee break */
  allowSiesta: boolean;
  /** Extra AI instruction for this pace */
  paceInstruction: string;
}

export const PACE_CONFIG: Record<TripPace, PaceConfig> = {
  relaxed: {
    activitiesPerDay: 2,
    minMinutesPerSpot: 120,
    allowSiesta: true,
    paceInstruction:
      "This is a RELAXED pace. Limit to max 2-3 main spots per day. Allow time to linger. MUST include a coffee or rest break in the afternoon.",
  },
  balanced: {
    activitiesPerDay: 4,
    minMinutesPerSpot: 90,
    allowSiesta: false,
    paceInstruction:
      "This is a BALANCED pace. Aim for 4 main spots per day with comfortable transitions between them.",
  },
  packed: {
    activitiesPerDay: 6,
    minMinutesPerSpot: 45,
    allowSiesta: false,
    paceInstruction:
      "This is a PACKED pace. Maximize spots per day (up to 6). Group locations geographically to minimize travel. Prioritize photo-ops and quick visits over lingering.",
  },
};
