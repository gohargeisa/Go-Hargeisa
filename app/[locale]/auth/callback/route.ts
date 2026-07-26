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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL(`${origin}/${params.locale}/auth/login`);
      loginUrl.searchParams.set("error", "auth_failed");
      if (requestedNext) loginUrl.searchParams.set("next", requestedNext);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
