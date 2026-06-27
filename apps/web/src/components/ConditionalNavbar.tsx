"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Navbar } from "./Navbar";
import { useLandingShell } from "../lib/landing-shell";

function hasBrowseParams(searchParams: URLSearchParams) {
  if (searchParams.get("q")) return true;
  if (searchParams.get("category")) return true;
  if (searchParams.get("size")) return true;
  if (searchParams.get("gender")) return true;
  if (searchParams.get("theme")) return true;
  if (searchParams.get("sort")) return true;
  if (searchParams.get("priceMin") || searchParams.get("priceMax")) return true;
  const page = searchParams.get("page");
  if (page && page !== "1") return true;
  const view = searchParams.get("view");
  if (view && view !== "grid") return true;
  return false;
}

function ConditionalNavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navRevealed } = useLandingShell();

  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/oauth")) {
    return null;
  }

  const isCleanHome = pathname === "/" && !hasBrowseParams(searchParams);
  if (isCleanHome && !navRevealed) {
    return null;
  }

  return <Navbar />;
}

export function ConditionalNavbar() {
  return (
    <Suspense fallback={null}>
      <ConditionalNavbarInner />
    </Suspense>
  );
}
