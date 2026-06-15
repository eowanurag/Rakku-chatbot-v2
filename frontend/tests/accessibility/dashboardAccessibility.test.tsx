import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Dashboard layout landmarks", () => {
  it("should have zero violations on core semantic tags check", async () => {
    const { container } = render(
      <div>
        <header>
          <h1>Rakku Dashboard</h1>
        </header>
        <nav aria-label="Main Navigation">
          <a href="/chat">Chat</a>
        </nav>
        <main>
          <section aria-labelledby="quick-services">
            <h2 id="quick-services">Services</h2>
          </section>
        </main>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
