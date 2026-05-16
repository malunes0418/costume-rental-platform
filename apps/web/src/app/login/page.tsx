"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ExclamationTriangleIcon,
  EyeClosedIcon as EyeOff,
  EyeOpenIcon as Eye,
  UpdateIcon as Loader,
} from "@radix-ui/react-icons";

import { GoogleAuthLink } from "@/components/auth/GoogleAuthLink";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDefaultPostLoginPath, resolvePostLoginPath } from "../../lib/authRedirects";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function LoginPage() {
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [next, setNext] = useState("/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("next") || "/");

    const error = params.get("oauthError");
    if (!error) return;

    setOauthError(error);
    toast.error(error);
    params.delete("oauthError");
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login");
  }, [router]);

  useEffect(() => {
    if (isAuthLoading || !user) return;
    router.replace(getDefaultPostLoginPath(user));
  }, [isAuthLoading, router, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const authUser = await login(email.trim(), password);
      toast.success("Welcome back.");
      await new Promise((resolve) => setTimeout(resolve, 400));
      router.replace(resolvePostLoginPath(authUser, next));
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Login failed");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between border-r border-border bg-muted/30 px-12 py-16">
        <div className="flex flex-1 items-center">
          <div className="space-y-6">
            <p className="font-playfair text-4xl font-semibold leading-tight text-foreground xl:text-5xl">
              Your wardrobe,
              <br />
              elevated.
            </p>
            <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
              Access your reservations, saved costumes, and booking history - all in one place.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <BrandLogo size="sm" />
          <span>Copyright {new Date().getFullYear()}</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16 lg:py-0">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="mb-10 space-y-2">
            <h1 className="font-playfair text-4xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Log in to your account to continue.</p>
          </div>

          {oauthError ? (
            <Alert variant="destructive" className="mb-6 border-destructive/40">
              <ExclamationTriangleIcon />
              <AlertTitle>Google sign-in failed</AlertTitle>
              <AlertDescription>{oauthError}</AlertDescription>
            </Alert>
          ) : null}

          <GoogleAuthLink
            id="google-login-btn"
            intent="login"
            label="Continue with Google"
            className="mb-8"
          />

          <div className="relative mb-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="login-email"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="h-12 rounded-sm border-border bg-transparent text-foreground placeholder:text-muted-foreground/50 focus-visible:border-foreground/30 focus-visible:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="login-password"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="........"
                  className="h-12 rounded-sm border-border bg-transparent pr-12 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-foreground/30 focus-visible:ring-0"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader className="size-3.5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
