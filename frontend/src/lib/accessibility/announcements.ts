export class Announcements {
  private static liveRegionId = "rakku-live-announcer";

  /**
   * Triggers an audible message announcement inside our global polite live region.
   */
  static announce(message: string, priority: "polite" | "assertive" = "polite") {
    if (typeof window === "undefined") return;

    let region = document.getElementById(this.liveRegionId);
    if (!region) {
      region = document.createElement("div");
      region.id = this.liveRegionId;
      region.className = "sr-only";
      region.setAttribute("aria-live", priority);
      region.setAttribute("aria-atomic", "true");
      document.body.appendChild(region);
    }

    // Update region text
    region.textContent = "";
    setTimeout(() => {
      if (region) region.textContent = message;
    }, 100);
  }
}
export default Announcements;
