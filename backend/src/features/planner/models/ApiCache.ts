import mongoose, { Schema, Document } from "mongoose";

export interface IApiCache extends Document {
  key: string;
  source: string;
  payload: Record<string, any>;
  expiresAt: Date;
}

const ApiCacheSchema = new Schema<IApiCache>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index - MongoDB will automatically delete expired documents
ApiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IApiCache>("ApiCache", ApiCacheSchema);
