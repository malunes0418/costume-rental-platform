"use client";

import { cn } from "@/lib/utils";

interface RangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  className,
}: RangeSliderProps) {
  const range = Math.max(max - min, 1);
  const lowPct = ((valueMin - min) / range) * 100;
  const highPct = ((valueMax - min) / range) * 100;

  return (
    <div className={cn("relative pt-1", className)}>
      <div className="relative h-1.5 rounded-full bg-muted">
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={valueMin}
        onChange={(e) => {
          const next = Math.min(Number(e.target.value), valueMax);
          onChange(next, valueMax);
        }}
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background"
        aria-label="Minimum price"
      />
      <input
        type="range"
        min={min}
        max={max}
        value={valueMax}
        onChange={(e) => {
          const next = Math.max(Number(e.target.value), valueMin);
          onChange(valueMin, next);
        }}
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background"
        aria-label="Maximum price"
      />
    </div>
  );
}
