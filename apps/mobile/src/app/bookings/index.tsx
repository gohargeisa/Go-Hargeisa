/**
 * My Bookings — the signed-in user's hotel bookings, table reservations,
 * and appointments in one place. Mirrors the website dashboard's Bookings/
 * Appointments/Reservations tabs (lib/data/business.ts + reservations.ts),
 * reading the same tables directly via RLS — no new backend.
 */
import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useConfirmExitOnBack } from "@/lib/back-handler";
import {
  useMyAppointments,
  useMyHotelBookings,
  useMyTableReservations,
  type BookingStatus,
} from "@/lib/my-bookings";
import { useLocale } from "@/i18n/use-locale";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Card, Screen, Skeleton } from "@/ui";
import { EmptyState, ErrorState, OfflineBanner } from "@/ui/states";

function StatusLabel({ status }: { status: BookingStatus }) {
  const { t } = useTranslation();
  const label =
    status === "confirmed"
      ? t("bookings.statusConfirmed", "Confirmed")
      : status === "completed"
        ? t("bookings.statusCompleted", "Completed")
        : status === "cancelled"
          ? t("bookings.statusCancelled", "Cancelled")
          : t("bookings.statusPending", "Pending");
  const color = status === "confirmed" || status === "completed" ? "primary" : "muted";
  return (
    <AppText variant="label" color={color}>
      {label}
    </AppText>
  );
}

function SectionSkeleton() {
  return (
    <View style={{ gap: 10 }}>
      <Skeleton height={80} radius={16} />
      <Skeleton height={80} radius={16} />
    </View>
  );
}

function HotelBookingsSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const list = useMyHotelBookings();

  return (
    <View style={{ gap: 10 }}>
      <AppText variant="heading">{t("bookings.hotelsTitle", "Hotel Bookings")}</AppText>
      {list.isPending ? (
        <SectionSkeleton />
      ) : list.isError ? (
        <ErrorState
          title={t("bookings.error", "Couldn't load this")}
          onAction={() => list.refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      ) : list.data.length === 0 ? (
        <AppText variant="caption" color="muted">
          {t("bookings.hotelsEmpty", "No hotel bookings yet.")}
        </AppText>
      ) : (
        list.data.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => b.hotelSlug && router.push(`/hotels/${b.hotelSlug}`)}
          >
            <Card style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                  {b.hotelName}
                </AppText>
                <StatusLabel status={b.status} />
              </View>
              {b.roomName ? (
                <AppText variant="caption" color="muted">
                  {b.roomName}
                </AppText>
              ) : null}
              <AppText variant="caption" color="muted">
                {b.checkIn} → {b.checkOut} · {t("bookings.guests", "{count} guests", { count: b.guestsCount })}
              </AppText>
            </Card>
          </Pressable>
        ))
      )}
    </View>
  );
}

function TableReservationsSection() {
  const { t } = useTranslation();
  const list = useMyTableReservations();

  return (
    <View style={{ gap: 10 }}>
      <AppText variant="heading">{t("bookings.tablesTitle", "Table Reservations")}</AppText>
      {list.isPending ? (
        <SectionSkeleton />
      ) : list.isError ? (
        <ErrorState
          title={t("bookings.error", "Couldn't load this")}
          onAction={() => list.refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      ) : list.data.length === 0 ? (
        <AppText variant="caption" color="muted">
          {t("bookings.tablesEmpty", "No table reservations yet.")}
        </AppText>
      ) : (
        list.data.map((r) => (
          <Card key={r.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                {r.businessName}
              </AppText>
              <StatusLabel status={r.status} />
            </View>
            <AppText variant="caption" color="muted">
              {r.reservationDate} {r.reservationTime} · {t("bookings.guests", "{count} guests", { count: r.guestsCount })}
            </AppText>
          </Card>
        ))
      )}
    </View>
  );
}

function AppointmentsSection() {
  const { t } = useTranslation();
  const list = useMyAppointments();

  return (
    <View style={{ gap: 10 }}>
      <AppText variant="heading">{t("bookings.appointmentsTitle", "Appointments")}</AppText>
      {list.isPending ? (
        <SectionSkeleton />
      ) : list.isError ? (
        <ErrorState
          title={t("bookings.error", "Couldn't load this")}
          onAction={() => list.refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      ) : list.data.length === 0 ? (
        <AppText variant="caption" color="muted">
          {t("bookings.appointmentsEmpty", "No appointments yet.")}
        </AppText>
      ) : (
        list.data.map((a) => (
          <Card key={a.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                {a.doctorName}
              </AppText>
              <StatusLabel status={a.status} />
            </View>
            {a.hospitalName ? (
              <AppText variant="caption" color="muted">
                {a.hospitalName}
              </AppText>
            ) : null}
            <AppText variant="caption" color="muted">
              {a.appointmentDate} {a.appointmentTime}
            </AppText>
          </Card>
        ))
      )}
    </View>
  );
}

export default function BookingsScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isRtl } = useLocale();
  const hotels = useMyHotelBookings();
  const tables = useMyTableReservations();
  const appointments = useMyAppointments();

  const allEmpty =
    !hotels.isPending &&
    !tables.isPending &&
    !appointments.isPending &&
    !hotels.isError &&
    !tables.isError &&
    !appointments.isError &&
    hotels.data?.length === 0 &&
    tables.data?.length === 0 &&
    appointments.data?.length === 0;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <Screen padded={false} edges={{ top: false }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 12,
          backgroundColor: theme.colors.background,
        }}
      >
        <Pressable onPress={back} hitSlop={10} style={{ width: 40, height: 32, justifyContent: "center" }}>
          <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color={theme.colors.text} />
        </Pressable>
        <AppText variant="display">{t("bookings.title", "My Bookings")}</AppText>
      </View>

      <OfflineBanner label={t("common.offline", "You're offline")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX,
          paddingTop: 8,
          paddingBottom: insets.bottom + spacing.section,
        }}
      >
        {allEmpty ? (
          <EmptyState
            title={t("bookings.emptyTitle", "No bookings yet")}
            message={t("bookings.emptyBody", "Book a hotel, reserve a table, or schedule an appointment to see it here.")}
          />
        ) : (
          <View style={{ gap: 24 }}>
            <HotelBookingsSection />
            <TableReservationsSection />
            <AppointmentsSection />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
