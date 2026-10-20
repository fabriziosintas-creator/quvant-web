import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Bloque, TituloPanel } from "@/componentes/panel/Graficos";
import { fecha, fechaHora } from "@/componentes/panel/formato";
import { BarrasSimples, UsoSemanalPorModulo } from "@/componentes/panel/nucleos/Graficos";
import { AccionesAlerta, BloqueClaude, FormularioAcompanamiento } from "@/componentes/panel/nucleos/Interactivos";
import { CartelEjemplo, CLASE_BOTON_PANEL_2, IndicadorGrande, Numero, Semaforo, Tendencia, Vista } from "@/componentes/panel/nucleos/comunes";
import { Torre } from "@/componentes/panel/nucleos/tresd/Torre";
import { PANEL_ADMIN } from "@/datos/textos";
import { usoPorModulo } from "@/nucleos/indicadores";
import { cargarPanorama, filtrosEnUrl, leerFiltrosNucleos } from "@/servidor/nucleos/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.nucleos;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** B.4.3 · Un cliente: qué usa, qué no, qué pasó y qué hicimos. */
export default function PaginaCliente({ params, searchParams }: PageProps<"/panel/nucleos/[nucleo]/[cliente]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params, searchParams }: { params: PageProps<"/panel/nucleos/[nucleo]/[cliente]">["params"]; searchParams: PageProps<"/panel/nucleos/[nucleo]/[cliente]">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/nucleos");
  const [{ nucleo: idNucleo, cliente: idCliente }, parametros] = await Promise.all([params, searchParams]);
  const p = await cargarPanorama(supabase, { ...leerFiltrosNucleos(parametros), incluirPrueba: true, responsable: "todos" });
  const cliente = p.clientes.find((c) => c.id === idCliente && c.nucleoId === idNucleo);
  const nucleo = p.nucleos.find((n) => n.id === idNucleo);
  if (!cliente || !nucleo) notFound();
  const sufijo = filtrosEnUrl(leerFiltrosNucleos(parametros));
  const C = T.cliente;
  const i = cliente.indicadores;
  const semanas8 = i?.semanas.slice(-8) ?? [];
  const modulos = i ? usoPorModulo(i.semanas) : [];
  const acompanamientos = p.acompanamientos.filter((a) => a.clienteId === cliente.id);
  const linea = [
    ...cliente.alertas.map((a) => ({ fecha: a.fecha, tipo: "alerta" as const, alerta: a })),
    ...acompanamientos.map((a) => ({ fecha: `${a.fecha}T12:00:00Z`, tipo: "acomp" as const, acomp: a })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <Vista nivel={2}>
      <div className="flex flex-col gap-3">
        <Link href={`/panel/nucleos/${nucleo.id}${sufijo}`} className="font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">← {C.volver}: {nucleo.nombre}</Link>
        <TituloPanel titulo={cliente.nombre} bajada={T.medidoPorUso} />
        <dl className="flex flex-wrap gap-x-6 gap-y-2 font-plex text-xs">
          <div><dt className="inline text-acero">{C.alta}: </dt><dd className="inline text-blanco">{fecha(cliente.alta)}</dd></div>
          <div><dt className="inline text-acero">{C.sucursales}: </dt><dd className="inline text-blanco">{cliente.sucursalesContratadas}</dd></div>
          <div><dt className="inline text-acero">{C.usuarios}: </dt><dd className="inline text-blanco">{cliente.usuariosContratados}</dd></div>
          <div><dt className="inline text-acero">{C.responsable}: </dt><dd className="inline text-blanco">{cliente.responsable === "michel" ? "Michel" : "fabrizio"}</dd></div>
          {cliente.plan ? <div><dt className="inline text-acero">{C.plan}: </dt><dd className="inline text-blanco">{cliente.plan}</dd></div> : null}
          {cliente.esPrueba ? <div className="border border-profundo px-1.5 py-0.5 text-[10px] uppercase tracking-etiqueta text-acero">prueba</div> : null}
        </dl>
      </div>
      {p.modoEjemplo ? <CartelEjemplo motivo={p.motivoEjemplo} /> : null}

      {!i ? (
        <p className="border border-profundo p-6 font-lectura text-sm text-acero">{C.sinIndicadores}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <IndicadorGrande etiqueta={C.salud} valor={i.salud === null ? "—" : <Numero valor={i.salud} />} detalle={<Semaforo valor={i.semaforo} />} />
            <IndicadorGrande etiqueta={T.nucleo.ordenes.adopcion} valor={<><Numero valor={Math.round(i.adopcion * 100)} /> %</>} detalle={`${i.funcionesClave.filter((f) => f.estado === "usada").length} de ${i.funcionesClave.length}`} />
            <IndicadorGrande etiqueta={T.nucleo.ordenes.tendencia} valor={<Tendencia valor={i.tendencia} />} detalle={C.diasActivos.replace("{n}", String(i.diasActivos4Semanas))} />
            <IndicadorGrande etiqueta={T.nucleo.ordenes.crecimiento} valor={<>{i.crecimiento.total > 0 ? "+" : ""}<Numero valor={Math.round(i.crecimiento.total * 100)} /> %</>} detalle={T.medidoPorUso} />
          </div>

          <Torre titulo={C.torre} nota={C.torreNota} semanas={semanas8} modulos={modulos} lista={<UsoSemanalPorModulo semanas={semanas8} modulos={modulos} />} />

          <Bloque titulo={C.funciones}>
            <ul className="grid gap-2 md:grid-cols-2">
              {i.funcionesClave.map((f) => (
                <li key={f.id} className="flex flex-col gap-1.5 border border-profundo p-4">
                  <p className="flex items-center justify-between gap-3">
                    <span className="font-lectura text-[15px] font-semibold text-blanco">{f.nombre}</span>
                    <span className={`shrink-0 border px-1.5 py-0.5 font-plex text-[10px] uppercase tracking-etiqueta ${f.estado === "usada" ? "border-blanco bg-blanco text-negro" : f.estado === "dejo_de_usar" ? "border-blanco text-blanco" : "border-profundo text-acero"}`}>
                      {f.estado === "usada" ? T.nucleo.usada : f.estado === "dejo_de_usar" ? T.nucleo.dejoDeUsar : T.nucleo.sinUsar}
                    </span>
                  </p>
                  <p className="font-plex text-xs text-acero">{C.ultimaVez}: {f.ultimaVez ? fechaHora(f.ultimaVez) : C.nunca} · {f.frecuencia}</p>
                  <p className="font-lectura text-sm leading-relaxed text-acero">{f.porQueImporta}</p>
                </li>
              ))}
            </ul>
          </Bloque>

          <div className="grid gap-6 md:grid-cols-2">
            <Bloque titulo={C.porSucursal}>
              <BarrasSimples filas={Object.entries(i.actividadPorSucursal).map(([s, d]) => ({ etiqueta: s, valor: d }))} maximo={7} />
            </Bloque>
            <Bloque titulo={C.porRol}>
              <BarrasSimples filas={Object.entries(i.accionesPorRol).sort((a, b) => b[1] - a[1]).map(([r, n]) => ({ etiqueta: r, valor: n }))} />
            </Bloque>
          </div>
        </>
      )}

      <Bloque titulo={C.lineaDeTiempo}>
        {linea.length === 0 ? (
          <p className="font-plex text-sm text-acero">{C.sinHistorial}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {linea.map((x) => (
              <li key={x.tipo === "alerta" ? x.alerta.id : x.acomp.id} className="flex flex-col gap-1 border border-profundo p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-plex text-xs">
                    <span aria-hidden className={`size-2 ${x.tipo === "alerta" ? (x.alerta.gravedad === "roja" ? "bg-blanco" : "border border-blanco") : "bg-acero"}`} />
                    <span className="text-blanco">{x.tipo === "alerta" ? T.alertas.tipos[x.alerta.tipo] : C.tiposAcomp[x.acomp.tipo]}</span>
                    <span className="text-acero">· {x.tipo === "alerta" ? fechaHora(x.alerta.fecha) : fecha(x.acomp.fecha)}</span>
                    {x.tipo === "alerta" ? <span className="text-acero">· {T.alertas.estados[x.alerta.estado]}</span> : null}
                  </p>
                  {x.tipo === "acomp" && x.acomp.nota ? <p className="font-lectura text-sm text-acero">{x.acomp.nota}</p> : null}
                  {x.tipo === "alerta" && x.alerta.funcionClave ? <p className="font-lectura text-sm text-acero">{String(x.alerta.detalle.funcion ?? x.alerta.funcionClave)}</p> : null}
                </div>
                {x.tipo === "alerta" && !p.modoEjemplo ? <AccionesAlerta alerta={x.alerta} /> : null}
              </li>
            ))}
          </ol>
        )}
      </Bloque>

      <Bloque titulo={C.registrar}>
        <FormularioAcompanamiento clienteId={cliente.id} alertas={cliente.alertas} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled className={`${CLASE_BOTON_PANEL_2} opacity-50`}>{C.dejarNovedad}</button>
          <span className="font-plex text-xs text-acero">{C.dejarNovedadNota}</span>
        </div>
      </Bloque>

      <BloqueClaude clienteId={cliente.id} />
    </Vista>
  );
}
