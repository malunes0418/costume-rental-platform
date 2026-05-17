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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDefaultPostLoginPath, resolvePostLoginPath } from "../../lib/authRedirects";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const LOGIN_POINTS = [
  "Review upcoming reservations",
  "Pick up where checkout left off",
  "Keep saved looks close at hand",
];

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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
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
    <div className="flex flex-1 bg-background px-6 py-10 md:py-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="surface-shell flex flex-col justify-between rounded-[var(--radius-xl)] p-8 md:p-10">
          <div>
            <BrandLogo size="md" />
            <div className="mt-10 max-w-2xl">
              <div className="brand-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                <span className="inline-block size-1.5 rounded-full bg-gold" />
                Customer access
              </div>
              <h1 className="mt-6 font-display text-4xl text-foreground md:text-5xl lg:text-6xl">
                Log in and get straight back to the booking flow.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                SnapCos keeps account access simple: reservations, wishlist, and checkout progress
                stay connected in one calmer customer workspace.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {LOGIN_POINTS.map((point) => (
                <div
                  key={point}
                  className="rounded-[var(--radius-lg)] border border-border bg-background/75 p-4"
                >
                  <p className="text-sm leading-6 text-foreground">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Premium rentals, product-grade clarity
            </p>
            <Link
              href="/register"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-brand)] transition-colors hover:text-foreground"
            >
              Create account
            </Link>
          </div>
        </section>

        <section className="surface-panel rounded-[var(--radius-xl)] p-6 md:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Welcome back
            </p>
            <h2 className="mt-3 font-display text-3xl text-foreground">Continue with your account</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use Google for speed or sign in with your email and password.
            </p>
          </div>

          {oauthError ? (
            <Alert variant="destructive" className="mt-6">
              <ExclamationTriangleIcon />
              <AlertTitle>Google sign-in failed</AlertTitle>
              <AlertDescription>{oauthError}</AlertDescription>
            </Alert>
          ) : null}

          <GoogleAuthLink
            id="google-login-btn"
            intent="login"
            label="Continue with Google"
            className="mt-6 rounded-[var(--radius-md)] py-3"
          />

          <div className="relative my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Or use email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label
                htmlFor="login-email"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="login-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="h-12 rounded-[var(--radius-md)] bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="login-password"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="h-12 rounded-[var(--radius-md)] bg-background pr-12"
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

            <Button
              id="login-submit-btn"
              type="submit"
              variant="brand"
              size="lg"
              disabled={isSubmitting}
              className="mt-2 w-full text-xs font-semibold uppercase tracking-[0.24em]"
            >
              {isSubmitting ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  Logging in
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
