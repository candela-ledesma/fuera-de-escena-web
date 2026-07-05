import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getCategories(supabase: Client) {
  const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");

  if (error) throw error;
  return data;
}

export async function getReviewsByAuthor(supabase: Client, authorId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, title, slug, status, rating, venue, event_date, updated_at")
    .eq("author_id", authorId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReviewBySlugForAuthor(supabase: Client, slug: string, authorId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, title, venue, event_date, category_id, rating, body, slug, status, author_id")
    .eq("slug", slug)
    .eq("author_id", authorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getReviewTagNames(supabase: Client, reviewId: string) {
  const { data, error } = await supabase
    .from("review_tags")
    .select("tags(name)")
    .eq("review_id", reviewId);

  if (error) throw error;
  return data.map((row) => row.tags?.name).filter((name): name is string => Boolean(name));
}

export async function slugExists(supabase: Client, slug: string, excludeReviewId?: string) {
  let query = supabase.from("reviews").select("id").eq("slug", slug);

  if (excludeReviewId) {
    query = query.neq("id", excludeReviewId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function insertReview(
  supabase: Client,
  review: Database["public"]["Tables"]["reviews"]["Insert"],
) {
  const { data, error } = await supabase.from("reviews").insert(review).select("id, slug").single();

  if (error) throw error;
  return data;
}

export async function updateReview(
  supabase: Client,
  reviewId: string,
  review: Database["public"]["Tables"]["reviews"]["Update"],
) {
  const { error } = await supabase.from("reviews").update(review).eq("id", reviewId);

  if (error) throw error;
}

export async function deleteReview(supabase: Client, reviewId: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) throw error;
}

export async function findTagsByName(supabase: Client, names: string[]) {
  if (names.length === 0) return [];

  const { data, error } = await supabase.from("tags").select("id, name").in("name", names);

  if (error) throw error;
  return data;
}

export async function insertTags(supabase: Client, tags: { name: string; slug: string }[]) {
  if (tags.length === 0) return [];

  const { data, error } = await supabase.from("tags").insert(tags).select("id, name");

  if (error) throw error;
  return data;
}

export async function replaceReviewTags(supabase: Client, reviewId: string, tagIds: string[]) {
  const { error: deleteError } = await supabase.from("review_tags").delete().eq("review_id", reviewId);

  if (deleteError) throw deleteError;

  if (tagIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("review_tags")
    .insert(tagIds.map((tagId) => ({ review_id: reviewId, tag_id: tagId })));

  if (insertError) throw insertError;
}
