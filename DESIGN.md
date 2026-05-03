---
name: SnapCos
description: Modern costume rental marketplace merging SaaS utility with editorial minimalism
colors:
  studio-black: "oklch(0.14 0.01 30)"
  gallery-canvas: "oklch(0.98 0.01 30)"
  soft-ash: "oklch(0.94 0.01 30)"
  alert-rust: "oklch(0.55 0.22 25)"
  border-ash: "oklch(0.85 0.01 30)"
typography:
  display:
    fontFamily: "\"Playfair Display\", Georgia, serif"
  body:
    fontFamily: "\"DM Sans\", system-ui, sans-serif"
rounded:
  md: "0.5rem"
components:
  button-primary:
    backgroundColor: "{colors.studio-black}"
    textColor: "{colors.gallery-canvas}"
    rounded: "{rounded.md}"
    padding: "0 0.625rem"
    height: "2rem"
  button-secondary:
    backgroundColor: "{colors.soft-ash}"
    textColor: "{colors.studio-black}"
    rounded: "{rounded.md}"
    padding: "0 0.625rem"
    height: "2rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.studio-black}"
    rounded: "{rounded.md}"
    padding: "0 0.625rem"
    height: "2rem"
---

# Design System: SnapCos

## 1. Overview

**Creative North Star: "The Curator's Studio"**

SnapCos embodies refined utilitarianism. It balances the functional robustness of a modern SaaS tool with the visual elegance of a premium editorial marketplace. The aesthetic is clean, intentional, and content-forward, ensuring that the interface recedes to let costume photography take center stage. 

The system explicitly rejects SaaS landing-page clichés, heavy decorative elements, neon accents, and generic glassmorphism.

**Key Characteristics:**
- Crisp 1px borders for structure
- Generous whitespace for breathability
- Zero heavy shadows
- High-contrast typography

## 2. Colors

The palette is a warm monochrome that provides a subtle, sophisticated foundation.

### Primary
- **Studio Black** (oklch(0.14 0.01 30)): The anchor color. Used for primary typography, primary actions, and high-emphasis UI elements.

### Neutral
- **Gallery Canvas** (oklch(0.98 0.01 30)): The base canvas. Provides a warm, inviting backdrop that feels editorial rather than clinical white.
- **Soft Ash** (oklch(0.94 0.01 30)): Used for secondary backgrounds, muted surfaces, and low-emphasis fills.
- **Border Ash** (oklch(0.85 0.01 30)): Used for all structural borders and inputs.

### Semantic
- **Alert Rust** (oklch(0.55 0.22 25)): Used strictly for destructive actions and error states.

### Named Rules
**The Content-Forward Rule.** The UI must remain monochromatic to ensure that full-color costume photography provides the only true color pops on the screen.

## 3. Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Body Font:** DM Sans (with system-ui, sans-serif)

**Character:** An elegant serif display creates an authoritative, magazine-like feel for headlines, while the clean geometric sans-serif ensures maximum legibility for dense UI data and body copy.

### Hierarchy
- **Display**: Reserved for hero sections and major page titles. Expresses the editorial voice.
- **Headline**: Section headers and card titles.
- **Body**: Primary UI text, descriptions, and functional copy.
- **Label**: Small, often uppercase tracking, used for metadata and microcopy.

### Named Rules
**The Intentional Contrast Rule.** Hierarchy is established through extreme contrast in weight and scale, rather than subtle shifts in size.

## 4. Elevation

The system is flat-by-default. It relies entirely on crisp 1px borders and tonal layering (Gallery Canvas vs. Soft Ash) to separate surfaces, explicitly avoiding heavy drop shadows.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, focus) or for critical overlay context like modals, and even then must be extremely diffuse and low-opacity.

## 5. Components

### Buttons
- **Shape:** Softly curved edges (0.5rem radius)
- **Primary:** Solid Studio Black background with Gallery Canvas text. Precise and understated.
- **Hover / Focus:** Slight opacity shift or muted background.
- **Secondary / Ghost:** Soft Ash background or transparent with hover states.

### Cards / Containers
- **Corner Style:** 0.5rem radius
- **Background:** Gallery Canvas or Soft Ash
- **Shadow Strategy:** None at rest
- **Border:** 1px solid Border Ash

### Inputs / Fields
- **Style:** 1px Border Ash stroke, Gallery Canvas background, 0.5rem radius.
- **Focus:** Sharp border color shift to Studio Black, no soft glow.

### Navigation
- **Style:** Clean, text-driven links with strong active-state typography.

## 6. Do's and Don'ts

### Do:
- **Do** use 1px solid borders (`oklch(0.85 0.01 30)`) to separate content areas.
- **Do** use Playfair Display exclusively for top-level hierarchy and editorial moments.
- **Do** rely on generous whitespace rather than lines to group related items.

### Don't:
- **Don't** use heavy drop shadows on cards or containers.
- **Don't** use neon accents, purple gradients, or SaaS-cream aesthetics.
- **Don't** use side-stripe borders (border-left or border-right greater than 1px as a colored accent).
- **Don't** use glassmorphism as a default treatment.
- **Don't** use identical card grids repeatedly without typographic breaks.
