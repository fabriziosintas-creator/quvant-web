import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bloque, Indicador, TituloPanel } from "@/componentes/panel/Graficos";
import { hoyEnBuenosAires, numero } from "@/componentes/panel/formato";
import { FormularioLocal } from "@/componentes/panel/mapa/FormularioLocal";
import { ImportarCsv } from "@/componentes/panel/mapa/ImportarCsv";
import { MapaProspeccion, ProveedorMapas } from "@/componentes/panel/mapa/MapaProspeccion";
import { PANEL_ADMIN } from "@/datos/textos";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";
import { hayGeocodificacion } from "@/servidor/panel/geocodificar";
import {
  ESTADOS_LOCAL,
  FEEDBACKS,
  VOLVER,
  cargarAdmins,
  cargarLocales,
  cargarVisitas,
  contar,
  filtrarLocales,
  hayFiltros,
  leerFiltrosMapa,
  type Admin,
  type FiltrosMapa,
} from "@/servidor/panel/mapa";

const T = PANEL_ADMIN.mapa;

export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** 6.3 Mapa de prospección: los locales, las visitas y a cuáles volver. */
export default function Mapa({ searchParams }: PageProps<"/panel/mapa">) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/mapa">["searchParams"] }) {
  const { supabase, perfil } = await exigirAdmin("/panel/mapa");
  const filtros = leerFiltrosMapa(await searchParams);
  const [locales, visitas, admins, nichos] = await Promise.all([cargarLocales(supabase), cargarVisitas(supabase), cargarAdmins(supabase), cargarNichos(supabase)]);
  const hoy = hoyEnBuenosAires();
  const filtrados = filtrarLocales(locales, visitas, filtros, hoy);
  const contadores = contar(locales, visitas, admins, hoy);
  const clave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
  const nombresNicho = Object.fromEntries(nichos.map((n) => [n.id, n.nombre]));
  const C = T.contadores;

  return (
    <ProveedorMapas clave={clave}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Indicador etiqueta={C.locales} valor={numero(contadores.locales)} />
        <Indicador etiqueta={C.visitados} valor={numero(contadores.visitados)} />
        <Indicador etiqueta={C.interesados} valor={numero(contadores.interesados)} />
        <Indicador etiqueta={C.clientes} valor={numero(contadores.clientes)} />
        <Indicador etiqueta={C.descartados} valor={numero(contadores.descartados)} />
        <Indicador
          etiqueta={C.visitasMes}
          valor={numero(contadores.visitasMes.reduce((s, v) => s + v.cantidad, 0))}
          detalle={contadores.visitasMes.length ? contadores.visitasMes.map((v) => `${v.nombre} ${v.cantidad}`).join(" · ") : C.sinVisitas}
        />
      </div>

      <FormularioFiltros filtros={filtros} nichos={nichos.filter((n) => n.id !== "otro")} admins={admins} />

      <MapaProspeccion
        locales={filtrados}
        visitas={visitas}
        admins={admins}
        yo={perfil.id}
        hayClave={Boolean(clave)}
        mapId={mapId}
        nombresNicho={nombresNicho}
        ubicados={filtrados.filter((l) => l.latitud !== null).length}
      />

      <Bloque titulo={T.local.titulo} nota={T.local.bajada}>
        <FormularioLocal nichos={nichos.filter((n) => n.id !== "otro").map((n) => ({ id: n.id, nombre: n.nombre }))} hayClave={Boolean(clave)} />
      </Bloque>

      <Bloque titulo={T.importar.titulo} nota={T.importar.bajada}>
        <ImportarCsv hayClaveServidor={hayGeocodificacion()} />
      </Bloque>

      <p className="font-plex text-xs text-acero">{T.costo}</p>
    </ProveedorMapas>
  );
}

const CLASE_CONTROL = "h-10 w-full border border-profundo bg-negro px-3 font-plex text-base text-blanco focus:border-acero focus:outline-none md:text-sm";
const CLASE_ETIQUETA_FILTRO = "mb-1.5 block font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero";

/** Los filtros, en un formulario común (GET): funcionan sin JavaScript y quedan en la dirección. */
function FormularioFiltros({ filtros, nichos, admins }: { filtros: FiltrosMapa; nichos: Array<{ id: string; nombre: string }>; admins: Admin[] }) {
  const F = T.filtros;
  return (
    <form method="get" aria-label={F.titulo} className="grid grid-cols-2 gap-3 border border-profundo p-4 md:grid-cols-4 lg:grid-cols-[repeat(7,minmax(0,1fr))_auto] lg:items-end">
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.nicho}</span>
        <select name="nicho" defaultValue={filtros.nicho} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {nichos.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.estado}</span>
        <select name="estado" defaultValue={filtros.estado} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {ESTADOS_LOCAL.map((e) => (
            <option key={e} value={e}>
              {T.estados[e]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.feedback}</span>
        <select name="feedback" defaultValue={filtros.feedback} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {FEEDBACKS.map((f) => (
            <option key={f} value={f}>
              {T.feedback[f]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.volver}</span>
        <select name="volver" defaultValue={filtros.volver} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {VOLVER.map((v) => (
            <option key={v} value={v}>
              {T.volver[v]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.visitante}</span>
        <select name="visitante" defaultValue={filtros.visitante} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.sinVisitar}</span>
        <input type="number" name="sinVisitar" min={1} max={3650} inputMode="numeric" defaultValue={filtros.sinVisitar || ""} className={CLASE_CONTROL} />
      </label>
      <label className="flex items-center gap-3 self-end pb-2.5">
        <input type="checkbox" name="semana" value="si" defaultChecked={filtros.semana} className="size-4 accent-[#ECECEE]" />
        <span className="font-plex text-[11px] uppercase leading-snug tracking-etiqueta text-acero">{F.semana}</span>
      </label>
      <div className="col-span-2 flex items-end gap-3 md:col-span-4 lg:col-span-1">
        <button type="submit" className="h-10 bg-blanco px-5 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
          {F.aplicar}
        </button>
        {hayFiltros(filtros) ? (
          <Link href="/panel/mapa" className="flex h-10 items-center font-plex text-xs uppercase tracking-[0.14em] text-acero hover:text-blanco">
            {F.limpiar}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
