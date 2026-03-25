import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#061018",
          900: "#091723",
          800: "#0f2434",
        },
        mint: {
          400: "#73f2c0",
          500: "#2ce89a",
        },
        coral: {
          400: "#ff8b68",
          500: "#ff6a3d",
        },
        gold: {
          300: "#ffd36e",
          400: "#ffbf3d",
        },
      },
      fontFamily: {
        sans: [
          "\"Sora\"",
          "\"IBM Plex Sans\"",
          "\"Avenir Next\"",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "\"Space Grotesk\"",
          "\"Sora\"",
          "\"Avenir Next\"",
          "sans-serif",
        ],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.28)",
      },
      backgroundImage: {
        "market-grid":
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
