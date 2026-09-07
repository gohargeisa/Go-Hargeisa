/**
 * Table reservation — restaurants + cafes share this one screen (the
 * `submit_table_reservation` RPC is already generic over listingType, and
 * the website's own TableReservationForm is the same shared component for
 * both verticals — see components/shared/table-reservation-form.tsx).
 * No slot/availability system exists for reservations (unlike appointments)
 * — date + time are free pickers, matching the website's plain
 * `<input type="date">` / `<input type="time">`.
 *
 * Entry point: the "Reserve a Table" button on `restaurants/[slug]` /
 * `cafes/[slug]`, only shown when `data.reservable`. Presented as a modal
 * (see `_layout.tsx`) — anonymous-writable, same as the website.
 */
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import {
  ReservationError,
  useSubmitTableReservation,
  type TableReservationListingType,
} from "@/lib/reservations";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Button, Card, Input, Screen } from "@/ui";

const MAX_GUESTS = 50;

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TableReservationScreen() {
  const { listingType, id, name } = useLocalSearchParams<{
    listingType: TableReservationListingType;
    id: string;
    name?: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [guestsCount, setGuestsCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useSubmitTableReservation();

  const close = () => (router.canDismiss() ? router.dismiss() : router.replace("/"));

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
            {t("reservations.successTitle", "Reservation Request Received")}
          </AppText>
          <AppText variant="body" color="muted" style={{ textAlign: "center" }}>
            {t(
              "reservations.successBody",
              "Your table reservation request has been sent. The business will review it and confirm shortly.",
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
    if (!customerName.trim() || !customerPhone.trim()) {
      setError(t("reservations.errorRequired", "Full name, phone number, date, and time are required."));
      return;
    }
    if (!date || !time) {
      setError(t("reservations.errorRequired", "Full name, phone number, date, and time are required."));
      return;
    }

    submit.mutate(
      {
        listingType,
        listingId: id,
        customerName,
        customerPhone,
        reservationDate: toIsoDate(date),
        reservationTime: toHHMM(time),
        guestsCount,
        notes: notes || undefined,
      },
      {
        onError: (err) => {
          const message =
            err instanceof ReservationError
              ? err.message
              : t("reservations.errorGeneric", "Something went wrong. Please try again.");
          setError(message);
        },
      },
    );
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <AppText variant="display">{t("reservations.modalTitle", "Reserve a Table")}</AppText>
        <Pressable onPress={close} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={theme.colors.textMuted} />
        </Pressable>
      </View>
      {name ? (
        <AppText variant="body" color="muted" style={{ marginBottom: spacing.section }}>
          {name}
        </AppText>
      ) : (
        <View style={{ marginBottom: spacing.section }} />
      )}

      <View style={{ gap: 14 }}>
        <Input
          label={t("reservations.nameLabel", "Full name")}
          value={customerName}
          onChangeText={setCustomerName}
        />
        <Input
          label={t("reservations.phoneLabel", "Phone number")}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
          placeholder="+252 63 000 0000"
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="label" color="muted" style={{ marginBottom: 6 }}>
              {t("reservations.dateLabel", "Date")}
            </AppText>
            <Pressable
              onPress={() => setShowDatePicker(true)}
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
              <AppText variant="body" color={date ? "default" : "muted"}>
                {date ? date.toLocaleDateString() : t("common.select", "Select")}
              </AppText>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="label" color="muted" style={{ marginBottom: 6 }}>
              {t("reservations.timeLabel", "Time")}
            </AppText>
            <Pressable
              onPress={() => setShowTimePicker(true)}
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
              <AppText variant="body" color={time ? "default" : "muted"}>
                {time
                  ? time.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                  : t("common.select", "Select")}
              </AppText>
              <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {showDatePicker ? (
          <DateTimePicker
            value={date ?? todayDate()}
            mode="date"
            minimumDate={todayDate()}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_event, selected) => {
              setShowDatePicker(Platform.OS === "ios");
              if (selected) setDate(selected);
            }}
          />
        ) : null}
        {showTimePicker ? (
          <DateTimePicker
            value={time ?? new Date()}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_event, selected) => {
              setShowTimePicker(Platform.OS === "ios");
              if (selected) setTime(selected);
            }}
          />
        ) : null}

        <View
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
          <AppText variant="bodyStrong">{t("reservations.guestsLabel", "Guests")}</AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable
              onPress={() => setGuestsCount((n) => Math.max(1, n - 1))}
              disabled={guestsCount <= 1}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: guestsCount <= 1 ? 0.4 : 1,
              }}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </Pressable>
            <AppText variant="bodyStrong" style={{ minWidth: 24, textAlign: "center" }}>
              {guestsCount}
            </AppText>
            <Pressable
              onPress={() => setGuestsCount((n) => Math.min(MAX_GUESTS, n + 1))}
              disabled={guestsCount >= MAX_GUESTS}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: guestsCount >= MAX_GUESTS ? 0.4 : 1,
              }}
            >
              <Ionicons name="add" size={16} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        <Input
          label={t("reservations.notesLabel", "Special requests (optional)")}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ height: 90, paddingTop: 12, textAlignVertical: "top" }}
        />

        {error ? (
          <Card style={{ backgroundColor: theme.colors.background, borderColor: "#DC2626" }}>
            <AppText variant="caption" style={{ color: "#DC2626" }}>
              {error}
            </AppText>
          </Card>
        ) : null}

        <Button
          label={t("reservations.submit", "Confirm Reservation")}
          onPress={onSubmit}
          loading={submit.isPending}
        />
      </View>
    </Screen>
  );
}
