import { Stack } from "expo-router";

import { useTheme } from "@/providers/theme-provider";

export default function AuthLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
