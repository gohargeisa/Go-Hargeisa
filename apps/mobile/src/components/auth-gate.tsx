/**
 * `AuthGate` — wrap a screen or action that requires a signed-in user.
 *
 * While the session is resolving it shows a spinner; when anonymous it
 * renders `fallback` (default: a prompt that routes to `/auth/login` and
 * remembers where to return). Most of the app is browsable anonymously —
 * this only guards writes (bookings, orders, saved items, profile).
 */
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/providers/supabase-provider";
import { EmptyState } from "@/ui/states";

interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGate({ children, fallback }: AuthGateProps) {
  const { status } = useAuth();
  const pathname = usePathname();
  const { t } = useTranslation();

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === "anonymous") {
    if (fallback) return <>{fallback}</>;
    return (
      <EmptyState
        title={t("auth.signInRequiredTitle", "Sign in to continue")}
        message={t(
          "auth.signInRequiredBody",
          "Create an account or sign in to book, order and save places.",
        )}
        actionLabel={t("auth.signIn", "Sign in")}
        onAction={() =>
          router.push({
            pathname: "/auth/login",
            params: { returnTo: pathname },
          })
        }
      />
    );
  }

  return <>{children}</>;
}
