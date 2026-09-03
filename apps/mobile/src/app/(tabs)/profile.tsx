/**
 * Profile — account, language, theme. Works signed-out (shows a sign-in CTA)
 * and signed-in (shows the account + sign-out).
 */
import { View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useAuth } from "@/providers/supabase-provider";
import { useTheme } from "@/providers/theme-provider";
import { useLocale } from "@/i18n/use-locale";
import { locales, localeConfig, type Locale } from "@gohargeisa/i18n";
import { spacing } from "@/theme";
import { AppText, Button, Card, Screen } from "@/ui";

export default function ProfileScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();
  const { user, status, signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  const { locale, setLocale } = useLocale();

  return (
    <Screen scroll>
      <AppText variant="display" style={{ marginBottom: spacing.section }}>
        {t("nav.profile", "Profile")}
      </AppText>

      <Card style={{ marginBottom: 16 }}>
        {status === "authenticated" && user ? (
          <View style={{ gap: 8 }}>
            <AppText variant="bodyStrong">{user.email}</AppText>
            <Button
              label={t("auth.signOut", "Sign out")}
              onPress={() => void signOut()}
              variant="secondary"
              size="sm"
            />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <AppText variant="bodyStrong">
              {t("auth.signedOutTitle", "You're browsing as a guest")}
            </AppText>
            <Button
              label={t("auth.signIn", "Sign in")}
              onPress={() => router.push("/auth/login")}
              size="sm"
            />
          </View>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <AppText variant="heading" style={{ marginBottom: 12 }}>
          {t("profile.language", "Language")}
        </AppText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {locales.map((l: Locale) => (
            <Button
              key={l}
              label={localeConfig[l].label}
              onPress={() => void setLocale(l)}
              variant={l === locale ? "primary" : "secondary"}
              size="sm"
              fullWidth={false}
            />
          ))}
        </View>
      </Card>

      <Card>
        <AppText variant="heading" style={{ marginBottom: 12 }}>
          {t("profile.theme", "Appearance")}
        </AppText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(["system", "light", "dark"] as const).map((p) => (
            <Button
              key={p}
              label={t(`profile.theme_${p}`, p)}
              onPress={() => setPreference(p)}
              variant={p === preference ? "primary" : "secondary"}
              size="sm"
              fullWidth={false}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}
