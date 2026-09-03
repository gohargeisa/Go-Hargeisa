/**
 * `Screen` — the standard page container: themed background, safe-area
 * padding, optional scroll, and a consistent horizontal gutter.
 */
import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: { top?: boolean; bottom?: boolean };
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = { top: true, bottom: false },
  refreshing,
  onRefresh,
}: ScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const paddingTop = edges.top ? insets.top : 0;
  const paddingBottom = edges.bottom ? insets.bottom : 0;
  const paddingHorizontal = padded ? spacing.screenX : 0;

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          paddingTop,
          paddingBottom: paddingBottom + spacing.section,
          paddingHorizontal,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop,
        paddingBottom,
        paddingHorizontal,
      }}
    >
      {children}
    </View>
  );
}
