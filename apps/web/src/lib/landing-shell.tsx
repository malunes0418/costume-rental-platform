"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LandingShellContextValue = {
  heroActive: boolean;
  navRevealed: boolean;
  setHeroActive: (active: boolean) => void;
  revealNav: () => void;
  resetHeroNav: () => void;
};

const LandingShellContext = createContext<LandingShellContextValue | null>(null);

export function LandingShellProvider({ children }: { children: ReactNode }) {
  const [heroActive, setHeroActive] = useState(false);
  const [navRevealed, setNavRevealed] = useState(false);

  const revealNav = useCallback(() => setNavRevealed(true), []);
  const resetHeroNav = useCallback(() => setNavRevealed(false), []);

  const value = useMemo(
    () => ({
      heroActive,
      navRevealed,
      setHeroActive,
      revealNav,
      resetHeroNav,
    }),
    [heroActive, navRevealed, revealNav, resetHeroNav]
  );

  return (
    <LandingShellContext.Provider value={value}>{children}</LandingShellContext.Provider>
  );
}

export function useLandingShell() {
  const ctx = useContext(LandingShellContext);
  return (
    ctx ?? {
      heroActive: false,
      navRevealed: true,
      setHeroActive: () => {},
      revealNav: () => {},
      resetHeroNav: () => {},
    }
  );
}
