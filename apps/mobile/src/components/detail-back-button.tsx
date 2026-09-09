/**
 * The circular back affordance overlaid on a detail screen's hero image
 * (partner/restaurants/cafes/hotels). Extracted into one component so the
 * RTL fix (position + icon direction) lives in exactly one place instead of
 * four near-identical, easily-drifting copies.
 *
 * `left`/`right` in React Native are NOT automatically mirrored for RTL
 * (unlike `flexDirection: "row"`, which Yoga does mirror automatically) —
 * an absolutely-positioned element needs its side picked explicitly. Same
 * for the chevron glyph itself: RN never flips icon artwork, only layout.
 */
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocale } from "@/i18n/use-locale";
import { spacing } from "@/theme";

export function DetailBackButton({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const { isRtl } = useLocale();

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        top: insets.top + 8,
        ...(isRtl ? { right: spacing.screenX } : { left: spacing.screenX }),
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(5,20,39,0.55)",
      }}
      hitSlop={8}
    >
      <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={22} color="#fff" />
    </Pressable>
  );
}
