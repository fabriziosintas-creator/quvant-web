import Link from "next/link";
import type { CSSProperties } from "react";
import { COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { METRICA } from "@/objetivos/catalogo";
import type { Avance } from "@/objetivos/estado";
import { diasEntre } from "@/objetivos/fechas";
import { conUnidad, diaLargo, porcentajeEntero } from "@/objetivos/formato";
import type { Meta } from "@/objetivos/tipos";
import { Anillo, ChipEstado, Curvita } from "./Piezas";

const T = PANEL_ADMIN.objetivos;

/** La línea de ritmo: "vas 15 % adelantado", "te faltan 12 visitas en 9 días hábiles"… */
export function textoRitmo(meta: Meta, a: Avance, hoy: string) {
  const C = T.tarjeta;
  if (hoy < meta.desde) return C.empieza.replace("{fecha}", diaLargo(meta.desde));
  if (meta.direccion === "menos_es_mejor") return C.menosEsMejor.replace("{meta}", conUnidad(meta.meta, meta.unidad));
  if (a.estado === "cumplido" || a.valor === null || a.falta === null) return a.abierto ? "" : C.termino.replace("{fecha}", diaLargo(meta.hasta));
  if (!a.abierto) return C.faltaCerrado.replace("{falta}", conUnidad(a.falta, meta.unidad));
  if (meta.acumulacion !== "promedio" && a.esperado !== null && a.esperado > 0 && a.valor > a.esperado) {
    return C.adelantado.replace("{p}", porcentajeEntero(a.valor / a.esperado - 1));
  }
  return C.falta
    .replace("{falta}", conUnidad(a.falta, meta.unidad))
    .replace("{dias}", String(a.diasRestantes))
    .replace("{tipo}", a.ritmo === "habiles" ? C.habiles : C.corridos);
}

export function IconoFuente({ meta }: { meta: Meta }) {
  const m = METRICA[meta.metrica];
  const texto = m?.automatica ? T.tarjeta.automatico : m?.sinFuente ? T.tarjeta.sinFuente : T.tarjeta.manual;
  return (
    <span title={texto} className="inline-flex items-center gap-1.5 font-plex text-[10px] uppercase tracking-etiqueta text-acero">
      <svg aria-hidden width="10" height="10" viewBox="0 0 10 10">
        {m?.automatica ? <path d="M1 5h2l1.5-3 2 6L8 5h1" fill="none" stroke="currentColor" strokeWidth="1.2" /> : <path d="M2 8 7.5 2.5l1 1L3 9H2Z" fill="none" stroke="currentColor" strokeWidth="1.1" />}
      </svg>
      <span className="sr-only sm:not-sr-only">{texto}</span>
    </span>
  );
}

/** Una tarjeta por objetivo: anillo, real contra meta, estado, ritmo, curva, responsable y de dónde sale el dato. */
export function TarjetaObjetivo({ meta, avance, serie, hoy }: { meta: Meta; avance: Avance; serie: Array<number | null>; hoy: string }) {
  const color = COLOR_ESTADO[avance.estado];
  const ajustada = meta.meta !== meta.metaOriginal;
  return (
    <Link
      href={`/panel/objetivos/${meta.id}`}
      aria-label={T.tarjeta.abrir.replace("{nombre}", meta.nombre)}
      style={{ "--estado": color } as CSSProperties}
      className="group relative flex h-full flex-col gap-4 border border-profundo p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-(--estado)/60 md:p-5"
    >
      <div className="flex items-start gap-4">
        <Anillo avance={avance.avance} estado={avance.estado} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <ChipEstado estado={avance.estado} />
          <h3 className="font-lectura text-[15px] font-semibold leading-snug text-blanco">{meta.nombre}</h3>
          <p className="font-plex text-xs text-acero">
            <span className="text-blanco">{conUnidad(avance.valor, meta.unidad)}</span> / {conUnidad(meta.meta, meta.unidad)}
            {ajustada ? <span className="ml-2 line-through decoration-acero/70" title={T.tarjeta.metaOriginal}>{conUnidad(meta.metaOriginal, meta.unidad)}</span> : null}
          </p>
        </div>
      </div>
      <p className="min-h-4 font-plex text-xs text-acero">{textoRitmo(meta, avance, hoy)}</p>
      <div className="mt-auto flex items-end justify-between gap-3">
        <Curvita puntos={serie} meta={meta.meta} total={Math.max(1, diasEntre(meta.desde, meta.hasta) + 1)} estado={avance.estado} />
        <div className="flex flex-col items-end gap-1">
          <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">{T.responsables[meta.responsable]}</span>
          <IconoFuente meta={meta} />
        </div>
      </div>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-[0.15] bg-(--estado) transition-transform duration-500 group-hover:scale-x-100" />
    </Link>
  );
}
