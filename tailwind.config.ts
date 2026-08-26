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
        neon: "0 0 6px rgba(228,255,26,0.4), 0 0 14px rgba(228,255,26,0.2)",
      },
      fontFamily: {
        display: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

