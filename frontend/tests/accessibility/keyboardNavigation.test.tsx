import { Keyboard } from "../../src/lib/accessibility/keyboard";

describe("Keyboard Navigation Interactions", () => {
  it("should match action keys correctly", () => {
    const enterEvent = { key: "Enter" } as KeyboardEvent;
    const spaceEvent = { key: " " } as KeyboardEvent;
    const tabEvent = { key: "Tab" } as KeyboardEvent;

    expect(Keyboard.isEnter(enterEvent)).toBe(true);
    expect(Keyboard.isSpace(spaceEvent)).toBe(true);
    expect(Keyboard.isTab(tabEvent)).toBe(true);
  });

  it("should trigger callback on action key events", () => {
    const callback = jest.fn();
    const event = { key: "Enter", preventDefault: jest.fn() } as unknown as KeyboardEvent;

    Keyboard.triggerOnAction(event, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
