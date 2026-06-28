"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

function ConditionalNavbarInner() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/oauth")) {
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
