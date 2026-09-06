import type { ReactNode } from "react";

export default function RevealLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-white">{children}</div>
  );
}
