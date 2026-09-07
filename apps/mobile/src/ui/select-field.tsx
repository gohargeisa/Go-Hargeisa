/**
 * `SelectField` — labelled themed picker; the native equivalent of a web
 * `<select>`. Tapping it opens a bottom sheet-style modal list — plain
 * `react-native` `Modal`, no third-party picker dependency, matching the
 * app's existing modal convention (the `auth` route is presented the same
 * way: `presentation: "modal"`, slide-from-bottom).
 */
import { useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/providers/theme-provider";
import { radii } from "@/theme";
import { AppText } from "@/ui/text";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface SelectFieldProps {
  label?: string;
  /** Modal header text; falls back to `label`, then `placeholder`. */
  title?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  title,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: SelectFieldProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const isDisabled = disabled || options.length === 0;

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="label" color="muted">
          {label}
        </AppText>
      ) : null}
      <Pressable
        onPress={() => !isDisabled && setOpen(true)}
        style={{
          height: 48,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <AppText
          variant="body"
          color={selected ? "default" : "muted"}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {selected ? selected.label : placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(5,20,39,0.55)" }}
          onPress={() => setOpen(false)}
        />
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            maxHeight: "70%",
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <AppText variant="heading">{title ?? label ?? placeholder}</AppText>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => (
              <Pressable
                disabled={item.disabled}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: item.disabled ? 0.4 : 1,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="body">{item.label}</AppText>
                  {item.sublabel ? (
                    <AppText variant="caption" color="muted">
                      {item.sublabel}
                    </AppText>
                  ) : null}
                </View>
                {item.value === value ? (
                  <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                ) : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
