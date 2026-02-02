import mongoose, { Schema } from "mongoose";
import {
  IBudgetCategory,
  IEmbeddedBudget,
  IActivity,
  IItineraryDay,
  ICityStop,
  ITrip,
} from "./Trip.types";
import { TripStatusValues } from "@voyager/shared";
import { attachTripMethods } from "./Trip.methods";

export type { ITrip } from "./Trip.types";

// ============================================
// SCHEMA DEFINITIONS
// ============================================

const BudgetCategorySchema = new Schema<IBudgetCategory>(
  {
    name: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
    spent: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false },
);

const EmbeddedBudgetSchema = new Schema<IEmbeddedBudget>(
  {
    currency: { type: String, default: "USD" },
    totalLimit: { type: Number, required: true, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    breakdown: [BudgetCategorySchema],
  },
  { _id: false },
);

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: ["poi", "accommodation", "transport", "custom"],
      required: true,
    },
    placeId: { type: Schema.Types.ObjectId, ref: "Place" },
    name: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: [Number],
    },
    time: String,
    endTime: String,
    cost: Number,
    status: {
      type: String,
      enum: ["planned", "confirmed", "completed", "cancelled"],
      default: "planned",
    },
    notes: String,
    order: { type: Number, required: true },
  },
  { _id: true }, // Keep _id for individual activity updates
);

const ItineraryDaySchema = new Schema<IItineraryDay>(
  {
    day: { type: Number, required: true },
    date: { type: Date, required: true },
    geoHash: String,
    activities: [ActivitySchema],
  },
  { _id: true },
);

const StaySchema = new Schema(
  {
    placeId: { type: Schema.Types.ObjectId, ref: "Place" },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["hotel", "hostel", "airbnb", "other"],
      required: true,
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    pricePerNight: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    confirmationNumber: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { _id: true },
);

const CityStopSchema = new Schema<ICityStop>(
  {
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    order: { type: Number, required: true },
    stayNights: { type: Number, required: true },
    stays: [StaySchema],
  },
  { _id: false },
);

// ============================================
// MAIN TRIP SCHEMA
// ============================================

const TripSchema = new Schema<ITrip>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Embedded Budget
    budget: {
      type: EmbeddedBudgetSchema,
      required: true,
      default: () => ({
        currency: "USD",
        totalLimit: 0,
        totalSpent: 0,
        breakdown: [],
      }),
    },

    // Embedded Itinerary
    itinerary: {
      type: [ItineraryDaySchema],
      default: [],
    },

    // City stops
    cities: [CityStopSchema],

    // Agent Locking
    isAgentProcessing: { type: Boolean, default: false, index: true },
    agentJobId: String,
    agentLockedAt: Date,

    // Optimistic Concurrency Control
    version: { type: Number, default: 1 },

    // Metadata
    status: {
      type: String,
      enum: TripStatusValues as unknown as string[],
      default: "DRAFT",
      index: true,
    },
    coverImage: String,
    tags: [String],
  },
  {
    timestamps: true,
    // Enable optimistic concurrency via version key
    optimisticConcurrency: true,
  },
);

// ============================================
// INDEXES
// ============================================

// Compound index for user's trips sorted by date
TripSchema.index({ userId: 1, startDate: -1 });

// Index for finding trips by status
TripSchema.index({ userId: 1, status: 1 });

// Index for agent job lookups
TripSchema.index({ agentJobId: 1 }, { sparse: true });

// ============================================
// MIDDLEWARE
// ============================================

// Auto-increment version on save
TripSchema.pre("save", function () {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
});

// ============================================
// STATIC METHODS
// ============================================

attachTripMethods(TripSchema);

export default mongoose.model<ITrip>("Trip", TripSchema);
