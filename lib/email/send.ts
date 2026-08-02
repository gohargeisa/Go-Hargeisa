/**
 * Thin wrapper around the Resend HTTP API (https://resend.com) — plain
 * `fetch`, no SDK dependency. Safe no-op (logs in dev, silent in prod) when
 * RESEND_API_KEY isn't set, matching this codebase's existing
 * isSupabaseConfigured()-style graceful-degradation pattern: every email
 * call site stays a normal, non-blocking best-effort step rather than a
 * hard requirement, so nothing breaks in an environment that hasn't
 * configured email yet.
 */
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Go Hargeisa <notifications@gohargeisa.com>";

export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[email:skipped, no RESEND_API_KEY] to=${input.to} subject="${input.subject}"`);
    }
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to: input.to, subject: input.subject, html: input.html }),
    });
    if (!res.ok && process.env.NODE_ENV === "development") {
      console.warn("sendEmail failed:", res.status, await res.text());
    }
  } catch (err) {
    // Best-effort — an email failure must never block the booking/review/
    // verification/announcement action that triggered it.
    if (process.env.NODE_ENV === "development") console.warn("sendEmail error:", err);
  }
}
