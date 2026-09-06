"use client";

import { useRef } from "react";
import { Timer, getConsoleFunction, setConsoleFunction } from "three";

const CLOCK_DEPRECATION =
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

/** R3F v9 still constructs THREE.Clock per Canvas. Drop that until fiber v10. */
function filterClockDeprecation() {
  if (typeof window === "undefined") return;
  const root = window as Window & { __intekThreeClockFilter?: boolean };
  if (root.__intekThreeClockFilter) return;
  root.__intekThreeClockFilter = true;

  const prior = getConsoleFunction();
  setConsoleFunction((type, message, ...rest) => {
    if (type === "warn" && message === CLOCK_DEPRECATION) return;
    if (prior) {
      prior(type, message, ...rest);
      return;
    }
    const log = type === "error" ? console.error : type === "warn" ? console.warn : console.log;
    log(message, ...rest);
  });
}

filterClockDeprecation();

export function useSceneTimer() {
  const timer = useRef<Timer | null>(null);
  if (!timer.current) timer.current = new Timer();
  return timer.current;
}
