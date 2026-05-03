"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import { myWishlist, removeWishlist, type WishlistItem } from "../../lib/account";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ExclamationTriangleIcon as AlertCircle, HeartIcon as Heart, Cross1Icon as Trash2, EyeOpenIcon as Eye } from "@radix-ui/react-icons";

export default function WishlistPage() {
  const { token } = useAuth();
  const [items, setItems]     = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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
      .then((res) => { if (!cancelled) setItems(res); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load wishlist"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Card className="border border-border bg-card shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="display text-foreground">
              Wishlist
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Log in to save favorites.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full text-primary-foreground border-0 bg-primary hover:bg-primary/90">
              <Link href="/login?next=/wishlist">Log in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Heart className="size-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tight display text-foreground">
              Wishlist
            </h1>
            {!isLoading && items.length > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold bg-primary/10 text-primary border-primary/30"
              >
                {items.length}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your saved costumes, ready when you are.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 border-destructive/30 bg-destructive/10">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-destructive text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border border-border bg-card rounded-2xl">
              <Skeleton className="w-full rounded-none bg-muted aspect-4/3" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-3/4 bg-muted" />
                <Skeleton className="h-3 w-2/5 bg-muted" />
              </CardContent>
            </Card>
          ))
        ) : items.length ? (
          items.map((it) => {
            const c = it.Costume;
            const img = c?.CostumeImages?.find((i) => i.is_primary)?.image_url || c?.CostumeImages?.[0]?.image_url || "";
            const tags = [c?.category, c?.theme, c?.size].filter(Boolean);

            return (
              <Card
                key={it.id}
                className="group overflow-hidden border border-border bg-card rounded-2xl transition-all duration-250 hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
              >
                <div className="relative w-full overflow-hidden bg-muted aspect-4/3">
                  {img ? (
                    <img
                      src={resolveApiAsset(img)}
                      alt={c?.name || "Costume"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                      <Heart className="size-12" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold tracking-tight text-foreground display">
                        {c?.name || `Costume #${it.costume_id}`}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {tags.join(" · ") || "Costume"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="shrink-0 size-8 rounded-lg hover:bg-muted text-muted-foreground">
                      <Link href={`/costumes/${it.costume_id}`} aria-label="View costume">
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await removeWishlist(token, it.costume_id);
                        setItems((xs) => xs.filter((x) => x.id !== it.id));
                      } catch { /* silent */ }
                    }}
                    className="mt-4 w-full rounded-xl border-border bg-transparent text-sm font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground gap-2"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full rounded-3xl border border-border bg-card p-16 text-center">
            <div className="mb-4 flex justify-center text-muted-foreground/30">
              <Heart className="size-16" />
            </div>
            <p className="text-[1.05rem] text-muted-foreground display">
              Your wishlist is empty.
            </p>
            <Button asChild className="mt-6 rounded-full text-primary-foreground border-0 bg-primary hover:bg-primary/90">
              <Link href="/">Browse Costumes</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
