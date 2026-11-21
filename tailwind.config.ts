import type { Config } from "tailwindcss";
export default {
  content: ["./entrypoints/**/*.{html,ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    vortex: { canvas: "#0E1117", sidebar: "#131720", surface: "#181D28", hover: "#1F2636", border: "#242B3B", text: "#E6EDF5", muted: "#8B97AD", accent: "#4F8CFF" }
  }, borderRadius: { vortex: "10px" } } },
  plugins: []
} satisfies Config;
