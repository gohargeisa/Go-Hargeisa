/**
 * Hotel detail — native, mirrors `restaurants/[slug].tsx`'s structure. Two
 * booking modes, matching the website exactly:
 *   - "go_hargeisa" (default): a "Book Now" button opens the native booking
 *     screen (room selection lives there, not here — same separation as the
 *     appointment flow keeping doctor selection in its own booking screen).
 *   - "external": the hotel opted out of in-app booking; show plain
 *     website/Booking.com/WhatsApp action buttons instead of a form.
 */
import { Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { toWhatsAppHref } from "@gohargeisa/core";

import { useHotel } from "@/lib/queries";
import { useMyReview } from "@/lib/reviews";
import { useTheme } from "@/providers/theme-provider";
import { radii, spacing } from "@/theme";
import { AppText, Button, Card, Screen, Skeleton } from "@/ui";
import { ErrorState } from "@/ui/states";
import { PartnerMap } from "@/components/partner-map";
import { DetailBackButton } from "@/components/detail-back-button";

const HERO_HEIGHT = 280;

export default function HotelDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const { data, isPending, isError, refetch } = useHotel(slug);
  const myReview = useMyReview("hotel", data?.id);

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

  const isExternal = data.bookingMode === "external";
  const availableRoomCount = data.rooms.filter((r) => r.isAvailable).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.section }}
        showsVerticalScrollIndicator={false}
      >
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
          {data.priceRange ? (
            <AppText variant="label" color="muted">
              {data.priceRange}
            </AppText>
          ) : null}
          <AppText variant="title">{data.name}</AppText>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {data.reviewCount > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="star" size={13} color={theme.colors.primary} />
                <AppText variant="caption">
                  {data.rating.toFixed(1)} ({data.reviewCount})
                </AppText>
              </View>
            ) : null}
            {data.rooms.length > 0 ? (
              <AppText variant="caption" color="muted">
                {t("hotels.roomsAvailable", "{count} rooms available", { count: availableRoomCount })}
              </AppText>
            ) : null}
          </View>

          {isExternal ? (
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {data.externalBookingUrl ? (
                <Button
                  label={t("hotels.bookOnWebsite", "Book on website")}
                  onPress={() => Linking.openURL(data.externalBookingUrl as string)}
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  icon={<Ionicons name="open-outline" size={16} color={theme.colors.primary} />}
                />
              ) : null}
              {data.bookingComUrl ? (
                <Button
                  label={t("hotels.bookOnBookingCom", "Book on Booking.com")}
                  onPress={() => Linking.openURL(data.bookingComUrl as string)}
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  icon={<Ionicons name="open-outline" size={16} color={theme.colors.primary} />}
                />
              ) : null}
              {data.bookingWhatsapp ? (
                <Button
                  label={t("hotels.bookViaWhatsapp", "Book via WhatsApp")}
                  onPress={() => Linking.openURL(toWhatsAppHref(data.bookingWhatsapp as string))}
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  icon={<Ionicons name="logo-whatsapp" size={16} color={theme.colors.primary} />}
                />
              ) : null}
            </View>
          ) : (
            <Button
              label={t("hotels.bookNow", "Book Now")}
              onPress={() =>
                router.push({
                  pathname: "/booking/hotel/[hotelId]",
                  params: { hotelId: data.id, slug: data.slug },
                })
              }
              variant="secondary"
              size="sm"
              fullWidth={false}
              icon={<Ionicons name="bed-outline" size={16} color={theme.colors.primary} />}
            />
          )}

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

          {data.checkInTime || data.checkOutTime ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              <AppText variant="heading">{t("hotels.checkTimes", "Check-in / Check-out")}</AppText>
              <AppText variant="body" color="muted">
                {data.checkInTime ?? "—"} / {data.checkOutTime ?? "—"}
              </AppText>
            </View>
          ) : null}

          {data.coords ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <AppText variant="heading">{t("partner.location", "Location")}</AppText>
              <PartnerMap lat={data.coords.lat} lng={data.coords.lng} label={data.name} />
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

        {data.gallery.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <AppText variant="heading" style={{ paddingHorizontal: spacing.screenX, marginBottom: 8 }}>
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

        <View style={{ marginTop: 20, paddingHorizontal: spacing.screenX, gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <AppText variant="heading">{t("partner.reviews", "Reviews")}</AppText>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/review/[listingType]/[id]",
                  params: { listingType: "hotel", id: data.id, slug: data.slug },
                })
              }
            >
              <AppText variant="label" color="primary">
                {myReview.data ? t("review.editReview", "Edit review") : t("review.leaveReview", "Leave a review")}
              </AppText>
            </Pressable>
          </View>
          {data.reviews.length === 0 ? (
            <AppText variant="caption" color="muted">
              {t("review.beFirstReview", "Be the first to leave a review.")}
            </AppText>
          ) : null}
        </View>

        {data.reviews.length > 0 ? (
          <View style={{ paddingHorizontal: spacing.screenX, gap: 10 }}>
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

      <DetailBackButton onPress={back} />
    </View>
  );
}
