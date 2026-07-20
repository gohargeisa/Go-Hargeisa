import type { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Terms of Service — Go Hargeisa",
    alternates: { canonical: `/${locale}/terms` },
  };
}

export default function TermsPage() {
  return (
    <section className="container-px mx-auto max-w-3xl py-14 prose prose-neutral dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: July 2026</p>
      <p>
        By using Go Hargeisa, you agree to the following terms. Please read them carefully.
      </p>
      <h2>Use of content</h2>
      <p>
        Listing information (hotels, restaurants, attractions, events) is provided for general travel
        planning purposes. Prices, hours and availability should be confirmed directly with the business
        before booking.
      </p>
      <h2>User accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for any
        activity under your account. Reviews you submit must be honest and based on genuine experience.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        Go Hargeisa is provided "as is" without warranties of any kind. We are not liable for losses
        arising from reliance on information found on this site.
      </p>
      <h2>Contact</h2>
      <p>Questions about these terms can be sent to hello@gohargeisa.com.</p>
    </section>
  );
}
