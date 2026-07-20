import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { placeholderImage } from "@/lib/placeholder-image";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "About Go Hargeisa",
  description: "Go Hargeisa is an independent guide to the capital of Somaliland, built for travelers, business visitors and the diaspora.",
    alternates: { canonical: `/${locale}/about` },
  };
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title="About Go Hargeisa"
        image={placeholderImage("About Go Hargeisa", { tone: "primary" })}
      />
      <section className="container-px mx-auto max-w-3xl py-14 prose prose-neutral dark:prose-invert">
        <p>
          Go Hargeisa is an independent tourism guide built to introduce Hargeisa — the capital of
          Somaliland — to international visitors, business travelers, and the global Somali diaspora.
        </p>
        <p>
          We work with local hotels, restaurants, guides and cultural institutions to keep our listings
          accurate, current and genuinely useful, whether you're planning a first visit or looking for a new
          favorite cafe close to home.
        </p>
        <p>
          Have a business you'd like listed, or spotted something out of date? Reach out through our{" "}
          <a href="../contact">contact page</a> — we'd love to hear from you.
        </p>
      </section>
    </>
  );
}
