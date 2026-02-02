/**
 * @deprecated This model is DEPRECATED.
 * Accommodation has been merged into the unified Place model.
 * Stay details are now embedded in Trip.cities[].stays[].
 * See Place.ts and Trip.ts for the new schema.
 * 
 * This file is kept for migration purposes only.
 * Do not use in new code.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

/** @deprecated Use IPlace from Place.ts instead */
export interface IAccommodation extends Document {
  cityId?: Types.ObjectId;
  linkedTripId: Types.ObjectId;
  name: string;
  type: "hotel" | "hostel" | "airbnb" | "other";
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  pricePerNight: number;
  rating?: number;
  checkIn?: Date;
  checkOut?: Date;
  createdAt: Date;
}

const AccommodationSchema = new Schema<IAccommodation>(
  {
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
    },
    linkedTripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["hotel", "hostel", "airbnb", "other"],
      required: true,
    },
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
    pricePerNight: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    checkIn: Date,
    checkOut: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AccommodationSchema.index({ location: "2dsphere" });

export default mongoose.model<IAccommodation>(
  "Accommodation",
  AccommodationSchema
);
