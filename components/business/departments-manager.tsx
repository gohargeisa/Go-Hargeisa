"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { createDepartment, deleteDepartment, updateDepartment, type DepartmentInput } from "@/lib/actions/departments";
import { Field, inputClass } from "@/components/admin/form-shared";

export interface DepartmentManagerRow extends DepartmentInput {
  id: string;
}

const BLANK: DepartmentInput = { name: "", nameAr: "", nameSo: "" };

/** Inline CRUD for a hospital/clinic's departments — mirrors
 * components/business/products-manager.tsx's structure. */
export function DepartmentsManager({
  cityServiceId,
  initialDepartments,
  revalidatePaths,
}: {
  cityServiceId: string;
  initialDepartments: DepartmentManagerRow[];
  revalidatePaths: string[];
}) {
  const t = useTranslations("appointments");
  const [departments, setDepartments] = useState(initialDepartments);
  useEffect(() => setDepartments(initialDepartments), [initialDepartments]);

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<DepartmentInput>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function startEdit(department?: DepartmentManagerRow) {
    setError(null);
    if (department) {
      setEditingId(department.id);
      setDraft({ ...department });
    } else {
      setEditingId("new");
      setDraft(BLANK);
    }
  }

  function save() {
    if (!draft.name.trim()) {
      setError(t("departmentNameRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        editingId && editingId !== "new"
          ? await updateDepartment(editingId, cityServiceId, draft, revalidatePaths)
          : await createDepartment(cityServiceId, draft, revalidatePaths);
      if (result.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function remove(id: string) {
    if (!confirm(t("confirmDeleteDepartment"))) return;
    startTransition(async () => {
      const result = await deleteDepartment(id, cityServiceId, revalidatePaths);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("deleteFailed"));
    });
  }

  return (
    <div className="space-y-4 rounded-xl2 border border-ink/8 p-5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("departmentsTitle")}</h3>
        {editingId === null && (
          <button
            type="button"
            onClick={() => startEdit()}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Plus size={13} /> {t("addDepartment")}
          </button>
        )}
      </div>

      {departments.length === 0 && editingId === null && (
        <p className="text-sm text-ink/50 dark:text-sand/50">{t("noDepartmentsYet")}</p>
      )}

      <div className="space-y-2">
        {departments.map((department) =>
          editingId === department.id ? (
            <DepartmentForm key={department.id} draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setEditingId(null)} isPending={isPending} error={error} t={t} />
          ) : (
            <div key={department.id} className="flex items-center gap-3 rounded-xl2 border border-ink/8 p-3 dark:border-white/10">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{department.name}</p>
              <button
                type="button"
                onClick={() => startEdit(department)}
                aria-label={`${t("edit")} ${department.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-primary hover:text-primary dark:border-white/15"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => remove(department.id)}
                disabled={isPending}
                aria-label={`${t("delete")} ${department.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        )}

        {editingId === "new" && (
          <DepartmentForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setEditingId(null)} isPending={isPending} error={error} t={t} />
        )}
      </div>
    </div>
  );
}

function DepartmentForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isPending,
  error,
  t,
}: {
  draft: DepartmentInput;
  setDraft: (d: DepartmentInput) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  function update<K extends keyof DepartmentInput>(key: K, value: DepartmentInput[K]) {
    setDraft({ ...draft, [key]: value });
  }

  return (
    <div className="space-y-3 rounded-xl2 border border-primary/30 bg-primary/5 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("nameLabel")}>
          <input value={draft.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("nameArLabel")}>
          <input dir="rtl" value={draft.nameAr ?? ""} onChange={(e) => update("nameAr", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("nameSoLabel")}>
          <input value={draft.nameSo ?? ""} onChange={(e) => update("nameSo", e.target.value)} className={inputClass} />
        </Field>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          {t("saveDepartment")}
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold dark:border-white/20">
          <X size={12} /> {t("cancel")}
        </button>
      </div>
    </div>
  );
}
