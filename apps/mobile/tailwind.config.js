/**
 * NativeWind (Tailwind for React Native).
 *
 * This is a build-time Node (CommonJS) file, so it can't `require()` the
 * TypeScript `@gohargeisa/tokens`. The values below are a hand copy of
 * `packages/tokens/src/index.ts` — that file stays the source of truth for
 * the RUNTIME theme (`src/theme/`); keep these two in sync (colours rarely
 * change).
 *
 * Navy + blue is the Go Hargeisa mobile chrome. `amber` is present only for
 * partner-branded surfaces — it is NOT the app primary.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
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
        // App primary = brand blue (matches manifest.json theme_color / colors.xml)
        primary: {
          DEFAULT: "#0B5ED7",
          dark: "#084BB0",
          tint: "#E7F0FD",
        },
        blue: {
          DEFAULT: "#0B5ED7",
          dark: "#084BB0",
          tint: "#E7F0FD",
        },
        accent: {
          DEFAULT: "#10B981",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        // Partner-branded surfaces ONLY.
        amber: {
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
        sand: "#F8FAFC",
        ink: "#111827",
      },
      borderRadius: {
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
      },
      // Font names match the loaded @expo-google-fonts faces (src/theme/fonts.ts).
      fontFamily: {
        display: ["Fraunces_600SemiBold"],
        "display-bold": ["Fraunces_700Bold"],
        body: ["PlusJakartaSans_400Regular"],
        "body-medium": ["PlusJakartaSans_500Medium"],
        "body-semibold": ["PlusJakartaSans_600SemiBold"],
        "body-bold": ["PlusJakartaSans_700Bold"],
      },
    },
  },
  plugins: [],
};
