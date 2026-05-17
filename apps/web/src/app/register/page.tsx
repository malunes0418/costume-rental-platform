"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
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
import { getDefaultPostLoginPath } from "../../lib/authRedirects";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const TRUST_POINTS = [
  "Browse without needing a card",
  "Save looks and compare later",
  "Move from wishlist to booking quickly",
];

export default function RegisterPage() {
  const { register, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("oauthError");
    if (!error) return;

    setOauthError(error);
    toast.error(error);
    params.delete("oauthError");
    const query = params.toString();
    router.replace(query ? `/register?${query}` : "/register");
  }, [router]);

  useEffect(() => {
    if (isAuthLoading || !user) return;
    router.replace(getDefaultPostLoginPath(user));
  }, [isAuthLoading, router, user]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const authUser = await register(email.trim(), password, name.trim() || undefined);
      toast.success("Account created - welcome to SnapCos.");
      router.replace(getDefaultPostLoginPath(authUser));
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Registration failed");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 bg-background px-6 py-10 md:py-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="surface-panel order-2 rounded-[var(--radius-xl)] p-6 md:p-8 lg:order-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Create account
            </p>
            <h1 className="mt-3 font-display text-3xl text-foreground">Join SnapCos</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Set up your customer account in a minute, then start saving and booking costumes with
              a clearer flow.
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
            id="google-register-btn"
            intent="register"
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
                htmlFor="register-name"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Full name
              </Label>
              <Input
                id="register-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="h-12 rounded-[var(--radius-md)] bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="register-email"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="register-email"
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
                htmlFor="register-password"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="register-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Use at least 8 characters"
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
              <p className="text-xs text-muted-foreground">
                Use a password you will remember for future bookings and payment follow-up.
              </p>
            </div>

            <Button
              id="register-submit-btn"
              type="submit"
              variant="brand"
              size="lg"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="mt-2 w-full text-xs font-semibold uppercase tracking-[0.24em]"
            >
              {isSubmitting ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  Creating account
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-center text-xs leading-6 text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Log in
            </Link>
          </p>
        </section>

        <section className="surface-shell order-1 flex flex-col justify-between rounded-[var(--radius-xl)] p-8 md:p-10 lg:order-2">
          <div>
            <BrandLogo size="md" />
            <div className="mt-10 max-w-2xl">
              <div className="brand-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                <span className="inline-block size-1.5 rounded-full bg-gold" />
                Customer onboarding
              </div>
              <h2 className="mt-6 font-display text-4xl text-foreground md:text-5xl lg:text-6xl">
                Start browsing like a customer, not a guest.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                A SnapCos account keeps discovery, wishlist, reservations, and payment follow-up in
                one structured product flow.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {TRUST_POINTS.map((point) => (
                <div
                  key={point}
                  className="rounded-[var(--radius-lg)] border border-border bg-background/75 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-foreground">
                      <CheckIcon className="size-3" />
                    </span>
                    <p className="text-sm leading-6 text-foreground">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Modern SaaS structure, restrained brand warmth
            </p>
            <Link
              href="/login"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-brand)] transition-colors hover:text-foreground"
            >
              Already have access
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
