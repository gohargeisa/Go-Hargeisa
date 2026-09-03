/**
 * `AppText` — themed typography primitive. Variants map to the shared type
 * scale; the family switches between Fraunces (display) and Plus Jakarta Sans
 * (body) to match the website.
 */
import { Text as RNText, type TextProps } from "react-native";

import { useTheme } from "@/providers/theme-provider";
import { fontFamily } from "@/theme/fonts";

type Variant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodyStrong"
  | "caption"
  | "label";

const SPEC: Record<
  Variant,
  { size: number; lineHeight: number; family: string }
> = {
  display: { size: 30, lineHeight: 36, family: fontFamily.displayBold },
  title: { size: 24, lineHeight: 30, family: fontFamily.display },
  heading: { size: 18, lineHeight: 24, family: fontFamily.bodySemibold },
  body: { size: 15, lineHeight: 22, family: fontFamily.body },
  bodyStrong: { size: 15, lineHeight: 22, family: fontFamily.bodySemibold },
  caption: { size: 13, lineHeight: 18, family: fontFamily.body },
  label: { size: 12, lineHeight: 16, family: fontFamily.bodyMedium },
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: "default" | "muted" | "primary" | "inverse";
}

export function AppText({
  variant = "body",
  color = "default",
  style,
  ...rest
}: AppTextProps) {
  const { theme } = useTheme();
  const spec = SPEC[variant];
  const colorValue =
    color === "muted"
      ? theme.colors.textMuted
      : color === "primary"
        ? theme.colors.primary
        : color === "inverse"
          ? theme.colors.chromeText
          : theme.colors.text;

  return (
    <RNText
      {...rest}
      style={[
        {
          fontSize: spec.size,
          lineHeight: spec.lineHeight,
          fontFamily: spec.family,
          color: colorValue,
        },
        style,
      ]}
    />
  );
}
