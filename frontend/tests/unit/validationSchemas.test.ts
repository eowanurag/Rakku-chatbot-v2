import { CitizenProfileSchema } from "../../src/lib/validation/citizen.schema";
import { EngineResponseSchema } from "../../src/lib/validation/workflow.schema";
import { ServiceFeedbackSchema } from "../../src/lib/validation/feedback.schema";

describe("Zod Runtime Schema Validators", () => {
  describe("CitizenProfileSchema", () => {
    it("should pass valid citizen records", () => {
      const valid = {
        id: "cit-1",
        name: "Anoop Kumar",
        mobile: "9876543210",
        isAuthenticated: true,
      };
      const res = CitizenProfileSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("should block invalid mobile prefixes", () => {
      const invalid = {
        id: "cit-1",
        name: "Anoop Kumar",
        mobile: "1234567890", // Invalid prefix
        isAuthenticated: true,
      };
      const res = CitizenProfileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("EngineResponseSchema", () => {
    it("should parse full normalized responses", () => {
      const payload = {
        sessionId: "sess-123",
        workflowId: "lost-mobile",
        textResponse: "Form loaded",
        workflowStatus: "ACTIVE",
        isUrgent: false,
      };
      const res = EngineResponseSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });
  });

  describe("ServiceFeedbackSchema", () => {
    it("should accept valid rating values", () => {
      const feedback = {
        sessionId: "sess-xyz",
        rating: 5,
        category: "chatbot",
        submittedAt: new Date().toISOString(),
      };
      const res = ServiceFeedbackSchema.safeParse(feedback);
      expect(res.success).toBe(true);
    });

    it("should block ratings outside 1-5 limit range", () => {
      const feedback = {
        sessionId: "sess-xyz",
        rating: 6, // invalid rating
        category: "chatbot",
        submittedAt: new Date().toISOString(),
      };
      const res = ServiceFeedbackSchema.safeParse(feedback);
      expect(res.success).toBe(false);
    });
  });
});
