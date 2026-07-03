import { cn } from "@/lib/utils";

interface MarketplaceLoadingStageProps {
  className?: string;
}

function HeroLoadingLine({ className }: { className?: string }) {
  return <div className={cn("hero-loading-line rounded-md", className)} aria-hidden="true" />;
}

export function MarketplaceLoadingStage({ className }: MarketplaceLoadingStageProps) {
  return (
    <div
      className={cn("marketplace-shell flex flex-1 flex-col", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading marketplace"
    >
      <section
        aria-hidden="true"
        className="hero-splash relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden"
      >
        <div className="hero-marquee pointer-events-none absolute inset-x-0 top-0 z-20 overflow-hidden border-b border-primary/15 bg-primary/[0.06] py-2.5">
          <div className="mx-auto h-3 w-40 max-w-[70%] rounded-full hero-loading-line opacity-80" />
        </div>

        <div className="hero-curtain hero-curtain-left hero-curtain-heavy" />
        <div className="hero-curtain hero-curtain-right hero-curtain-heavy" />
        <div className="hero-spotlight" />
        <div className="hero-spotlight-sweep" />

        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 pt-20 text-center md:px-10">
          <HeroLoadingLine className="h-3 w-52 sm:w-64" />
          <HeroLoadingLine className="mt-6 h-[clamp(2.75rem,11vw,5.5rem)] w-56 sm:w-72" />
          <HeroLoadingLine className="mt-2 h-[clamp(3rem,12vw,6.5rem)] w-64 sm:w-80" />
          <HeroLoadingLine className="mt-6 h-4 w-full max-w-md" />
          <HeroLoadingLine className="mt-2 h-4 w-48 max-w-[80%]" />
          <HeroLoadingLine className="mt-10 h-14 w-48 rounded-2xl" />
        </div>

        <div className="hero-stage-line" />
        <div className="hero-stage-glow" />
      </section>

      <p className="sr-only">Loading marketplace</p>
    </div>
  );
}
