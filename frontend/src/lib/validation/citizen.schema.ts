import { z } from "zod";

export const CitizenProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
  address: z.string().optional(),
  district: z.string().optional(),
  aadhaarLastFour: z.string().regex(/^\d{4}$/, "Invalid Aadhaar suffix").optional(),
  isAuthenticated: z.boolean(),
});

export type CitizenProfileDto = z.infer<typeof CitizenProfileSchema>;
