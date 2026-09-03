/**
 * The browsable app — a native bottom tab bar (navy chrome, blue active).
 *
 *   Home     — discovery feed (categories, featured, near you)
 *   Explore  — search + map
 *   Saved    — wishlist / bookmarks               (auth-gated content)
 *   Alerts   — booking + order updates            (auth-gated content)
 *   Profile  — account, language, theme
 *
 * Screen bodies are P1b placeholders; the Home → listing → detail → auth
 * vertical slice is built in P1d.
 */
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/providers/theme-provider";
import { fontFamily } from "@/theme/fonts";

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  color,
  size,
}: {
  name: IoniconName;
  color: ColorValue;
  size: number;
}) {
  return <Ionicons name={name} color={color as string} size={size} />;
}

const TABS: { name: string; icon: IoniconName; labelKey: string; fallback: string }[] =
  [
    { name: "index", icon: "home-outline", labelKey: "nav.home", fallback: "Home" },
    { name: "explore", icon: "search-outline", labelKey: "nav.explore", fallback: "Explore" },
    { name: "saved", icon: "heart-outline", labelKey: "nav.saved", fallback: "Saved" },
    { name: "alerts", icon: "notifications-outline", labelKey: "nav.alerts", fallback: "Alerts" },
    { name: "profile", icon: "person-outline", labelKey: "nav.profile", fallback: "Profile" },
  ];

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.bodyMedium,
          fontSize: 11,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.labelKey, tab.fallback),
            tabBarIcon: ({ color, size }) => (
              <TabIcon name={tab.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
