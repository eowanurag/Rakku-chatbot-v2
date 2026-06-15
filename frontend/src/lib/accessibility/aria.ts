export const Aria = {
  invalidAttr(hasError: boolean) {
    return hasError ? { "aria-invalid": true } : {};
  },
  describedByAttr(id?: string) {
    return id ? { "aria-describedby": id } : {};
  },
  labelAttr(label: string) {
    return { "aria-label": label };
  },
};
export default Aria;
