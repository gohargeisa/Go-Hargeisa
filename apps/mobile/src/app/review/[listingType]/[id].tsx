/**
 * Write / edit a review — mirrors components/shared/review-form.tsx's exact
 * fields and behavior: star rating, optional title, required comment,
 * optional visit date. Text-only (no photo upload — see lib/reviews.ts's
 * comment). One review per user per listing; this screen derives create-vs-
 * edit from useMyReview's result, same as the website's `existingReview`
 * prop, rather than a separate route param.
 */
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import {
  ReviewSubmitError,
  useDeleteReview,
  useMyReview,
  useSubmitReview,
  useUpdateReview,
  type ReviewListingType,
} from "@/lib/reviews";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Button, Card, Input, Screen, Skeleton } from "@/ui";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function ReviewScreen() {
  const { listingType, id, slug } = useLocalSearchParams<{
    listingType: ReviewListingType;
    id: string;
    slug: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const myReview = useMyReview(listingType, id);
  const submitReview = useSubmitReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  // `existing` (the signed-in user's own review, if any) arrives
  // asynchronously from useMyReview — these are edit OVERRIDES layered on
  // top of it rather than state synced from it via an effect (React advises
  // against setState-in-effect for exactly this "derive initial state from
  // an async prop" case; it also causes an extra render pass).
  const [ratingOverride, setRatingOverride] = useState<number | null>(null);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [commentOverride, setCommentOverride] = useState<string | null>(null);
  const [visitDateOverride, setVisitDateOverride] = useState<Date | null | undefined>(undefined);
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = myReview.data;
  const rating = ratingOverride ?? existing?.rating ?? 5;
  const title = titleOverride ?? existing?.title ?? "";
  const comment = commentOverride ?? existing?.comment ?? "";
  const visitDate =
    visitDateOverride !== undefined
      ? visitDateOverride
      : existing?.visitDate
        ? new Date(`${existing.visitDate}T00:00:00`)
        : null;

  const close = () => (router.canDismiss() ? router.dismiss() : router.replace("/"));

  const isPending = submitReview.isPending || updateReview.isPending;

  function onSubmit() {
    setError(null);
    if (!comment.trim()) {
      setError(t("review.commentRequired", "Please write a comment."));
      return;
    }

    const shared = {
      rating,
      title: title || undefined,
      comment,
      visitDate: visitDate ? toIsoDate(visitDate) : undefined,
    };

    const onError = (err: unknown) => {
      const message =
        err instanceof ReviewSubmitError ? err.message : t("review.somethingWentWrong", "Something went wrong.");
      setError(message);
    };

    if (existing) {
      updateReview.mutate(
        { ...shared, reviewId: existing.id, listingType, listingId: id, slug },
        { onSuccess: close, onError },
      );
    } else {
      submitReview.mutate({ ...shared, listingType, listingId: id, slug }, { onSuccess: close, onError });
    }
  }

  function onDelete() {
    if (!existing) return;
    Alert.alert(t("review.editReview", "Edit review"), t("review.deleteReviewConfirm", "Delete your review permanently? This can't be undone."), [
      { text: t("common.cancel", "Cancel"), style: "cancel" },
      {
        text: t("review.deleteReview", "Delete"),
        style: "destructive",
        onPress: () =>
          deleteReview.mutate(
            { reviewId: existing.id, listingType, listingId: id, slug },
            { onSuccess: close, onError: (err) => setError(err instanceof ReviewSubmitError ? err.message : t("review.somethingWentWrong", "Something went wrong.")) },
          ),
      },
    ]);
  }

  if (myReview.isPending) {
    return (
      <Screen scroll>
        <View style={{ gap: 12 }}>
          <Skeleton height={28} width="60%" />
          <Skeleton height={48} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.section }}>
        <AppText variant="display">
          {existing ? t("review.editReview", "Edit review") : t("review.leaveReview", "Leave a review")}
        </AppText>
        <Pressable onPress={close} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Pressable key={i} onPress={() => setRatingOverride(i + 1)} hitSlop={6}>
              <Ionicons
                name={i < rating ? "star" : "star-outline"}
                size={30}
                color={theme.colors.primary}
              />
            </Pressable>
          ))}
        </View>

        <Input
          label={t("review.reviewTitleLabel", "Review title (optional)")}
          value={title}
          onChangeText={setTitleOverride}
        />
        <Input
          label={t("review.commentPlaceholder", "Share details of your own experience…")}
          value={comment}
          onChangeText={setCommentOverride}
          multiline
          style={{ height: 100, paddingTop: 12, textAlignVertical: "top" }}
        />

        <View>
          <AppText variant="label" color="muted" style={{ marginBottom: 6 }}>
            {t("review.visitDateLabel", "Visit date (optional)")}
          </AppText>
          <Pressable
            onPress={() => setShowDate(true)}
            style={{
              height: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <AppText variant="body" color={visitDate ? "default" : "muted"}>
              {visitDate ? visitDate.toLocaleDateString() : t("common.select", "Select")}
            </AppText>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>
        {showDate ? (
          <DateTimePicker
            value={visitDate ?? new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(_e, selected) => {
              setShowDate(false);
              if (selected) setVisitDateOverride(selected);
            }}
          />
        ) : null}

        {error ? (
          <Card style={{ backgroundColor: theme.colors.background, borderColor: "#DC2626" }}>
            <AppText variant="caption" style={{ color: "#DC2626" }}>
              {error}
            </AppText>
          </Card>
        ) : null}

        <Button
          label={existing ? t("review.saveChanges", "Save Changes") : t("review.submitReview", "Submit Review")}
          onPress={onSubmit}
          loading={isPending}
        />
        {existing ? (
          <Button
            label={t("review.deleteReview", "Delete")}
            onPress={onDelete}
            variant="ghost"
            loading={deleteReview.isPending}
          />
        ) : null}
      </View>
    </Screen>
  );
}
