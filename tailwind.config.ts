import type { Config } from "tailwindcss";

// Design tokens for the IT Ops Vault platform.
// Cool paper-grey light surface + deep teal accent — deliberately not the
// generic "dark mode + single bright accent" SaaS default. Light mode reduces
// eye strain for all-day MSP use; teal signals security/trust without being
// a templated blue-SaaS or terracotta look.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F6F7F9",
        surface: "#FFFFFF",
        border: "#DEE2E8",
        ink: "#1A1F29",
        muted: "#5C6472",
        accent: {
          DEFAULT: "#0E6E5F",
          hover: "#0B5A4E"
        },
        danger: "#C4432B"
      },
      fontFamily: {
        sans: ["var(--font-lato)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
