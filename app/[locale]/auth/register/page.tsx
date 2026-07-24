import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Sign In — Go Hargeisa",
};

export default function RegisterPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  redirect(`/${locale}/auth/login`);
}