/**
 * Saved — wishlist / bookmarks. Content is auth-gated; browsing the rest of
 * the app is not.
 */
import { useTranslation } from "react-i18next";

import { AuthGate } from "@/components/auth-gate";
import { useConfirmExitOnBack } from "@/lib/back-handler";
import { Screen } from "@/ui";
import { EmptyState } from "@/ui/states";

export default function SavedScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();

  return (
    <Screen>
      <AuthGate>
        <EmptyState
          title={t("saved.emptyTitle", "Nothing saved yet")}
          message={t(
            "saved.emptyBody",
            "Tap the heart on a place or product to keep it here.",
          )}
        />
      </AuthGate>
    </Screen>
  );
}
