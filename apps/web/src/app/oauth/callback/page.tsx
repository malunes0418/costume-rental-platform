"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../../lib/auth";
import { getDefaultPostLoginPath } from "../../../lib/authRedirects";

export default function OAuthCallbackPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Cookie is already set by the backend redirect — just rehydrate user state
    refreshUser().then((authUser) => router.replace(getDefaultPostLoginPath(authUser)));
  }, [refreshUser, router]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold tracking-tight">Signing you in…</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Finishing your login. You&apos;ll be redirected shortly.
        </p>
      </div>
    </div>
  );
}
