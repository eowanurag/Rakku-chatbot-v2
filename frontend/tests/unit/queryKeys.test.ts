import { queryKeys } from "../../src/lib/query/queryKeys";

describe("TanStack Query Keys Hierarchy", () => {
  it("should generate proper list and item sub-keys", () => {
    expect(queryKeys.applications.all).toEqual(["applications"]);
    expect(queryKeys.applications.lists()).toEqual(["applications", "list"]);
    expect(queryKeys.applications.recent()).toEqual(["applications", "recent"]);
    expect(queryKeys.applications.tracking("UP-123")).toEqual(["applications", "tracking", "UP-123"]);
  });

  it("should generate chat session keys correctly", () => {
    expect(queryKeys.chat.session("session-abc")).toEqual(["chat", "session-abc"]);
  });
});
