/**
 * @deprecated This model is DEPRECATED.
 * POI has been merged into the unified Place model.
 * See Place.ts for the new schema with AI embeddings.
 *
 * This file is kept for migration purposes only.
 * Do not use in new code.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

/** @deprecated Use IPlace from Place.ts instead */
export interface IPOI extends Document {
  cityId: Types.ObjectId;
  source: "google" | "manual" | "api";
  name: string;
  category: string;
  description?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  averageCost?: number;
  rating?: number;
  createdAt: Date;
}

const POISchema = new Schema<IPOI>(
  {
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["google", "manual", "api"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
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
    averageCost: Number,
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Geospatial index for nearby queries
POISchema.index({ location: "2dsphere" });

export default mongoose.model<IPOI>("POI", POISchema);
