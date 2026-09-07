/**
 * Hotel booking — room selection, date range, guest info, live price
 * summary, submit. Mirrors components/shared/booking-form.tsx's exact
 * pricing math (weekend/discount rate override, no tax system yet — an
 * honest $0 line, not fabricated) using the SAME UTC-safe date arithmetic
 * the website uses; that code has a documented past bug ("page freezes on
 * Check-out") from parsing dates as local midnight instead of UTC, so this
 * copies the fix, not the mistake.
 *
 * Room availability is a static per-room flag already in the fetched hotel
 * detail (no live date-range availability check exists for guests — see
 * lib/hotel-booking.ts's own comment).
 */
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { HotelRoomDTO } from "@gohargeisa/api";

import { BookingError, useSubmitBookingRequest } from "@/lib/hotel-booking";
import { useHotel } from "@/lib/queries";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Button, Card, Input, Screen, Skeleton } from "@/ui";
import { ErrorState } from "@/ui/states";

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** UTC-anchored: these strings name a calendar day, not a moment. Parsing
 *  them as local midnight and re-serializing via toISOString() (UTC) shifts
 *  the calendar day for any positive UTC offset (Hargeisa is UTC+3) — the
 *  exact bug the website's own booking-form.tsx documents fixing. */
function parseIsoDateUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = Math.round((parseIsoDateUTC(checkOut) - parseIsoDateUTC(checkIn)) / 86_400_000);
  return diff > 0 ? diff : 0;
}

function nightlyRate(room: HotelRoomDTO | undefined, date: string): number {
  if (!room) return 0;
  if (room.discountPrice) return room.discountPrice;
  const day = new Date(`${date}T00:00:00`).getDay();
  if (room.weekendPrice && (day === 0 || day === 6)) return room.weekendPrice;
  return room.pricePerNight ?? 0;
}

const MAX_STAY_NIGHTS = 366;

