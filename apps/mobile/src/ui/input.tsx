/**
 * `Input` — labelled themed text field.
 */
import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { useTheme } from "@/providers/theme-provider";
import { radii } from "@/theme";
import { fontFamily } from "@/theme/fonts";
import { AppText } from "@/ui/text";

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, onFocus, onBlur, ...rest }: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="label" color="muted">
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            height: 48,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: focused ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 14,
            color: theme.colors.text,
            fontFamily: fontFamily.body,
            fontSize: 15,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}
