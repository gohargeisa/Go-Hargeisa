import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1320px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F59E0B",
          50: "#FFF7E6",
          100: "#FDECC8",
          200: "#FBD38D",
          300: "#F8B84E",
          400: "#F6A623",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },

        navy: {
          DEFAULT: "#0B1F3A",
          50: "#EDF3FA",
          100: "#D6E4F3",
          200: "#B3CAE8",
          300: "#7EA7D8",
          400: "#4C82C4",
          500: "#1F5FAE",
          600: "#0B3E78",
          700: "#0B2D57",
          800: "#081F3D",
          900: "#051427",
        },

        secondary: {
          DEFAULT: "#1F2937",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },

        accent: {
          DEFAULT: "#10B981",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },

        sand: "#F8FAFC",
        ink: "#111827",
      },

      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },

      borderRadius: {
        xl: "1rem",
        xl2: "1.25rem",
        xl3: "1.75rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      boxShadow: {
        glass: "0 10px 30px rgba(15,23,42,.08)",
        card: "0 12px 40px rgba(15,23,42,.12)",
        soft: "0 4px 18px rgba(0,0,0,.08)",
      },

      backgroundImage: {
        "hero-gradient":
          "linear-gradient(180deg, rgba(11,31,58,.10) 0%, rgba(11,31,58,.70) 100%)",
      },

      keyframes: {
        fadeUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(25px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },

      animation: {
        fadeUp: "fadeUp .8s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;