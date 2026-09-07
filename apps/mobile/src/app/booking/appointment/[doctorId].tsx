/**
 * Appointment booking — department (if any) -> doctor -> date -> available
 * time slot -> patient info -> submit. Mirrors
 * components/shared/appointment-booking-form.tsx's shape and validation
 * exactly (same field requirements, same "no longer available" race-lost
 * error), rebuilt as native screens/components instead of a web form.
 *
 * Entry point: `partner/[slug]`'s "Book appointment" button, which only
 * renders when the listing has doctors. Presented as a modal (see
 * `_layout.tsx`) — anonymous-writable, same as the website (no AuthGate).
 */
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/lib/api";
import { useCityService, useAppointmentSlots, useSubmitAppointment } from "@/lib/queries";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Button, Card, Input, Screen, SelectField, Skeleton } from "@/ui";
import { ErrorState } from "@/ui/states";

function formatTime12h(hhmm: string): string {
  const [hStr, mStr = "00"] = hhmm.split(":");
  const h = Number(hStr);
  if (!Number.isFinite(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr.padStart(2, "0")} ${period}`;
}

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AppointmentBookingScreen() {
  const { doctorId: routeDoctorId, slug } = useLocalSearchParams<{
    doctorId: string;
    slug: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const listing = useCityService(slug);

  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState(routeDoctorId ?? "");
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dateIso = date ? toIsoDate(date) : undefined;
  const slots = useAppointmentSlots(doctorId || undefined, dateIso);
  const submit = useSubmitAppointment();

  const close = () => (router.canDismiss() ? router.dismiss() : router.replace("/"));

  if (listing.isPending) {
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

  if (listing.isError || !listing.data) {
    return (
      <Screen>
        <ErrorState
          title={t("partner.loadError", "Couldn't load this business")}
          onAction={() => listing.refetch()}
          actionLabel={t("common.retry", "Retry")}
        />
      </Screen>
    );
  }

  const cityServiceName = listing.data.name;
  const departments = listing.data.departments;
  const doctors = listing.data.doctors;

  const filteredDoctors = departmentId
    ? doctors.filter((d) => d.departmentId === departmentId)
    : doctors;
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const doctorOptions = filteredDoctors.map((d) => ({
    value: d.id,
    label: d.specialty ? `${d.name} — ${d.specialty}` : d.name,
  }));
  const timeOptions = (slots.data ?? []).map((s) => ({
    value: s.time,
    label: formatTime12h(s.time),
    sublabel: s.available ? undefined : t("appointments.slotBooked", "Booked"),
    disabled: !s.available,
  }));

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
            {t("appointments.requestSentTitle", "Appointment Request Sent")}
          </AppText>
          <AppText variant="body" color="muted" style={{ textAlign: "center" }}>
            {t(
              "appointments.requestSentBody",
              "{name} will confirm your appointment shortly. You'll be contacted using the phone number you provided.",
              { name: cityServiceName },
            )}
          </AppText>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: theme.colors.chrome,
            }}
          >
            <AppText variant="label" color="inverse">
              {t("appointments.statusPending", "Pending")}
            </AppText>
          </View>
          <Button label={t("common.done", "Done")} onPress={close} />
        </View>
      </Screen>
    );
  }

  function onSubmit() {
    setError(null);
    if (!doctorId) {
      setError(t("appointments.selectDoctorRequired", "Please select a doctor."));
      return;
    }
    if (!dateIso || !time) {
      setError(t("appointments.selectDateTimeRequired", "Please select a date and time."));
      return;
    }
    if (!patientName.trim() || !patientPhone.trim()) {
      setError(t("appointments.patientInfoRequired", "Please enter your name and phone number."));
      return;
    }

    submit.mutate(
      {
        doctorId,
        patientName,
        patientPhone,
        patientEmail: patientEmail || undefined,
        appointmentDate: dateIso,
        appointmentTime: time,
        notes: notes || undefined,
      },
      {
        onError: (err) => {
          const message =
            err instanceof ApiError
              ? err.message
              : t("appointments.somethingWentWrong", "Something went wrong.");
          setError(message);
        },
      },
    );
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.section }}>
        <AppText variant="display">{t("appointments.bookAppointment", "Book an Appointment")}</AppText>
        <Pressable onPress={close} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ gap: 14 }}>
        {departments.length > 0 ? (
          <SelectField
            label={t("appointments.departmentLabel", "Department")}
            value={departmentId}
            onChange={(v) => {
              setDepartmentId(v);
              setDoctorId("");
            }}
            options={departmentOptions}
            placeholder={t("appointments.allDepartments", "All departments")}
          />
        ) : null}

        <SelectField
          label={t("appointments.doctorLabel", "Doctor")}
          value={doctorId}
          onChange={(v) => {
            setDoctorId(v);
            setTime("");
          }}
          options={doctorOptions}
          placeholder={t("appointments.selectDoctorPlaceholder", "Select a doctor")}
        />

        <View>
          <AppText variant="label" color="muted" style={{ marginBottom: 6 }}>
            {t("appointments.appointmentDate", "Date")}
          </AppText>
          <Pressable
            disabled={!doctorId}
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
              opacity: doctorId ? 1 : 0.5,
            }}
          >
            <AppText variant="body" color={date ? "default" : "muted"}>
              {date ? date.toLocaleDateString() : t("appointments.selectDatePlaceholder", "Select a date")}
            </AppText>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={date ?? todayDate()}
              mode="date"
              minimumDate={todayDate()}
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(_event, selected) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selected) {
                  setDate(selected);
                  setTime("");
                }
              }}
            />
          ) : null}
        </View>

        <SelectField
          label={t("appointments.appointmentTime", "Time")}
          value={time}
          onChange={setTime}
          options={timeOptions}
          disabled={!date || slots.isPending}
          placeholder={
            slots.isPending
              ? t("appointments.loadingSlots", "Loading times…")
              : date && timeOptions.length > 0 && timeOptions.every((o) => o.disabled)
                ? t("appointments.noSlotsAvailable", "No slots available")
                : t("appointments.selectTimePlaceholder", "Select a time")
          }
        />

        {selectedDoctor?.appointmentDurationMinutes ? (
          <AppText variant="caption" color="muted">
            {t("appointments.appointmentDurationNote", "Appointments are {minutes} minutes.", {
              minutes: selectedDoctor.appointmentDurationMinutes,
            })}
          </AppText>
        ) : null}

        <Input
          label={t("appointments.patientNameLabel", "Your name")}
          value={patientName}
          onChangeText={setPatientName}
        />
        <Input
          label={t("appointments.patientPhoneLabel", "Phone number")}
          value={patientPhone}
          onChangeText={setPatientPhone}
          keyboardType="phone-pad"
          placeholder="+252 63 000 0000"
        />
        <Input
          label={t("appointments.patientEmailLabel", "Email (optional)")}
          value={patientEmail}
          onChangeText={setPatientEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label={t("appointments.notesLabel", "Notes (optional)")}
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
          label={t("appointments.bookAppointment", "Book an Appointment")}
          onPress={onSubmit}
          loading={submit.isPending}
        />
      </View>
    </Screen>
  );
}
