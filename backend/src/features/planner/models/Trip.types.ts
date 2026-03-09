import { Document, Types } from "mongoose";
import type {
  TripStatus as SharedTripStatus,
  TripLifecycle as SharedTripLifecycle,
} from "@travelplan/shared";

export type TripStatus = SharedTripStatus;
export type TripLifecycle = SharedTripLifecycle;

/** Budget category breakdown (e.g., food, accommodation, transport) */
export interface IBudgetCategory {
  name: string;
  limit: number;
  spent: number;
}

/** Embedded budget - eliminates separate Budget collection lookup */
export interface IEmbeddedBudget {
  currency: string;
  totalLimit: number;
  totalSpent: number;
  breakdown: IBudgetCategory[];
}

/** Activity within a day's itinerary */
export interface IActivity {
  type: "poi" | "accommodation" | "transport" | "custom";
  /** Reference to Place collection for static data */
  placeId?: Types.ObjectId;
  /** Snapshot of critical info - avoids fetching Place just to render list */
  name: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    googlePlaceId?: string;
  };
  /** Dynamic trip-specific details */
  time?: string;
  endTime?: string;
  cost?: number;
  status: "planned" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  order: number;
  /** Rich place data from Mapbox + Google Places */
  rating?: number;
  priceLevel?: number;
  photoUrl?: string;
  openingHours?: string;
  /** Distance validation — set by geo-validator when activity requires non-walking transport */
  requiresTransport?: boolean;
  /** Distance from the previous activity in the day (in km) */
  distanceFromPrevious?: number;
  /** Nearby food/snack suggestions around this activity anchor (cached from Google Places) */
  nearbySuggestions?: Array<{
    name: string;
    placeId: string;
    distanceKm: number;
    priceLevel?: number;
    photoUrl?: string;
  }>;
}

/** Single day in the itinerary */
export interface IItineraryDay {
  day: number;
  date: Date;
  /** GeoHash for map focus optimization */
  geoHash?: string;
  activities: IActivity[];
}

/** City stop within the trip */
export interface ICityStop {
  cityId: Types.ObjectId;
  order: number;
  stayNights: number;
  /** Embedded stay details instead of Accommodation references */
  stays: {
    placeId?: Types.ObjectId;
    name: string;
    type: "hotel" | "hostel" | "airbnb" | "other";
    checkIn: Date;
    checkOut: Date;
    pricePerNight: number;
    totalPrice: number;
    confirmationNumber?: string;
    status: "pending" | "confirmed" | "cancelled";
  }[];
}

// ============================================
// MAIN TRIP INTERFACE (Super-Document Pattern)
// ============================================
export interface ITrip extends Document {
  userId: string;
  title: string;
  destination?: string;
  description?: string;
  startDate: Date;
  endDate: Date;

  // Preferences (Wizard inputs)
  purpose?: "leisure" | "business" | "bleisure" | "family_visit" | "event";
  groupType?: "solo" | "couple" | "family_kids" | "friends" | "work";
  priorities?: {
    money: number;
    comfort: number;
    unique: number;
  };
  mood?:
    | "city_break"
    | "beach"
    | "hiking"
    | "foodie"
    | "romantic"
    | "adventure";
  dealBreakers?: string[];

  // 1. EMBEDDED BUDGET (No separate collection)
  budget: IEmbeddedBudget;

  // 2. EMBEDDED ITINERARY (No separate collection)
  itinerary: IItineraryDay[];

  // 3. City stops with embedded stays
  cities: ICityStop[];

  // 4. AGENT LOCKING (Distributed Systems)
  /** Prevents User from editing while Agent is working */
  isAgentProcessing: boolean;
  agentJobId?: string;
  agentLockedAt?: Date;

  // 4b. CHUNKED GENERATION (Pro trips > 5 days)
  totalChunks?: number;
  chunksReady?: boolean[];
  regenCount?: number;

  // 5. OPTIMISTIC CONCURRENCY CONTROL
  version: number;

  // 6. UNDO HISTORY — snapshots of itinerary for undo/redo support (max 5 kept)
  itineraryHistory?: Array<{
    snapshot: IItineraryDay[];
    savedAt: Date;
  }>;

  // Metadata
  status: TripStatus;
  lifecycle: TripLifecycle;
  coverImage?: string;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}
