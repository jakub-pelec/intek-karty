"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  nextOpenPhase,
  OPEN_TIMING,
  type OpenPhase,
} from "@/lib/open-fx";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useOpenSequence<T>(initialCard: T | null = null) {
  const [phase, setPhase] = useState<OpenPhase>(initialCard ? "reveal" : "idle");
  const [card, setCard] = useState<T | null>(initialCard);
  const [chargeElapsed, setChargeElapsed] = useState(false);
  const [started, setStarted] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  const begin = useCallback(() => {
    setCard(null);
    setStarted(true);
    setChargeElapsed(reduced);
    setPhase("charge");
  }, [reduced]);

  const resolve = useCallback(
    (next: T) => {
      setCard(next);
      if (reduced) setPhase("reveal");
    },
    [reduced],
  );

  const fail = useCallback(() => {
    setCard(null);
    setStarted(false);
    setChargeElapsed(false);
    setPhase("idle");
  }, []);

  const reset = useCallback(() => {
    setCard(initialCard);
    setStarted(false);
    setChargeElapsed(false);
    setPhase(initialCard ? "reveal" : "idle");
  }, [initialCard]);

  useEffect(() => {
    if (phase !== "charge" || reduced) return;
    const timer = window.setTimeout(
      () => setChargeElapsed(true),
      OPEN_TIMING.chargeMs,
    );
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  useEffect(() => {
    const next = nextOpenPhase(phase, chargeElapsed, Boolean(card));
    if (next) setPhase(next);
  }, [phase, chargeElapsed, card]);

  useEffect(() => {
    if (phase !== "burst") return;
    const timer = window.setTimeout(
      () => setPhase("reveal"),
      OPEN_TIMING.burstMs,
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

  return {
    phase,
    card,
    started,
    begin,
    resolve,
    fail,
    reset,
    isBusy: phase === "charge" || phase === "burst",
  };
}
