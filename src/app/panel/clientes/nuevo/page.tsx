import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TituloPanel } from "@/componentes/panel/Graficos";
import { FormNuevoCliente, type ValoresCliente } from "@/componentes/panel/clientes/Formularios";
import { PANEL_ADMIN } from "@/datos/textos";
import { diaBA } from "@/objetivos/fechas";
import { uuidValido } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.clientesSistema;
export const metadata: Metadata = { title: `${T.nuevo} · ${PANEL_ADMIN.titulo} · Quvant` };

const NUCLEOS_FIJOS = [
  { id: "industria", nombre: "Industria y comercio" },
  { id: "gimnasios", nombre: "Gimnasios y fitness" },
  { id: "holistica", nombre: "Holística" },
  { id: "kioscos", nombre: "Kioscos" },
  { id: "pymes", nombre: "Pymes" },
  { id: "inmobiliarias", nombre: "Inmobiliarias" },
  { id: "supermercados", nombre: "Supermercados" },
];

/** Nuevo cliente: a mano, o precargado desde una oportunidad (?oportunidad=), un local (?local=) o Plantillas (?plantilla=). */
export default function Nuevo({ searchParams }: PageProps<"/panel/clientes/nuevo">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Link href="/panel/clientes" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        {T.ficha.volver}
      </Link>
      <TituloPanel titulo={T.nuevo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/clientes/nuevo">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/clientes/nuevo");
  const p = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const { data: nucleosBase } = await supabase.from("nucleos").select("id, nombre").order("orden");
  const nucleos = nucleosBase?.length ? nucleosBase : NUCLEOS_FIJOS;
  const ids = new Set(nucleos.map((n) => n.id));
  const nucleoDe = (nicho: string | null | undefined) => (nicho && ids.has(nicho) ? nicho : undefined);
  const F = T.form;
  let inicial: ValoresCliente = { responsable: "fabrizio" };
  const enlaces: string[] = [];

  const oportunidad = uno(p.oportunidad);
  const local = uno(p.local);
  const plantilla = uno(p.plantilla);
  if (uuidValido(oportunidad)) {
    const { data: o } = await supabase.from("oportunidades").select("id, negocio, nicho_id, valor_abono, responsable, local_id, cliente_plantilla_id").eq("id", oportunidad).maybeSingle();
    if (o) {
      inicial = { ...inicial, oportunidad_id: o.id, nombre: o.negocio, nucleo: nucleoDe(o.nicho_id), abono: o.valor_abono ? String(o.valor_abono) : undefined, responsable: o.responsable ?? "fabrizio" };
      enlaces.push(F.enlazadoOportunidad.replace("{n}", o.negocio));
    }
  } else if (uuidValido(local)) {
    const { data: l } = await supabase.from("locales").select("id, nombre, nicho_id").eq("id", local).maybeSingle();
    if (l) {
      inicial = { ...inicial, local_id: l.id, nombre: l.nombre, nucleo: nucleoDe(l.nicho_id) };
      enlaces.push(F.enlazadoLocal.replace("{n}", l.nombre));
    }
  } else if (uuidValido(plantilla)) {
    const { data: c } = await supabase.from("clientes_plantilla").select("id, empresa, nicho_id, abono_mensual").eq("id", plantilla).maybeSingle();
    if (c) {
      inicial = { ...inicial, plantilla_id: c.id, nombre: c.empresa, nucleo: nucleoDe(c.nicho_id), abono: c.abono_mensual ? String(c.abono_mensual) : undefined };
      enlaces.push(F.enlazadoPlantilla.replace("{n}", c.empresa));
    }
  }
  return <FormNuevoCliente inicial={inicial} nucleos={nucleos} enlaces={enlaces} hoy={diaBA(new Date())} />;
}
