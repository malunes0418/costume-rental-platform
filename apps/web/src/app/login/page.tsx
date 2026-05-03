"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [next, setNext] = useState("/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push(next);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(200,155,60,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-fade-up"
        style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}
      >
        {/* Card */}
        <div
          style={{
            background: "var(--clr-surface)",
            border: "1px solid var(--clr-border)",
            borderRadius: "var(--radius-xl)",
            padding: "2.5rem",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "2.5rem", display: "block", lineHeight: 1, marginBottom: "0.75rem" }}>
              🎭
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.75rem",
                fontWeight: 900,
                color: "var(--clr-text)",
                margin: 0,
              }}
            >
              Welcome back
            </h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--clr-text-muted)" }}>
              Log in to save favorites and book costumes.
            </p>
          </div>

          {/* Google OAuth */}
          <a
            href={googleHref}
            id="google-login-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--clr-border)",
              background: "var(--clr-surface-2)",
              color: "var(--clr-text)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              transition: "border-color 150ms, background 150ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--clr-border-hover)";
              (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--clr-border)";
              (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-2)";
            }}
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
          <div className="divider-gold" style={{ margin: "1.5rem 0" }}>or</div>

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                htmlFor="login-email"
                style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--clr-text-muted)", marginBottom: "0.4rem", letterSpacing: "0.03em" }}
              >
                EMAIL
              </label>
              <input
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="field-input"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--clr-text-muted)", marginBottom: "0.4rem", letterSpacing: "0.03em" }}
              >
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="field-input"
                  style={{ paddingRight: "3rem" }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--clr-text-dim)",
                    cursor: "pointer",
                    padding: "0.25rem",
                    fontSize: "0.85rem",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(196,16,42,0.1)",
                  border: "1px solid rgba(196,16,42,0.3)",
                  color: "#f87171",
                  fontSize: "0.8rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-crimson"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "0.875rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
              }}
            >
              {isSubmitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Logging in…
                </span>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.83rem", color: "var(--clr-text-muted)" }}>
            New here?{" "}
            <Link
              href="/register"
              style={{ color: "var(--clr-gold-light)", fontWeight: 600, textDecoration: "none" }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
