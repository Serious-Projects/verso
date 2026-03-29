"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          A critical error occurred. Please try refreshing the page.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-zinc-400">Error ID: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
