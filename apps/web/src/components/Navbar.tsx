"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";

export function Navbar() {
  const { user, token, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        transition: "background 300ms ease, border-color 300ms ease, box-shadow 300ms ease",
        background: scrolled
          ? "rgba(10,7,8,0.88)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(1.4)" : "none",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.06)" : "transparent"}`,
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "4rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "0.625rem",
              background: "linear-gradient(135deg, #c4102a 0%, #8b0a1c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(196,16,42,0.4)",
              fontSize: "1rem",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            🎭
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.15rem",
              color: "var(--clr-text)",
              letterSpacing: "-0.01em",
            }}
          >
            Costume<span style={{ color: "var(--clr-gold)" }}>Stay</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
          className="hidden-mobile"
          role="navigation"
          aria-label="Main navigation"
        >
          {[
            { href: "/", label: "Browse" },
            { href: "/wishlist", label: "Wishlist" },
            { href: "/trips", label: "My Trips" },
            { href: "/notifications", label: "Notifications" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                color: "var(--clr-text-muted)",
                textDecoration: "none",
                padding: "0.4rem 0.85rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "color 150ms, background 150ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--clr-text)";
                (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--clr-text-muted)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {label}
            </Link>
          ))}

          <div style={{ width: "1px", height: "1.25rem", background: "var(--clr-border)", margin: "0 0.5rem" }} />

          {!token ? (
            <Link href="/login" className="btn-crimson" style={{ textDecoration: "none" }}>
              Log in
            </Link>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="btn-ghost"
              style={{ fontSize: "0.8rem" }}
            >
              {user?.name ? `${user.name.split(" ")[0]}` : "Account"}
              <span style={{ opacity: 0.5 }}>· Log out</span>
            </button>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            display: "none",
            background: "none",
            border: "1px solid var(--clr-border)",
            borderRadius: "var(--radius-sm)",
            padding: "0.45rem 0.6rem",
            color: "var(--clr-text)",
            cursor: "pointer",
          }}
          className="mobile-menu-btn"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            {menuOpen ? (
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "var(--clr-surface)",
            borderTop: "1px solid var(--clr-border)",
            padding: "1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {[
            { href: "/", label: "Browse" },
            { href: "/wishlist", label: "Wishlist" },
            { href: "/trips", label: "My Trips" },
            { href: "/notifications", label: "Notifications" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: "var(--clr-text-muted)",
                textDecoration: "none",
                padding: "0.65rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem",
                display: "block",
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ height: "1px", background: "var(--clr-border)", margin: "0.5rem 0" }} />
          {!token ? (
            <Link
              href="/login"
              className="btn-crimson"
              onClick={() => setMenuOpen(false)}
              style={{ textDecoration: "none", justifyContent: "center" }}
            >
              Log in
            </Link>
          ) : (
            <button type="button" onClick={() => { logout(); setMenuOpen(false); }} className="btn-ghost" style={{ justifyContent: "center" }}>
              Log out
            </button>
          )}
        </div>
      )}

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
