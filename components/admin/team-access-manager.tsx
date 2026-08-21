"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Trash2, X } from "lucide-react";
import {
  upsertBusinessAccessGrant,
  setBusinessAccessGrantActive,
  deleteBusinessAccessGrant,
  upsertTeamPlatformPermissions,
  setTeamPlatformPermissionsActive,
  upsertHonoraryMember,
  removeHonoraryMember,
} from "@/lib/actions/access-control";
import type { TeamMemberOverviewRow, AccessPickerProfile, AccessPickerBusiness } from "@/lib/data/access-control";
import type { HonoraryMember, BusinessPermissionKey, PlatformPermissionKey, BusinessPermissions, PlatformPermissions, BusinessListingType } from "@/types";

const BUSINESS_PERMISSION_KEYS: BusinessPermissionKey[] = [
  "orders_view", "orders_manage",
  "bookings_view", "bookings_manage",
  "appointments_view", "appointments_manage",
  "businesses_view", "businesses_edit",
  "reviews_view", "reviews_moderate",
];

const PLATFORM_PERMISSION_KEYS: PlatformPermissionKey[] = [
  "partners_view", "partners_add", "partners_edit", "partners_manage_status",
  "content_view", "content_create", "content_edit", "content_publish",
  "reports_view", "reports_export",
  "analytics_view",
  "requests_view", "requests_manage",
];

function PermissionGrid<K extends string>({
  keys,
  value,
  onChange,
  labelFor,
  disabled,
}: {
  keys: K[];
  value: Partial<Record<K, boolean>>;
  onChange: (next: Partial<Record<K, boolean>>) => void;
  labelFor: (key: K) => string;
  /** True while the parent grant/permissions row is disabled — checkboxes
   * go read-only so editing permissions can never happen "by accident" on
   * an inactive grant; re-enabling it first (a separate, explicit action)
   * is the only way back to an editable state. */
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
      {keys.map((key) => (
        <label key={key} className={`flex items-center gap-2 text-xs text-ink/70 dark:text-sand/70 ${disabled ? "opacity-50" : ""}`}>
          <input
            type="checkbox"
            checked={value[key] === true}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-ink/25 text-primary focus:ring-primary dark:border-white/25"
          />
          {labelFor(key)}
        </label>
      ))}
    </div>
  );
}

