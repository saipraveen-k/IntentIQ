import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#111827",
        surfaceLight: "#1f293d",
        primary: {
          50: "#eef2ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        accent: {
          cyan: "#06b6d4",
          purple: "#a855f7",
          amber: "#f59e0b",
          emerald: "#10b981",
        }
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.15), transparent 70%)',
      }
    },
  },
  plugins: [],
};
export default config;
