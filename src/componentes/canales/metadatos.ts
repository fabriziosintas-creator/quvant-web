import type { Metadata } from "next";
import { canalPorId } from "./navegacion";

/** Título, descripción y canonical de la página de un canal (el resto lo pone el layout). */
export function metadatosCanal(id: string): Metadata {
  const canal = canalPorId(id);
  return {
    title: `${canal.metaTitulo} | Quvant`,
    description: `${canal.titulo} ${canal.bajada}`,
    alternates: { canonical: canal.ruta },
    openGraph: { url: canal.ruta, title: `${canal.metaTitulo} | Quvant`, description: canal.bajada },
  };
}
