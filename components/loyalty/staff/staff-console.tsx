"use client";

import { useCallback, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LogOut, QrCode, ScanLine, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyStaffRole, StaffMemberDoc } from "@/lib/loyalty/types";
import {
  staffLookupByQrAction,
  staffLookupByNumberAction,
  staffValidateCodeAction,
} from "@/lib/actions/loyalty-staff";
import { QrScanner } from "./qr-scanner";
import { MemberPanel } from "./member-panel";

type Tab = "scan" | "code";

export function StaffConsole({
  locale,
  role,
  program,
  partnerName,
  partnerLogo,
  exitHref,
}: {
  locale: Locale;
  role: LoyaltyStaffRole;
  program: { id: string; name: string; currency: string; pointsPerCurrency: number };
  partnerName: string;
  partnerLogo: string | null;
  exitHref: string;
}) {
  const t = useTranslations("loyalty");
  const [tab, setTab] = useState<Tab>("scan");
  const [doc, setDoc] = useState<StaffMemberDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Bump to force the scanner to remount (fresh camera + decode loop) after a
  // failed lookup, so the operator can immediately try again.
  const [scanKey, setScanKey] = useState(0);

  // Validate-code tab state
  const [code, setCode] = useState("");
  const [codeResult, setCodeResult] = useState<
    { ok: true; code: string; rewardName: string | null } | { ok: false; error: string } | null
  >(null);

  const loadByUid = useCallback(
    (uid: string) => {
      setError(null);
      startTransition(async () => {
        const res = await staffLookupByQrAction(uid, locale);
        if (res.ok) setDoc(res.doc);
        else {
          setError(res.error);
          setScanKey((k) => k + 1);
        }
      });
    },
    [locale]
  );

  const loadByNumber = useCallback(
    (number: string) => {
      setError(null);
      startTransition(async () => {
        const res = await staffLookupByNumberAction(program.id, number, locale);
        if (res.ok) setDoc(res.doc);
        else {
          setError(res.error);
          setScanKey((k) => k + 1);
        }
      });
    },
    [locale, program.id]
  );

  const refreshMember = useCallback(async () => {
    if (!doc) return;
    const res = await staffLookupByQrAction(doc.member.member_uid, locale);
    if (res.ok) setDoc(res.doc);
  }, [doc, locale]);

  function validateCode(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setCodeResult(null);
    startTransition(async () => {
      const res = await staffValidateCodeAction(c, locale);
      if (res.ok) {
        setCodeResult({ ok: true, code: res.code, rewardName: res.rewardName });
        setCode("");
      } else {
        setCodeResult({ ok: false, error: res.error });
      }
    });
  }

  return (
    <div className="container-px mx-auto max-w-2xl pb-16 pt-[calc(env(safe-area-inset-top)+5.25rem)]">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {partnerLogo && (
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-primary/10">
              <Image src={partnerLogo} alt="" fill sizes="36px" className="object-contain p-1" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{program.name}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
              {t(role === "staff" ? "staffBadge" : "managerBadge")}
            </p>
          </div>
        </div>
        <Link
          href={exitHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        >
          <LogOut size={14} aria-hidden="true" className="rtl:rotate-180" />
          {t("staffExit")}
        </Link>
      </header>

      {doc ? (
        <div className="mt-6">
          <MemberPanel
            locale={locale}
            role={role}
            program={program}
            doc={doc}
            onRefresh={refreshMember}
            onClear={() => {
              setDoc(null);
              setError(null);
            }}
          />
        </div>
      ) : (
        <div className="mt-6">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-ink/5 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTab("scan")}
              aria-pressed={tab === "scan"}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === "scan" ? "bg-white text-primary-700 shadow-soft dark:bg-ink dark:text-primary-300" : "text-ink/55 dark:text-sand/55"
              }`}
            >
              <ScanLine size={15} aria-hidden="true" />
              {t("scanMemberTab")}
            </button>
            <button
              type="button"
              onClick={() => setTab("code")}
              aria-pressed={tab === "code"}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === "code" ? "bg-white text-primary-700 shadow-soft dark:bg-ink dark:text-primary-300" : "text-ink/55 dark:text-sand/55"
              }`}
            >
              <QrCode size={15} aria-hidden="true" />
              {t("validateCodeTab")}
            </button>
          </div>

          {tab === "scan" ? (
            <>
              <QrScanner
                key={scanKey}
                onMemberUid={loadByUid}
                onMembershipNumber={loadByNumber}
                numberEntryLabel={t("membershipNumberLabel")}
              />
              {pending && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-ink/55 dark:text-sand/55">
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  {t("lookingUp")}
                </p>
              )}
              {error && (
                <p className="mt-3 text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm text-ink/60 dark:text-sand/60">{t("validateCodeHint")}</p>
              <form onSubmit={validateCode} className="mt-3 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("redemptionCodeLabel")}
                  aria-label={t("redemptionCodeLabel")}
                  autoCapitalize="characters"
                  className="min-w-0 flex-1 rounded-full border border-ink/15 bg-transparent px-4 py-2.5 font-mono text-sm tracking-wider outline-none focus:border-primary dark:border-white/20"
                />
                <button
                  type="submit"
                  disabled={pending || !code.trim()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
                >
                  {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                  {t("validate")}
                </button>
              </form>

              {codeResult && codeResult.ok && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t("codeAccepted")}</p>
                    <p className="mt-0.5 text-sm text-ink/70 dark:text-sand/70">
                      {codeResult.rewardName ?? t("reward")} · <span className="font-mono">{codeResult.code}</span>
                    </p>
                  </div>
                </div>
              )}
              {codeResult && !codeResult.ok && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                  <XCircle size={18} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{codeResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
