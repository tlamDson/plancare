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
  },
  {
    timestamps: true,
  },
);

PlaceCacheSchema.index({ coordinates: "2dsphere" });
PlaceCacheSchema.index({ query: 1, isVerified: 1 });
PlaceCacheSchema.index({ lastVerifiedAt: 1 });

export default mongoose.model<IPlaceCache>("PlaceCache", PlaceCacheSchema);
