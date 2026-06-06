import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          navy: {
            DEFAULT: "var(--police-navy)",
            light: "var(--police-navy-light)",
            dark: "var(--police-navy-dark)",
          },
          red: {
            DEFAULT: "var(--police-red)",
            light: "var(--police-red-light)",
            dark: "var(--police-red-dark)",
          },
          gold: {
            DEFAULT: "var(--police-gold)",
            light: "var(--police-gold-light)",
            dark: "var(--police-gold-dark)",
          },
          khaki: {
            DEFAULT: "var(--police-khaki)",
            dark: "var(--police-khaki-dark)",
          }
        },
        slate: {
          850: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        theme: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".8" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
