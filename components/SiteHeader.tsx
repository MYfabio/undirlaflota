import Link from "next/link";
import { APP_NAME } from "@/lib/config";

/** Capçalera comuna (landing, tutorial, login, about). */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-mar-300/10 bg-mar-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden>🫧</span>
          <span>
            {APP_NAME}
            <span className="ml-1 rounded bg-batalla px-1.5 py-0.5 text-[10px] font-black text-mar-950">3D</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-3">
          <Link href="/tutorial" className="rounded-lg px-3 py-2 hover:bg-mar-900">
            Tutorial
          </Link>
          <Link href="/about" className="hidden rounded-lg px-3 py-2 hover:bg-mar-900 sm:block">
            Pedagogia
          </Link>
          <Link href="/login" className="btn-primary !px-4 !py-2 text-sm">
            Jugar
          </Link>
        </nav>
      </div>
    </header>
  );
}
