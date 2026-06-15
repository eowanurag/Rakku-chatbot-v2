export const LOCALE_KEYS = {
  SERVICES: {
    LOST_MOBILE: "services.lost_mobile",
    LOST_DOCUMENTS: "services.lost_documents",
    CYBER_FRAUD: "services.cyber_fraud",
    HARASSMENT: "services.harassment",
    CHARACTER_CERTIFICATE: "services.character_certificate",
    TENANT_VERIFICATION: "services.tenant_verification",
  },
  TRACKING: {
    SUBMITTED: "tracking.submitted",
    UNDER_REVIEW: "tracking.under_review",
    APPROVED: "tracking.approved",
    REJECTED: "tracking.rejected",
  },
  PRP: {
    USE_VERIFIED_PROFILE: "prp.use_verified_profile",
    APPLY_FOR_SOMEONE_ELSE: "prp.apply_for_someone_else",
    APPLICANT: "prp.applicant",
    SUBJECT: "prp.subject",
  },
  FEEDBACK: {
    CATEGORIES: {
      LOCALIZATION: "feedback.categories.LOCALIZATION",
      CONFUSING_FLOW: "feedback.categories.CONFUSING_FLOW",
      DUPLICATE_DATA_COLLECTION: "feedback.categories.DUPLICATE_DATA_COLLECTION",
      LOCATION_ERROR: "feedback.categories.LOCATION_ERROR",
      TRACKING_ISSUE: "feedback.categories.TRACKING_ISSUE",
      VERIFICATION_ISSUE: "feedback.categories.VERIFICATION_ISSUE",
      UI_PROBLEM: "feedback.categories.UI_PROBLEM",
      PERFORMANCE: "feedback.categories.PERFORMANCE",
      OTHER: "feedback.categories.OTHER",
    },
    RATING: {
      TITLE: "feedback.rating.title",
      COMMENT_OPTIONAL: "feedback.rating.comment_optional",
      COMMENT_REQUIRED: "feedback.rating.comment_required",
      SKIP: "feedback.rating.skip",
      SUBMIT: "feedback.rating.submit",
    },
  },
  EMERGENCY: {
    TITLE: "emergency.title",
    CALL_NOW: "emergency.call_now",
    NEAREST_POLICE_STATION: "emergency.nearest_police_station",
    CYBER_CRIME_HELPLINE: "emergency.cyber_crime_helpline",
    WOMEN_HELPLINE: "emergency.women_helpline",
    AMBULANCE: "emergency.ambulance",
    FIRE_SERVICE: "emergency.fire_service",
  },
} as const;
export default LOCALE_KEYS;
