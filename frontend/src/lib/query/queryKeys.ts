export const queryKeys = {
  applications: {
    all: ["applications"] as const,
    lists: () => [...queryKeys.applications.all, "list"] as const,
    recent: () => [...queryKeys.applications.all, "recent"] as const,
    tracking: (id: string) => [...queryKeys.applications.all, "tracking", id] as const,
  },
  chat: {
    session: (id: string) => ["chat", id] as const,
  },
  profile: () => ["profile"] as const,
  feedback: () => ["feedback"] as const,
} as const;
