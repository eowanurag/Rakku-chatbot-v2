import { z } from "zod";

export const EngineResponseSchema = z.object({
  sessionId: z.string(),
  workflowId: z.string().optional(),
  textResponse: z.string(),
  suggestions: z.array(z.string()).optional(),
  formTemplate: z.any().optional(),
  nextStep: z.string().optional(),
  workflowStatus: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  isUrgent: z.boolean().optional(),
});

export type EngineResponseDto = z.infer<typeof EngineResponseSchema>;
