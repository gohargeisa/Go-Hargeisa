/**
 * Alerts — booking + order status updates. Auth-gated content; push wiring
 * comes later (P3). For now it lists nothing but proves the gate + shell.
 */
import { useTranslation } from "react-i18next";

import { AuthGate } from "@/components/auth-gate";
import { useConfirmExitOnBack } from "@/lib/back-handler";
import { Screen } from "@/ui";
import { EmptyState } from "@/ui/states";

export default function AlertsScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();

  return (
    <Screen>
      <AuthGate>
        <EmptyState
          title={t("alerts.emptyTitle", "No updates")}
          message={t(
            "alerts.emptyBody",
            "Booking confirmations and order updates will show up here.",
          )}
        />
      </AuthGate>
    </Screen>
  );
}
