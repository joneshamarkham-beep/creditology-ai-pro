import type { Config } from "tailwindcss";

// Creditology brand tokens — keep in sync with the prototype (creditology-ai-pro.jsx)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#131110",
        panel: "#1D1A18",
        panelSoft: "#26221F",
        line: "#3A342F",
        terracotta: "#C96F4A",
        terracottaSoft: "#E08B66",
        gold: "#C9A227",
        goldSoft: "#E3C766",
        cream: "#F2EDE4",
        creamDim: "#B9B0A3",
        danger: "#D66A5B",
        ok: "#8FAF7E",
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
