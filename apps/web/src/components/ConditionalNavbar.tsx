"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "../components/Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  // Suppress the user Navbar for the entire /admin subtree
  if (pathname.startsWith("/admin")) return null;
  return <Navbar />;
}
