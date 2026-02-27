import mongoose, { Schema, Document } from "mongoose";

export interface IPlaceCache extends Document {
  query: string;
  coordinates: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  placeName: string;
  placeType: string;
  confidence: number;
  googlePlaceId?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  photos?: string[];
  categories?: string[];
  isVerified: boolean;
  source: "mapbox" | "google" | "both";
  lastVerifiedAt: Date;
  hitCount: number;
  /** Nearby food suggestions cached per anchor (avoids repeated Nearby Search API calls) */
  nearbyFood?: Array<{
    name: string;
    placeId: string;
    distanceKm: number;
    priceLevel?: number;
    photoUrl?: string;
  }>;
  /** TTL expiry — MongoDB auto-deletes this document after 60 days */
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceCacheSchema = new Schema<IPlaceCache>(
  {
    query: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    coordinates: {
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
    placeName: { type: String, required: true },
    placeType: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    googlePlaceId: String,
    rating: { type: Number, min: 0, max: 5 },
    reviewCount: Number,
    priceLevel: { type: Number, min: 0, max: 4 },
    photos: [String],
    categories: [String],
    isVerified: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ["mapbox", "google", "both"],
      required: true,
    },
    lastVerifiedAt: { type: Date, default: Date.now },
    hitCount: { type: Number, default: 0 },
    // Nearby food suggestions cached per anchor place
    nearbyFood: [
      {
        name: String,
        placeId: String,
        distanceKm: Number,
        priceLevel: Number,
        photoUrl: String,
      },
    ],
    // TTL: auto-expire cache after 60 days (MongoDB handles deletion)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  },
);

PlaceCacheSchema.index({ coordinates: "2dsphere" });
PlaceCacheSchema.index({ query: 1, isVerified: 1 });
PlaceCacheSchema.index({ lastVerifiedAt: 1 });
// TTL index: MongoDB auto-deletes cache entries when expiresAt is reached
PlaceCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPlaceCache>("PlaceCache", PlaceCacheSchema);
