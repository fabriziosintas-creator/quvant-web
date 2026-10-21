import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TituloPanel } from "@/componentes/panel/Graficos";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO } from "@/componentes/cuenta/estilos";
import { PANEL_ADMIN } from "@/datos/textos";
import { cargarClientes } from "@/servidor/clientes/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.clientesSistema;
const C = T.columnas;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const pesos = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `$ ${Math.round(n).toLocaleString("es-AR")}`);
const COLOR_SEMAFORO: Record<string, string> = { verde: "#34D399", amarillo: "#FFB547", rojo: "#F8717A", arranque: "#3DD9EB" };

/** Los clientes reales del sistema, con su lado comercial, su salud y si comparten métricas. */
export default function Clientes() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <div className="flex flex-wrap gap-3">
        <Link href="/panel/clientes/nuevo" className={CLASE_BOTON}>
          {T.nuevo}
        </Link>
        {/* Una descarga, no una página: va con <a> (como las otras exportaciones). */}
        <a href={`/panel/clientes/exportar`} download className={CLASE_BOTON_SECUNDARIO}>
          {T.exportar}
        </a>
      </div>
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Lista />
      </Suspense>
    </main>
  );
}

async function Lista() {
  const { supabase } = await exigirAdmin("/panel/clientes");
  const [datos, nucleos] = await Promise.all([cargarClientes(supabase), supabase.from("nucleos").select("id, nombre")]);
  if (!datos) return <p className="border border-profundo p-4 font-plex text-sm text-acero">{T.falta}</p>;
  const nombreNucleo = new Map((nucleos.data ?? []).map((n) => [n.id, n.nombre]));

  return (
    <>
      {datos.filas.length === 0 ? (
        <p className="border border-profundo p-4 font-plex text-sm text-acero">{T.vacio}</p>
      ) : (
        <div className="overflow-x-auto border border-profundo">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-profundo font-plex text-[10px] uppercase tracking-etiqueta text-acero">
                {[C.cliente, C.nicho, C.plan, C.sucursales, C.responsable, C.abono, C.alta, C.estado, C.salud, C.metricas].map((t) => (
                  <th key={t} scope="col" className="px-3 py-2 font-normal">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-plex text-xs text-acero">
              {datos.filas.map(({ sistema: s, plantilla: p, salud, semaforo }) => (
                <tr key={s.id} className="border-b border-profundo/60 last:border-0">
                  <th scope="row" className="px-3 py-3 font-normal">
                    <Link href={`/panel/clientes/${s.id}`} className="font-lectura text-sm text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">
                      {s.nombre}
                    </Link>
                  </th>
                  <td className="px-3 py-3">{nombreNucleo.get(s.nucleo_id) ?? s.nucleo_id}</td>
                  <td className="px-3 py-3">{s.plan ? T.planes[s.plan as "negocio" | "multinegocio"] : T.planes.sin}</td>
                  <td className="px-3 py-3 tabular-nums">{s.sucursales_contratadas}</td>
                  <td className="px-3 py-3">{PANEL_ADMIN.comercial.responsables[s.responsable as "fabrizio" | "michel"] ?? s.responsable}</td>
                  <td className="px-3 py-3 tabular-nums">{pesos(p?.abono_mensual)}</td>
                  <td className="px-3 py-3 tabular-nums">{s.alta}</td>
                  <td className="px-3 py-3">{s.baja ? T.estados.baja : T.estados.activo}</td>
                  <td className="px-3 py-3">
                    {salud === null ? (
                      T.sinSalud
                    ) : (
                      <span className="inline-flex items-center gap-2 tabular-nums text-blanco">
                        <span aria-hidden className="size-2" style={{ background: COLOR_SEMAFORO[semaforo ?? ""] ?? "#9C9CA3" }} />
                        {salud}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">{s.comparte_metricas ? <span className="text-blanco">{T.comparte}</span> : T.noComparte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {datos.sinCuenta.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-michroma text-sm uppercase tracking-etiqueta text-blanco">{T.sinCuenta.titulo}</h2>
          <p className="font-plex text-xs text-acero">{T.sinCuenta.bajada}</p>
          <ul className="flex flex-col">
            {datos.sinCuenta.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-profundo/60 py-2">
                <span className="font-lectura text-sm text-blanco">{p.empresa}</span>
                <Link href={`/panel/clientes/nuevo?plantilla=${p.id}`} className="font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
                  {T.sinCuenta.alta}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
