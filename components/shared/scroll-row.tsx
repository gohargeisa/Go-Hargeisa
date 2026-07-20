import type { ReactNode } from "react";

export function ScrollRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible scrollbar-none">
      {children}
    </div>
  );
}
