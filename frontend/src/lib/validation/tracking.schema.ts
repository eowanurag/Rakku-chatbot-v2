import { z } from "zod";

export const TrackingMilestoneSchema = z.object({
  title: z.string(),
  status: z.string(),
  timestamp: z.string(),
  description: z.string().optional(),
  isCompleted: z.boolean(),
});

export const ApplicationTrackingStatusSchema = z.object({
  referenceNumber: z.string(),
  serviceType: z.string(),
  status: z.string(),
  updatedAt: z.string(),
  milestones: z.array(TrackingMilestoneSchema),
  details: z.record(z.any()).optional(),
});

export type ApplicationTrackingStatusDto = z.infer<typeof ApplicationTrackingStatusSchema>;
