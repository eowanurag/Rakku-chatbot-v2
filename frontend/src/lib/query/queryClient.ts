import { QueryClient } from "@tanstack/react-query";
import { CONSTANTS } from "../../config/constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: CONSTANTS.API.DEFAULT_RETRY_COUNT,
      retryDelay: (failureCount) =>
        Math.min(
          1000 * Math.pow(2, failureCount), // Exponential backoff (1s, 2s, 4s...)
          30000
        ),
    },
  },
});
