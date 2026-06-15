export const Keyboard = {
  isEnter(e: React.KeyboardEvent | KeyboardEvent): boolean {
    return e.key === "Enter";
  },
  isSpace(e: React.KeyboardEvent | KeyboardEvent): boolean {
    return e.key === " " || e.key === "Spacebar";
  },
  isEscape(e: React.KeyboardEvent | KeyboardEvent): boolean {
    return e.key === "Escape" || e.key === "Esc";
  },
  isTab(e: React.KeyboardEvent | KeyboardEvent): boolean {
    return e.key === "Tab";
  },
  triggerOnAction(e: React.KeyboardEvent | KeyboardEvent, callback: () => void) {
    if (this.isEnter(e) || this.isSpace(e)) {
      e.preventDefault();
      callback();
    }
  },
};
export default Keyboard;
