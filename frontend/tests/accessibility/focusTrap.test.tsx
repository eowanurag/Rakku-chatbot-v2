import { FocusManager } from "../../src/lib/accessibility/focusManager";

describe("FocusManager Trapping logic", () => {
  let container: HTMLDivElement;
  let btn1: HTMLButtonElement;
  let btn2: HTMLButtonElement;

  beforeEach(() => {
    container = document.createElement("div");
    btn1 = document.createElement("button");
    btn2 = document.createElement("button");
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should focus the first element in the container", () => {
    FocusManager.focusFirst(container);
    expect(document.activeElement).toBe(btn1);
  });
});
