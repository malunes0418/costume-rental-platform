"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "../components/Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  // Suppress the global navbar for app areas that render their own shell.
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) return null;
  return <Navbar />;
}
