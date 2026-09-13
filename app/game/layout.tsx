import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partida",
  description: "Tauler de batalla naval 3D amb dos visors: la teva flota i el grid d'atac.",
};

/** Layout del joc: pantalla completa sense capçalera ni peu de la web. */
export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-mar-950">{children}</div>;
}
