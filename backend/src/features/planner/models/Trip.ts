import mongoose, { Schema } from "mongoose";
import {
  IBudgetCategory,
  IEmbeddedBudget,
  IActivity,
  IItineraryDay,
  ICityStop,
  ITrip,
} from "./Trip.types";
import { TripStatusValues } from "@travelplan/shared";
import { attachTripMethods } from "./Trip.methods";

export type { ITrip } from "./Trip.types";

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
      googlePlaceId: String,
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
    // Rich place data from Mapbox + Google Places validation
    rating: Number,
    priceLevel: Number,
    photoUrl: String,
    openingHours: String,
    // Distance validation flag — set when next activity is too far for chosen transport mode
    requiresTransport: { type: Boolean, default: false },
    // Nearby food/snack suggestions cached from Google Places Nearby Search
    nearbySuggestions: [
      {
        name: String,
        placeId: String,
        distanceKm: Number,
        priceLevel: Number,
        photoUrl: String,
      },
    ],
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

    purpose: {
      type: String,
      enum: ["leisure", "business", "bleisure", "family_visit", "event"],
    },
    groupType: {
      type: String,
      enum: ["solo", "couple", "family_kids", "friends", "work"],
    },
    priorities: {
      money: { type: Number, min: 1, max: 10 },
      comfort: { type: Number, min: 1, max: 10 },
      unique: { type: Number, min: 1, max: 10 },
    },
    mood: {
      type: String,
      enum: [
        "city_break",
        "beach",
        "hiking",
        "foodie",
        "romantic",
        "adventure",
      ],
    },
    dealBreakers: [String],

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

    itinerary: {
      type: [ItineraryDaySchema],
      default: [],
    },

    cities: [CityStopSchema],

    isAgentProcessing: { type: Boolean, default: false, index: true },
    agentJobId: String,
    agentLockedAt: Date,

    version: { type: Number, default: 1 },

    // Undo history: stores up to 5 itinerary snapshots for undo/redo
    itineraryHistory: {
      type: [
        {
          snapshot: Schema.Types.Mixed,
          savedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false, // excluded from default queries (large field)
    },

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
TripSchema.index({ userId: 1, startDate: -1 });

TripSchema.index({ userId: 1, status: 1 });

TripSchema.index({ agentJobId: 1 }, { sparse: true });
TripSchema.pre("save", function () {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
});
attachTripMethods(TripSchema);

export default mongoose.model<ITrip>("Trip", TripSchema);
