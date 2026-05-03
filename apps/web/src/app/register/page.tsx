"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email.trim(), password, name.trim() || undefined);
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Registration failed");
    } finally {
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
          background: "radial-gradient(ellipse, rgba(196,16,42,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="animate-fade-up relative z-10 w-full max-w-[420px]">
        <Card
          className="border shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          style={{
            background: "var(--clr-surface)",
            borderColor: "var(--clr-border)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <CardHeader className="pb-4 text-center">
            <div className="mb-3 flex justify-center text-5xl leading-none">🎭</div>
            <CardTitle
              className="text-[1.75rem] font-black"
              style={{ fontFamily: "var(--font-display)", color: "var(--clr-text)" }}
            >
              Create your account
            </CardTitle>
            <CardDescription style={{ color: "var(--clr-text-muted)" }}>
              It only takes a minute.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="register-name"
                  className="text-[0.8rem] font-medium uppercase tracking-[0.03em]"
                  style={{ color: "var(--clr-text-muted)" }}
                >
                  Name
                </Label>
                <Input
                  id="register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  className="rounded-xl border-white/10 bg-[var(--clr-surface-2)] text-[var(--clr-text)] placeholder:text-[var(--clr-text-dim)] focus-visible:ring-[var(--clr-gold)]/30 focus-visible:border-[var(--clr-gold)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="register-email"
                  className="text-[0.8rem] font-medium uppercase tracking-[0.03em]"
                  style={{ color: "var(--clr-text-muted)" }}
                >
                  Email
                </Label>
                <Input
                  id="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="rounded-xl border-white/10 bg-[var(--clr-surface-2)] text-[var(--clr-text)] placeholder:text-[var(--clr-text-dim)] focus-visible:ring-[var(--clr-gold)]/30 focus-visible:border-[var(--clr-gold)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="register-password"
                  className="text-[0.8rem] font-medium uppercase tracking-[0.03em]"
                  style={{ color: "var(--clr-text-muted)" }}
                >
                  Password
                </Label>
                <Input
                  id="register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="rounded-xl border-white/10 bg-[var(--clr-surface-2)] text-[var(--clr-text)] placeholder:text-[var(--clr-text-dim)] focus-visible:ring-[var(--clr-gold)]/30 focus-visible:border-[var(--clr-gold)]"
                />
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="rounded-xl border-red-500/30 bg-red-500/10"
                >
                  <AlertCircle className="size-4" />
                  <AlertDescription style={{ color: "#f87171", fontSize: "0.8rem" }}>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                id="register-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-xl py-5 text-[0.9rem] font-semibold text-white border-0 disabled:opacity-60"
                style={{ background: "var(--clr-crimson)" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pt-0">
            <p className="text-center text-[0.83rem]" style={{ color: "var(--clr-text-muted)" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold hover:underline"
                style={{ color: "var(--clr-gold-light)" }}
              >
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
