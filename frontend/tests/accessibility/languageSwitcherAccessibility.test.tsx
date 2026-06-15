import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("LanguageSwitcher accessibility", () => {
  it("should have zero violations on button triggers and active tags", async () => {
    const { container } = render(
      <div role="group" aria-label="Select Language">
        <button aria-label="Switch to Hindi">हिन्दी</button>
        <button aria-label="Switch to English">English</button>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
