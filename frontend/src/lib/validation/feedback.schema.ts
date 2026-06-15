import { z } from "zod";

export const ServiceFeedbackSchema = z.object({
  sessionId: z.string(),
  rating: z.number().int().min(1).max(5),
  comments: z.string().max(500).optional(),
  category: z.string(),
  submittedAt: z.string(),
});

export type ServiceFeedbackDto = z.infer<typeof ServiceFeedbackSchema>;
