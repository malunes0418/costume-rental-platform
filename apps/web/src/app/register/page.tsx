"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getDefaultPostLoginPath } from "../../lib/authRedirects";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthLink } from "@/components/auth/GoogleAuthLink";
import { toast } from "sonner";
import {
  EyeOpenIcon as Eye,
  EyeClosedIcon as EyeOff,
  ExclamationTriangleIcon,
  UpdateIcon as Loader,
  CheckIcon
} from "@radix-ui/react-icons";

const TRUST_POINTS = [
  "No credit card required to browse",
  "Save and wishlist any costume",
  "Book in minutes, cancel anytime"
];

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
      toast.success("Account created - welcome to SnapCos.");
      router.replace(getDefaultPostLoginPath(authUser));
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Registration failed");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <div className="flex flex-1 items-center justify-center px-6 py-16 lg:py-0">
        <div className="w-full max-w-[400px] animate-fade-up">
          <Link
            href="/"
            className="mb-10 block font-playfair text-xl font-semibold text-foreground hover:opacity-70 transition-opacity lg:hidden"
          >
            Snap<em>Cos</em>
          </Link>

          <div className="mb-10 space-y-2">
            <h1 className="font-playfair text-4xl font-semibold text-foreground">Create account</h1>
            <p className="text-sm text-muted-foreground">
              Join SnapCos and start renting extraordinary costumes.
            </p>
          </div>

          {oauthError ? (
            <Alert variant="destructive" className="mb-6 border-destructive/40">
              <ExclamationTriangleIcon />
              <AlertTitle>Google sign-in failed</AlertTitle>
              <AlertDescription>{oauthError}</AlertDescription>
            </Alert>
          ) : null}

          <GoogleAuthLink
            id="google-register-btn"
            intent="register"
            label="Register with Google"
            className="mb-8"
          />

          <div className="relative mb-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="register-name"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
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
                className="h-12 rounded-sm border-border bg-transparent text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground/30"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="register-email"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
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
                className="h-12 rounded-sm border-border bg-transparent text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground/30"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="register-password"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
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
                  placeholder="••••••••"
                  className="h-12 rounded-sm border-border bg-transparent pr-12 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground/30"
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
              <p className="text-[10px] text-muted-foreground">Use at least 8 characters.</p>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="size-3.5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>

            <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
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

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between border-l border-border bg-muted/30 px-12 py-16">
        <Link
          href="/"
          className="font-playfair text-xl font-semibold text-foreground hover:opacity-70 transition-opacity"
        >
          Snap<em>Cos</em>
        </Link>

        <div className="space-y-10">
          <div className="space-y-4">
            <p className="font-playfair text-4xl font-semibold leading-tight text-foreground xl:text-5xl">
              Wear something
              <br />
              extraordinary.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground max-w-xs">
              Thousands of premium costumes available for rent - from theatrical period pieces to fantasy ensembles.
            </p>
          </div>

          <ul className="space-y-4">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border border-border text-foreground">
                  <CheckIcon className="size-3" />
                </span>
                <span className="text-sm text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          SnapCos © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
