import type { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Privacy Policy — Go Hargeisa",
    alternates: { canonical: `/${locale}/privacy` },
  };
}

export default function PrivacyPage() {
  return (
    <section className="container-px mx-auto max-w-3xl py-14 prose prose-neutral dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: July 2026</p>
      <p>
        Go Hargeisa ("we", "our") respects your privacy. This page explains what information we collect
        when you use this website and how it is used.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account information (name, email) when you sign up.</li>
        <li>Reviews, favorites and saved trips you create while signed in.</li>
        <li>Newsletter subscription email addresses.</li>
        <li>Basic usage analytics to help us improve the site.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        We use your information solely to operate Go Hargeisa — personalizing your dashboard, sending the
        newsletter you opted into, and responding to contact form submissions. We do not sell personal data.
      </p>
      <h2>Contact</h2>
      <p>Questions about this policy can be sent to hello@gohargeisa.com.</p>
    </section>
  );
}
