import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Context pedagògic",
  description: "Com Undirlaflota connecta la batalla naval 3D amb les matemàtiques, el sistema dièdric i l'estratègia a l'ESO.",
};

/** Pàgina "Sobre l'app": context pedagògic per a docents i famílies. */
export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <span className="chip border-estrategia/40 text-estrategia">Per a docents</span>
        <h1 className="mt-3 text-4xl font-black">La guerra submarina: matemàtiques i estratègia en 3D</h1>
        <p className="mt-4 text-lg text-mar-100/85">
          Undirlaflota és un joc de batalla naval en tres dimensions pensat per a 3r i 4t d&apos;ESO. Sota la capa de joc hi ha
          una pràctica intensiva de coordenades cartesianes, vistes ortogonals i raonament estratègic.
        </p>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-extrabold">Connexió curricular</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <h3 className="font-extrabold text-mar-300">Matemàtiques</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-mar-100/80">
                <li>Coordenades a l&apos;espai (x, y, z)</li>
                <li>Distància entre punts</li>
                <li>Plans, eixos i octants</li>
                <li>Recompte i probabilitat</li>
              </ul>
            </div>
            <div className="card">
              <h3 className="font-extrabold text-estrategia">Educació Visual i Plàstica</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-mar-100/80">
                <li>Sistema dièdric</li>
                <li>Planta, alçat i perfil</li>
                <li>Perspectiva isomètrica</li>
                <li>Lectura de plànols</li>
              </ul>
            </div>
            <div className="card">
              <h3 className="font-extrabold text-batalla">Competències transversals</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-mar-100/80">
                <li>Estratègia i planificació</li>
                <li>Gestió de recursos limitats</li>
                <li>Raonament deductiu</li>
                <li>Cooperació i torns</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-3">
          <h2 className="text-2xl font-extrabold">Com funciona una partida</h2>
          <ol className="list-decimal space-y-2 pl-5 text-mar-100/85">
            <li>Cada jugador col·loca 7 vaixells en un mar de 10 × 10 × 5: portaavions i fragates a la superfície (z = 0), submarins a z = -1 o z = -2.</li>
            <li>Per torns, cada jugador dispara una coordenada (x, y, z) amb un torpede (arriba a qualsevol profunditat) o un atac aeri (només superfície).</li>
            <li>El visor de la pròpia flota mostra els impactes rebuts; el visor d&apos;atac mostra el grid transparent on apuntar.</li>
            <li>Guanya qui enfonsa tota la flota rival, o qui ha fet més dany quan s&apos;acaba la munició.</li>
            <li>La pantalla final analitza la precisió, els nivells Z explorats i el patró d&apos;atac (sistemàtic o exploratori).</li>
          </ol>
        </section>

        <section className="mt-12 space-y-3">
          <h2 className="text-2xl font-extrabold">Propostes d&apos;aula</h2>
          <ul className="list-disc space-y-2 pl-5 text-mar-100/85">
            <li><strong>Abans de jugar:</strong> dibuixa la planta i l&apos;alçat d&apos;una flota donada i dedueix les coordenades de cada vaixell.</li>
            <li><strong>Durant:</strong> anota a la llibreta els trets com a punts i marca els impactes a les tres vistes dièdriques.</li>
            <li><strong>Després:</strong> calcula la distància euclidiana entre el primer i l&apos;últim impacte, i argumenta quin patró de cerca hauria estat més eficient.</li>
          </ul>
          <p className="text-sm text-mar-300/80">
            Trobaràs el detall d&apos;aquestes activitats al document <span className="coord">docs/PEDAGOGIA.md</span> del projecte.
          </p>
        </section>

        <section id="docents" className="card mt-12">
          <h2 className="text-2xl font-extrabold">Vols un codi de classe?</h2>
          <p className="mt-2 text-mar-100/85">
            Els codis els crea el professorat des de Supabase (taula <span className="coord">classroom_codes</span>). Si ets docent
            d&apos;un altre centre, demana l&apos;alta a través del catàleg{" "}
            <a href="https://aulaia.cat" className="underline hover:text-batalla" target="_blank" rel="noopener">
              aulaia.cat
            </a>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary">
              Entrar amb codi
            </Link>
            <Link href="/tutorial" className="btn-secondary">
              Tutorial
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