function BusinessGrantRow({
  grant,
  businessName,
  onSaved,
}: {
  grant: TeamMemberOverviewRow["businessGrants"][number];
  businessName: string;
  onSaved: () => void;
}) {
  const t = useTranslations("admin");
  const [permissions, setPermissions] = useState<BusinessPermissions>(grant.permissions);
  const [isPending, startTransition] = useTransition();
  const dirty = JSON.stringify(permissions) !== JSON.stringify(grant.permissions);

  function save() {
    startTransition(async () => {
      await upsertBusinessAccessGrant(grant.userId, grant.listingType, grant.listingId, permissions, [window.location.pathname]);
      onSaved();
    });
  }

  function toggleActive() {
    startTransition(async () => {
      await setBusinessAccessGrantActive(grant.id, !grant.isActive, [window.location.pathname]);
      onSaved();
    });
  }

  function remove() {
    if (!confirm(t("teamAccessConfirmRemoveGrant", { business: businessName }))) return;
    startTransition(async () => {
      await deleteBusinessAccessGrant(grant.id, [window.location.pathname]);
      onSaved();
    });
  }

  return (
    <div className={`rounded-xl border p-3 ${grant.isActive ? "border-ink/10 dark:border-white/10" : "border-ink/8 opacity-60 dark:border-white/8"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {businessName} <span className="font-normal text-ink/40 dark:text-sand/40">· {t(`teamAccessListingType_${grant.listingType}` as "teamAccessListingType_hotel")}</span>
          {!grant.isActive && <span className="ms-2 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-white/10">{t("teamAccessDisabled")}</span>}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={toggleActive} disabled={isPending} className="rounded-full border border-ink/15 px-2.5 py-1 text-[11px] font-semibold dark:border-white/20">
            {grant.isActive ? t("teamAccessDisable") : t("teamAccessEnable")}
          </button>
          <button type="button" onClick={remove} disabled={isPending} aria-label={t("teamAccessRemove")} className="rounded-full border border-ink/15 p-1.5 text-red-500 dark:border-white/20">
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
      <PermissionGrid
        keys={BUSINESS_PERMISSION_KEYS}
        value={permissions}
        onChange={setPermissions}
        labelFor={(k) => t(`permission_${k}` as "permission_orders_view")}
        disabled={!grant.isActive}
      />
      {!grant.isActive && <p className="mt-2 text-[11px] text-ink/45 dark:text-sand/45">{t("teamAccessEnableToEdit")}</p>}
      {grant.isActive && dirty && (
        <button type="button" onClick={save} disabled={isPending} className="mt-2.5 rounded-full bg-primary-700 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {t("teamAccessSaveChanges")}
        </button>
      )}
    </div>
  );
}

function AddGrantForm({ userId, businesses, onAdded }: { userId: string; businesses: AccessPickerBusiness[]; onAdded: () => void }) {
  const t = useTranslations("admin");
  const [listingKey, setListingKey] = useState("");
  const [permissions, setPermissions] = useState<BusinessPermissions>({});
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!listingKey) return;
    const [listingType, listingId] = listingKey.split("::") as [BusinessListingType, string];
    startTransition(async () => {
      await upsertBusinessAccessGrant(userId, listingType, listingId, permissions, [window.location.pathname]);
      setListingKey("");
      setPermissions({});
      onAdded();
    });
  }

  return (
    <div className="mt-2 rounded-xl border border-dashed border-ink/15 p-3 dark:border-white/15">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={listingKey}
          onChange={(e) => setListingKey(e.target.value)}
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-ink/15 bg-transparent px-3 text-xs dark:border-white/20"
        >
          <option value="">{t("teamAccessSelectBusiness")}</option>
          {businesses.map((b) => (
            <option key={`${b.listingType}::${b.id}`} value={`${b.listingType}::${b.id}`}>
              {b.name} ({t(`teamAccessListingType_${b.listingType}` as "teamAccessListingType_hotel")})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!listingKey || isPending}
          className="inline-flex items-center gap-1 rounded-full bg-primary-700 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Plus size={13} aria-hidden="true" /> {t("teamAccessGrantAccess")}
        </button>
      </div>
      {listingKey && (
        <div className="mt-2.5">
          <PermissionGrid keys={BUSINESS_PERMISSION_KEYS} value={permissions} onChange={setPermissions} labelFor={(k) => t(`permission_${k}` as "permission_orders_view")} />
        </div>
      )}
    </div>
  );
}

function TeamMemberCard({ member, businesses, onChanged }: { member: TeamMemberOverviewRow; businesses: AccessPickerBusiness[]; onChanged: () => void }) {
  const t = useTranslations("admin");
  const [platformPerms, setPlatformPerms] = useState<PlatformPermissions>(member.platformPermissions?.permissions ?? {});
  const [isPending, startTransition] = useTransition();
  const dirtyPlatform = JSON.stringify(platformPerms) !== JSON.stringify(member.platformPermissions?.permissions ?? {});
  const businessById = new Map(businesses.map((b) => [`${b.listingType}::${b.id}`, b.name]));

  function savePlatform() {
    startTransition(async () => {
      await upsertTeamPlatformPermissions(member.userId, platformPerms, [window.location.pathname]);
      onChanged();
    });
  }

  function togglePlatformActive() {
    startTransition(async () => {
      await setTeamPlatformPermissionsActive(member.userId, !(member.platformPermissions?.isActive ?? false), [window.location.pathname]);
      onChanged();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
      <p className="font-display text-base font-bold">{member.fullName}</p>

      <div className="mt-3 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/40 dark:text-sand/40">{t("teamAccessBusinessAccessTitle")}</p>
        {member.businessGrants.map((g) => (
          <BusinessGrantRow key={g.id} grant={g} businessName={businessById.get(`${g.listingType}::${g.listingId}`) ?? "—"} onSaved={onChanged} />
        ))}
        <AddGrantForm userId={member.userId} businesses={businesses} onAdded={onChanged} />
      </div>

      <div className="mt-4 border-t border-ink/8 pt-3 dark:border-white/10">
        <p className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ink/40 dark:text-sand/40">
          {t("teamAccessPlatformPermissionsTitle")}
          {member.platformPermissions && (
            <button type="button" onClick={togglePlatformActive} disabled={isPending} className="text-[11px] font-semibold normal-case text-ink/60 underline dark:text-sand/60">
              {member.platformPermissions.isActive ? t("teamAccessDisable") : t("teamAccessEnable")}
            </button>
          )}
        </p>
        <PermissionGrid
          keys={PLATFORM_PERMISSION_KEYS}
          value={platformPerms}
          onChange={setPlatformPerms}
          labelFor={(k) => t(`permission_${k}` as "permission_partners_view")}
          disabled={member.platformPermissions ? !member.platformPermissions.isActive : false}
        />
        {member.platformPermissions && !member.platformPermissions.isActive && (
          <p className="mt-2 text-[11px] text-ink/45 dark:text-sand/45">{t("teamAccessEnableToEdit")}</p>
        )}
        {(member.platformPermissions?.isActive ?? true) && dirtyPlatform && (
          <button type="button" onClick={savePlatform} disabled={isPending} className="mt-2.5 rounded-full bg-primary-700 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            {t("teamAccessSaveChanges")}
          </button>
        )}
      </div>
    </div>
  );
}

function AddTeamMemberPanel({ profiles, businesses, onAdded, onClose }: { profiles: AccessPickerProfile[]; businesses: AccessPickerBusiness[]; onAdded: () => void; onClose: () => void }) {
  const t = useTranslations("admin");
  const [userId, setUserId] = useState("");
  const [listingKey, setListingKey] = useState("");
  const [permissions, setPermissions] = useState<BusinessPermissions>({});
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!userId || !listingKey) return;
    const [listingType, listingId] = listingKey.split("::") as [BusinessListingType, string];
    startTransition(async () => {
      await upsertBusinessAccessGrant(userId, listingType, listingId, permissions, [window.location.pathname]);
      onAdded();
      onClose();
    });
  }

  return (
    <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">{t("teamAccessAddMember")}</p>
        <button type="button" onClick={onClose} aria-label={t("teamAccessClose")} className="text-ink/40 dark:text-sand/40">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="h-9 rounded-lg border border-ink/15 bg-transparent px-3 text-xs dark:border-white/20">
          <option value="">{t("teamAccessSelectPerson")}</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
        <select value={listingKey} onChange={(e) => setListingKey(e.target.value)} className="h-9 rounded-lg border border-ink/15 bg-transparent px-3 text-xs dark:border-white/20">
          <option value="">{t("teamAccessSelectBusiness")}</option>
          {businesses.map((b) => (
            <option key={`${b.listingType}::${b.id}`} value={`${b.listingType}::${b.id}`}>
              {b.name} ({t(`teamAccessListingType_${b.listingType}` as "teamAccessListingType_hotel")})
            </option>
          ))}
        </select>
      </div>
      {userId && listingKey && (
        <div className="mt-3">
          <PermissionGrid keys={BUSINESS_PERMISSION_KEYS} value={permissions} onChange={setPermissions} labelFor={(k) => t(`permission_${k}` as "permission_orders_view")} />
        </div>
      )}
      <button
        type="button"
        onClick={add}
        disabled={!userId || !listingKey || isPending}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        <Plus size={13} aria-hidden="true" /> {t("teamAccessGrantAccess")}
      </button>
    </div>
  );
}

function HonoraryMemberCard({ member, onChanged }: { member: HonoraryMember; onChanged: () => void }) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm(t("teamAccessConfirmRemoveHonorary", { name: member.titleEn }))) return;
    startTransition(async () => {
      await removeHonoraryMember(member.userId, [window.location.pathname]);
      onChanged();
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 p-3 dark:border-white/10">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{member.titleEn}</p>
        <p className="truncate text-xs text-ink/50 dark:text-sand/50">
          {[member.titleAr, member.titleSo].filter(Boolean).join(" · ") || "—"} {member.isPublic ? `· ${t("teamAccessPublic")}` : `· ${t("teamAccessPrivate")}`}
        </p>
      </div>
      <button type="button" onClick={remove} disabled={isPending} aria-label={t("teamAccessRemove")} className="shrink-0 rounded-full border border-ink/15 p-1.5 text-red-500 dark:border-white/20">
        <Trash2 size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

function AddHonoraryPanel({ profiles, onAdded, onClose }: { profiles: AccessPickerProfile[]; onAdded: () => void; onClose: () => void }) {
  const t = useTranslations("admin");
  const [userId, setUserId] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [titleSo, setTitleSo] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!userId || !titleEn.trim()) return;
    startTransition(async () => {
      const result = await upsertHonoraryMember(userId, { titleEn, titleAr, titleSo }, isPublic, [window.location.pathname]);
      if (!result.ok) { alert(result.error ?? t("somethingWentWrong")); return; }
      onAdded();
      onClose();
    });
  }

  return (
    <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">{t("teamAccessAddHonorary")}</p>
        <button type="button" onClick={onClose} aria-label={t("teamAccessClose")} className="text-ink/40 dark:text-sand/40">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="h-9 rounded-lg border border-ink/15 bg-transparent px-3 text-xs dark:border-white/20">
          <option value="">{t("teamAccessSelectPerson")}</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-ink/70 dark:text-sand/70">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink/25 dark:border-white/25" />
          {t("teamAccessShowPublicly")}
        </label>
        <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder={t("teamAccessTitleEnPlaceholder")} className="h-9 rounded-lg border border-ink/15 bg-transparent px-3 text-xs dark:border-white/20" />
        <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder={t("teamAccessTitleArPlaceholder")} dir="rtl" className="h-9 rounded-lg border border-ink/15 bg-transparent px-3 text-xs dark:border-white/20" />
        <input value={titleSo} onChange={(e) => setTitleSo(e.target.value)} placeholder={t("teamAccessTitleSoPlaceholder")} className="h-9 rounded-lg border border-ink/15 bg-transparent px-3 text-xs dark:border-white/20 sm:col-span-2" />
      </div>
      <button
        type="button"
        onClick={add}
        disabled={!userId || !titleEn.trim() || isPending}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        <Plus size={13} aria-hidden="true" /> {t("teamAccessAdd")}
      </button>
    </div>
  );
}

/**
 * Owner-only. Everything here reads/writes business_access_grants,
 * team_platform_permissions, and honorary_members directly through the
 * server actions in lib/actions/access-control.ts, which independently
 * re-verify role = 'owner' server-side (and RLS backs that up again) — this
 * component itself carries no authorization weight, same discipline as
 * every other admin management UI in this app.
 */
export function TeamAccessManager({
  teamMembers,
  honoraryMembers,
  allProfiles,
  allBusinesses,
}: {
  teamMembers: TeamMemberOverviewRow[];
  honoraryMembers: HonoraryMember[];
  allProfiles: AccessPickerProfile[];
  allBusinesses: AccessPickerBusiness[];
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [addingMember, setAddingMember] = useState(false);
  const [addingHonorary, setAddingHonorary] = useState(false);

  function refresh() {
    router.refresh();
  }

  const availableProfiles = allProfiles.filter((p) => !honoraryMembers.some((h) => h.userId === p.id));

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">{t("teamAccessTeamMembersTitle")}</h2>
            <p className="text-xs text-ink/50 dark:text-sand/50">{t("teamAccessTeamMembersSubtitle")}</p>
          </div>
          {!addingMember && (
            <button type="button" onClick={() => setAddingMember(true)} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-xs font-semibold dark:border-white/20">
              <Plus size={13} aria-hidden="true" /> {t("teamAccessAddMember")}
            </button>
          )}
        </div>

        {addingMember && <AddTeamMemberPanel profiles={allProfiles} businesses={allBusinesses} onAdded={refresh} onClose={() => setAddingMember(false)} />}

        {teamMembers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink/45 dark:border-white/15 dark:text-sand/45">
            {t("teamAccessNoMembersYet")}
          </p>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((m) => (
              <TeamMemberCard key={m.userId} member={m} businesses={allBusinesses} onChanged={refresh} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">{t("teamAccessHonoraryTitle")}</h2>
            <p className="text-xs text-ink/50 dark:text-sand/50">{t("teamAccessHonorarySubtitle")}</p>
          </div>
          {!addingHonorary && (
            <button type="button" onClick={() => setAddingHonorary(true)} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-xs font-semibold dark:border-white/20">
              <Plus size={13} aria-hidden="true" /> {t("teamAccessAddHonorary")}
            </button>
          )}
        </div>

        {addingHonorary && <AddHonoraryPanel profiles={availableProfiles} onAdded={refresh} onClose={() => setAddingHonorary(false)} />}

        {honoraryMembers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink/45 dark:border-white/15 dark:text-sand/45">
            {t("teamAccessNoHonoraryYet")}
          </p>
        ) : (
          <div className="space-y-2">
            {honoraryMembers.map((h) => (
              <HonoraryMemberCard key={h.id} member={h} onChanged={refresh} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
