import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase email confirmations, magic links, and OAuth redirects all land
// here with a `code` param. Exchanging it sets the session cookie, then we
// send the person on to wherever they were headed (or the dashboard).
export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith(`/${params.locale}/`)
    ? requestedNext
    : `/${params.locale}/dashboard`;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
