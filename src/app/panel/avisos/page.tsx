import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { agrupar, TIPOS_AVISO, type TipoAviso } from "@/avisos/avisos";
import { TituloPanel } from "@/componentes/panel/Graficos";
import { PreferenciasAvisos } from "@/componentes/panel/avisos/PreferenciasAvisos";
import { PANEL_ADMIN } from "@/datos/textos";
import { canalAvisos } from "@/servidor/chat/whatsapp";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.avisos;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const POR_DEFECTO_WHATSAPP: TipoAviso[] = ["registro", "chat", "alerta_roja", "copia_detectada"];
const esTipo = (t: string): t is TipoAviso => (TIPOS_AVISO as readonly string[]).includes(t);

/** Las preferencias de avisos de cada socio y los últimos avisos, todos juntos. */
export default function Avisos() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.pagina.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido />
      </Suspense>
    </main>
  );
}

async function Contenido() {
  const { supabase, perfil } = await exigirAdmin("/panel/avisos");
  const [preferencias, avisos] = await Promise.all([
    supabase.from("avisos_preferencias").select("apagados, por_whatsapp").eq("perfil_id", perfil.id).maybeSingle(),
    supabase.from("avisos").select("id, tipo, titulo, texto, enlace, prioridad, creado_en").eq("es_prueba", false).order("creado_en", { ascending: false }).limit(100),
  ]);
  if (avisos.error) return <p className="border border-profundo p-4 font-plex text-sm text-acero">{T.pagina.falta}</p>;
  const apagados = (preferencias.data?.apagados ?? []).filter(esTipo);
  const porWhatsapp = preferencias.data ? preferencias.data.por_whatsapp.filter(esTipo) : POR_DEFECTO_WHATSAPP;
  const lista = (avisos.data ?? []).filter((a) => esTipo(a.tipo)).map((a) => ({ ...a, tipo: a.tipo as TipoAviso, creadoEn: a.creado_en }));
  // La hora se calcula en el servidor al pedir la página (dinámica: depende de la sesión).
  const ahora = new Date().toISOString();

  return (
    <>
      <PreferenciasAvisos apagados={apagados} porWhatsapp={porWhatsapp} hayCanal={canalAvisos() !== "ninguno"} />
      <section className="flex flex-col gap-4">
        <h2 className="font-michroma text-sm uppercase tracking-etiqueta text-blanco">{T.pagina.recientes}</h2>
        {lista.length === 0 ? (
          <p className="font-plex text-sm text-acero">{T.vacio}</p>
        ) : (
          agrupar(lista, ahora).map((g) => (
            <div key={g.grupo} className="flex flex-col gap-1">
              <p className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">{T.grupos[g.grupo]}</p>
              <ul className="flex flex-col">
                {g.avisos.map((a) => (
                  <li key={a.id} className="border-b border-profundo/60 py-2">
                    <Link href={a.enlace ?? "/panel"} className="flex flex-col gap-0.5 hover:text-blanco">
                      <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">
                        {T.tipos[a.tipo]} · {new Date(a.creadoEn).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })}
                      </span>
                      <span className="font-lectura text-sm text-blanco">{a.titulo}</span>
                      {a.texto ? <span className="font-plex text-xs text-acero">{a.texto}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
