"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { updateAppointmentStatus } from "@/lib/actions/appointments";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { formatTime12h } from "@/lib/utils/opening-hours";
import type { Appointment, AppointmentStatus } from "@/types";

export interface AppointmentManagerRow extends Appointment {
  doctorName: string;
}

const STATUS_OPTIONS: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"];

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
  rejected: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  no_show: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Mirrors components/business/bookings-table.tsx's structure — one shared
 * shape for "list of requests, change status inline" across both engines. */
export function AppointmentsTable({ appointments, revalidatePath }: { appointments: AppointmentManagerRow[]; revalidatePath: string }) {
  const t = useTranslations("appointments");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onStatusChange(appointment: AppointmentManagerRow, status: AppointmentStatus) {
    startTransition(async () => {
      await updateAppointmentStatus(appointment.id, appointment.doctorId, status, [revalidatePath]);
      router.refresh();
    });
  }

  function contactPatientHref(appointment: AppointmentManagerRow): string | undefined {
    return toWhatsAppHref(
      appointment.patientPhone,
      `Hi ${appointment.patientName}, this is regarding your appointment request with ${appointment.doctorName}.`
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("noAppointmentsYet")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto rounded-2xl border border-ink/8 dark:border-white/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t("patientName")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("doctorLabel")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("appointmentDate")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("appointmentTime")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("status")}</th>
              <th className="px-4 py-3 text-end font-semibold">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8 dark:divide-white/10">
            {appointments.map((a) => {
              const whatsappHref = contactPatientHref(a);
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.patientName}</td>
                  <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{a.doctorName}</td>
                  <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{formatDate(a.appointmentDate)}</td>
                  <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{formatTime12h(a.appointmentTime)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      disabled={isPending}
                      onChange={(e) => onStatusChange(a, e.target.value as AppointmentStatus)}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold capitalize outline-none ${STATUS_STYLES[a.status]}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {t(`appointmentStatus_${s}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-end">
                    {whatsappHref && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("contactPatient")}
                        title={t("contactPatient")}
                        className="ms-auto flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-[#25D366] transition-colors hover:border-[#25D366] dark:border-white/20"
                      >
                        <MessageCircle size={14} aria-hidden="true" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {appointments.map((a) => {
          const whatsappHref = contactPatientHref(a);
          return (
            <div key={a.id} className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.patientName}</p>
                  <p className="text-xs text-ink/50 dark:text-sand/50">{a.doctorName}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[a.status]}`}>
                  {t(`appointmentStatus_${a.status}`)}
                </span>
              </div>
              <div className="mt-3 text-xs text-ink/60 dark:text-sand/60">
                {formatDate(a.appointmentDate)} • {formatTime12h(a.appointmentTime)}
              </div>
              <div className="mt-3 flex gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStatusChange(a, s)}
                    disabled={isPending || a.status === s}
                    className={`flex-1 rounded-full border py-2 text-xs font-semibold disabled:opacity-40 ${
                      a.status === s ? "border-primary text-primary" : "border-ink/15 dark:border-white/20"
                    }`}
                  >
                    {t(`appointmentStatus_${s}`)}
                  </button>
                ))}
              </div>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1 rounded-full border border-ink/15 py-2 text-xs font-semibold dark:border-white/20"
                >
                  <MessageCircle size={13} aria-hidden="true" /> {t("contactPatient")}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
