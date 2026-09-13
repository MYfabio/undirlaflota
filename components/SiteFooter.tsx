import Link from "next/link";

/** Peu comú amb enllaços a aulaia.cat i a l'Institut Escola Industrial. */
export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-mar-300/10 bg-mar-950/60">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-mar-100/80 sm:grid-cols-3">
        <div>
          <p className="font-extrabold text-mar-50">Undirlaflota</p>
          <p className="mt-1">La guerra submarina: matemàtiques i estratègia en 3D.</p>
          <p className="mt-1 text-xs text-mar-300/70">undirlaflota.cat · ESO 3r-4t</p>
        </div>
        <div>
          <p className="font-bold text-mar-50">Enllaços</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/tutorial" className="hover:text-batalla">
                Tutorial interactiu
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-batalla">
                Context pedagògic
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-batalla">
                Entrar amb codi de classe
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-mar-50">Forma part de</p>
          <ul className="mt-2 space-y-1">
            <li>
              <a href="https://aulaia.cat" target="_blank" rel="noopener" className="hover:text-batalla">
                aulaia.cat · catàleg d&apos;apps educatives
              </a>
            </li>
            <li>
              <a href="https://escolaindustrial.org" target="_blank" rel="noopener" className="hover:text-batalla">
                Institut Escola Industrial
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
