import { create } from "zustand";
import { CitizenProfile } from "../types/citizen.types";
import { GeolocationContext } from "../types/api.types";
import { CONSTANTS } from "../config/constants";

interface SessionState {
  profile: CitizenProfile | null;
  location: GeolocationContext | null;
  setProfile: (profile: CitizenProfile | null) => void;
  setLocation: (location: GeolocationContext | null) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  location: null,
  setProfile: (profile) => {
    set({ profile });
    if (typeof window !== "undefined") {
      if (profile) {
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.SESSION_PROFILE, JSON.stringify(profile));
      } else {
        localStorage.removeItem(CONSTANTS.STORAGE_KEYS.SESSION_PROFILE);
      }
    }
  },
  setLocation: (location) => set({ location }),
  logout: () => {
    set({ profile: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.SESSION_PROFILE);
    }
  },
}));
