import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ACCIONES } from "@/bitacora/bitacora";
import { TituloPanel } from "@/componentes/panel/Graficos";
import { LineaBitacora } from "@/componentes/panel/bitacora/LineaBitacora";
import { PANEL_ADMIN } from "@/datos/textos";
import { cargarBitacora, filtrosEnUrl, leerFiltrosBitacora, type FiltrosBitacora } from "@/servidor/bitacora/datos";
import { cargarAdmins } from "@/servidor/panel/mapa";
import { exigirAdmin } from "@/servidor/panel/acceso";

const B = PANEL_ADMIN.bitacora;
const F = B.filtros;
export const metadata: Metadata = { title: `${B.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const CLASE_CONTROL = "h-10 w-full border border-profundo bg-negro px-3 font-plex text-base text-blanco focus:border-acero focus:outline-none md:text-sm";
const CLASE_ETIQUETA = "mb-1.5 block font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero";

/** La bitácora: la línea de tiempo de todo lo que se cargó, cambió o borró en el panel. */
export default function Bitacora({ searchParams }: PageProps<"/panel/bitacora">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={B.titulo} bajada={B.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/bitacora">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/bitacora");
  const filtros = leerFiltrosBitacora(await searchParams);
  const [datos, admins] = await Promise.all([cargarBitacora(supabase, filtros), cargarAdmins(supabase)]);
  if (!datos) return <p className="border border-profundo p-4 font-plex text-sm text-acero">{B.falta}</p>;
  const ultima = datos.entradas.at(-1);

  return (
    <>
      <Filtros filtros={filtros} admins={admins.map((a) => ({ id: a.id, nombre: a.nombre }))} />
      <div className="flex flex-wrap gap-3">
        <a href={`/panel/bitacora/exportar${filtrosEnUrl(filtros)}`} download className="inline-flex h-10 items-center border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco hover:border-acero">
          {B.exportar}
        </a>
      </div>
      {datos.entradas.length === 0 ? (
        <p className="font-plex text-sm text-acero">{B.vacio}</p>
      ) : (
        <ul>
          {datos.entradas.map((e) => (
            <LineaBitacora key={e.id} e={e} nombre={e.quien ? (datos.nombres[e.quien] ?? null) : null} />
          ))}
        </ul>
      )}
      {datos.hayMas && ultima ? (
        <Link href={`/panel/bitacora${filtrosEnUrl(filtros, { antes: String(ultima.id) })}`} className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
          {B.masViejos}
        </Link>
      ) : null}
    </>
  );
}

/** Los filtros, en un formulario común (GET): funcionan sin JavaScript y quedan en la dirección. */
function Filtros({ filtros, admins }: { filtros: FiltrosBitacora; admins: Array<{ id: string; nombre: string }> }) {
  return (
    <form method="get" aria-label={F.aplicar} className="grid grid-cols-2 gap-3 border border-profundo p-4 md:grid-cols-3 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto] lg:items-end">
      <label>
        <span className={CLASE_ETIQUETA}>{F.quien}</span>
        <select name="quien" defaultValue={filtros.quien} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
          <option value="sistema">{B.sistema}</option>
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA}>{F.tabla}</span>
        <select name="tabla" defaultValue={filtros.tabla} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {Object.entries(B.tablasFiltro).map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA}>{F.accion}</span>
        <select name="accion" defaultValue={filtros.accion} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {ACCIONES.map((a) => (
            <option key={a} value={a}>
              {B.acciones[a]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA}>{F.desde}</span>
        <input type="date" name="desde" defaultValue={filtros.desde} className={CLASE_CONTROL} />
      </label>
      <label>
        <span className={CLASE_ETIQUETA}>{F.hasta}</span>
        <input type="date" name="hasta" defaultValue={filtros.hasta} className={CLASE_CONTROL} />
      </label>
      <label>
        <span className={CLASE_ETIQUETA}>{F.registro}</span>
        <input type="search" name="registro" defaultValue={filtros.registro} maxLength={80} className={CLASE_CONTROL} />
      </label>
      <div className="col-span-2 flex items-end gap-3 md:col-span-3 lg:col-span-1">
        <button type="submit" className="h-10 bg-blanco px-5 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
          {F.aplicar}
        </button>
        <Link href="/panel/bitacora" className="flex h-10 items-center font-plex text-xs uppercase tracking-[0.14em] text-acero hover:text-blanco">
          {F.limpiar}
        </Link>
      </div>
    </form>
  );
}
