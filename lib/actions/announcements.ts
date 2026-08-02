"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { announcementEmail } from "@/lib/email/templates";
import type { Locale } from "@/lib/i18n/config";
import { logActivity } from "./activity";

async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") throw new Error("Not authorized.");

  return supabase;
}

export interface AnnouncementInput {
  title: string;
  message: string;
  linkUrl?: string;
  linkLabel?: string;
}

export async function createAnnouncement(locale: string, input: AnnouncementInput): Promise<{ ok: boolean; error?: string }> {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || !message) return { ok: false, error: "Title and message are required." };

  const supabase = await assertOwner();

  const { error } = await supabase.from("site_announcements").insert({
    title,
    message,
    link_url: input.linkUrl?.trim() || null,
    link_label: input.linkLabel?.trim() || null,
    status: "draft",
  } as never);

  if (error) return { ok: false, error: error.message };

  await logActivity("create", "site_announcement");
  revalidatePath(`/${locale}/admin/announcements`);
  return { ok: true };
}

export async function setAnnouncementStatus(
  locale: string,
  id: string,
  status: "draft" | "published" | "archived"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { data: before } = await supabase.from("site_announcements").select("status, title, message").eq("id", id).single();
  const previous = before as { status: string; title: string; message: string } | null;

  const { error } = await supabase
    .from("site_announcements")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // Email broadcast — best-effort, only on a genuine ->published
  // transition, sent to every user who has "Local recommendations & news"
  // (notify_marketing) enabled. Capped at 500 recipients per publish so one
  // announcement can't turn into an unbounded synchronous fan-out.
  if (status === "published" && previous && previous.status !== "published") {
    const { data: optedIn } = await supabase.from("profiles").select("id").eq("notify_marketing", true).limit(500);
    const optedInIds = new Set((optedIn ?? []).map((p) => (p as { id: string }).id));
    if (optedInIds.size > 0) {
      const admin = createAdminClient();
      const { data: page } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const { subject, html } = announcementEmail(locale as Locale, previous.title, previous.message);
      const recipients = (page?.users ?? []).filter((u) => optedInIds.has(u.id) && u.email);
      await Promise.all(recipients.map((u) => sendEmail({ to: u.email!, subject, html })));
    }
  }

  await logActivity(status === "published" ? "publish" : "update", "site_announcement", id, { status });
  revalidatePath(`/${locale}/admin/announcements`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

export async function deleteAnnouncement(locale: string, id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase.from("site_announcements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity("delete", "site_announcement", id);
  revalidatePath(`/${locale}/admin/announcements`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}