function computeSubtotal(room: HotelRoomDTO | undefined, checkIn: string, checkOut: string, roomsCount: number): number {
  if (!room || !checkIn || !checkOut) return 0;
  let total = 0;
  let cursor = checkIn;
  let guard = 0;
  while (cursor < checkOut && guard < MAX_STAY_NIGHTS) {
    total += nightlyRate(room, cursor);
    cursor = addDaysIso(cursor, 1);
    guard += 1;
  }
  return total * roomsCount;
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function roomTypeLabel(t: string): string {
  return t
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function HotelBookingScreen() {
  const { hotelId, slug } = useLocalSearchParams<{ hotelId: string; slug: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const hotel = useHotel(slug);

  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCountry, setGuestCountry] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [roomsCount, setRoomsCount] = useState(1);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useSubmitBookingRequest();

  const close = () => (router.canDismiss() ? router.dismiss() : router.replace("/"));

  const checkInIso = checkIn ? toIsoDate(checkIn) : "";
  const checkOutIso = checkOut ? toIsoDate(checkOut) : "";
  const selectedRoom = hotel.data?.rooms.find((r) => r.id === roomId);
  const nights = useMemo(() => nightsBetween(checkInIso, checkOutIso), [checkInIso, checkOutIso]);
  const subtotal = useMemo(
    () => computeSubtotal(selectedRoom, checkInIso, checkOutIso, roomsCount),
    [selectedRoom, checkInIso, checkOutIso, roomsCount],
  );
  const effectiveNightlyRate = selectedRoom ? (selectedRoom.discountPrice ?? selectedRoom.pricePerNight ?? 0) : 0;
  const taxes = 0;
  const total = subtotal + taxes;

  if (hotel.isPending) {
    return (
      <Screen scroll>
        <View style={{ gap: 12 }}>
          <Skeleton height={28} width="60%" />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </View>
      </Screen>
    );
  }

  if (hotel.isError || !hotel.data) {
    return (
      <Screen>
        <ErrorState
          title={t("partner.loadError", "Couldn't load this business")}
          onAction={() => hotel.refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      </Screen>
    );
  }

  if (submit.isSuccess) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: spacing.section }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primary + "1A",
            }}
          >
            <Ionicons name="checkmark-circle" size={40} color={theme.colors.primary} />
          </View>
          <AppText variant="title" style={{ textAlign: "center" }}>
            {t("hotels.successTitle", "Booking Request Sent Successfully")}
          </AppText>
          <AppText variant="body" color="muted" style={{ textAlign: "center" }}>
            {t(
              "hotels.successBody",
              "Your booking request has been sent successfully. {name} will review availability and contact you shortly.",
              { name: hotel.data.name },
            )}
          </AppText>
          {submit.data ? (
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <AppText variant="label">{submit.data}</AppText>
            </View>
          ) : null}
          <Button label={t("common.done", "Done")} onPress={close} />
        </View>
      </Screen>
    );
  }

  function onSubmit() {
    setError(null);
    if (!guestName.trim() || !guestPhone.trim()) {
      setError(t("hotels.errorRequired", "Full name, phone number, and check-in/check-out dates are required."));
      return;
    }
    if (!checkInIso || !checkOutIso) {
      setError(t("hotels.errorRequired", "Full name, phone number, and check-in/check-out dates are required."));
      return;
    }
    if (checkOutIso <= checkInIso) {
      setError(t("hotels.invalidRange", "Check-out must be after check-in."));
      return;
    }
    if (selectedRoom && !selectedRoom.isAvailable) {
      setError(t("hotels.roomUnavailable", "This room is currently unavailable. Please choose another room."));
      return;
    }

    submit.mutate(
      {
        hotelId,
        roomId: roomId || undefined,
        guestName,
        guestPhone,
        guestEmail: guestEmail || undefined,
        guestCountry: guestCountry || undefined,
        adults,
        children,
        roomsCount,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        notes: notes || undefined,
      },
      {
        onError: (err) => {
          const message =
            err instanceof BookingError ? err.message : t("hotels.error", "Something went wrong. Please try again.");
          setError(message);
        },
      },
    );
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.section }}>
        <AppText variant="display">{t("hotels.bookNow", "Book Now")}</AppText>
        <Pressable onPress={close} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={theme.colors.textMuted} />
        </Pressable>
      </View>
      <AppText variant="body" color="muted" style={{ marginBottom: spacing.section }}>
        {hotel.data.name}
      </AppText>

      <View style={{ gap: 14 }}>
        {hotel.data.rooms.length > 0 ? (
          <View style={{ gap: 8 }}>
            <AppText variant="heading">{t("hotels.roomSectionTitle", "Choose a room")}</AppText>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <View style={{ gap: 8 }}>
                {hotel.data.rooms.map((room) => {
                  const selected = roomId === room.id;
                  return (
                    <Pressable
                      key={room.id}
                      disabled={!room.isAvailable}
                      onPress={() => setRoomId(selected ? "" : room.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selected ? theme.colors.primary + "0D" : theme.colors.surface,
                        opacity: room.isAvailable ? 1 : 0.5,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="bodyStrong">{room.name}</AppText>
                        <AppText variant="caption" color="muted">
                          {roomTypeLabel(room.roomType)} · {t("hotels.guestsCount", "{count} guests", { count: room.maxGuests })}
                        </AppText>
                        {room.pricePerNight ? (
                          <AppText variant="caption" color="primary">
                            {money(room.discountPrice ?? room.pricePerNight)} {t("hotels.perNight", "/ night")}
                          </AppText>
                        ) : (
                          <AppText variant="caption" color="muted">
                            {t("hotels.contactForPricing", "Contact for pricing")}
                          </AppText>
                        )}
                      </View>
                      <AppText variant="label" color={room.isAvailable ? "primary" : "muted"}>
                        {room.isAvailable ? t("hotels.availableBadge", "Available") : t("hotels.unavailableBadge", "Unavailable")}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : null}

        <Input label={t("hotels.guestNameLabel", "Full name")} value={guestName} onChangeText={setGuestName} />
        <Input
          label={t("hotels.guestPhoneLabel", "Phone number")}
          value={guestPhone}
          onChangeText={setGuestPhone}
          keyboardType="phone-pad"
          placeholder="+252 63 000 0000"
        />
        <Input
          label={t("hotels.guestEmailLabel", "Email address (optional)")}
          value={guestEmail}
          onChangeText={setGuestEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label={t("hotels.guestCountryLabel", "Country (optional)")}
          value={guestCountry}
          onChangeText={setGuestCountry}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="label" color="muted" style={{ marginBottom: 6 }}>
              {t("hotels.checkInLabel", "Check-in")}
            </AppText>
            <Pressable
              onPress={() => setShowCheckIn(true)}
              style={{
                height: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <AppText variant="body" color={checkIn ? "default" : "muted"}>
                {checkIn ? checkIn.toLocaleDateString() : t("common.select", "Select")}
              </AppText>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="label" color="muted" style={{ marginBottom: 6 }}>
              {t("hotels.checkOutLabel", "Check-out")}
            </AppText>
            <Pressable
              onPress={() => setShowCheckOut(true)}
              style={{
                height: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <AppText variant="body" color={checkOut ? "default" : "muted"}>
                {checkOut ? checkOut.toLocaleDateString() : t("common.select", "Select")}
              </AppText>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        </View>
        {nights > 0 ? (
          <AppText variant="caption" color="primary">
            {t("hotels.nightsCount", "{count} nights", { count: nights })}
          </AppText>
        ) : null}

        {showCheckIn ? (
          <DateTimePicker
            value={checkIn ?? todayDate()}
            mode="date"
            minimumDate={todayDate()}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_event, selected) => {
              setShowCheckIn(Platform.OS === "ios");
              if (selected) {
                setCheckIn(selected);
                if (checkOut && checkOut <= selected) {
                  const next = new Date(selected);
                  next.setDate(next.getDate() + 1);
                  setCheckOut(next);
                }
              }
            }}
          />
        ) : null}
        {showCheckOut ? (
          <DateTimePicker
            value={checkOut ?? (checkIn ? new Date(checkIn.getTime() + 86_400_000) : todayDate())}
            mode="date"
            minimumDate={checkIn ? new Date(checkIn.getTime() + 86_400_000) : todayDate()}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_event, selected) => {
              setShowCheckOut(Platform.OS === "ios");
              if (selected) setCheckOut(selected);
            }}
          />
        ) : null}

        <View style={{ gap: 8 }}>
          {[
            { label: t("hotels.adultsLabel", "Adults"), value: adults, min: 1, set: setAdults },
            { label: t("hotels.childrenLabel", "Children"), value: children, min: 0, set: setChildren },
            { label: t("hotels.roomsLabel", "Rooms"), value: roomsCount, min: 1, set: setRoomsCount },
          ].map((stepper) => (
            <View
              key={stepper.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                paddingHorizontal: 14,
              }}
            >
              <AppText variant="bodyStrong">{stepper.label}</AppText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <Pressable
                  onPress={() => stepper.set(Math.max(stepper.min, stepper.value - 1))}
                  disabled={stepper.value <= stepper.min}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: stepper.value <= stepper.min ? 0.4 : 1,
                  }}
                >
                  <Ionicons name="remove" size={16} color={theme.colors.text} />
                </Pressable>
                <AppText variant="bodyStrong" style={{ minWidth: 24, textAlign: "center" }}>
                  {stepper.value}
                </AppText>
                <Pressable
                  onPress={() => stepper.set(stepper.value + 1)}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="add" size={16} color={theme.colors.text} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Input
          label={t("hotels.requestsSectionTitle", "Special requests")}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ height: 90, paddingTop: 12, textAlignVertical: "top" }}
        />

        <Card style={{ gap: 8 }}>
          <AppText variant="heading">{t("hotels.summaryTitle", "Booking summary")}</AppText>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText variant="caption" color="muted">
              {t("hotels.summaryRoom", "Room")}
            </AppText>
            <AppText variant="caption">{selectedRoom?.name ?? t("hotels.anyRoom", "Any available room")}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText variant="caption" color="muted">
              {t("hotels.summaryNights", "Nights")}
            </AppText>
            <AppText variant="caption">{nights}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText variant="caption" color="muted">
              {t("hotels.summaryPricePerNight", "Price per night")}
            </AppText>
            <AppText variant="caption">{effectiveNightlyRate ? money(effectiveNightlyRate) : "—"}</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText variant="caption" color="muted">
              {t("hotels.summaryTaxes", "Estimated taxes")}
            </AppText>
            <AppText variant="caption">{money(taxes)}</AppText>
          </View>
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText variant="bodyStrong">{t("hotels.summaryTotal", "Estimated total")}</AppText>
            <AppText variant="bodyStrong">{money(total)}</AppText>
          </View>
        </Card>

        {error ? (
          <Card style={{ backgroundColor: theme.colors.background, borderColor: "#DC2626" }}>
            <AppText variant="caption" style={{ color: "#DC2626" }}>
              {error}
            </AppText>
          </Card>
        ) : null}

        <Button label={t("hotels.submit", "Send Booking Request")} onPress={onSubmit} loading={submit.isPending} />
      </View>
    </Screen>
  );
}
