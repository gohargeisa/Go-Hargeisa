/**
 * Reviews — direct supabase-js reads/writes, same architecture as
 * lib/profile.ts. Unlike bookings/reservations/orders, review CRUD on the
 * website is NOT an RPC (lib/actions/content.ts's submitReview/updateReview/
 * deleteReview are plain authenticated `.insert()`/`.update()`/`.delete()`
 * calls, RLS-scoped to `user_id = auth.uid()`) — so there is no RPC to
 * reuse here; a direct table op is the only architecture-consistent option.
 *
 * Scoped to the four verticals with native screens today
 * (city_service/restaurant/cafe/hotel) — matches PolymorphicListingType's
 * values for those four exactly (see types/index.ts on the website).
 * Text-only: no photo upload in this v1 (hotels are the only vertical with
 * it on the website, and it needs a new image-picker dependency + Storage
 * upload code that doesn't exist in the native app yet — deferred).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/supabase-provider";

export type ReviewListingType = "city_service" | "restaurant" | "cafe" | "hotel";

export interface MyReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  visitDate: string | null;
}

export class ReviewSubmitError extends Error {}

/** The signed-in visitor's own review for this listing, if any — mirrors
 *  getMyReviewForListing on the website exactly, switching the UI from
 *  "leave a review" to "edit your review" (one-review-per-user-per-listing
 *  constraint, same as the web). Disabled entirely when signed out. */
export function useMyReview(listingType: ReviewListingType, listingId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-review", listingType, listingId, user?.id],
    enabled: Boolean(user?.id && listingId),
    queryFn: async (): Promise<MyReview | null> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, title, comment, visit_date")
        .eq("user_id", user!.id)
        .eq("listing_type", listingType)
        .eq("listing_id", listingId as string)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        rating: data.rating,
        title: data.title,
        comment: data.comment ?? "",
        visitDate: data.visit_date,
      };
    },
  });
}

export interface SubmitReviewInput {
  listingType: ReviewListingType;
  listingId: string;
  rating: number;
  title?: string;
  comment: string;
  visitDate?: string;
  /** Pass to invalidate the right cached listing-detail query afterwards —
   *  see the shared invalidation helper below. */
  slug: string;
}

function invalidateAfterReviewChange(queryClient: ReturnType<typeof useQueryClient>, slug: string) {
  // The four listing-detail query keys differ in shape (["city-service",
  // locale, slug], ["restaurant", slug], ...) — matching by "does this key
  // contain the slug" covers all of them without hardcoding four separate
  // invalidations that would drift if a query key ever changes shape.
  queryClient.invalidateQueries({
    predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes(slug),
  });
}

export function useSubmitReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitReviewInput): Promise<void> => {
      if (!user) throw new ReviewSubmitError("Please sign in to leave a review.");
      if (input.rating < 1 || input.rating > 5) throw new ReviewSubmitError("Rating must be between 1 and 5.");

      const { error } = await supabase.from("reviews").insert({
        listing_type: input.listingType,
        listing_id: input.listingId,
        user_id: user.id,
        rating: input.rating,
        comment: input.comment,
        title: input.title || null,
        visit_date: input.visitDate || null,
      } as never);

      if (error) {
        if (error.code === "23505") {
          throw new ReviewSubmitError("You've already reviewed this listing — edit your existing review instead.");
        }
        throw new ReviewSubmitError(error.message);
      }
    },
    onSuccess: (_data, vars) => {
      invalidateAfterReviewChange(queryClient, vars.slug);
      queryClient.invalidateQueries({ queryKey: ["my-review", vars.listingType, vars.listingId] });
    },
  });
}

export interface UpdateReviewInput {
  reviewId: string;
  rating: number;
  title?: string;
  comment: string;
  visitDate?: string;
  listingType: ReviewListingType;
  listingId: string;
  slug: string;
}

export function useUpdateReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateReviewInput): Promise<void> => {
      if (!user) throw new ReviewSubmitError("Please sign in to edit your review.");
      if (input.rating < 1 || input.rating > 5) throw new ReviewSubmitError("Rating must be between 1 and 5.");

      const { error } = await supabase
        .from("reviews")
        .update({
          rating: input.rating,
          comment: input.comment,
          title: input.title || null,
          visit_date: input.visitDate || null,
        } as never)
        .eq("id", input.reviewId)
        .eq("user_id", user.id);

      if (error) throw new ReviewSubmitError(error.message);
    },
    onSuccess: (_data, vars) => {
      invalidateAfterReviewChange(queryClient, vars.slug);
      queryClient.invalidateQueries({ queryKey: ["my-review", vars.listingType, vars.listingId] });
    },
  });
}

export interface DeleteReviewInput {
  reviewId: string;
  listingType: ReviewListingType;
  listingId: string;
  slug: string;
}

export function useDeleteReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeleteReviewInput): Promise<void> => {
      if (!user) throw new ReviewSubmitError("Please sign in.");
      const { error } = await supabase.from("reviews").delete().eq("id", input.reviewId).eq("user_id", user.id);
      if (error) throw new ReviewSubmitError(error.message);
    },
    onSuccess: (_data, vars) => {
      invalidateAfterReviewChange(queryClient, vars.slug);
      queryClient.invalidateQueries({ queryKey: ["my-review", vars.listingType, vars.listingId] });
    },
  });
}
