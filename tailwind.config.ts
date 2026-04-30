import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f7fa",
          100: "#e4e9f0",
          200: "#c7d0dd",
          300: "#9aa7bb",
          500: "#5c6a82",
          700: "#2d3648",
          900: "#0f1626",
        },
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          500: "#3b6bff",
          600: "#2a55e6",
          700: "#1f42b8",
        },
        accent: {
          500: "#10b981",
          600: "#059669",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 22, 38, 0.04), 0 6px 24px rgba(15, 22, 38, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
