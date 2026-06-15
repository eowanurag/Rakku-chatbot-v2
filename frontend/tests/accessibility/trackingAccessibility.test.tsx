import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Tracking screen accessibility", () => {
  it("should validate structured lists and status timeline segments", async () => {
    const { container } = render(
      <ol aria-label="Application progress timeline">
        <li>
          <span className="font-semibold">Submitted</span> - Application received
        </li>
      </ol>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
