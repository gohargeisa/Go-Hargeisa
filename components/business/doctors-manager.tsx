"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { createDoctor, deleteDoctor, updateDoctor, type DoctorInput } from "@/lib/actions/doctors";
import { ImageUploader } from "@/components/shared/image-uploader";
import { OpeningHoursEditor } from "@/components/shared/opening-hours-editor";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import type { DepartmentManagerRow } from "@/components/business/departments-manager";
import type { OpeningHoursGroup } from "@/types";

export interface DoctorManagerRow extends DoctorInput {
  id: string;
}

const BLANK: DoctorInput = {
  name: "",
  photo: "",
  specialty: "",
  specialtyAr: "",
  specialtySo: "",
  bio: "",
  bioAr: "",
  bioSo: "",
  languages: [],
  workingHours: [],
  appointmentDurationMinutes: 30,
  isActive: true,
  departmentId: undefined,
};

/** Inline CRUD for a hospital/clinic's doctors — mirrors
 * components/business/products-manager.tsx's structure. Working hours reuse
 * the existing OpeningHoursEditor as-is (Phase 4 accepted design choice). */
export function DoctorsManager({
  cityServiceId,
  initialDoctors,
  departments,
  revalidatePaths,
}: {
  cityServiceId: string;
  initialDoctors: DoctorManagerRow[];
  departments: DepartmentManagerRow[];
  revalidatePaths: string[];
}) {
  const t = useTranslations("appointments");
  const tw = useTranslations("weekdays");
  const [doctors, setDoctors] = useState(initialDoctors);
  useEffect(() => setDoctors(initialDoctors), [initialDoctors]);

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<DoctorInput>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function startEdit(doctor?: DoctorManagerRow) {
    setError(null);
    if (doctor) {
      setEditingId(doctor.id);
      setDraft({ ...doctor });
    } else {
      setEditingId("new");
      setDraft(BLANK);
    }
  }

  function save() {
    if (!draft.name.trim()) {
      setError(t("doctorNameRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        editingId && editingId !== "new"
          ? await updateDoctor(editingId, cityServiceId, draft, revalidatePaths)
          : await createDoctor(cityServiceId, draft, revalidatePaths);
      if (result.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function remove(id: string) {
    if (!confirm(t("confirmDeleteDoctor"))) return;
    startTransition(async () => {
      const result = await deleteDoctor(id, cityServiceId, revalidatePaths);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("deleteFailed"));
    });
  }

  function departmentName(id?: string) {
    return departments.find((d) => d.id === id)?.name;
  }

  return (
    <div className="space-y-4 rounded-xl2 border border-ink/8 p-5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("doctorsTitle")}</h3>
        {editingId === null && (
          <button
            type="button"
            onClick={() => startEdit()}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Plus size={13} /> {t("addDoctor")}
          </button>
        )}
      </div>

      {doctors.length === 0 && editingId === null && <p className="text-sm text-ink/50 dark:text-sand/50">{t("noDoctorsYet")}</p>}

      <div className="space-y-2">
        {doctors.map((doctor) =>
          editingId === doctor.id ? (
            <DoctorForm
              key={doctor.id}
              draft={draft}
              setDraft={setDraft}
              departments={departments}
              onSave={save}
              onCancel={() => setEditingId(null)}
              isPending={isPending}
              error={error}
              t={t}
              tw={tw}
            />
          ) : (
            <div key={doctor.id} className="flex items-center gap-3 rounded-xl2 border border-ink/8 p-3 dark:border-white/10">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-ink/5 dark:bg-white/5">
                {doctor.photo && <Image src={doctor.photo} alt={doctor.name} fill sizes="48px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{doctor.name}</p>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      doctor.isActive
                        ? "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400"
                        : "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300"
                    }`}
                  >
                    {doctor.isActive ? t("active") : t("inactive")}
                  </span>
                </div>
                <p className="text-xs text-ink/50 dark:text-sand/50">
                  {doctor.specialty ?? ""}
                  {departmentName(doctor.departmentId) ? ` • ${departmentName(doctor.departmentId)}` : ""}
                  {` • ${doctor.appointmentDurationMinutes} ${t("minutesShort")}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(doctor)}
                aria-label={`${t("edit")} ${doctor.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-primary hover:text-primary dark:border-white/15"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => remove(doctor.id)}
                disabled={isPending}
                aria-label={`${t("delete")} ${doctor.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        )}

        {editingId === "new" && (
          <DoctorForm
            draft={draft}
            setDraft={setDraft}
            departments={departments}
            onSave={save}
            onCancel={() => setEditingId(null)}
            isPending={isPending}
            error={error}
            t={t}
            tw={tw}
          />
        )}
      </div>
    </div>
  );
}

function DoctorForm({
  draft,
  setDraft,
  departments,
  onSave,
  onCancel,
  isPending,
  error,
  t,
  tw,
}: {
  draft: DoctorInput;
  setDraft: (d: DoctorInput) => void;
  departments: DepartmentManagerRow[];
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
  t: ReturnType<typeof useTranslations>;
  tw: ReturnType<typeof useTranslations>;
}) {
  function update<K extends keyof DoctorInput>(key: K, value: DoctorInput[K]) {
    setDraft({ ...draft, [key]: value });
  }

  return (
    <div className="space-y-3 rounded-xl2 border border-primary/30 bg-primary/5 p-4">
      <ImageUploader folder="doctors" value={draft.photo ?? ""} onChange={(url) => update("photo", url)} label={t("photoLabel")} rounded="rounded-full" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("nameLabel")}>
          <input value={draft.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        {departments.length > 0 && (
          <Field label={t("departmentLabel")}>
            <select value={draft.departmentId ?? ""} onChange={(e) => update("departmentId", e.target.value || undefined)} className={inputClass}>
              <option value="">{t("noDepartment")}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("specialtyLabel")}>
          <input value={draft.specialty ?? ""} onChange={(e) => update("specialty", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("specialtyArLabel")}>
          <input dir="rtl" value={draft.specialtyAr ?? ""} onChange={(e) => update("specialtyAr", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("specialtySoLabel")}>
          <input value={draft.specialtySo ?? ""} onChange={(e) => update("specialtySo", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("bioLabel")}>
          <textarea rows={2} value={draft.bio ?? ""} onChange={(e) => update("bio", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("bioArLabel")}>
          <textarea dir="rtl" rows={2} value={draft.bioAr ?? ""} onChange={(e) => update("bioAr", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("bioSoLabel")}>
          <textarea rows={2} value={draft.bioSo ?? ""} onChange={(e) => update("bioSo", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <TagInput label={t("languagesLabel")} values={draft.languages} onChange={(v) => update("languages", v)} placeholder={t("languagesPlaceholder")} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("appointmentDurationLabel")}>
          <input
            type="number"
            min={5}
            step={5}
            value={draft.appointmentDurationMinutes}
            onChange={(e) => update("appointmentDurationMinutes", Number(e.target.value) || 30)}
            className={inputClass}
          />
        </Field>
        <Field label={t("statusLabel")}>
          <select value={draft.isActive ? "active" : "inactive"} onChange={(e) => update("isActive", e.target.value === "active")} className={inputClass}>
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>
        </Field>
      </div>

      <OpeningHoursEditor
        value={draft.workingHours}
        onChange={(v: OpeningHoursGroup[]) => update("workingHours", v)}
        dayLabel={tw}
        title={t("workingHoursTitle")}
        addLabel={t("addHoursGroupLabel")}
        openLabel={t("hoursOpenLabel")}
        closeLabel={t("hoursCloseLabel")}
        removeAriaLabel={t("removeHoursGroupAriaLabel")}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          {t("saveDoctor")}
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold dark:border-white/20">
          <X size={12} /> {t("cancel")}
        </button>
      </div>
    </div>
  );
}
