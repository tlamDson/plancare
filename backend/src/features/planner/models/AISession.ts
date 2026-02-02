import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAISession extends Document {
  userId: Types.ObjectId;
  tripId?: Types.ObjectId;
  messages: {
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

const AISessionSchema = new Schema<IAISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.model<IAISession>("AISession", AISessionSchema);
