import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        heatBlack: "#0a0a0a",
        heatBlack2: "#141414",
        neon: "#E4FF1A",
      },
      boxShadow: {
        neon: "0 0 5px rgba(228,255,26,0.3), 0 0 11px rgba(228,255,26,0.15)",
      },
      fontFamily: {
        display: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

