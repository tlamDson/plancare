import { Document, Types } from "mongoose";

/** Place categories */
export type PlaceCategory =
  | "attraction"
  | "restaurant"
  | "cafe"
  | "bar"
  | "accommodation"
  | "shopping"
  | "transport"
  | "entertainment"
  | "nature"
  | "museum"
  | "landmark"
  | "other";

/** Accommodation-specific subtypes */
export type AccommodationType =
  | "hotel"
  | "hostel"
  | "airbnb"
  | "resort"
  | "guesthouse"
  | "other";

/** Place details interface */
export interface IPlaceDetails {
  rating?: number;
  reviewCount?: number;
  priceLevel?: number; // 1-4 scale ($ to $$$$)
  images?: string[];
  openingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  phone?: string;
  website?: string;
  address?: string;

  // Accommodation-specific fields
  accommodationType?: AccommodationType;
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
}

export interface IPlace extends Document {
  // Identity
  name: string;
  category: PlaceCategory;
  description?: string;

  // Location (GeoJSON)
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };

  // Optional city reference for filtering
  cityId?: Types.ObjectId;

  // Detailed information
  details: IPlaceDetails;

  // ============================================
  // AI-ENABLED FIELDS
  // ============================================

  /**
   * Vector embedding for semantic search
   * Stores the "meaning" of this place for AI queries like "find romantic spots"
   * Dimensions depend on your embedding model (e.g., 1536 for OpenAI ada-002)
   */
  embedding?: number[];

  /**
   * AI-generated tags for enhanced searchability
   * Examples: ["romantic", "quiet", "family-friendly", "instagram-worthy"]
   */
  aiTags?: string[];

  /**
   * AI-generated summary for quick context
   */
  aiSummary?: string;

  // ============================================
  // DATA SOURCE & CACHE CONTROL
  // ============================================

  /** Data source for deduplication and updates */
  source: "google" | "tripadvisor" | "booking" | "manual" | "ai_generated";

  /** External source ID to prevent duplicates */
  sourceId?: string;

  /** Last time data was synced from external source */
  lastSyncedAt?: Date;

  /** Indicates if this place needs data refresh */
  isStale?: boolean;

  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
