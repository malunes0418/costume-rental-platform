"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";

export default function OAuthCallbackPage() {
  const { setTokenFromOAuthCallback } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usp = new URLSearchParams(window.location.search);
    const token = usp.get("token");
    if (!token) {
      setError("Missing token.");
      return;
    }
    setTokenFromOAuthCallback(token);
    router.replace("/");
  }, [router, setTokenFromOAuthCallback]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold tracking-tight">Signing you in…</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {error ?? "Finishing your login. You’ll be redirected shortly."}
        </p>
      </div>
    </div>
  );
}

