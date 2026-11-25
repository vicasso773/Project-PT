import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-4xl">Report not found</h1>
      <p className="mt-2 text-muted">This link may be mistyped, or the report was removed.</p>
      <Link href="/" className="mt-6 rounded-full bg-sage px-5 py-3 font-medium text-charcoal">Start a new scan</Link>
    </main>
  );
}
