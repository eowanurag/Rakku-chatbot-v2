import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Chat layout accessibility", () => {
  it("should have zero axe violations in chat view model", async () => {
    const { container } = render(
      <div>
        <div role="log" aria-live="polite">
          <p>Rakku: Hello! How can I help you?</p>
        </div>
        <div role="group" aria-label="Quick options">
          <button>File Complaint</button>
        </div>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
