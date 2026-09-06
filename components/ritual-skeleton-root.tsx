"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const FADE_MS = 200;

let overlay: HTMLElement | null = null;
let overlayTimer: number | null = null;

function fadeOutNode(node: HTMLElement, rect: DOMRectReadOnly) {
  if (rect.width < 8 || rect.height < 8) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  overlay?.remove();
  if (overlayTimer !== null) window.clearTimeout(overlayTimer);

  const clone = node.cloneNode(true) as HTMLElement;
  clone.removeAttribute("aria-busy");
  clone.setAttribute("aria-hidden", "true");
  clone.classList.add("ritual-skeleton-fade");
  clone.style.position = "fixed";
  clone.style.left = `${rect.left}px`;
  clone.style.top = `${rect.top}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.margin = "0";
  clone.style.zIndex = "30";
  clone.style.pointerEvents = "none";
  document.body.appendChild(clone);
  overlay = clone;
  overlayTimer = window.setTimeout(() => {
    clone.remove();
    if (overlay === clone) overlay = null;
    overlayTimer = null;
  }, FADE_MS);
}

export function SkeletonRoot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRectReadOnly | null>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const remember = () => {
      rectRef.current = node.getBoundingClientRect();
    };
    remember();

    const observer = new ResizeObserver(remember);
    observer.observe(node);
    window.addEventListener("scroll", remember, true);
    window.addEventListener("resize", remember);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", remember, true);
      window.removeEventListener("resize", remember);
      const rect = node.isConnected ? node.getBoundingClientRect() : rectRef.current;
      if (rect) fadeOutNode(node, rect);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-ritual-skeleton=""
      aria-busy="true"
      aria-live="polite"
      className={className}
    >
      {children}
    </div>
  );
}
