/**
 * `AppImage` — `expo-image` with the app's defaults: disk+memory cache, a
 * themed placeholder while loading, and a graceful fallback block on error
 * (Supabase storage URLs occasionally 404 — the website's ImageWithFallback
 * has the same guard).
 */
import { useState } from "react";
import { View, type DimensionValue } from "react-native";
import { Image, type ImageContentFit } from "expo-image";

import { useTheme } from "@/providers/theme-provider";
import { radii } from "@/theme";
import { AppText } from "@/ui/text";

interface AppImageProps {
  uri: string | null | undefined;
  width?: DimensionValue;
  height?: DimensionValue;
  aspectRatio?: number;
  radius?: number;
  contentFit?: ImageContentFit;
  fallbackLabel?: string;
}

export function AppImage({
  uri,
  width = "100%",
  height,
  aspectRatio,
  radius = radii.lg,
  contentFit = "cover",
  fallbackLabel,
}: AppImageProps) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);

  const frame = {
    width,
    height,
    aspectRatio,
    borderRadius: radius,
    backgroundColor: theme.colors.border,
    overflow: "hidden" as const,
  };

  if (!uri || failed) {
    return (
      <View
        style={[frame, { alignItems: "center", justifyContent: "center" }]}
      >
        <AppText variant="label" color="muted">
          {fallbackLabel ?? "No image"}
        </AppText>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={frame}
      contentFit={contentFit}
      transition={200}
      cachePolicy="disk"
      onError={() => setFailed(true)}
    />
  );
}
