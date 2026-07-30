"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  const { error } = await supabase
    .from("site_announcements")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

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
