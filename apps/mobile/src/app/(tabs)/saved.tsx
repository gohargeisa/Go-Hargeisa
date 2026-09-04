/**
 * Saved — the signed-in user's saved city-services. IDs come from the
 * `favorites` table (direct supabase, RLS-scoped); details are resolved
 * from `/api/v1` and matched by id.
 */
import { useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { PartnerCard } from "@/components/partner-card";
import { useConfirmExitOnBack } from "@/lib/back-handler";
import { useSavedCityServices } from "@/lib/favorites";
import { useCityServices } from "@/lib/queries";
import { spacing } from "@/theme";
import { AppText, Screen, Skeleton } from "@/ui";
import { EmptyState, ErrorState, OfflineBanner } from "@/ui/states";

function SavedList() {
  const { t } = useTranslation();
  const saved = useSavedCityServices();
  // Pull a wide page and match locally — the catalogue is small.
  const all = useCityServices({ pageSize: 50 });

  const items = useMemo(() => {
    if (!saved.data || !all.data) return [];
    const ids = new Set(saved.data.map((r) => r.listing_id));
    const order = new Map(saved.data.map((r, i) => [r.listing_id, i]));
    return all.data.items
      .filter((i) => ids.has(i.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [saved.data, all.data]);

  if (saved.isPending || all.isPending) {
    return (
      <View style={{ gap: 14 }}>
        <Skeleton height={220} radius={24} />
        <Skeleton height={220} radius={24} />
      </View>
    );
  }
  if (saved.isError) {
    return (
      <ErrorState
        title={t("saved.error", "Couldn't load your saved places")}
        onAction={() => saved.refetch()}
        actionLabel={t("common.retry", "Retry")}
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title={t("saved.emptyTitle", "Nothing saved yet")}
        message={t("saved.emptyBody", "Tap Save on a business to keep it here.")}
      />
    );
  }
  return (
    <>
      {items.map((item) => (
        <PartnerCard key={item.id} item={item} />
      ))}
    </>
  );
}

export default function SavedScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      <AppText variant="display" style={{ marginBottom: spacing.section }}>
        {t("nav.saved", "Saved")}
      </AppText>
      <OfflineBanner label={t("common.offline", "You're offline")} />
      <SavedList />
    </Screen>
  );
}
