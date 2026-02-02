/**
 * @deprecated This model is DEPRECATED.
 * Itinerary is now embedded directly in the Trip document.
 * See Trip.ts for the new IItineraryDay interface.
 *
 * This file is kept for migration purposes only.
 * Do not use in new code.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

/** @deprecated Use IItineraryDay from Trip.ts instead */
export interface IItinerary extends Document {
  tripId: Types.ObjectId;
  date: Date;
  activities: {
    poiId?: Types.ObjectId;
    accommodationId?: Types.ObjectId;
    title: string;
    startTime?: string;
    endTime?: string;
    cost?: number;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ItinerarySchema = new Schema<IItinerary>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    activities: [
      {
        poiId: {
          type: Schema.Types.ObjectId,
          ref: "POI",
        },
        accommodationId: {
          type: Schema.Types.ObjectId,
          ref: "Accommodation",
        },
        title: {
          type: String,
          required: true,
        },
        startTime: String,
        endTime: String,
        cost: Number,
        order: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient trip date queries
ItinerarySchema.index({ tripId: 1, date: 1 });

export default mongoose.model<IItinerary>("Itinerary", ItinerarySchema);
