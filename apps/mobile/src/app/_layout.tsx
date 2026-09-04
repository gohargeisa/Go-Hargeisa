/**
 * Root layout — the top of the native app.
 *
 *   SplashGate  (locale → RTL → i18next → fonts, native splash held)
 *     AppProviders  (gesture-handler, safe-area, keyboard, query, theme, auth, sheets)
 *       ThemedRoot  (StatusBar + the router Stack, themed)
 *
 * The Stack has three groups:
 *   (tabs)      — the browsable app (Home / Explore / Saved / Alerts / Profile)
 *   auth/*      — sign-in, presented modally over the tabs
 *   +not-found  — unmatched deep links
 */
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/providers";
import { useTheme } from "@/providers/theme-provider";
import { SplashGate } from "@/components/splash-gate";
import { RootErrorBoundary } from "@/components/error-boundary";

// expo-router renders this for an uncaught error inside any route segment.
export { RouteErrorView as ErrorBoundary } from "@/components/error-boundary";

function ThemedRoot() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="category/[slug]" />
        <Stack.Screen name="partner/[slug]" />
        <Stack.Screen
          name="auth"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: "" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <SplashGate>
        <AppProviders>
          <ThemedRoot />
        </AppProviders>
      </SplashGate>
    </RootErrorBoundary>
  );
}
