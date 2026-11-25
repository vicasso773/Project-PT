import Link from "next/link";
import { ScanForm } from "@/components/ScanForm";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-12">
      <p className="text-sm font-semibold tracking-[0.25em] text-sage-light">PRECISE TALONS</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight">Site Scanner</h1>
      <p className="mt-3 text-lg text-muted">
        Type a local business&apos;s website. In about a minute you&apos;ll have a plain-English report to show the owner.
      </p>
      <ScanForm />
      <Link href="/history" className="mt-8 self-start text-muted underline decoration-line underline-offset-4 hover:text-ivory">
        Scan history →
      </Link>
    </main>
  );
}
