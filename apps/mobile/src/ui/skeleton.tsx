/**
 * `Skeleton` — a pulsing placeholder block for loading states. Uses
 * Reanimated so it runs on the UI thread.
 */
import { useEffect } from "react";
import type { DimensionValue } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/providers/theme-provider";
import { radii } from "@/theme";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius = radii.sm,
}: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.border,
        },
        animated,
      ]}
    />
  );
}
