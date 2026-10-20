import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        debugger: {
          bg: "#07090e",
          panel: "#0f141f",
          panelLight: "#161d2d",
          panelDark: "#0b0e17",
          border: "#1e293b",
          borderBright: "#334155",
          accentCyan: "#06b6d4",
          accentAmber: "#f59e0b",
          accentYellow: "#fef08a",
          accentGreen: "#10b981",
          accentRed: "#ef4444",
          accentMagenta: "#ec4899",
          textMuted: "#64748b",
          textNormal: "#cbd5e1",
          textBright: "#f8fafc",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        glowCyan: "0 0 15px rgba(6, 182, 212, 0.4)",
        glowAmber: "0 0 15px rgba(245, 158, 11, 0.4)",
        glowGreen: "0 0 15px rgba(16, 185, 129, 0.4)",
        glowRed: "0 0 15px rgba(239, 68, 68, 0.4)",
        glowMagenta: "0 0 15px rgba(236, 72, 153, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
