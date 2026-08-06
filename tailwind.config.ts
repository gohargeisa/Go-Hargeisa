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
      // Single source of truth for stacking order across the whole app —
      // every overlay system (side menu, search, notifications, account
      // menu, bottom sheets, drawers, modals, lightbox, toast, native
      // splash) uses one of these named tiers instead of ad-hoc numbers,
      // so two unrelated overlays can never accidentally collide again.
      zIndex: {
        chrome: "40", // persistent app chrome: bottom nav, mobile booking bar, offline banner
        overlay: "55", // header-triggered popups: side menu, search, notifications, account menu
        sheet: "60", // bottom sheets
        drawer: "70", // slide-in drawers (e.g. business dashboard sidebar)
        modal: "80", // centered confirmation/business modals
        lightbox: "90", // full-screen image viewer
        toast: "100", // transient toast notifications — always on top of any open overlay
        splash: "200", // native cold-start splash gate — always absolute top
      },
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
          700: "#047857",
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
        premium: "0 24px 60px rgba(15,23,42,.14)",
        "premium-lg": "0 32px 80px rgba(15,23,42,.18)",
      },

      backgroundImage: {
        "hero-gradient":
          "linear-gradient(180deg, rgba(11,31,58,.10) 0%, rgba(11,31,58,.70) 100%)",
      },

      // A single shared "expo-out" curve for hover/lift/reveal motion across
      // the site — the same family of easing Apple/Airbnb-style interfaces
      // use for anything that should feel like it's settling into place
      // rather than linearly sliding.
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        kenburns: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.25" },
          "50%": { transform: "translateY(-18px)", opacity: "0.7" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.1)" },
        },
      },

      animation: {
        fadeUp: "fadeUp .8s ease-out forwards",
        shimmer: "shimmer 2.2s ease-in-out infinite",
        kenburns: "kenburns 20s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        glowPulse: "glowPulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;