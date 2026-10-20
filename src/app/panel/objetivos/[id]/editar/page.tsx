import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TituloPanel } from "@/componentes/panel/Graficos";
import { FormMeta } from "@/componentes/panel/objetivos/Formularios";
import { PANEL_ADMIN } from "@/datos/textos";
import { uuidValido } from "@/servidor/cuenta/validacion";
import { cargarMeta, FaltaMigracion } from "@/servidor/objetivos/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";

const T = PANEL_ADMIN.objetivos;
export const metadata: Metadata = { title: `${T.form.tituloEditar} · ${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** Editar un objetivo: si cambia la meta o el período, pide el motivo y lo guarda. */
export default function Editar({ params }: PageProps<"/panel/objetivos/[id]/editar">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido params={params} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params }: { params: PageProps<"/panel/objetivos/[id]/editar">["params"] }) {
  const { supabase } = await exigirAdmin("/panel/objetivos");
  const { id } = await params;
  if (!uuidValido(id)) notFound();
  let meta;
  try {
    meta = await cargarMeta(supabase, id);
  } catch (error) {
    if (error instanceof FaltaMigracion) return <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.faltaMigracion}</p>;
    throw error;
  }
  if (!meta) notFound();
  const nichos = await cargarNichos(supabase);
  return (
    <>
      <Link href={`/panel/objetivos/${meta.id}`} className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        ← {meta.nombre}
      </Link>
      <TituloPanel titulo={T.form.tituloEditar} bajada={meta.nombre} />
      <FormMeta meta={meta} nichos={nichos.filter((n) => n.id !== "otro").map((n) => ({ id: n.id, nombre: n.nombre }))} />
    </>
  );
}
