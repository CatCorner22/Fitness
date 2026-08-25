"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5">
      <h1 className="display text-4xl">Something broke</h1>
      <p className="mt-3 text-muted">The last action did not finish. Try again, or go back to Today.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn-quiet">
          Today
        </Link>
      </div>
    </div>
  );
}
