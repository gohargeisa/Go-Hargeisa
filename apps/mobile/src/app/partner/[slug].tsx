/**
 * Partner detail — a fully native screen (no WebView). Hero image with a
 * native back affordance, identity block with a live "open now" pill
 * (computed with the SHARED opening-hours logic from @gohargeisa/core),
 * localized description, a native action row (call / WhatsApp / directions /
 * website via Linking), gallery, reviews, and a Save toggle.
 */
import { Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { getOpenStatus, toWhatsAppHref } from "@gohargeisa/core";
import type { OpeningHoursGroup } from "@gohargeisa/types";

import { openDirections } from "@/lib/maps";
import { useCityService } from "@/lib/queries";
import { useFavorite } from "@/lib/favorites";
import { useTheme } from "@/providers/theme-provider";
import { radii, spacing } from "@/theme";
import { AppText, Button, Card, Screen, Skeleton } from "@/ui";
import { ErrorState } from "@/ui/states";
import { PartnerMap } from "@/components/partner-map";

const HERO_HEIGHT = 280;

export default function PartnerDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const { data, isPending, isError, refetch } = useCityService(slug);
  const fav = useFavorite("city_service", data?.id ?? "");

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (isPending) {
    return (
      <Screen>
        <Skeleton height={HERO_HEIGHT} radius={0} />
        <View style={{ padding: spacing.screenX, gap: 12 }}>
          <Skeleton height={28} width="70%" />
          <Skeleton height={16} width="40%" />
          <Skeleton height={80} />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <ErrorState
          title={t("partner.loadError", "Couldn't load this business")}
          onAction={() => refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      </Screen>
    );
  }

  const open = getOpenStatus(
    (data.openingHoursStructured as OpeningHoursGroup[] | null) ?? [],
    {
      is24Hours: data.is24Hours,
      temporarilyClosed: data.temporarilyClosed,
      permanentlyClosed: data.permanentlyClosed,
    },
  );
  const openLabel =
    open.state === "open"
      ? t("partner.openNow", "Open now")
      : open.state === "closed"
        ? t("partner.closed", "Closed")
        : open.state === "temporarilyClosed"
          ? t("partner.tempClosed", "Temporarily closed")
          : open.state === "permanentlyClosed"
            ? t("partner.permClosed", "Permanently closed")
            : t("partner.openNow", "Open now");
  const openColor = open.state === "open" ? theme.colors.primary : theme.colors.textMuted;

  const actions: { icon: keyof typeof Ionicons.glyphMap; label: string; run: () => void }[] = [];
  if (data.phone)
    actions.push({
      icon: "call-outline",
      label: t("partner.call", "Call"),
      run: () => Linking.openURL(`tel:${data.phone}`),
    });
  if (data.whatsapp)
    actions.push({
      icon: "logo-whatsapp",
      label: t("partner.whatsapp", "WhatsApp"),
      run: () => Linking.openURL(toWhatsAppHref(data.whatsapp as string)),
    });
  if (data.coords)
    actions.push({
      icon: "navigate-outline",
      label: t("partner.directions", "Directions"),
      run: () =>
        data.coords
          ? openDirections({ latitude: data.coords.lat, longitude: data.coords.lng })
          : undefined,
    });
  else if (data.mapsUrl)
    actions.push({
      icon: "map-outline",
      label: t("partner.map", "Map"),
      run: () => Linking.openURL(data.mapsUrl as string),
    });
  if (data.website)
    actions.push({
      icon: "globe-outline",
      label: t("partner.website", "Website"),
      run: () => Linking.openURL(data.website as string),
    });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.section }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT, backgroundColor: theme.colors.border }}>
          {data.image ? (
            <Image
              source={{ uri: data.image }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          ) : null}
        </View>

        <View style={{ paddingHorizontal: spacing.screenX, paddingTop: 16, gap: 10 }}>
          {data.categoryName ? (
            <AppText variant="label" color="muted">
              {data.categoryName.toUpperCase()}
            </AppText>
          ) : null}
          <AppText variant="title">{data.name}</AppText>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <AppText variant="caption" style={{ color: openColor }}>
              ● {openLabel}
            </AppText>
            {data.reviewCount > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="star" size={13} color={theme.colors.primary} />
                <AppText variant="caption">
                  {data.rating.toFixed(1)} ({data.reviewCount})
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Save (on-device) */}
          <Button
            label={
              fav.isFavorited
                ? t("partner.saved", "Saved")
                : t("partner.save", "Save")
            }
            onPress={fav.toggle}
            variant={fav.isFavorited ? "secondary" : "primary"}
            size="sm"
            fullWidth={false}
            icon={
              <Ionicons
                name={fav.isFavorited ? "heart" : "heart-outline"}
                size={16}
                color={fav.isFavorited ? theme.colors.primary : theme.colors.primaryText}
              />
            }
          />

          {/* Actions */}
          {actions.length > 0 ? (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
              {actions.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={a.run}
                  style={{
                    alignItems: "center",
                    gap: 4,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    minWidth: 78,
                  }}
                >
                  <Ionicons name={a.icon} size={20} color={theme.colors.primary} />
                  <AppText variant="label">{a.label}</AppText>
                </Pressable>
              ))}
            </View>
          ) : null}

          {data.description ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              <AppText variant="heading">{t("partner.about", "About")}</AppText>
              <AppText variant="body" color="muted">
                {data.description}
              </AppText>
            </View>
          ) : null}

          {data.openingHours && !data.openingHoursStructured ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              <AppText variant="heading">{t("partner.hours", "Opening hours")}</AppText>
              <AppText variant="body" color="muted">
                {data.openingHours}
              </AppText>
            </View>
          ) : null}

          {data.coords ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <AppText variant="heading">{t("partner.location", "Location")}</AppText>
              <PartnerMap
                lat={data.coords.lat}
                lng={data.coords.lng}
                label={data.name}
              />
            </View>
          ) : null}

          {data.amenities.length > 0 ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <AppText variant="heading">{t("partner.amenities", "Amenities")}</AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {data.amenities.map((a) => (
                  <View
                    key={a}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radii.pill,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <AppText variant="label">{a}</AppText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* Gallery */}
        {data.gallery.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <AppText
              variant="heading"
              style={{ paddingHorizontal: spacing.screenX, marginBottom: 8 }}
            >
              {t("partner.gallery", "Photos")}
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: spacing.screenX }}
            >
              {data.gallery.map((g, i) => (
                <Image
                  key={`${g.url}-${i}`}
                  source={{ uri: g.url }}
                  style={{ width: 220, height: 150, borderRadius: radii.lg }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Reviews */}
        {data.reviews.length > 0 ? (
          <View style={{ marginTop: 20, paddingHorizontal: spacing.screenX, gap: 10 }}>
            <AppText variant="heading">{t("partner.reviews", "Reviews")}</AppText>
            {data.reviews.slice(0, 10).map((r) => (
              <Card key={r.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText variant="bodyStrong">{r.authorName}</AppText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="star" size={12} color={theme.colors.primary} />
                    <AppText variant="caption">{r.rating}</AppText>
                  </View>
                </View>
                {r.comment ? (
                  <AppText variant="caption" color="muted" style={{ marginTop: 4 }}>
                    {r.comment}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Native back affordance, over the hero */}
      <Pressable
        onPress={back}
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: spacing.screenX,
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(5,20,39,0.55)",
        }}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}
