import type { Metadata } from "next";
import { Manrope, Prata } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { ConditionalNavbar } from "../components/ConditionalNavbar";
import { ThemeProvider } from "../components/theme-provider";
import { CartProvider } from "../lib/CartContext";
import { AuthProvider } from "../lib/auth";
import "./globals.css";

const prata = Prata({
  variable: "--font-prata",
  subsets: ["latin"],
  weight: ["400"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "SnapCos - Premium Costume Rentals",
    template: "%s | SnapCos",
  },
  description:
    "Discover extraordinary costumes for any occasion. Browse, book, and wear with confidence.",
  keywords: ["costume rental", "cosplay", "party costumes", "theatrical costumes"],
  icons: {
    icon: "/icon.png",
    apple: "/brand/snapcos-mark.png",
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "SnapCos - Premium Costume Rentals",
    description: "Discover extraordinary costumes for any occasion.",
    type: "website",
    images: ["/brand/snapcos-lockup.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapCos - Premium Costume Rentals",
    description: "Discover extraordinary costumes for any occasion.",
    images: ["/brand/snapcos-lockup.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${prata.variable} ${manrope.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <ConditionalNavbar />
              <div className="flex flex-1 flex-col">{children}</div>
              <Toaster position="top-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
