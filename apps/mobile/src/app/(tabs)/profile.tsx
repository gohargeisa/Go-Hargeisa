/**
 * Profile — account, saved shortcut, language, appearance, about.
 * Works signed-out (sign-in CTA) and signed-in (account + inline name edit
 * + sign out). Native throughout.
 */
import { useState } from "react";
import { Alert, Linking, Pressable, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useSavedCityServices } from "@/lib/favorites";
import { useProfile, useUpdateProfile } from "@/lib/profile";
import { useAuth } from "@/providers/supabase-provider";
import { useTheme } from "@/providers/theme-provider";
import { useLocale } from "@/i18n/use-locale";
import { locales, localeConfig, type Locale } from "@gohargeisa/i18n";
import { spacing } from "@/theme";
import { AppText, Button, Card, Input, Screen } from "@/ui";
import { OfflineBanner } from "@/ui/states";

function AccountCard() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const update = useUpdateProfile();

  const [editing, setEditing] = useState<null | string>(null); // null = not editing; string = draft name
  const name = editing ?? "";
  const setName = (v: string) => setEditing(v);
  const startEdit = () => setEditing(profile.data?.fullName ?? "");
  const stopEdit = () => setEditing(null);

  const memberSince = profile.data?.createdAt
    ? new Date(profile.data.createdAt).getFullYear()
    : null;

  const confirmSignOut = () => {
    Alert.alert(
      t("auth.signOut", "Sign out"),
      t("profile.signOutConfirm", "You'll need to sign in again to book and save."),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("auth.signOut", "Sign out"),
          style: "destructive",
          onPress: () => void signOut(),
        },
      ],
    );
  };

  const save = async () => {
    await update.mutateAsync({ fullName: name.trim() });
    stopEdit();
  };

  return (
    <Card style={{ gap: 12 }}>
      {editing !== null ? (
        <View style={{ gap: 8 }}>
          <Input
            label={t("profile.name", "Name")}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label={t("common.save", "Save")}
              onPress={() => void save()}
              loading={update.isPending}
              size="sm"
              fullWidth={false}
            />
            <Button
              label={t("common.cancel", "Cancel")}
              onPress={stopEdit}
              variant="ghost"
              size="sm"
              fullWidth={false}
            />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="heading">
              {profile.data?.fullName || t("profile.noName", "Add your name")}
            </AppText>
            <AppText variant="caption" color="muted">
              {user?.email}
            </AppText>
            {memberSince ? (
              <AppText variant="label" color="muted">
                {t("profile.memberSince", "Member since {year}", { year: memberSince })}
              </AppText>
            ) : null}
          </View>
          <Pressable onPress={startEdit} hitSlop={8}>
            <AppText variant="label" color="primary">
              {t("common.edit", "Edit")}
            </AppText>
          </Pressable>
        </View>
      )}
      <Button
        label={t("auth.signOut", "Sign out")}
        onPress={confirmSignOut}
        variant="secondary"
        size="sm"
      />
    </Card>
  );
}

export default function ProfileScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();
  const { status } = useAuth();
  const { theme, preference, setPreference } = useTheme();
  const { locale, setLocale } = useLocale();
  const saved = useSavedCityServices();
  const savedCount = saved.data?.length ?? 0;

  const version = Constants.expoConfig?.version ?? "0.1.0";

  return (
    <Screen scroll>
      <AppText variant="display" style={{ marginBottom: spacing.section }}>
        {t("nav.profile", "Profile")}
      </AppText>
      <OfflineBanner label={t("common.offline", "You're offline")} />

      {status === "authenticated" ? (
        <AccountCard />
      ) : (
        <Card style={{ gap: 8 }}>
          <AppText variant="bodyStrong">
            {t("auth.signedOutTitle", "You're browsing as a guest")}
          </AppText>
          <AppText variant="caption" color="muted">
            {t("profile.guestBody", "Sign in to sync bookings and manage your account.")}
          </AppText>
          <Button
            label={t("auth.signIn", "Sign in")}
            onPress={() => router.push("/auth/login")}
            size="sm"
          />
        </Card>
      )}

      {/* Saved shortcut */}
      <Pressable onPress={() => router.push("/saved")}>
        <Card style={{ marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="heart-outline" size={20} color={theme.colors.primary} />
            <AppText variant="bodyStrong">{t("nav.saved", "Saved")}</AppText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppText variant="caption" color="muted">{savedCount}</AppText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
          </View>
        </Card>
      </Pressable>

      {/* Language */}
      <Card style={{ marginTop: 16 }}>
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

      {/* Appearance */}
      <Card style={{ marginTop: 16 }}>
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

      {/* About */}
      <Card style={{ marginTop: 16, gap: 8 }}>
        <AppText variant="heading">{t("profile.about", "About")}</AppText>
        <Pressable onPress={() => Linking.openURL("https://gohargeisa.com")}>
          <AppText variant="body" color="primary">
            {t("profile.visitWebsite", "Visit gohargeisa.com")}
          </AppText>
        </Pressable>
        <AppText variant="label" color="muted">
          {t("profile.version", "Version {v}", { v: version })}
        </AppText>
      </Card>
    </Screen>
  );
}
