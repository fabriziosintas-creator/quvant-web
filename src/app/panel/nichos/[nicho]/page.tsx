import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition, type CSSProperties } from "react";
import { Bloque } from "@/componentes/panel/Graficos";
import { Ciudad } from "@/componentes/panel/nucleos/tresd/Ciudad";
import { MapaCalorNicho } from "@/componentes/panel/nichos/MapaCalorNicho";
import { RankingSocios } from "@/componentes/panel/nichos/RankingSocios";
import { Atencion, Cohortes, Embudo, Inteligencia, Plantilla, Pulso, Tiempos } from "@/componentes/panel/nichos/Secciones";
import { Tunel } from "@/componentes/panel/nichos/Tunel";
import { ACENTO_NICHO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import type { Periodo } from "@/nichos/tipos";
import { cargarNicho, PERIODOS } from "@/servidor/nichos/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.nichos;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const acentoDe = (id: string) => (id in ACENTO_NICHO ? ACENTO_NICHO[id as keyof typeof ACENTO_NICHO] : "#ECECEE");

/**
 * "Dentro del nicho": todo lo de un rubro en una página. Mientras llegan
 * los datos se ve el túnel (Suspense); cuando llegan, cada bloque se
 * enciende en su lugar. El punto y el nombre del nicho vienen de la puerta
 * (ViewTransition compartida con la tarjeta de la que se entró).
 */
export default function Nicho({ params, searchParams }: PageProps<"/panel/nichos/[nicho]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <Suspense fallback={<Tunel />}>
        <Contenido params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params, searchParams }: { params: PageProps<"/panel/nichos/[nicho]">["params"]; searchParams: PageProps<"/panel/nichos/[nicho]">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/nichos");
  const [{ nicho }, parametros] = await Promise.all([params, searchParams]);
  if (!/^[a-z_]{1,40}$/.test(nicho)) notFound();
  const pedido = Number(Array.isArray(parametros.periodo) ? parametros.periodo[0] : parametros.periodo);
  const dias: Periodo = (PERIODOS as number[]).includes(pedido) ? (pedido as Periodo) : 30;
  const d = await cargarNicho(supabase, nicho, dias);
  if (!d) notFound();
  const acento = acentoDe(d.nicho.id);
  const estado = d.nicho.tienePlantilla ? "disponible" : d.nicho.enRegistro ? "en_diseno" : "proximamente";
  const conUso = d.socios.filter((s) => s.conUso);

  return (
    <div style={{ "--acento": acento } as CSSProperties} className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <Link href="/panel/nichos" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
          {T.volver}
        </Link>
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <ViewTransition name={`nicho-${d.nicho.id}`} share="entrar-nicho" default="none">
            <h1 className="flex items-center gap-4 font-michroma text-3xl uppercase leading-none tracking-marca text-blanco md:text-5xl">
              <span aria-hidden className="size-4 shrink-0 md:size-5" style={{ background: acento }} />
              {d.nicho.nombre}
            </h1>
          </ViewTransition>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-profundo px-2 py-1 font-plex text-[10px] uppercase tracking-etiqueta text-acero">{T.estados[estado]}</span>
            <nav aria-label={T.periodo} className="flex gap-1">
              {PERIODOS.map((p) => (
                <Link
                  key={p}
                  href={`/panel/nichos/${d.nicho.id}${p === 30 ? "" : `?periodo=${p}`}`}
                  aria-current={dias === p ? "page" : undefined}
                  className="h-9 border border-profundo px-3 font-plex text-[11px] uppercase leading-9 tracking-etiqueta text-acero hover:text-blanco aria-[current=page]:border-(--acento) aria-[current=page]:text-blanco"
                >
                  {T.periodos[String(p) as keyof typeof T.periodos]}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {d.avisos.map((a) => (
          <p key={a} className="flex items-start gap-3 border border-profundo px-4 py-3 font-plex text-xs leading-relaxed text-acero">
            <span aria-hidden className="mt-1.5 size-1.5 shrink-0 bg-acero" />
            {T.avisos[a as keyof typeof T.avisos] ?? a}
          </p>
        ))}
      </div>

      <Pulso d={d} acento={acento} />

      <section className="nicho-entra flex flex-col gap-4" style={{ animationDelay: "200ms" }}>
        <Bloque titulo={T.socios.titulo} nota={T.socios.nota}>
          {d.socios.length === 0 ? (
            <p className="border border-profundo p-5 font-plex text-sm text-acero">{T.socios.vacio}</p>
          ) : conUso.length > 0 ? (
            <Ciudad
              titulo={T.socios.ciudad}
              nota={T.socios.nota}
              edificios={conUso.map((s) => ({ id: s.id, nombre: s.nombre, actividad: s.semanas.at(-1) ?? 0, sucursales: s.sucursales, semaforo: (s.semaforo as "verde" | "amarillo" | "rojo" | "arranque") ?? "arranque", href: s.href ?? `/panel/nichos/${d.nicho.id}` }))}
              lista={<RankingSocios socios={d.socios} acento={acento} />}
            />
          ) : (
            <RankingSocios socios={d.socios} acento={acento} />
          )}
        </Bloque>
      </section>

      <div className="nicho-entra" style={{ animationDelay: "300ms" }}>
        <Embudo d={d} acento={acento} />
      </div>

      <div className="nicho-entra grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" style={{ animationDelay: "380ms" }}>
        <Cohortes d={d} acento={acento} />
        <Tiempos d={d} />
      </div>

      <div className="nicho-entra" style={{ animationDelay: "440ms" }}>
        <Atencion d={d} acento={acento} />
      </div>

      <section className="nicho-entra flex flex-col gap-4" style={{ animationDelay: "500ms" }}>
        <Bloque titulo={T.prospeccion.titulo} nota={T.prospeccion.nota}>
          <MapaCalorNicho prospectos={d.prospectos} visitas={d.visitas} acento={acento} hoy={d.hoy} />
        </Bloque>
      </section>

      <div className="nicho-entra" style={{ animationDelay: "560ms" }}>
        <Plantilla d={d} acento={acento} />
      </div>

      <div className="nicho-entra" style={{ animationDelay: "620ms" }}>
        <Inteligencia d={d} acento={acento} />
      </div>
    </div>
  );
}
