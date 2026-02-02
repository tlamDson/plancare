import mongoose, { Schema } from "mongoose";
import { IPlace, IPlaceDetails } from "./Place.types";
import { attachPlaceMethods } from "./Place.methods";

export type { IPlace, IPlaceDetails, PlaceCategory, AccommodationType } from "./Place.types";

// ============================================
// PLACE MODEL (Shared Knowledge Base)
// Combines POI and Accommodation into one robust
// collection for reuse across users and trips
// ============================================

// ============================================
// SCHEMA DEFINITION
// ============================================

const PlaceDetailsSchema = new Schema<IPlaceDetails>(
  {
    rating: { type: Number, min: 0, max: 5 },
    reviewCount: { type: Number, min: 0 },
    priceLevel: { type: Number, min: 1, max: 4 },
    images: [String],
    openingHours: {
      monday: String,
      tuesday: String,
      wednesday: String,
      thursday: String,
      friday: String,
      saturday: String,
      sunday: String,
    },
    phone: String,
    website: String,
    address: String,
    accommodationType: {
      type: String,
      enum: ["hotel", "hostel", "airbnb", "resort", "guesthouse", "other"],
    },
    amenities: [String],
    checkInTime: String,
    checkOutTime: String,
  },
  { _id: false },
);

const PlaceSchema = new Schema<IPlace>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "attraction",
        "restaurant",
        "cafe",
        "bar",
        "accommodation",
        "shopping",
        "transport",
        "entertainment",
        "nature",
        "museum",
        "landmark",
        "other",
      ],
      required: true,
      index: true,
    },
    description: String,

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
      index: true,
    },

    details: {
      type: PlaceDetailsSchema,
      default: () => ({}),
    },

    // AI Fields
    embedding: {
      type: [Number],
      select: false, // Don't include in queries by default (large field)
    },
    aiTags: [String],
    aiSummary: String,

    // Source & Cache
    source: {
      type: String,
      enum: ["google", "tripadvisor", "booking", "manual", "ai_generated"],
      required: true,
    },
    sourceId: {
      type: String,
      sparse: true,
    },
    lastSyncedAt: Date,
    isStale: {
      type: Boolean,
      default: false,
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================
// INDEXES
// ============================================

// Geospatial index for nearby queries ("Find restaurants near me")
PlaceSchema.index({ location: "2dsphere" });

// Compound index for city + category filtering
PlaceSchema.index({ cityId: 1, category: 1 });

// Compound index for source deduplication
PlaceSchema.index({ source: 1, sourceId: 1 }, { unique: true, sparse: true });

// Text index for basic keyword search
PlaceSchema.index({ name: "text", description: "text", "details.address": "text" });

// Index for finding stale data that needs refresh
PlaceSchema.index({ isStale: 1, lastSyncedAt: 1 });

// ============================================
// STATIC METHODS
// ============================================

attachPlaceMethods(PlaceSchema);

export default mongoose.model<IPlace>("Place", PlaceSchema);
