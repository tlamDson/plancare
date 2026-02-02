import mongoose, { Schema, Document } from "mongoose";
//for type safety
export interface IUser extends Document {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  gender: string;
  dateOfBirth: Date;
  preferences: {
    currency: string;
    budgetRange?: number;
    travelStyle?: string[];
  };
  notificationPreferences: {
    tripReminders: { type: Boolean; default: true };
    budgetAlerts: { type: Boolean; default: true };
    tripInvites: { type: Boolean; default: true };
    aiSuggestions: { type: Boolean; default: true };
    doNotDisturb: { type: Boolean; default: false };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true, // this prevent the duplicate
      index: true, //have index for faster queries
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      default: "not_specified",
    },
    avatarUrl: String,
    notificationPreferences: {
      tripReminders: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
      tripInvites: { type: Boolean, default: true },
      aiSuggestions: { type: Boolean, default: true },
      doNotDisturb: { type: Boolean, default: false },
    },
    preferences: {
      currency: {
        type: String,
        default: "USD",
      },
      budgetRange: Number,
      travelStyle: [String],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);
