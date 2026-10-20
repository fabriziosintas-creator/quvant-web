import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bloque, TituloPanel } from "@/componentes/panel/Graficos";
import { FormPlan } from "@/componentes/panel/objetivos/Formularios";
import { PANEL_ADMIN } from "@/datos/textos";
import { METRICA } from "@/objetivos/catalogo";
import { conUnidad, diaLargo } from "@/objetivos/formato";
import { PLAN_INICIAL, completarDelPlan } from "@/objetivos/plan";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.objetivos;
export const metadata: Metadata = { title: `${T.plan.titulo} · ${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** "Cargar plan inicial": la lista del plan, todo tildado; se destilda lo que no se quiere. No duplica. */
export default function Plan() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Link href="/panel/objetivos" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        {T.detalle.volver}
      </Link>
      <TituloPanel titulo={T.plan.titulo} bajada={T.plan.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido />
      </Suspense>
    </main>
  );
}

async function Contenido() {
  const { supabase } = await exigirAdmin("/panel/objetivos/plan");
  const { data, error } = await supabase.from("metas").select("clave_plan").not("clave_plan", "is", null);
  if (error) return <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.faltaMigracion}</p>;
  const cargadas = new Set((data ?? []).map((m) => m.clave_plan));
  const etapas = ["90_dias", "6_meses", "12_meses"] as const;

  return (
    <FormPlan>
      {etapas.map((etapa) => (
        <Bloque key={etapa} titulo={T.etapas[etapa]}>
          <ul className="flex flex-col gap-2">
            {PLAN_INICIAL.filter((m) => m.etapa === etapa)
              .map(completarDelPlan)
              .map((m) => {
                const ya = cargadas.has(m.clavePlan);
                return (
                  <li key={m.clavePlan}>
                    <label className={`flex items-start gap-3 border border-profundo p-3 transition-colors ${ya ? "opacity-50" : "cursor-pointer hover:border-acero has-[:checked]:border-acero"}`}>
                      <input type="checkbox" name="clave" value={m.clavePlan} defaultChecked={!ya} disabled={ya} className="mt-1 size-4 shrink-0 accent-[#ECECEE]" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="font-lectura text-sm text-blanco">
                          {m.nombre} · <span className="tabular-nums">{m.direccion === "menos_es_mejor" ? "≤ " : ""}{conUnidad(m.meta, m.unidad)}</span>
                        </span>
                        <span className="font-plex text-xs text-acero">
                          {METRICA[m.metrica].nombre} · {T.responsables[m.responsable]} · {diaLargo(m.desde)} → {diaLargo(m.hasta)}
                          {m.descripcion ? ` · ${m.descripcion}` : ""}
                          {ya ? ` · ${T.plan.yaCargada}` : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
          </ul>
        </Bloque>
      ))}
    </FormPlan>
  );
}
