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
    <section className="relative h-[50vh] w-full overflow-hidden md:h-[60vh] lg:h-[70vh]">
      <Image
        src={image}
        alt={title}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />

      {/* Dark overlay for readability (50% opacity, within the 40-60% target range) */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center text-white animate-fadeUp">
        <span className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur-sm">
          {eyebrow}
        </span>

        <h1 className="mt-5 font-display text-4xl font-bold drop-shadow-lg sm:text-5xl md:text-6xl">
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