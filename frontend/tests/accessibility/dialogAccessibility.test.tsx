import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Dialog accessibility standards", () => {
  it("should render mock dialog with no violations", async () => {
    const { container } = render(
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">Confirm Submission</h2>
        <button>Accept</button>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
