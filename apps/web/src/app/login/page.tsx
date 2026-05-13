"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EyeOpenIcon as Eye, EyeClosedIcon as EyeOff, UpdateIcon as Loader } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

// ── Google G mark ─────────────────────────────────────────────────────────────

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [next, setNext] = useState("/");

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleHref = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
    return base ? `${base}/api/auth/google` : "#";
  }, []);

  useEffect(() => {
    const usp = new URLSearchParams(window.location.search);
    setNext(usp.get("next") || "/");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back.");
      await new Promise((r) => setTimeout(r, 400));
      router.push(next);
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Login failed");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row">

      {/* ── Left: editorial panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between border-r border-border bg-muted/30 px-12 py-16">
        <Link
          href="/"
          className="font-playfair text-xl font-semibold text-foreground hover:opacity-70 transition-opacity"
        >
          Snap<em>Cos</em>
        </Link>

        <div className="space-y-6">
          <p className="font-playfair text-4xl font-semibold leading-tight text-foreground xl:text-5xl">
            Your wardrobe,<br />elevated.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground max-w-xs">
            Access your reservations, saved costumes, and booking history — all in one place.
          </p>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          SnapCos © {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Right: form ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-16 lg:py-0">
        <div className="w-full max-w-[400px] animate-fade-up">

          {/* Mobile wordmark */}
          <Link
            href="/"
            className="mb-10 block font-playfair text-xl font-semibold text-foreground hover:opacity-70 transition-opacity lg:hidden"
          >
            Snap<em>Cos</em>
          </Link>

          {/* Header */}
          <div className="mb-10 space-y-2">
            <h1 className="font-playfair text-4xl font-semibold text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Log in to your account to continue.
            </p>
          </div>

          {/* Google OAuth */}
          <a
            href={googleHref}
            id="google-login-btn"
            className="mb-8 flex w-full items-center justify-center gap-3 rounded-sm border border-border bg-transparent px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
          >
            <GoogleMark />
            Continue with Google
          </a>

          {/* Divider */}
          <div className="relative mb-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Form */}
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
                className="h-12 rounded-sm border-border bg-transparent text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground/30"
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
                  placeholder="••••••••"
                  className="h-12 rounded-sm border-border bg-transparent pr-12 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground/30"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
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
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="size-3.5 animate-spin" />
                  Logging in…
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
