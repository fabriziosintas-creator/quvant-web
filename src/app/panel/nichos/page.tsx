import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, ViewTransition, type CSSProperties } from "react";
import { Bloque, TituloPanel } from "@/componentes/panel/Graficos";
import { Puerta } from "@/componentes/panel/nichos/Puerta";
import { ACENTO_NICHO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import type { ResumenNicho } from "@/nichos/tipos";
import { conUnidad } from "@/objetivos/formato";
import { cargarResumenNichos } from "@/servidor/nichos/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.nichos;
const C = T.comparar;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const acentoDe = (id: string) => (id in ACENTO_NICHO ? ACENTO_NICHO[id as keyof typeof ACENTO_NICHO] : "#ECECEE");
type Eje = keyof typeof C.ejes;
const EJES: Eje[] = ["socios", "mrr", "salud", "conversion", "vistas", "prospectos"];
const valorEje = (n: ResumenNicho, e: Eje) => (e === "salud" ? n.saludPromedio : e === "conversion" ? n.conversion : n[e]);

/** 4.7 Todos los nichos: las puertas, la comparación en coordenadas paralelas y la tabla. */
export default function Nichos({ searchParams }: PageProps<"/panel/nichos">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/nichos">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/nichos");
  const parametros = await searchParams;
  const orden = (EJES as string[]).includes(String(parametros.orden)) ? (parametros.orden as Eje) : "socios";
  const nichos = await cargarResumenNichos(supabase);
  const ordenados = [...nichos].sort((a, b) => (valorEje(b, orden) ?? -1) - (valorEje(a, orden) ?? -1) || Number(b.tienePlantilla) - Number(a.tienePlantilla));

  return (
    <>
      {/* Las puertas. */}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {ordenados.map((n, i) => {
          const acento = acentoDe(n.id);
          return (
            <li key={n.id} className="nicho-entra" style={{ animationDelay: `${i * 60}ms` }}>
              <Puerta
                nicho={n.id}
                etiqueta={T.entrar.replace("{nombre}", n.nombre)}
                className="group relative flex h-full flex-col gap-3 overflow-hidden border border-profundo p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-(--acento)/70"
              >
                <span style={{ "--acento": acento } as CSSProperties} className="contents">
                  <ViewTransition name={`nicho-${n.id}`} share="entrar-nicho" default="none">
                    <span className="flex items-center gap-2 font-michroma text-sm uppercase tracking-marca text-blanco">
                      <span aria-hidden className="size-2 shrink-0 transition-transform duration-300 group-hover:scale-150" style={{ background: acento }} />
                      {n.nombre}
                    </span>
                  </ViewTransition>
                  <span className="grid grid-cols-2 gap-2 font-plex text-[11px] text-acero">
                    <span>
                      <span className="block font-michroma text-lg text-blanco">{n.socios}</span>
                      {C.ejes.socios}
                    </span>
                    <span>
                      <span className="block font-michroma text-lg text-blanco">{n.vistas}</span>
                      {C.ejes.vistas}
                    </span>
                  </span>
                  <span className="font-plex text-[11px] text-acero">{conUnidad(n.mrr, "ars")} / mes</span>
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: acento }} />
                </span>
              </Puerta>
            </li>
          );
        })}
      </ul>

      <Bloque titulo={C.titulo} nota={C.nota}>
        <Paralelas nichos={nichos} />
      </Bloque>

      <Bloque titulo={C.tabla}>
        <div className="overflow-x-auto border border-profundo">
          <table className="w-full min-w-[46rem] border-collapse font-plex text-xs">
            <thead>
              <tr className="text-left text-acero">
                <th scope="col" className="p-3 font-medium uppercase tracking-etiqueta">{T.titulo}</th>
                {EJES.map((e) => (
                  <th key={e} scope="col" className="p-3 text-right font-medium uppercase tracking-etiqueta">
                    <Link href={`/panel/nichos?orden=${e}`} aria-current={orden === e ? "true" : undefined} className="hover:text-blanco aria-[current=true]:text-blanco">
                      {C.ejes[e]}
                    </Link>
                  </th>
                ))}
                <th scope="col" className="p-3 text-right font-medium uppercase tracking-etiqueta">Churn</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((n) => (
                <tr key={n.id} className="border-t border-profundo transition-colors hover:bg-profundo/40">
                  <th scope="row" className="p-3 text-left font-normal">
                    <Link href={`/panel/nichos/${n.id}`} className="flex items-center gap-2 text-blanco hover:underline">
                      <span aria-hidden className="size-1.5" style={{ background: acentoDe(n.id) }} />
                      {n.nombre}
                    </Link>
                  </th>
                  <td className="p-3 text-right tabular-nums text-blanco">{n.socios}</td>
                  <td className="p-3 text-right tabular-nums text-blanco">{conUnidad(n.mrr, "ars")}</td>
                  <td className="p-3 text-right tabular-nums text-blanco">{n.saludPromedio ?? "—"}</td>
                  <td className="p-3 text-right tabular-nums text-blanco">{n.conversion === null ? "—" : `${Math.round(n.conversion * 1000) / 10} %`}</td>
                  <td className="p-3 text-right tabular-nums text-blanco">{n.vistas}</td>
                  <td className="p-3 text-right tabular-nums text-blanco">{n.prospectos}</td>
                  <td className="p-3 text-right tabular-nums text-acero">{n.churn === null ? "—" : `${Math.round(n.churn * 100)} %`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloque>
    </>
  );
}

/**
 * Coordenadas paralelas: un eje por métrica, normalizado entre el menor y
 * el mayor de los nichos; una línea por nicho, de su color. Al pasar por
 * una línea, las demás se apagan (CSS, sin JavaScript).
 */
function Paralelas({ nichos }: { nichos: ResumenNicho[] }) {
  const ancho = 720;
  const alto = 280;
  const m = { izq: 30, der: 30, arr: 30, aba: 30 };
  const x = (i: number) => m.izq + (i / (EJES.length - 1)) * (ancho - m.izq - m.der);
  const rangos = Object.fromEntries(
    EJES.map((e) => {
      const valores = nichos.map((n) => valorEje(n, e)).filter((v): v is number => v !== null);
      return [e, { min: Math.min(0, ...valores), max: Math.max(1e-9, ...valores) }];
    }),
  ) as Record<Eje, { min: number; max: number }>;
  const y = (e: Eje, v: number | null) => {
    if (v === null) return alto - m.aba;
    const { min, max } = rangos[e];
    return alto - m.aba - ((v - min) / (max - min || 1)) * (alto - m.arr - m.aba);
  };
  return (
    <figure className="flex flex-col gap-3 border border-profundo p-3 md:p-5">
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="paralelas h-auto w-full" role="img" aria-label={C.titulo}>
        {EJES.map((e, i) => (
          <g key={e}>
            <line x1={x(i)} x2={x(i)} y1={m.arr} y2={alto - m.aba} stroke="#26262B" strokeWidth="1.5" />
            <text x={x(i)} y={16} textAnchor="middle" className="fill-acero font-plex text-[11px] uppercase">
              {C.ejes[e]}
            </text>
          </g>
        ))}
        {nichos.map((n, i) => (
          <polyline
            key={n.id}
            points={EJES.map((e, j) => `${x(j).toFixed(1)},${y(e, valorEje(n, e)).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={acentoDe(n.id)}
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="linea-paralela nicho-entra"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <title>{n.nombre}</title>
          </polyline>
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 font-plex text-[11px] text-acero">
        {nichos.map((n) => (
          <span key={n.id} className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-4" style={{ background: acentoDe(n.id) }} />
            {n.nombre}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
