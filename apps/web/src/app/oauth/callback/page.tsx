"use client";

import { UpdateIcon as Loader } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../../lib/auth";
import { getDefaultPostLoginPath } from "../../../lib/authRedirects";

export default function OAuthCallbackPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    refreshUser()
      .then((authUser) => {
        if (!authUser) {
          router.replace("/login?oauthError=Google sign-in could not be completed. Please try again.");
          return;
        }

        router.replace(getDefaultPostLoginPath(authUser));
      })
      .catch(() => {
        router.replace("/login?oauthError=Google sign-in could not be completed. Please try again.");
      });
  }, [refreshUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex animate-fade-up flex-col items-center gap-5 text-center">
        <p className="font-playfair text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Snap<em>Cos</em>
        </p>
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
