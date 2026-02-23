import { Document, Types } from "mongoose";
import type { TripStatus as SharedTripStatus } from "@travelplan/shared";

export type TripStatus = SharedTripStatus;

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

  // 5. OPTIMISTIC CONCURRENCY CONTROL
  version: number;

  // Metadata
  status: TripStatus;
  coverImage?: string;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}
