"use client";

import { ChevronDownIcon as ChevronDown } from "@radix-ui/react-icons";
import { Sparkle } from "@/components/brand/Sparkle";
import { categoryFilters } from "@/components/marketplace/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroSplashProps {
  onBrowse: () => void;
  className?: string;
}

const marqueeLabels = categoryFilters
  .filter((c) => c.value)
  .map((c) => c.label);

const floatingTags = [
  { label: "Superhero", className: "left-[6%] top-[20%] -rotate-[14deg]" },
  { label: "Anime", className: "right-[7%] top-[24%] rotate-[10deg]" },
  { label: "Fantasy", className: "left-[10%] bottom-[30%] rotate-[8deg]" },
  { label: "Theatrical", className: "right-[9%] bottom-[28%] -rotate-[11deg]" },
  { label: "Sci-Fi", className: "left-[22%] top-[12%] rotate-[6deg] max-md:hidden" },
  { label: "Vintage", className: "right-[20%] top-[14%] -rotate-[7deg] max-md:hidden" },
] as const;

function HeroMarquee() {
  const loop = [...marqueeLabels, ...marqueeLabels];

  return (
    <div className="hero-marquee pointer-events-none absolute inset-x-0 top-0 z-20 overflow-hidden border-b border-primary/15 bg-primary/[0.06] py-2.5">
      <div className="hero-marquee-track flex w-max gap-8">
        {loop.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="flex shrink-0 items-center gap-3 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-primary/80"
          >
            <Sparkle size="sm" animated={false} className="opacity-70" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HeroSplash({ onBrowse, className }: HeroSplashProps) {
  return (
    <section
      id="hero-splash"
      aria-label="Welcome"
      className={cn(
        "hero-splash relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden",
        className
      )}
    >
      <HeroMarquee />

      <div className="hero-curtain hero-curtain-left hero-curtain-heavy" aria-hidden="true" />
      <div className="hero-curtain hero-curtain-right hero-curtain-heavy" aria-hidden="true" />
      <div className="hero-spotlight" aria-hidden="true" />
      <div className="hero-spotlight-sweep" aria-hidden="true" />

      {floatingTags.map((tag, i) => (
        <div
          key={tag.label}
          aria-hidden="true"
          className={cn("absolute z-[1] hidden sm:block", tag.className)}
        >
          <span
            className={cn(
              "hero-float-tag inline-flex rounded-full border border-primary/25 bg-card/90 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-foreground shadow-sm",
              `hero-float-tag-${i + 1}`
            )}
          >
            {tag.label}
          </span>
        </div>
      ))}

      <Sparkle size="lg" className="hero-sparkle hero-sparkle-a absolute left-[14%] top-[38%] opacity-90" />
      <Sparkle size="md" className="hero-sparkle hero-sparkle-b absolute right-[16%] top-[42%] opacity-80" />
      <Sparkle size="sm" className="hero-sparkle hero-sparkle-c absolute bottom-[36%] left-[18%] opacity-70" />
      <Sparkle size="md" className="hero-sparkle hero-sparkle-d absolute bottom-[38%] right-[15%] opacity-85" />
      <Sparkle size="sm" className="hero-sparkle hero-sparkle-e absolute left-[42%] top-[28%] opacity-60 max-md:hidden" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 pt-20 text-center md:px-10">
        <p className="animate-fade-up flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.32em] text-primary">
          <Sparkle size="sm" animated={false} />
          Costume rentals, but make it a main character moment
          <Sparkle size="sm" animated={false} />
        </p>

        <h1 className="animate-fade-up-delay-1 mt-6 font-display leading-[0.92] tracking-tight">
          <span className="block text-[clamp(2.75rem,11vw,5.5rem)] font-bold text-foreground">
            Snap Into
          </span>
          <span className="hero-character-word mt-1 block text-[clamp(3.5rem,14vw,7.5rem)] font-bold italic text-primary">
            Character
          </span>
        </h1>

        <p className="animate-fade-up-delay-2 mt-6 max-w-md text-base leading-relaxed text-muted-foreground md:max-w-lg md:text-lg">
          Parties, shoots, cosplay nights, opening night — pick a look, book it, and own the room.
        </p>

        <div className="animate-fade-up-delay-3 mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            onClick={onBrowse}
            className="hero-cta h-14 rounded-2xl px-12 text-base font-bold shadow-coral shadow-coral-hover"
          >
            Browse Costumes
          </Button>
          <button
            type="button"
            onClick={onBrowse}
            className="text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            or peek at the marketplace ↓
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onBrowse}
        aria-label="Scroll to marketplace"
        className="hero-scroll-cue group absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
      >
        <span className="rounded-full border border-border bg-card/80 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.24em] shadow-sm">
          Scroll to browse
        </span>
        <span className="flex size-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          <ChevronDown className="size-5 motion-safe:animate-scroll-cue" />
        </span>
      </button>

      <div className="hero-stage-line" aria-hidden="true" />
      <div className="hero-stage-glow" aria-hidden="true" />
    </section>
  );
}
