/**
 * The provider stack, composed once and mounted by `src/app/_layout.tsx`
 * (inside the SplashGate, so i18n + fonts + locale are ready first).
 *
 * Order (outer → inner):
 *   GestureHandlerRootView  — required by gesture-handler / bottom-sheet
 *   SafeAreaProvider        — insets for the edge-to-edge chrome
 *   KeyboardProvider        — react-native-keyboard-controller
 *   QueryClientProvider     — server-state cache
 *   ThemeProvider           — light/dark
 *   SupabaseProvider        — auth session
 *   BottomSheetModalProvider— app-wide sheet host
 */
import type { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/query";
import { SupabaseProvider } from "@/providers/supabase-provider";
import { ThemeProvider } from "@/providers/theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <SupabaseProvider>
                <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
              </SupabaseProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export { useTheme } from "@/providers/theme-provider";
export { useAuth } from "@/providers/supabase-provider";
