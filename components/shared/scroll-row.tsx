import type { ReactNode } from "react";

export function ScrollRow({ children }: { children: ReactNode }) {
  return (
    // Cards keep a min-width (e.g. min-w-[288px]) so they read as fixed-size
    // cards while horizontally scrolling below md:. Once this switches to a
    // real grid at md:, that same min-width would force each column wider
    // than its track (grid-cols-3's minmax(0,1fr) can shrink the TRACK, but
    // not a child that explicitly demands more) — overflowing the container
    // at exactly the width where 3 columns of a 288px-min card don't fit
    // (roughly 768–1023px). md:[&>*]:min-w-0 neutralizes that min-width only
    // once grid mode is active, letting the grid's own column sizing take
    // over instead.
    <div className="flex items-stretch gap-4 overflow-x-auto pb-3 -mx-5 px-5 sm:gap-5 md:mx-0 md:grid md:grid-cols-3 md:items-stretch md:px-0 lg:grid-cols-4 md:overflow-visible md:[&>*]:min-w-0 scrollbar-none">
      {children}
    </div>
  );
}
