/**
 * Sign in / create account.
 *
 * P1b: native email + password against Supabase directly (`supabase.auth`),
 * with `expo-secure-store` persistence already wired. Google OAuth via
 * `expo-web-browser` + PKCE is added in P1d. On success it returns to
 * `returnTo` (set by `AuthGate`) or falls back to the shared post-login path.
 */
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { isSupabaseConfigured } from "@/env";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Button, Screen } from "@/ui";
import { Input } from "@/ui/input";

type Mode = "signIn" | "signUp";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const done = () => {
    if (router.canDismiss()) router.dismiss();
    const target = returnTo && returnTo.startsWith("/") ? returnTo : "/";
    router.replace(target as never);
  };

  const forgotPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email.includes("@")) {
      setError(t("auth.enterEmailFirst", "Enter your email above first."));
      return;
    }
    setBusy(true);
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(email);
      if (e) throw e;
      setNotice(t("auth.resetSent", "Password reset link sent — check your email."));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.genericError", "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!isSupabaseConfigured) {
      setError(t("auth.notConfigured", "Sign-in isn't available in this build."));
      return;
    }
    if (!email.includes("@") || password.length < 6) {
      setError(t("auth.invalidInput", "Enter a valid email and a password of at least 6 characters."));
      return;
    }
    setBusy(true);
    try {
      if (mode === "signIn") {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        done();
      } else {
        const { data, error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
        if (data.session) done();
        else setNotice(t("auth.checkEmail", "Check your email to confirm your account."));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.genericError", "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={() => (router.canDismiss() ? router.dismiss() : router.replace("/"))}
          hitSlop={10}
          style={{ alignSelf: "flex-end", marginTop: 4, padding: 4 }}
        >
          <Ionicons name="close" size={24} color={theme.colors.textMuted} />
        </Pressable>

        <View style={{ gap: 6, marginTop: 8, marginBottom: spacing.section }}>
          <AppText variant="display">
            {mode === "signIn"
              ? t("auth.signInTitle", "Sign in")
              : t("auth.signUpTitle", "Create account")}
          </AppText>
          <AppText variant="body" color="muted">
            {t("auth.subtitle", "To book, order and save places across Hargeisa.")}
          </AppText>
        </View>

        <View style={{ gap: 12 }}>
          <Input
            label={t("auth.email", "Email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label={t("auth.password", "Password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          />

          {error ? (
            <AppText variant="caption" style={{ color: "#DC2626" }}>
              {error}
            </AppText>
          ) : null}
          {notice ? (
            <AppText variant="caption" color="primary">
              {notice}
            </AppText>
          ) : null}

          <Button
            label={
              mode === "signIn"
                ? t("auth.signIn", "Sign in")
                : t("auth.signUp", "Create account")
            }
            onPress={() => void submit()}
            loading={busy}
          />
          <Button
            label={
              mode === "signIn"
                ? t("auth.switchToSignUp", "Create an account instead")
                : t("auth.switchToSignIn", "I already have an account")
            }
            onPress={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
              setNotice(null);
            }}
            variant="ghost"
          />

          {mode === "signIn" ? (
            <Pressable onPress={() => void forgotPassword()} style={{ alignSelf: "center", padding: 6 }}>
              <AppText variant="label" color="muted">
                {t("auth.forgotPassword", "Forgot password?")}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <AppText variant="label" color="muted" style={{ marginTop: spacing.section }}>
          {t("auth.oauthComing", "Continue with Google — coming in the next update.")}
        </AppText>
      </KeyboardAvoidingView>
    </Screen>
  );
}
