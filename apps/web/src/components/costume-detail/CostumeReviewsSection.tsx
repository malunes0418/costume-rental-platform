"use client";

import { StarFilledIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { resolveApiAsset } from "@/lib/assets";
import type { Review } from "@/lib/costumes";

function StarRating({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarFilledIcon
          key={star}
          className={cn("size-3.5", star <= rounded ? "text-primary" : "text-muted-foreground/25")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface CostumeReviewsSectionProps {
  reviews: Review[];
  avgRating: number | null;
  ratingCount: number;
  starDistribution: number[];
  highRatingPercent: number | null;
  formatReviewDate: (value?: string) => string | null;
  reviewerInitials: (name?: string | null) => string;
}

export function CostumeReviewsSection({
  reviews,
  avgRating,
  ratingCount,
  starDistribution,
  highRatingPercent,
  formatReviewDate,
  reviewerInitials
}: CostumeReviewsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {avgRating ? (
          <div className="costume-rating-spotlight rounded-2xl px-6 py-5 text-right">
            <p className="font-display text-5xl font-semibold tabular-nums text-foreground">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} className="mt-2 justify-end" />
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              from {ratingCount} review{ratingCount === 1 ? "" : "s"}
            </p>
          </div>
        ) : null}
      </div>

      {reviews.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <div className="panel-card space-y-4 p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Breakdown</p>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starDistribution[star - 1];
                const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;

                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-7 shrink-0 tabular-nums text-muted-foreground">{star}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="rating-bar-fill h-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-7 shrink-0 text-right tabular-nums text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
            {highRatingPercent !== null ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {highRatingPercent}% rated 4 stars or higher.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {reviews.map((review) => {
              const reviewDate = formatReviewDate(review.created_at);

              return (
                <article key={review.id} className="panel-card p-5">
                  <div className="flex items-start gap-3">
                    {review.User?.avatar_url ? (
                      <img
                        src={resolveApiAsset(review.User.avatar_url)}
                        alt=""
                        className="size-10 shrink-0 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground ring-2 ring-border">
                        {reviewerInitials(review.User?.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{review.User?.name || "Guest"}</p>
                        <StarRating rating={review.rating} />
                      </div>
                      {reviewDate ? (
                        <p className="mt-1 text-xs text-muted-foreground">{reviewDate}</p>
                      ) : null}
                      {review.comment ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="panel-card border-dashed px-6 py-14 text-center">
          <StarFilledIcon className="mx-auto mb-3 size-9 text-accent animate-sparkle" aria-hidden="true" />
          <p className="font-display text-xl font-semibold text-foreground">Curtain hasn&apos;t risen yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Be the first renter to leave a review after your reservation wraps.
          </p>
        </div>
      )}
    </div>
  );
}
