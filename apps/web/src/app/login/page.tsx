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
import { Sparkle } from "@/components/brand/Sparkle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getDefaultPostLoginPath, resolvePostLoginPath } from "../../lib/authRedirects";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const BACKSTAGE_PERKS = [
  { label: "Saved costumes", detail: "Wishlist and favorites, synced across devices" },
  { label: "Reservations", detail: "Upcoming rentals, receipts, and pickup details" },
  { label: "Vendor tools", detail: "One login for renting and listing" },
] as const;

const FLOATING_TAGS = [
  { label: "Cosplay", className: "left-[5%] top-[6%] -rotate-[12deg]" },
  { label: "Gala", className: "right-[5%] top-[10%] rotate-[9deg]" },
  { label: "Opening night", className: "right-[16%] top-[30%] -rotate-[6deg]" },
] as const;

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
    <div className="login-stage-shell flex flex-1 flex-col overflow-hidden">
      <div className="hero-curtain hero-curtain-left opacity-50" aria-hidden="true" />
      <div className="hero-curtain hero-curtain-right opacity-50" aria-hidden="true" />
      <div className="login-stage-spotlight" aria-hidden="true" />
      <div className="hero-spotlight-sweep opacity-20" aria-hidden="true" />

      <div className="relative z-10 flex flex-1 flex-col lg:flex-row">
        <aside className="login-backstage" aria-label="Welcome">
          <div className="login-backstage-curtain login-backstage-curtain--left" aria-hidden="true" />

          <div className="login-backstage-deco" aria-hidden="true">
            {FLOATING_TAGS.map((tag, i) => (
              <div key={tag.label} className={cn("absolute", tag.className)}>
                <span
                  className={cn(
                    "login-callboard-tag hero-float-tag",
                    `hero-float-tag-${i + 1}`
                  )}
                >
                  {tag.label}
                </span>
              </div>
            ))}

            <Sparkle
              size="lg"
              className="hero-sparkle hero-sparkle-a absolute right-[14%] top-[74%] text-accent"
            />
            <Sparkle
              size="sm"
              className="hero-sparkle hero-sparkle-b absolute left-[18%] top-[80%] opacity-80"
            />
          </div>

          <div className="login-backstage-content">
            <p className="costume-act-label flex items-center gap-2">
              <Sparkle size="sm" animated={false} />
              Act I — House lights down
            </p>

            <h2 className="mt-5 font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              Snap into
              <br />
              <span className="hero-character-word inline-block text-primary">character.</span>
            </h2>

            <p className="mt-5 max-w-[22rem] text-base leading-relaxed text-muted-foreground">
              Your backstage pass to reservations, saved looks, and everything you have booked.
            </p>

            <ul className="mt-10 space-y-5">
              {BACKSTAGE_PERKS.map((perk, i) => (
                <li
                  key={perk.label}
                  className={cn("login-perk", i > 0 && "animate-fade-up")}
                  style={i > 0 ? { animationDelay: `${i * 80}ms` } : undefined}
                >
                  <span className="login-perk-icon" aria-hidden="true">
                    <Sparkle size="sm" animated={false} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{perk.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {perk.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="login-backstage-footer">
            <BrandLogo size="sm" />
            <span>© {new Date().getFullYear()} SnapCos</span>
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:py-14">
          <div className="w-full max-w-[26rem]">
            <div className="mb-8 text-center lg:hidden">
              <p className="costume-act-label flex items-center justify-center gap-2">
                <Sparkle size="sm" animated={false} />
                Backstage entrance
              </p>
              <p className="mt-3 font-display text-2xl font-semibold text-foreground">
                Welcome back
              </p>
            </div>

            <div className="login-ticket-panel animate-fade-up">
              <div
                className="costume-ticket-notch costume-ticket-notch--left hidden sm:block"
                aria-hidden="true"
              />
              <div
                className="costume-ticket-notch costume-ticket-notch--right hidden sm:block"
                aria-hidden="true"
              />

              <div className="hidden space-y-2 lg:block">
                <p className="costume-act-label">Sign in</p>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                  Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                  Log in to pick up where you left off.
                </p>
              </div>

              <p className="text-center text-sm text-muted-foreground lg:hidden">
                Log in to your account to continue.
              </p>

              {oauthError ? (
                <Alert variant="destructive" className="mt-6 border-destructive/40">
                  <ExclamationTriangleIcon />
                  <AlertTitle>Google sign-in failed</AlertTitle>
                  <AlertDescription>{oauthError}</AlertDescription>
                </Alert>
              ) : null}

              <GoogleAuthLink
                id="google-login-btn"
                intent="login"
                label="Continue with Google"
                className={cn("login-google-btn", oauthError ? "mt-4" : "mt-6 lg:mt-8")}
              />

              <div className="relative my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  or email
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="login-email"
                    className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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
                    className="login-field text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="login-password"
                    className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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
                      placeholder="········"
                      className="login-field pr-12 text-foreground placeholder:text-muted-foreground/50"
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
                  disabled={isSubmitting}
                  className="mt-1 h-12 w-full rounded-xl text-xs font-semibold uppercase tracking-[0.18em] shadow-coral shadow-coral-hover hover-snap"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="size-3.5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>

              <p className="mt-7 text-center text-xs text-muted-foreground">
                New here?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>

      <div className="hero-stage-line" aria-hidden="true" />
      <div className="hero-stage-glow opacity-60" aria-hidden="true" />
    </div>
  );
}
