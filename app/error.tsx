"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Something went wrong</h1>
      <p className="max-w-md text-sm text-[var(--muted)]">{error.message}</p>
      <button
        type="button"
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-[#1a1404]"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
