import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { ConditionalNavbar } from "../components/ConditionalNavbar";
import { ThemeProvider } from "../components/theme-provider";
import { CartProvider } from "../lib/CartContext";
import { AuthProvider } from "../lib/auth";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"],
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
      className={`${newsreader.variable} ${dmSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
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
              <div
                aria-hidden="true"
                style={{
                  position: "fixed",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 9999,
                  opacity: 0.025,
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "repeat",
                  backgroundSize: "128px",
                }}
              />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
