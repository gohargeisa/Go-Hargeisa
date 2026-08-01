"use client";

import { useEffect, useState } from "react";

interface CountdownLabels {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  live: string;
  ended: string;
}

type Phase = "loading" | "before" | "live" | "ended";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diff(targetMs: number, nowMs: number): Remaining {
  const totalSeconds = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Live countdown to `startIso`, switching to a "happening now" state between
 * start and `endIso`, then an "ended" state after. Renders nothing but a
 * fixed-size placeholder on the very first client render (matching the
 * server-rendered markup exactly) and only computes real values inside
 * useEffect — ticking every second would otherwise make the server-rendered
 * HTML and the client's first render disagree the instant they're generated
 * a few hundred ms apart, which React flags as a hydration mismatch.
 */
export function CountdownTimer({
  startIso,
  endIso,
  labels,
}: {
  startIso: string;
  endIso: string;
  labels: CountdownLabels;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [remaining, setRemaining] = useState<Remaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();

    function tick() {
      const now = Date.now();
      if (now >= endMs) {
        setPhase("ended");
      } else if (now >= startMs) {
        setPhase("live");
      } else {
        setPhase("before");
        setRemaining(diff(startMs, now));
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso, endIso]);

  if (phase === "loading") {
    return <div className="h-[92px] sm:h-[104px]" aria-hidden="true" />;
  }

  if (phase === "live" || phase === "ended") {
    return (
      <div
        className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-base font-bold text-white backdrop-blur-md sm:text-lg"
        role="status"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${phase === "live" ? "animate-pulse bg-emerald-400" : "bg-white/50"}`} aria-hidden="true" />
        {phase === "live" ? labels.live : labels.ended}
      </div>
    );
  }

  const units: { value: number; label: string }[] = [
    { value: remaining.days, label: labels.days },
    { value: remaining.hours, label: labels.hours },
    { value: remaining.minutes, label: labels.minutes },
    { value: remaining.seconds, label: labels.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-4" role="timer" aria-live="off">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex w-[64px] flex-col items-center rounded-2xl border border-white/20 bg-white/10 py-3 backdrop-blur-md sm:w-[76px] sm:py-4">
            <span className="font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">{pad(unit.value)}</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 sm:text-[11px]">{unit.label}</span>
          </div>
          {i < units.length - 1 && <span className="text-xl font-bold text-white/30 sm:text-2xl">:</span>}
        </div>
      ))}
    </div>
  );
}
