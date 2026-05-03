"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { EyeOpenIcon as Eye, EyeClosedIcon as EyeOff, UpdateIcon as Loader2 } from "@radix-ui/react-icons";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [next, setNext] = useState("/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      toast.success("Login successful! Welcome back.");
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push(next);
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Login failed");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(200,155,60,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="animate-fade-up relative z-10 w-full max-w-[420px]">
        {/* Card */}
        <Card className="border shadow-[0_24px_80px_rgba(0,0,0,0.5)] bg-card border-border rounded-3xl">
          {/* Logo */}
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-[1.75rem] font-black display text-foreground">
              Welcome back
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Log in to save favorites and book costumes.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Google OAuth */}
            <a
              href={googleHref}
              id="google-login-btn"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-border/80 hover:bg-secondary"
            >
              {/* Google icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Continue with Google
            </a>

            {/* Divider */}
            <div className="relative my-6 flex items-center gap-4 text-[0.78rem] uppercase tracking-widest text-muted-foreground before:h-px before:flex-1 before:bg-gradient-to-r before:from-transparent before:to-border after:h-px after:flex-1 after:bg-gradient-to-l after:from-transparent after:to-border">
              or
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="login-email"
                  className="text-[0.8rem] font-medium uppercase tracking-[0.03em] text-muted-foreground"
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
                  className="rounded-xl border-border bg-muted text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="login-password"
                  className="text-[0.8rem] font-medium uppercase tracking-[0.03em] text-muted-foreground"
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
                    className="rounded-xl border-border bg-muted text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary pr-12"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>



              <Button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-xl py-5 text-[0.9rem] font-semibold text-primary-foreground disabled:opacity-60 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Logging in…
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pt-0">
            <p className="text-center text-[0.83rem] text-muted-foreground">
              New here?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Create an account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
