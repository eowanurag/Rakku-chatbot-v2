export const ROUTES = {
  FRONTEND: {
    DASHBOARD: "/dashboard",
    CHAT: "/chat",
    TRACKING: "/tracking",
    COMPLAINTS: "/complaints",
    VERIFICATION: "/verification",
    CERTIFICATES: "/certificates",
    PROFILE: "/profile",
    FEEDBACK: "/feedback",
  },
  API: {
    CHAT: "/chat",
    COMPLAINT: "/complaint",
    VERIFICATION: "/verification",
    CERTIFICATE: "/certificate",
    EVENT: "/event",
    TRACKING: (refNum: string) => `/tracking/${refNum}`,
    PORTAL_STATS: "/portal/stats",
  },
};
