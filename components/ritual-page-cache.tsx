"use client";

import { Children, Fragment, isValidElement, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

function isRitualSkeleton(node: ReactNode): boolean {
  if (node == null || typeof node === "boolean") return false;
  if (Array.isArray(node)) return node.some(isRitualSkeleton);
  if (!isValidElement(node)) return false;
  if (
    node.props &&
    typeof node.props === "object" &&
    "data-ritual-skeleton" in node.props
  ) {
    return true;
  }
  if (node.type === Fragment) {
    return isRitualSkeleton((node.props as { children?: ReactNode }).children);
  }
  return Children.toArray((node.props as { children?: ReactNode }).children).some(
    isRitualSkeleton,
  );
}

export function RitualPageCache({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const cacheKey = pathname;
  const cache = useRef(new Map<string, ReactNode>());
  const prevKey = useRef(cacheKey);
  const navigated = prevKey.current !== cacheKey;
  prevKey.current = cacheKey;

  if (!isRitualSkeleton(children) && (!cache.current.has(cacheKey) || !navigated)) {
    cache.current.set(cacheKey, children);
  }

  const cached = cache.current.get(cacheKey);

  return (
    <>
      {[...cache.current.entries()].map(([key, node]) => (
        <div key={key} hidden={key !== cacheKey} inert={key !== cacheKey ? true : undefined}>
          {node}
        </div>
      ))}
      {!cached ? children : null}
    </>
  );
}
