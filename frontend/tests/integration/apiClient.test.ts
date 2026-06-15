import { request, ApiError } from "../../src/lib/api/apiClient";

describe("apiClient integration wrappers", () => {
  beforeEach(() => {
    // Clean storage values
    localStorage.clear();
  });

  it("should handle offline status errors", async () => {
    // We expect request to fail as it targets non-existent endpoint
    await expect(request("/nonexistent-endpoint")).rejects.toThrow(ApiError);
  });
});
