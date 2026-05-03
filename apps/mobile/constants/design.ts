/**
 * SnapCos Design Tokens — Theatrical Luxury theme
 * Mirrors the web design system for visual consistency.
 */

export const Colors = {
  // Background
  bg:        "#0a0708",
  surface:   "#130f10",
  surface2:  "#1c1618",
  surface3:  "#261e20",

  // Borders
  border:      "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",

  // Crimson accent
  crimson:     "#c4102a",
  crimson2:    "#e01530",
  crimsonGlow: "rgba(196,16,42,0.25)",

  // Gold accent
  gold:      "#c89b3c",
  goldLight: "#e3b65a",
  goldDim:   "rgba(200,155,60,0.15)",

  // Text
  text:      "#f0ebe8",
  textMuted: "#9a8f8c",
  textDim:   "#5c5250",

  // Utility
  error:    "#f87171",
  errorBg:  "rgba(196,16,42,0.1)",
  errorBdr: "rgba(196,16,42,0.3)",
  success:  "#4ade80",
  white:    "#ffffff",
  transparent: "transparent",
};

export const Typography = {
  // Font families – loaded via expo-font
  display: "PlayfairDisplay-Bold",
  displayBold: "PlayfairDisplay-ExtraBold",
  body:    "DMSans-Regular",
  bodySemibold: "DMSans-SemiBold",

  // Size scale
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  "2xl": 30,
  "3xl": 38,
};

export const Spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  "2xl":24,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 16,
  },
};
