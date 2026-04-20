"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import { myWishlist, removeWishlist, type WishlistItem } from "../../lib/account";

export default function WishlistPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    myWishlist(token)
      .then((res) => {
        if (cancelled) return;
        setItems(res);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load wishlist");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Log in to save favorites.</p>
          <Link
            href="/login?next=/wishlist"
            className="mt-6 inline-flex rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Your saved costumes, ready when you are.</p>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[320px] animate-pulse rounded-3xl border border-black/5 bg-white dark:border-white/10 dark:bg-zinc-950"
            />
          ))
        ) : items.length ? (
          items.map((it) => {
            const c = it.Costume;
            const img = c?.CostumeImages?.find((i) => i.is_primary)?.image_url || c?.CostumeImages?.[0]?.image_url || "";
            return (
              <div
                key={it.id}
                className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
              >
                <div className="aspect-[4/3] bg-zinc-100 dark:bg-white/5">
                  {img ? <img src={resolveApiAsset(img)} alt={c?.name || "Costume"} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold tracking-tight">{c?.name || `Costume #${it.costume_id}`}</div>
                      <div className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                        {[c?.category, c?.theme, c?.size].filter(Boolean).join(" · ") || "Costume"}
                      </div>
                    </div>
                    <Link
                      href={`/costumes/${it.costume_id}`}
                      className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
                    >
                      View
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await removeWishlist(token, it.costume_id);
                        setItems((xs) => xs.filter((x) => x.id !== it.id));
                      } catch {}
                    }}
                    className="mt-4 w-full rounded-2xl border border-black/10 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-3xl border border-black/5 bg-white p-8 text-center text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
            Your wishlist is empty.
          </div>
        )}
      </div>
    </div>
  );
}

