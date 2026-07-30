"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/home/reveal";

const FAQ_KEYS = [1, 2, 3, 4, 5] as const;

export function JoinFaq() {
  const t = useTranslations("joinRequest");
  const [openKey, setOpenKey] = useState<number | null>(1);

  return (
    <section className="container-px mx-auto max-w-3xl py-16 sm:py-20">
      <Reveal>
        <h2 className="text-balance text-center font-display text-2xl font-bold sm:text-3xl">{t("faqTitle")}</h2>
      </Reveal>

      <div className="mt-10 flex flex-col gap-3">
        {FAQ_KEYS.map((key) => {
          const isOpen = openKey === key;
          return (
            <div
              key={key}
              className="overflow-hidden rounded-2xl border border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.03]"
            >
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : key)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
              >
                <span className="font-semibold">{t(`faq${key}Question` as "faq1Question")}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-ink/40 transition-transform duration-300 ease-premium dark:text-sand/40 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <div
                className="grid transition-all duration-300 ease-premium"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                    {t(`faq${key}Answer` as "faq1Answer")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
