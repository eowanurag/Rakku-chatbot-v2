export const env = {
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "https://rakku-chatbot-v1.onrender.com/api",
  NEXT_PUBLIC_AI_SERVICE_URL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000",
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING === "true" || true, // default to true if local sandbox
  NODE_ENV: process.env.NODE_ENV || "development",
};
