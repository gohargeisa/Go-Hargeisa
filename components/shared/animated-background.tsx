type Variant = "dark" | "light";

const DEFAULT_BLOBS: Record<Variant, string[]> = {
  dark: ["-top-16 -end-16 h-64 w-64 bg-accent/20", "-bottom-20 -start-10 h-56 w-56 bg-primary-300/20"],
  light: ["-top-20 -end-16 h-72 w-72 bg-primary/15", "-bottom-24 -start-16 h-64 w-64 bg-accent/10"],
};

/**
 * The two-blurred-blob decorative backdrop repeated (with slightly
 * different colors/sizes) in join-final-cta.tsx, newsletter-section.tsx and
 * coming-soon-section.tsx. Pass `blobs` to override the defaults for a
 * one-off palette (e.g. join's white/navy blobs on its darker gradient).
 */
export function AnimatedBackground({ variant = "dark", blobs }: { variant?: Variant; blobs?: string[] }) {
  const shapes = blobs ?? DEFAULT_BLOBS[variant];
  return (
    <>
      {shapes.map((shape, i) => (
        <div key={i} className={`pointer-events-none absolute rounded-full blur-3xl ${shape}`} aria-hidden="true" />
      ))}
    </>
  );
}
