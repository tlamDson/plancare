/**
 * @deprecated This model is DEPRECATED.
 * Budget is now embedded directly in the Trip document.
 * See Trip.ts for the new IEmbeddedBudget interface.
 *
 * This file is kept for migration purposes only.
 * Do not use in new code.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

/** @deprecated Use IEmbeddedBudget from Trip.ts instead */
export interface IBudget extends Document {
  tripId: Types.ObjectId;
  categories: {
    name: string;
    limit: number;
    spent: number;
  }[];
  totalLimit: number;
  totalSpent: number;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      unique: true,
      index: true,
    },
    categories: [
      {
        name: {
          type: String,
          required: true,
        },
        limit: {
          type: Number,
          required: true,
          min: 0,
        },
        spent: {
          type: Number,
          required: true,
          default: 0,
          min: 0,
        },
      },
    ],
    totalLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSpent: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  },
);

export default mongoose.model<IBudget>("Budget", BudgetSchema);
