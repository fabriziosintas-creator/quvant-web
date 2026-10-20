import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TituloPanel } from "@/componentes/panel/Graficos";
import { FormMeta } from "@/componentes/panel/objetivos/Formularios";
import { PANEL_ADMIN } from "@/datos/textos";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";

const T = PANEL_ADMIN.objetivos;
export const metadata: Metadata = { title: `${T.form.tituloNueva} · ${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** 7.5 Crear un objetivo: la métrica sale del catálogo y explica de dónde sale el dato. */
export default function Nueva() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Link href="/panel/objetivos" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        {T.detalle.volver}
      </Link>
      <TituloPanel titulo={T.form.tituloNueva} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido />
      </Suspense>
    </main>
  );
}

async function Contenido() {
  const { supabase } = await exigirAdmin("/panel/objetivos/nueva");
  const nichos = await cargarNichos(supabase);
  return <FormMeta nichos={nichos.filter((n) => n.id !== "otro").map((n) => ({ id: n.id, nombre: n.nombre }))} />;
}
