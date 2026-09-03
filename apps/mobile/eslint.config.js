// Flat config (ESLint 9). `eslint-config-expo/flat` bundles the RN +
// TypeScript rules; add the isomorphism guard for the shared packages.
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*"],
  },
  {
    // Shared packages must stay isomorphic — no React Native / no Next.
    files: ["../../packages/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react-native", message: "@gohargeisa/* must stay isomorphic." },
            { name: "react-dom", message: "@gohargeisa/* must stay isomorphic." },
          ],
          patterns: [
            { group: ["next", "next/*"], message: "@gohargeisa/* must stay isomorphic — no next/*." },
            { group: ["@/lib/data/*", "*/lib/data/*"], message: "@gohargeisa/* is logic-only — no data layer." },
            { group: ["@/lib/supabase/*", "*/lib/supabase/*"], message: "@gohargeisa/* is logic-only — no Supabase client." },
          ],
        },
      ],
    },
  },
]);
