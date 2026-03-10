import { z } from "zod";

export const jobStatusSchema = z.enum([
  "IDLE",
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export const jobSchema = z.object({
  jobId: z.string(),
  status: jobStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  currentStep: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Job = z.infer<typeof jobSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
