"use client";

/**
 * Catches errors thrown above the [locale] segment (root layout, or
 * anything not-yet-localized) — app/[locale]/error.tsx only catches errors
 * inside that segment, so without this file a root-layout crash falls
 * through to Next's raw unstyled default error screen. Must render its own
 * <html>/<body> (it replaces the root layout when active) and can't use
 * next-intl, since that provider lives inside the very layout that failed.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: "0.5rem", maxWidth: "24rem", color: "#6b7280" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: "1.5rem", borderRadius: "9999px", background: "#0f766e", color: "#fff", padding: "0.75rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
