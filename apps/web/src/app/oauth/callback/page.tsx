"use client";

import { UpdateIcon as Loader } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { getDefaultPostLoginPath } from "../../../lib/authRedirects";
import { useAuth } from "../../../lib/auth";

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
        <BrandLogo priority size="lg" />
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
