import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Premium centered CTA shown at the bottom of a homepage preview section
 * (Hotels/Restaurants/Cafes), once each row is capped to a handful of
 * cards. Deliberately its own component rather than three inline copies —
 * same button, three destinations.
 */
export function ViewAllButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-10 flex justify-center md:mt-14">
      <Link
        href={href}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(245,158,11,0.3)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_16px_40px_rgba(245,158,11,0.4)] active:translate-y-0 sm:w-auto sm:min-w-[280px]"
      >
        {label}
        <ArrowRight
          size={18}
          aria-hidden="true"
          className="transition-transform duration-300 ease-out group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}
