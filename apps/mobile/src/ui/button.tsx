/**
 * `Button` — the app's primary action control. Navy/blue chrome; `partner`
 * variant is the only one that uses amber and is reserved for partner-branded
 * screens.
 */
import { ActivityIndicator, Pressable, View } from "react-native";

import { useTheme } from "@/providers/theme-provider";
import { palette, radii } from "@/theme";
import { AppText } from "@/ui/text";

type Variant = "primary" | "secondary" | "ghost" | "partner";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const HEIGHT: Record<Size, number> = { sm: 40, md: 48, lg: 56 };

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? theme.colors.primary
      : variant === "partner"
        ? palette.amber.DEFAULT
        : variant === "secondary"
          ? theme.colors.surface
          : "transparent";

  const borderColor =
    variant === "secondary" ? theme.colors.border : "transparent";

  const textColor =
    variant === "primary" || variant === "partner"
      ? "inverse"
      : variant === "ghost"
        ? "primary"
        : "default";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        height: HEIGHT[size],
        alignSelf: fullWidth ? "stretch" : "flex-start",
        paddingHorizontal: size === "sm" ? 16 : 24,
        borderRadius: radii.pill,
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor,
        backgroundColor: bg,
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      })}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" || variant === "partner"
              ? palette.white
              : theme.colors.primary
          }
        />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <AppText variant="bodyStrong" color={textColor}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}
