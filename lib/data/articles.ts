import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapArticle } from "./mappers";
import { articles as mockArticles } from "@/lib/mock-data";
import type { Article } from "@/types";

export async function getArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) return mockArticles;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, profiles(full_name)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("getArticles:", error.message);
    return [];
  }
  return (data ?? []).map((row: any) => mapArticle(row, row.profiles?.full_name ?? "Go Hargeisa Editorial"));
}

type ArticleWithBody = Article & { body: string };

async function _getArticleBySlug(slug: string): Promise<ArticleWithBody | null> {
  if (!isSupabaseConfigured()) {
    const article = mockArticles.find((a) => a.slug === slug);
    return article ? { ...article, body: article.excerpt } : null;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, profiles(full_name)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return { ...mapArticle(data, data.profiles?.full_name ?? "Go Hargeisa Editorial"), body: data.body };
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getArticleBySlug = cache(_getArticleBySlug);

export async function getAllArticleSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return mockArticles.map((a) => a.slug);
  const supabase = createPublicClient();
  const { data } = await supabase.from("articles").select("slug").eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}
