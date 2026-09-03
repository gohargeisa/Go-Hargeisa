/**
 * `Card` — themed surface with the shared radius + shadow. `onPress` makes it
 * a pressable list item.
 */
import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { useTheme } from "@/providers/theme-provider";
import { radii, shadows } from "@/theme";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  elevation?: "soft" | "card" | "none";
  style?: ViewStyle;
}

export function Card({
  children,
  onPress,
  padded = true,
  elevation = "soft",
  style,
}: CardProps) {
  const { theme } = useTheme();

  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: padded ? 16 : 0,
    overflow: "hidden",
    ...(elevation !== "none" ? shadows[elevation] : {}),
    ...style,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ ...base, opacity: pressed ? 0.92 : 1 })}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={base}>{children}</View>;
}
