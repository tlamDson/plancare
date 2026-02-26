import mongoose, { Document, Schema } from "mongoose";

export interface ICityCost extends Document {
  cityId: string;
  cityName: string;
  country: string;
  minFoodUSD: number;
  minHotelUSD: number;
  lastUpdated: Date;
}

const cityCostSchema = new Schema<ICityCost>(
  {
    cityId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cityName: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    minFoodUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    minHotelUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const CityCost = mongoose.model<ICityCost>("CityCost", cityCostSchema);
