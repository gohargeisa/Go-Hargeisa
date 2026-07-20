import Image from "next/image";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image: string;
}) {
  return (
    <section className="relative h-[340px] md:h-[420px] w-full overflow-hidden">
      <Image
        src={image}
        alt={title}
        fill
        priority
        className="object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <span className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur-sm">
          {eyebrow}
        </span>

        <h1 className="mt-5 font-display text-5xl md:text-6xl font-bold drop-shadow-lg">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}