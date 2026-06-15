export const CONSTANTS = {
  API: {
    TIMEOUT_MS: 15000,
    DEFAULT_RETRY_COUNT: 2,
    RETRY_DELAY_BASE_MS: 1000,
  },
  LOCALES: {
    DEFAULT: "hi",
    LANGUAGES: ["en", "hi", "hinglish"] as const,
  },
  STORAGE_KEYS: {
    WORKFLOW_DRAFT: "rakku_workflow_draft",
    SESSION_PROFILE: "rakku_session_profile",
    USER_LOCALE: "rakku_user_locale",
  },
};
