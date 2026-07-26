import type { ReactNode } from "react";

export function ScrollRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-stretch gap-4 overflow-x-auto pb-3 -mx-5 px-5 sm:gap-5 md:mx-0 md:grid md:grid-cols-3 md:items-stretch md:px-0 lg:grid-cols-4 md:overflow-visible scrollbar-none">
      {children}
    </div>
  );
}
