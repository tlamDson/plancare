import { Schema, Types } from "mongoose";
import type { ITrip } from "./Trip.types";

export const attachTripMethods = (schema: Schema<ITrip>) => {
  schema.statics.acquireAgentLock = async function (
    tripId: Types.ObjectId,
    jobId: string,
  ) {
    return this.findOneAndUpdate(
      { _id: tripId, isAgentProcessing: false },
      {
        isAgentProcessing: true,
        agentJobId: jobId,
        agentLockedAt: new Date(),
      },
      { new: true },
    );
  };

  schema.statics.releaseAgentLock = async function (
    tripId: Types.ObjectId,
    jobId: string,
  ) {
    return this.findOneAndUpdate(
      { _id: tripId, agentJobId: jobId },
      {
        isAgentProcessing: false,
        $unset: { agentJobId: 1, agentLockedAt: 1 },
      },
      { new: true },
    );
  };

  schema.statics.updateBudgetSpent = async function (
    tripId: Types.ObjectId,
    category: string,
    amount: number,
  ) {
    return this.findOneAndUpdate(
      { _id: tripId, "budget.breakdown.name": category },
      {
        $inc: {
          "budget.totalSpent": amount,
          "budget.breakdown.$.spent": amount,
        },
      },
      { new: true },
    );
  };
};
