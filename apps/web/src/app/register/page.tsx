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
import { Sparkle } from "@/components/brand/Sparkle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getDefaultPostLoginPath } from "../../lib/authRedirects";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const TRUST_POINTS = [
  { label: "Browse free", detail: "No credit card required to explore the collection" },
  { label: "Save anything", detail: "Wishlist costumes and come back when you're ready" },
  { label: "Book fast", detail: "Reserve in minutes — cancel anytime before pickup" },
] as const;

const FLOATING_TAGS = [
  { label: "Fantasy", className: "left-[5%] top-[6%] rotate-[10deg]" },
  { label: "Theatrical", className: "right-[5%] top-[10%] -rotate-[8deg]" },
  { label: "Sci-Fi", className: "right-[18%] top-[28%] rotate-[6deg]" },
] as const;

export default function RegisterPage() {
  const { register } = useAuth();
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const authUser = await register(email.trim(), password, name.trim() || undefined);
      toast.success("Account created — welcome to SnapCos.");
      router.replace(getDefaultPostLoginPath(authUser));
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Registration failed");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-stage-shell flex flex-1 flex-col overflow-hidden">
      <div className="hero-curtain hero-curtain-left opacity-50" aria-hidden="true" />
      <div className="hero-curtain hero-curtain-right opacity-50" aria-hidden="true" />
      <div className="login-stage-spotlight login-stage-spotlight--right" aria-hidden="true" />
      <div className="hero-spotlight-sweep opacity-20" aria-hidden="true" />

      <div className="relative z-10 flex flex-1 flex-col lg:flex-row">
        <main className="order-2 flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:order-1 lg:py-14">
          <div className="w-full max-w-[26rem]">
            <div className="mb-8 text-center lg:hidden">
              <p className="costume-act-label flex items-center justify-center gap-2">
                <Sparkle size="sm" animated={false} />
                Casting call
              </p>
              <p className="mt-3 font-display text-2xl font-semibold text-foreground">
                Create account
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
                <p className="costume-act-label">Join the cast</p>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                  Create account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Start renting extraordinary costumes today.
                </p>
              </div>

              <p className="text-center text-sm text-muted-foreground lg:hidden">
                Join SnapCos and start renting extraordinary costumes.
              </p>

              {oauthError ? (
                <Alert variant="destructive" className="mt-6 border-destructive/40">
                  <ExclamationTriangleIcon />
                  <AlertTitle>Google sign-in failed</AlertTitle>
                  <AlertDescription>{oauthError}</AlertDescription>
                </Alert>
              ) : null}

              <GoogleAuthLink
                id="google-register-btn"
                intent="register"
                label="Register with Google"
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
                    htmlFor="register-name"
                    className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Full name
                  </Label>
                  <Input
                    id="register-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    className="login-field text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="register-email"
                    className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="register-email"
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
                    htmlFor="register-password"
                    className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
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
                  <p className="text-[0.625rem] text-muted-foreground">Use at least 8 characters.</p>
                </div>

                <Button
                  id="register-submit-btn"
                  type="submit"
                  disabled={isSubmitting || !email.trim() || !password.trim()}
                  className="mt-1 h-12 w-full rounded-xl text-xs font-semibold uppercase tracking-[0.18em] shadow-coral shadow-coral-hover hover-snap"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="size-3.5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>

                <p className="text-center text-[0.625rem] leading-relaxed text-muted-foreground">
                  By creating an account, you agree to our{" "}
                  <Link href="#" className="underline underline-offset-4 hover:text-foreground">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="underline underline-offset-4 hover:text-foreground">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>

              <p className="mt-7 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </main>

        <aside
          className="login-backstage login-backstage--right order-1 lg:order-2"
          aria-label="Why join"
        >
          <div
            className="login-backstage-curtain login-backstage-curtain--right"
            aria-hidden="true"
          />

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
              className="hero-sparkle hero-sparkle-a absolute left-[16%] top-[72%] text-accent"
            />
            <Sparkle
              size="sm"
              className="hero-sparkle hero-sparkle-b absolute right-[20%] top-[78%] opacity-80"
            />
          </div>

          <div className="login-backstage-content">
            <p className="costume-act-label flex items-center gap-2">
              <Sparkle size="sm" animated={false} />
              Act II — Curtain rises
            </p>

            <h2 className="mt-5 font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              Wear something
              <br />
              <span className="hero-character-word inline-block text-primary">extraordinary.</span>
            </h2>

            <p className="mt-5 max-w-[22rem] text-base leading-relaxed text-muted-foreground">
              Premium costumes for parties, shoots, cosplay nights, and opening night — yours to rent.
            </p>

            <ul className="mt-10 space-y-5">
              {TRUST_POINTS.map((point, i) => (
                <li
                  key={point.label}
                  className={cn("login-perk", i > 0 && "animate-fade-up")}
                  style={i > 0 ? { animationDelay: `${i * 80}ms` } : undefined}
                >
                  <span className="login-perk-icon login-perk-icon--gold" aria-hidden="true">
                    <CheckIcon className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{point.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {point.detail}
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
      </div>

      <div className="hero-stage-line" aria-hidden="true" />
      <div className="hero-stage-glow opacity-60" aria-hidden="true" />
    </div>
  );
}
