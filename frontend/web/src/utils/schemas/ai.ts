import { z } from "zod";

export const aiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.string().datetime(),
  actions: z
    .array(
      z.object({
        type: z.string(),
        label: z.string(),
        data: z.unknown().optional(),
      }),
    )
    .optional(),
});

export const aiSessionSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  tripId: z.string().optional(),
  messages: z.array(aiMessageSchema),
  context: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AIMessage = z.infer<typeof aiMessageSchema>;
export type AISession = z.infer<typeof aiSessionSchema>;
