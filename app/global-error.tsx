"use client";

/**
 * Catches errors thrown above the [locale] segment (root layout, or
 * anything not-yet-localized) — app/[locale]/error.tsx only catches errors
 * inside that segment, so without this file a root-layout crash falls
 * through to Next's raw unstyled default error screen. Must render its own
 * <html>/<body> (it replaces the root layout when active) and can't use
 * next-intl, since that provider lives inside the very layout that failed.
 */
/**
 * Pure inline styles, deliberately — no Tailwind classes, no assumption
 * that globals.css is loaded. This file *replaces* the root layout when
 * active (Next.js requirement for global-error.tsx), so the stylesheet
 * import that normally lives in that same root layout may not have run.
 * Colors are hand-matched to the brand tokens (navy #051427,
 * primary blue #0B5ED7, ease-premium's cubic-bezier) rather than reusing
 * Tailwind's generated classes, since those classes can't be relied on here.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#051427" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              height: "4rem",
              width: "4rem",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "1.25rem",
              background: "rgba(11,94,215,0.16)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
                stroke="#4C82C4"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 style={{ marginTop: "1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>Something went wrong</h1>
          <p style={{ marginTop: "0.5rem", maxWidth: "24rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              borderRadius: "9999px",
              background: "#0B5ED7",
              color: "#fff",
              padding: "0.75rem 1.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 12px 30px rgba(11,94,215,0.35)",
              transition: "transform .2s cubic-bezier(0.16,1,0.3,1), opacity .2s cubic-bezier(0.16,1,0.3,1)",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
