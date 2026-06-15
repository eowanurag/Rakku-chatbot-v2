import { ACCESSIBILITY_CONSTANTS } from "./accessibility.constants";

export class FocusManager {
  private static activeTraps = new Set<HTMLElement>();

  /**
   * Traps the tab key index inside the target container.
   */
  static trapFocus(container: HTMLElement, e: KeyboardEvent) {
    if (e.key !== "Tab") return;

    const focusables = container.querySelectorAll(ACCESSIBILITY_CONSTANTS.FOCUSABLE_SELECTORS);
    if (focusables.length === 0) return;

    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  /**
   * Sets focus to the first focusable element inside the container.
   */
  static focusFirst(container: HTMLElement) {
    const focusables = container.querySelectorAll(ACCESSIBILITY_CONSTANTS.FOCUSABLE_SELECTORS);
    if (focusables.length > 0) {
      (focusables[0] as HTMLElement).focus();
    }
  }
}
export default FocusManager;
