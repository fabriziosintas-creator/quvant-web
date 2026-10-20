import Link from "next/link";
import { Suspense } from "react";
import { Barras, Bloque, Indicador, PuntoRubro, TituloPanel } from "@/componentes/panel/Graficos";
import { fechaHora, numero, porcentaje } from "@/componentes/panel/formato";
import { ACENTO_NICHO } from "@/datos/colores";
import { CUENTA, PANEL_ADMIN } from "@/datos/textos";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos, cargarRegistros, cargarResumen, filtrosEnUrl, leerFiltros, type Filtros } from "@/servidor/panel/datos";

const T = PANEL_ADMIN.resumen;
const acentoDe = (nicho: string) => (nicho in ACENTO_NICHO ? ACENTO_NICHO[nicho as keyof typeof ACENTO_NICHO] : undefined);
const objetivoCorto = (id: string) => PANEL_ADMIN.objetivosCortos[id as keyof typeof PANEL_ADMIN.objetivosCortos] ?? id;

/** 6.1 Resumen: los registrados, por rubro y por objetivo, y la lista con filtros y CSV. */
export default function Resumen({ searchParams }: PageProps<"/panel">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel");
  const filtros = leerFiltros(await searchParams);
  const [resumen, nichos, { filas, total }] = await Promise.all([
    cargarResumen(supabase),
    cargarNichos(supabase),
    cargarRegistros(supabase, filtros),
  ]);
  const nombreNicho = (id: string) => nichos.find((n) => n.id === id)?.nombre ?? id;
  const enRegistro = nichos.filter((n) => n.en_registro);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador etiqueta={T.tiles.hoy} valor={numero(resumen.hoy)} />
        <Indicador etiqueta={T.tiles.semana} valor={numero(resumen.semana)} />
        <Indicador etiqueta={T.tiles.mes} valor={numero(resumen.mes)} />
        <Indicador
          etiqueta={T.tiles.confirmacion}
          valor={porcentaje(resumen.confirmados, resumen.total)}
          detalle={T.tiles.deTotal.replace("{n}", numero(resumen.confirmados)).replace("{total}", numero(resumen.total))}
        />
      </div>

      {resumen.total === 0 ? (
        <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.sinDatos}</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Barras
              titulo={T.porNicho}
              unidad={T.personas}
              filas={enRegistro
                .map((n) => ({ id: n.id, etiqueta: n.nombre, valor: resumen.por_nicho[n.id] ?? 0, acento: acentoDe(n.id) }))
                .sort((a, b) => b.valor - a.valor)}
            />
            <Barras
              titulo={T.porObjetivo}
              unidad={T.personas}
              filas={CUENTA.objetivos.map((o) => ({ id: o.id, etiqueta: objetivoCorto(o.id), valor: resumen.por_objetivo[o.id] ?? 0 }))}
            />
          </div>

          <Bloque titulo={T.cruce} nota={T.cruceNota}>
            <Cruce resumen={resumen} nichos={enRegistro} />
          </Bloque>
        </>
      )}

      <Bloque
        titulo={T.ultimos}
        acciones={
          <a
            href={`/panel/exportar${filtrosEnUrl(filtros) ? `?${filtrosEnUrl(filtros)}` : ""}`}
            title={T.exportarNota}
            className="inline-flex h-10 items-center gap-2 border border-profundo px-4 font-plex text-xs font-medium uppercase tracking-[0.14em] text-blanco transition-colors hover:border-acero"
          >
            <span aria-hidden className="size-1.5 bg-blanco" />
            {T.exportar}
          </a>
        }
      >
        <FormularioFiltros filtros={filtros} nichos={enRegistro} />
        <p className="font-plex text-xs text-acero">
          {T.mostrando.replace("{n}", numero(filas.length)).replace("{total}", numero(total))}
        </p>
        {filas.length === 0 ? (
          <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.vacio}</p>
        ) : (
          <ListaRegistros filas={filas} nombreNicho={nombreNicho} />
        )}
      </Bloque>
    </>
  );
}

