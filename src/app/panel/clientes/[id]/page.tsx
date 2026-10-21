import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { permisoVigente } from "@/clientes/clientes";
import { Bloque, TituloPanel } from "@/componentes/panel/Graficos";
import { CLASE_BOTON_SECUNDARIO } from "@/componentes/cuenta/estilos";
import { FormBaja, FormPermiso } from "@/componentes/panel/clientes/Formularios";
import { PANEL_ADMIN } from "@/datos/textos";
import { diaBA } from "@/objetivos/fechas";
import { cargarFichaCliente } from "@/servidor/clientes/datos";
import { uuidValido } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { Historial } from "@/componentes/panel/bitacora/Historial";

const T = PANEL_ADMIN.clientesSistema;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** La ficha de un cliente real: sus datos, el permiso de métricas con su historial y la baja. */
export default function Ficha({ params }: PageProps<"/panel/clientes/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Link href="/panel/clientes" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        {T.ficha.volver}
      </Link>
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido params={params} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params }: { params: PageProps<"/panel/clientes/[id]">["params"] }) {
  const { id } = await params;
  if (!uuidValido(id)) notFound();
  const { supabase } = await exigirAdmin(`/panel/clientes/${id}`);
  const f = await cargarFichaCliente(supabase, id);
  if (!f) notFound();
  const s = f.sistema;
  const hoy = diaBA(new Date());
  const vigente = f.historial ? permisoVigente(f.historial) : null;
  const P = T.metricas;
  const B = T.baja;
  const M = T.modulos as Record<string, string>;
  const fila = (t: string, v: string) => (
    <div className="flex flex-col gap-0.5">
      <dt className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">{t}</dt>
      <dd className="font-lectura text-sm text-blanco">{v}</dd>
    </div>
  );

  return (
    <>
      <header className="flex flex-col gap-4">
        <TituloPanel titulo={s.nombre} bajada={s.baja ? B.deBaja.replace("{f}", s.baja).replace("{m}", s.motivo_baja ? B.motivos[s.motivo_baja as keyof typeof B.motivos] : "—") : `${T.estados.activo} · ${T.columnas.alta} ${s.alta}`} />
        <div className="flex flex-wrap gap-3">
          <Link href={`/panel/nucleos/${s.nucleo_id}/${s.id}`} className={CLASE_BOTON_SECUNDARIO}>
            {T.ficha.verNucleos}
          </Link>
          {f.oportunidadId ? (
            <Link href={`/panel/comercial/${f.oportunidadId}`} className={CLASE_BOTON_SECUNDARIO}>
              {T.ficha.oportunidad}
            </Link>
          ) : null}
        </div>
      </header>

      <Bloque titulo={T.ficha.datos}>
        <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {fila(T.ficha.organizacion, s.organizacion_id)}
          {fila(T.columnas.plan, s.plan ? T.planes[s.plan as "negocio" | "multinegocio"] : T.planes.sin)}
          {fila(T.columnas.sucursales, String(s.sucursales_contratadas))}
          {fila(T.ficha.usuarios, String(s.usuarios_contratados))}
          {fila(T.columnas.responsable, PANEL_ADMIN.comercial.responsables[s.responsable as "fabrizio" | "michel"] ?? s.responsable)}
          {fila(T.columnas.abono, f.plantilla?.abono_mensual ? `$ ${Math.round(f.plantilla.abono_mensual).toLocaleString("es-AR")}` : "—")}
          {fila(T.columnas.salud, f.salud === null ? T.sinSalud : String(f.salud))}
          <div className="sm:col-span-2">{fila(T.ficha.modulos, s.modulos_activos.length ? s.modulos_activos.map((m) => M[m] ?? m).join(", ") : T.ficha.ninguno)}</div>
        </dl>
      </Bloque>

      <Bloque titulo={P.titulo}>
        <div className="flex flex-col gap-4">
          <p className="font-plex text-xs text-acero">{P.explicacion}</p>
          <p className="font-plex text-xs text-acero">{P.contrato}</p>
          {f.historial === null ? (
            <p className="border border-profundo p-3 font-plex text-xs text-acero">{T.faltaPermisos}</p>
          ) : (
            <>
              <p className="font-lectura text-sm text-blanco">
                {s.comparte_metricas && vigente ? P.prendido.replace("{f}", vigente.fecha).replace("{m}", P.medios[vigente.medio as keyof typeof P.medios] ?? vigente.medio).replace("{q}", vigente.quien) : P.apagado}
              </p>
              <FormPermiso clienteId={s.id} prendido={s.comparte_metricas} hoy={hoy} />
              <div>
                <p className="mb-2 font-plex text-[10px] uppercase tracking-etiqueta text-acero">{P.historial}</p>
                {f.historial.length === 0 ? (
                  <p className="font-plex text-xs text-acero">{P.sinHistorial}</p>
                ) : (
                  <ul className="flex flex-col">
                    {f.historial.map((h) => (
                      <li key={h.creadoEn} className="border-b border-profundo/60 py-2 font-plex text-xs text-acero">
                        <span className="text-blanco">{P.acciones[h.accion]}</span> · {h.fecha} · {P.medios[h.medio as keyof typeof P.medios] ?? h.medio} · {h.quien}
                        {h.detalle ? ` · ${h.detalle}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </Bloque>

      {!s.baja ? (
        <Bloque titulo={B.titulo}>
          <div className="flex flex-col gap-4">
            <p className="font-plex text-xs text-acero">{B.explicacion}</p>
            {f.historial === null ? <p className="font-plex text-xs text-acero">{T.faltaPermisos}</p> : <FormBaja clienteId={s.id} hoy={hoy} />}
          </div>
        </Bloque>
      ) : null}
      <Historial tabla="clientes_sistema" registroId={s.id} />
    </>
  );
}
