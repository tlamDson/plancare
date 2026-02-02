import mongoose, { Schema, Document } from "mongoose";

export interface ICity extends Document {
  name: string;
  country: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  timezone: string;
  createdAt: Date;
}

const CitySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: true,
    },
    country: {
      type: String,
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
    timezone: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Create geospatial index for location queries
CitySchema.index({ location: "2dsphere" });

export default mongoose.model<ICity>("City", CitySchema);