/** El cruce rubro × objetivo: tabla con cada celda más clara cuantas más personas (una sola escala, de negro a blanco). */
function Cruce({ resumen, nichos }: { resumen: Awaited<ReturnType<typeof cargarResumen>>; nichos: Array<{ id: string; nombre: string }> }) {
  const valor = (nicho: string, objetivo: string) => resumen.cruce.find((c) => c.nicho === nicho && c.objetivo === objetivo)?.n ?? 0;
  const maximo = Math.max(1, ...resumen.cruce.map((c) => c.n));
  return (
    <div className="overflow-x-auto border border-profundo">
      <table className="w-full min-w-[34rem] border-collapse font-plex text-xs">
        <thead>
          <tr className="text-left text-acero">
            <th scope="col" className="p-3 font-medium uppercase tracking-etiqueta">
              {PANEL_ADMIN.resumen.filtros.nicho}
            </th>
            {CUENTA.objetivos.map((o) => (
              <th key={o.id} scope="col" className="p-3 text-right font-medium uppercase tracking-etiqueta">
                {objetivoCorto(o.id)}
              </th>
            ))}
            <th scope="col" className="p-3 text-right font-medium uppercase tracking-etiqueta">
              {PANEL_ADMIN.resumen.total}
            </th>
          </tr>
        </thead>
        <tbody>
          {nichos.map((n) => (
            <tr key={n.id} className="border-t border-profundo">
              <th scope="row" className="p-3 text-left font-normal text-blanco">
                <span className="flex items-center gap-2">
                  <PuntoRubro acento={acentoDe(n.id)} />
                  {n.nombre}
                </span>
              </th>
              {CUENTA.objetivos.map((o) => {
                const n2 = valor(n.id, o.id);
                return (
                  <td
                    key={o.id}
                    className="p-3 text-right tabular-nums text-blanco"
                    style={{ background: n2 ? `rgb(236 236 238 / ${0.06 + 0.3 * (n2 / maximo)})` : undefined }}
                  >
                    {n2 || <span className="text-acero/50">0</span>}
                  </td>
                );
              })}
              <td className="p-3 text-right tabular-nums text-blanco">{resumen.por_nicho[n.id] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CLASE_CONTROL =
  "h-10 w-full border border-profundo bg-negro px-3 font-plex text-base text-blanco focus:border-acero focus:outline-none md:text-sm";
const CLASE_ETIQUETA_FILTRO = "mb-1.5 block font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero";

/** Los filtros, en un formulario común (GET): funcionan sin JavaScript y quedan en la dirección. */
function FormularioFiltros({ filtros, nichos }: { filtros: Filtros; nichos: Array<{ id: string; nombre: string }> }) {
  const F = PANEL_ADMIN.resumen.filtros;
  return (
    <form method="get" className="grid grid-cols-2 gap-3 border border-profundo p-4 md:grid-cols-3 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto]">
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
        <span className={CLASE_ETIQUETA_FILTRO}>{F.objetivo}</span>
        <select name="objetivo" defaultValue={filtros.objetivo} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {CUENTA.objetivos.map((o) => (
            <option key={o.id} value={o.id}>
              {objetivoCorto(o.id)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.ciudad}</span>
        <input name="ciudad" defaultValue={filtros.ciudad} maxLength={80} className={CLASE_CONTROL} />
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.desde}</span>
        <input type="date" name="desde" defaultValue={filtros.desde} className={CLASE_CONTROL} />
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.hasta}</span>
        <input type="date" name="hasta" defaultValue={filtros.hasta} className={CLASE_CONTROL} />
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.novedades}</span>
        <select name="novedades" defaultValue={filtros.novedades} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          <option value="si">{F.si}</option>
          <option value="no">{F.no}</option>
        </select>
      </label>
      <div className="col-span-2 flex items-end gap-3 md:col-span-3 lg:col-span-1">
        <button type="submit" className="h-10 bg-blanco px-5 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
          {F.aplicar}
        </button>
        <Link href="/panel" className="flex h-10 items-center font-plex text-xs uppercase tracking-[0.14em] text-acero hover:text-blanco">
          {F.limpiar}
        </Link>
      </div>
    </form>
  );
}

/** La lista: tarjetas en el celular, tabla en la computadora. */
function ListaRegistros({
  filas,
  nombreNicho,
}: {
  filas: Awaited<ReturnType<typeof cargarRegistros>>["filas"];
  nombreNicho: (id: string) => string;
}) {
  const C = PANEL_ADMIN.resumen.columnas;
  const rubro = (f: (typeof filas)[number]) => (f.nicho_id === "otro" && f.nicho_otro ? `Otro: ${f.nicho_otro}` : nombreNicho(f.nicho_id));
  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {filas.map((f) => (
          <li key={f.id} className="flex flex-col gap-1.5 border border-profundo p-4 font-plex text-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="font-lectura text-[15px] font-semibold text-blanco">{[f.nombre, f.apellido].filter(Boolean).join(" ")}</span>
              <span className="shrink-0 text-acero">{fechaHora(f.creado_en)}</span>
            </div>
            <a href={`mailto:${f.email}`} className="break-all text-acero underline decoration-profundo underline-offset-4">
              {f.email}
            </a>
            <span className="flex items-center gap-2 text-blanco">
              <PuntoRubro acento={acentoDe(f.nicho_id)} />
              {rubro(f)} · {objetivoCorto(f.objetivo_id)}
            </span>
            <span className="text-acero">
              {[f.empresa, f.ciudad].filter(Boolean).join(" · ") || "—"}
              {f.acepta_novedades ? ` · ${C.novedades}` : ""}
              {f.email_confirmado_en ? "" : " · sin confirmar"}
            </span>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto border border-profundo md:block">
        <table className="w-full border-collapse font-plex text-xs">
          <thead>
            <tr className="text-left text-acero">
              {[C.fecha, C.nombre, C.email, C.nicho, C.objetivo, C.empresa, C.ciudad, C.novedades, C.confirmado].map((columna) => (
                <th key={columna} scope="col" className="whitespace-nowrap p-3 font-medium uppercase tracking-etiqueta">
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-t border-profundo text-blanco hover:bg-profundo/30">
                <td className="whitespace-nowrap p-3 tabular-nums text-acero">{fechaHora(f.creado_en)}</td>
                <td className="p-3">{[f.nombre, f.apellido].filter(Boolean).join(" ")}</td>
                <td className="p-3">
                  <a href={`mailto:${f.email}`} className="underline decoration-profundo underline-offset-4 hover:decoration-blanco">
                    {f.email}
                  </a>
                </td>
                <td className="p-3">
                  <span className="flex items-center gap-2">
                    <PuntoRubro acento={acentoDe(f.nicho_id)} />
                    {rubro(f)}
                  </span>
                </td>
                <td className="p-3">{objetivoCorto(f.objetivo_id)}</td>
                <td className="p-3 text-acero">{f.empresa ?? "—"}</td>
                <td className="p-3 text-acero">{f.ciudad ?? "—"}</td>
                <td className="p-3 text-acero">{f.acepta_novedades ? PANEL_ADMIN.resumen.filtros.si : PANEL_ADMIN.resumen.filtros.no}</td>
                <td className="p-3 text-acero">{f.email_confirmado_en ? PANEL_ADMIN.resumen.filtros.si : PANEL_ADMIN.resumen.filtros.no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
