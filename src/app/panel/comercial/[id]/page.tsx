import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Bloque } from "@/componentes/panel/Graficos";
import { FormActividad, FormOportunidad, MoverEtapa } from "@/componentes/panel/comercial/Formularios";
import { Vista } from "@/componentes/panel/nucleos/comunes";
import { PROBABILIDAD, diasEnEtapa, esEtapa, estancada, linkWhatsApp, valorAnual, type Etapa } from "@/comercial/comercial";
import { ACENTO_NICHO, COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { conUnidad, diaLargo } from "@/objetivos/formato";
import { aOportunidad, cargarOportunidad } from "@/servidor/comercial/datos";
import { uuidValido } from "@/servidor/cuenta/validacion";
import { FaltaMigracion } from "@/servidor/objetivos/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";
import { Historial } from "@/componentes/panel/bitacora/Historial";

const T = PANEL_ADMIN.comercial;
const F = T.ficha;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** La ficha de una oportunidad: contacto en un toque, actividad, cambio de etapa, datos e historial. */
export default function Ficha({ params }: PageProps<"/panel/comercial/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Link href="/panel/comercial" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        {F.volver}
      </Link>
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido params={params} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params }: { params: PageProps<"/panel/comercial/[id]">["params"] }) {
  const { supabase, perfil } = await exigirAdmin("/panel/comercial");
  const { id } = await params;
  if (!uuidValido(id)) notFound();
  let datos;
  try {
    datos = await cargarOportunidad(supabase, id);
  } catch (error) {
    if (error instanceof FaltaMigracion) return <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.faltaMigracion}</p>;
    throw error;
  }
  if (!datos) notFound();
  const { fila: o, actividades } = datos;
  const op = aOportunidad(o);
  const nichos = await cargarNichos(supabase);
  const { data: admins } = await supabase.from("perfiles").select("id, nombre").eq("rol", "admin");
  const ahora = new Date().toISOString();
  const etapa = (esEtapa(o.etapa) ? o.etapa : "nuevo") as Etapa;
  const acento = o.nicho_id && o.nicho_id in ACENTO_NICHO ? ACENTO_NICHO[o.nicho_id as keyof typeof ACENTO_NICHO] : "#9C9CA3";
  const whatsapp = linkWhatsApp(o.telefono, F.mensajeWhatsApp.replace("{nombre}", o.contacto?.split(" ")[0] ?? "").replace("{quien}", perfil.nombre));
  const origen = o.perfil_id ? "/panel/resumen" : o.local_id ? `/panel/mapa?local=${o.local_id}` : o.conversacion_id ? `/panel/mensajes?c=${o.conversacion_id}` : null;
  const nombreDe = (pid: string | null) => admins?.find((a) => a.id === pid)?.nombre ?? "—";
  const boton = "inline-flex h-11 items-center justify-center gap-2 border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco hover:border-acero";

  return (
    <Vista nivel={1}>
      <header className="flex flex-col gap-4 border border-profundo p-5 md:p-6">
        <p className="flex flex-wrap items-center gap-3 font-plex text-[11px] uppercase tracking-etiqueta">
          <span className="border border-blanco px-2 py-1 text-blanco">{T.etapas[etapa]}</span>
          <span style={{ color: estancada(op, ahora) ? COLOR_ESTADO.en_riesgo : "#9C9CA3" }}>{T.tablero.dias.replace("{n}", String(diasEnEtapa(op, ahora)))}</span>
          <span className="text-acero">{T.responsables[o.responsable as keyof typeof T.responsables]}</span>
        </p>
        <h1 className="flex items-center gap-3 font-michroma text-xl uppercase leading-tight tracking-marca text-blanco md:text-3xl">
          <span aria-hidden className="size-3 shrink-0" style={{ background: acento }} />
          {o.negocio}
        </h1>
        <p className="font-plex text-sm text-acero">
          {[o.contacto, o.telefono, o.email, o.ciudad].filter(Boolean).join(" · ") || "—"}
        </p>
        <dl className="grid grid-cols-2 gap-3 font-plex text-xs sm:grid-cols-4">
          <div>
            <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{F.valor}</dt>
            <dd className="mt-1 text-blanco">{valorAnual(op) ? conUnidad(valorAnual(op), "ars") : "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{F.probabilidad}</dt>
            <dd className="mt-1 text-blanco">{o.probabilidad !== null ? `${o.probabilidad} %` : F.deLaEtapa.replace("{n}", String(PROBABILIDAD[etapa]))}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{F.origen}</dt>
            <dd className="mt-1 text-blanco">{T.origenes[o.origen as keyof typeof T.origenes]}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{PANEL_ADMIN.comercial.lista.proximo}</dt>
            <dd className="mt-1 text-blanco">{o.proximo_paso_fecha ? diaLargo(o.proximo_paso_fecha) : "—"} {o.proximo_paso ?? ""}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {o.telefono ? (
            <a href={`tel:${o.telefono.replace(/[^\d+]/g, "")}`} className={boton}>
              {F.llamar}
            </a>
          ) : null}
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={boton}>
              {F.whatsapp}
            </a>
          ) : null}
          {o.email ? (
            <a href={`mailto:${o.email}`} className={boton}>
              {F.email}
            </a>
          ) : null}
          {origen ? (
            <Link href={origen} className={boton}>
              {F.verOrigen}
            </Link>
          ) : null}
          {o.cliente_plantilla_id ? (
            <Link href="/panel/plantillas" className={boton}>
              {F.cliente}
            </Link>
          ) : null}
          {o.etapa === "ganado" || o.etapa === "negociacion" ? (
            <Link href={`/panel/clientes/nuevo?oportunidad=${o.id}`} className={boton}>
              {PANEL_ADMIN.clientesSistema.sinCuenta.alta}
            </Link>
          ) : null}
        </div>
      </header>

      <Bloque titulo={T.actividad.titulo}>
        <FormActividad oportunidadId={o.id} />
      </Bloque>

      <MoverEtapa id={o.id} actual={etapa} />

      <Bloque titulo={F.historial}>
        {actividades.length === 0 ? (
          <p className="font-plex text-sm text-acero">{F.sinHistorial}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {actividades.map((a) => (
              <li key={a.id} className="flex flex-col gap-1 border-l border-profundo pl-3">
                <p className="font-plex text-xs text-blanco">
                  {T.tipos[a.tipo as keyof typeof T.tipos] ?? a.tipo}
                  {a.tipo === "cambio_etapa" && a.etapa_nueva ? `: ${esEtapa(a.etapa_anterior ?? "") ? T.etapas[a.etapa_anterior as Etapa] : "—"} → ${esEtapa(a.etapa_nueva) ? T.etapas[a.etapa_nueva] : a.etapa_nueva}` : ""}
                  <span className="text-acero"> · {nombreDe(a.quien)} · {diaLargo(a.creado_en.slice(0, 10))}</span>
                </p>
                {a.resultado ? <p className="font-lectura text-sm text-acero">{a.resultado}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </Bloque>

      <Bloque titulo={F.datos}>
        <FormOportunidad
          nichos={nichos.filter((n) => n.id !== "otro").map((n) => ({ id: n.id, nombre: n.nombre }))}
          inicial={{
            id: o.id,
            negocio: o.negocio,
            contacto: o.contacto ?? "",
            telefono: o.telefono ?? "",
            email: o.email ?? "",
            nicho: o.nicho_id ?? "",
            ciudad: o.ciudad ?? "",
            valor_abono: o.valor_abono === null ? "" : String(o.valor_abono).replace(".", ","),
            valor_proyecto: o.valor_proyecto === null ? "" : String(o.valor_proyecto).replace(".", ","),
            probabilidad: o.probabilidad === null ? "" : String(o.probabilidad),
            responsable: o.responsable,
            proximo_paso: o.proximo_paso ?? "",
            proximo_paso_fecha: o.proximo_paso_fecha ?? "",
          }}
        />
      </Bloque>
      <Historial tabla="oportunidades" registroId={o.id} />
    </Vista>
  );
}
