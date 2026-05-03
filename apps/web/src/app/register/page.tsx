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
import { ExclamationTriangleIcon as AlertCircle, UpdateIcon as Loader2 } from "@radix-ui/react-icons";
import { toast } from "sonner";

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
      toast.success("Account created successfully!");
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Registration failed");
      toast.error("Failed to create account");
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
          background: "radial-gradient(ellipse, rgba(200,155,60,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="animate-fade-up relative z-10 w-full max-w-[420px]">
        <Card className="border shadow-[0_24px_80px_rgba(0,0,0,0.5)] bg-card border-border rounded-3xl">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-[1.75rem] font-black display text-foreground">
              Create your account
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              It only takes a minute.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="register-name"
                  className="text-[0.8rem] font-medium uppercase tracking-[0.03em] text-muted-foreground"
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
                  className="rounded-xl border-border bg-muted text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="register-email"
                  className="text-[0.8rem] font-medium uppercase tracking-[0.03em] text-muted-foreground"
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
                  className="rounded-xl border-border bg-muted text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="register-password"
                  className="text-[0.8rem] font-medium uppercase tracking-[0.03em] text-muted-foreground"
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
                  className="rounded-xl border-border bg-muted text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="rounded-xl border-destructive/30 bg-destructive/10"
                >
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-destructive text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                id="register-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-xl py-5 text-[0.9rem] font-semibold text-primary-foreground border-0 disabled:opacity-60 bg-primary hover:bg-primary/90"
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
            <p className="text-center text-[0.83rem] text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
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
