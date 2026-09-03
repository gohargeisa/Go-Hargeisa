"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitAppointmentRequest, getSlotAvailability } from "@/lib/actions/appointments";
import { formatTime12h } from "@/lib/utils/opening-hours";
import type { SlotStatus } from "@/lib/utils/doctor-availability";
import type { Doctor, Department } from "@/types";

function doctorLocalizedField(value: string | undefined, valueAr: string | undefined, valueSo: string | undefined, locale: string): string | undefined {
  return (locale === "ar" && valueAr) || (locale === "so" && valueSo) || value;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Shared core of the appointment booking flow — department (if any) ->
 * doctor -> date -> available time slot -> patient info -> submit. Mirrors
 * components/shared/booking-form.tsx's single-page-with-confirmation-state
 * shape. Available slots are fetched from the server (getAvailableSlots)
 * whenever the doctor or date changes, since they depend on already-booked
 * appointments the client can't see directly (appointments has no public
 * SELECT policy — see that action's own comment).
 */
export function AppointmentBookingForm({
  cityServiceName,
  doctors,
  departments,
  preselectedDoctorId,
  locale,
  isDental,
  isMedical = true,
}: {
  cityServiceName: string;
  doctors: Doctor[];
  departments: Department[];
  preselectedDoctorId?: string;
  locale: string;
  isDental: boolean;
  isMedical?: boolean;
}) {
  const t = useTranslations("appointments");

  const [departmentId, setDepartmentId] = useState<string>(
    () => doctors.find((d) => d.id === preselectedDoctorId)?.departmentId ?? ""
  );
  const [doctorId, setDoctorId] = useState(preselectedDoctorId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredDoctors = useMemo(
    () => (departmentId ? doctors.filter((d) => d.departmentId === departmentId) : doctors),
    [doctors, departmentId]
  );
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  useEffect(() => {
    setTime("");
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    getSlotAvailability(doctorId, date)
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, date]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!doctorId) {
      setError(t(isMedical ? "selectDoctorRequired" : "selectStaffRequired"));
      return;
    }
    if (!date || !time) {
      setError(t("selectDateTimeRequired"));
      return;
    }
    if (!patientName.trim() || !patientPhone.trim()) {
      setError(t("patientInfoRequired"));
      return;
    }

    startTransition(async () => {
      const result = await submitAppointmentRequest({
        doctorId,
        patientName,
        patientPhone,
        patientEmail: patientEmail || undefined,
        appointmentDate: date,
        appointmentTime: time,
        notes: notes || undefined,
      });
      if (!result.ok) {
        setError(result.error ?? t("somethingWentWrong"));
        return;
      }
      setSent(true);
    });
  }

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

  if (sent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent-600">
          <CheckCircle2 size={34} aria-hidden="true" />
        </div>
        <h3 className="font-display text-2xl font-bold">{t("requestSentTitle")}</h3>
        <p className="max-w-md text-sm leading-relaxed text-ink/60 dark:text-sand/60">
          {t("requestSentBody", { name: cityServiceName })}
        </p>
        <span className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
          {t("appointmentStatus_pending")}
        </span>
      </div>
    );
  }

  const bookLabel = isMedical ? (isDental ? t("bookADentist") : t("bookADoctor")) : t("bookAppointmentButton");

  return (
    <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-8">
      <h2 className="font-display text-xl font-bold">{bookLabel}</h2>

      {departments.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("departmentLabel")}</label>
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setDoctorId("");
            }}
            className={inputClass}
          >
            <option value="">{t("allDepartments")}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {doctorLocalizedField(d.name, d.nameAr, d.nameSo, locale)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t(isMedical ? "doctorLabel" : "staffLabel")}</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputClass}>
          <option value="">{t(isMedical ? "selectDoctorPlaceholder" : "selectStaffPlaceholder")}</option>
          {filteredDoctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.specialty ? ` — ${d.specialty}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("appointmentDate")}</label>
          <input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} disabled={!doctorId} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("appointmentTime")}</label>
          <select value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} disabled={!date || loadingSlots}>
            <option value="">
              {loadingSlots
                ? t("loadingSlots")
                : date && !slots.some((s) => s.available)
                  ? t("noSlotsAvailable")
                  : t("selectTimePlaceholder")}
            </option>
            {slots.map((s) => (
              <option key={s.time} value={s.time} disabled={!s.available}>
                {formatTime12h(s.time)}
                {s.available ? "" : ` — ${t("slotBooked")}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedDoctor && selectedDoctor.appointmentDurationMinutes && (
        <p className="text-xs text-ink/45 dark:text-sand/45">{t("appointmentDurationNote", { minutes: selectedDoctor.appointmentDurationMinutes })}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("patientNameLabel")}</label>
          <input required value={patientName} onChange={(e) => setPatientName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("patientPhoneLabel")}</label>
          <input required type="tel" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("patientEmailLabel")}</label>
        <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("notesLabel")}</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder={t(isMedical ? "notesPlaceholder" : "staffNotesPlaceholder")} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {bookLabel}
      </button>
    </form>
  );
}
