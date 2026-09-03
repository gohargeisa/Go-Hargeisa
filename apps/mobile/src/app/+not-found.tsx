/**
 * Rendered for an unmatched route — including a deep link into a screen the
 * native app doesn't have yet. Offers a route home; P1d adds "open on the
 * website" as a fallback for web-only paths.
 */
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/ui";
import { EmptyState } from "@/ui/states";

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState
        title={t("notFound.title", "Page not found")}
        message={t(
          "notFound.body",
          "That link doesn't lead anywhere in the app yet.",
        )}
        actionLabel={t("notFound.goHome", "Go home")}
        onAction={() => router.replace("/")}
      />
    </Screen>
  );
}
