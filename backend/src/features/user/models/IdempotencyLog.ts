import mongoose, { Schema, Document } from "mongoose";

export interface IIdempotencyLog extends Document {
  key: string;
  userId: string;
  tripId: string;
  jobId: string;
  createdAt: Date;
}

const IdempotencyLogSchema = new Schema<IIdempotencyLog>(
  {
    key: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    tripId: { type: String, required: true },
    jobId: { type: String, required: true },
  },
  { timestamps: true },
);

// Auto-delete after 24h
IdempotencyLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 },
);

export default mongoose.model<IIdempotencyLog>(
  "IdempotencyLog",
  IdempotencyLogSchema,
);
