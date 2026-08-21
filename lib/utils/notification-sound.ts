/**
 * A short, subtle two-tone chime for a new incoming notification while the
 * dashboard is open — synthesized with the Web Audio API rather than an
 * audio file (no asset to ship, no network request). Deliberately
 * best-effort: browsers block unprompted audio unless the page has already
 * had a user gesture (a click, in practice, for any dashboard visit) —
 * every failure mode (blocked autoplay, no Web Audio support, a suspended
 * AudioContext) is swallowed silently so a new notification never breaks
 * the dashboard, it just plays no sound that one time.
 */
export function playNotificationSound(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const now = ctx.currentTime;

    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });

    setTimeout(() => void ctx.close().catch(() => {}), 500);
  } catch {
    // Autoplay blocked, no Web Audio support, or a suspended context —
    // never break the dashboard over a sound effect.
  }
}
