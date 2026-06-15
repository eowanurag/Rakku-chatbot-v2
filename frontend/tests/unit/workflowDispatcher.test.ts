import { WorkflowDispatcher } from "../../src/features/chat/services/workflowDispatcher";

describe("WorkflowDispatcher normalization tests", () => {
  it("should fall back to offline simulation on connection crash", async () => {
    // Calling dispatcher with specific triggers should return mock simulation answers
    const response = await WorkflowDispatcher.dispatchMessage("stolen mobile", "sess-test");
    expect(response.sessionId).toBe("sess-test");
    expect(response.isUrgent).toBe(true);
    expect(response.suggestions).toContain("File Complaint");
  });

  it("should trigger tenant verification prompt on tenant request keyword", async () => {
    const response = await WorkflowDispatcher.dispatchMessage("tenant verification kiraye", "sess-test");
    expect(response.workflowId).toBe("tenant-verification");
    expect(response.nextStep).toBe("tenant_name");
  });
});
