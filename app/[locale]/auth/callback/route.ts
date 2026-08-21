import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { defaultPostLoginPath } from "@/lib/utils/post-login-redirect";

// Supabase email confirmations, magic links, and OAuth redirects all land
// here with a `code` param. Exchanging it sets the session cookie, then we
// send the person on to wherever they were headed — an explicit `next`
// (set when a protected page bounced them to /auth/login) is always
// honored as-is; otherwise the destination is resolved by the just-signed-
// in account's role (see defaultPostLoginPath), same as the password-login
// path in components/shared/auth-form.tsx.
export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const explicitNext = requestedNext?.startsWith(`/${params.locale}/`) ? requestedNext : null;

  let next = explicitNext ?? `/${params.locale}/dashboard`;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL(`${origin}/${params.locale}/auth/login`);
      loginUrl.searchParams.set("error", "auth_failed");
      if (requestedNext) loginUrl.searchParams.set("next", requestedNext);
      return NextResponse.redirect(loginUrl);
    }

    if (!explicitNext && data.user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      next = defaultPostLoginPath(params.locale, profile?.role ?? null);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
