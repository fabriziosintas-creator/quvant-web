import type { Metadata } from "next";
import { Suspense } from "react";
import { Indicador } from "@/componentes/panel/Graficos";
import { TarjetasHoy } from "@/componentes/panel/hoy/TarjetasHoy";
import { Numero } from "@/componentes/panel/nucleos/comunes";
import { ACENTO_CANAL, AURORA } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { armarHoy, resumirDia } from "@/hoy/reglas";
import { conUnidad } from "@/objetivos/formato";
import { cargarHoy } from "@/servidor/hoy/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.hoy;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** 2. "Hoy": la portada del panel. Qué hay que hacer hoy, en orden de urgencia, y el día en números. */
export default function Hoy() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido />
      </Suspense>
    </main>
  );
}

function saludo() {
  const hora = Number(new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hora < 13 ? T.saludos.manana : hora < 20 ? T.saludos.tarde : T.saludos.noche;
}

async function Contenido() {
  const { supabase, perfil } = await exigirAdmin("/panel");
  const entrada = await cargarHoy(supabase, perfil.id);
  const tarjetas = armarHoy(entrada);
  const { urgentes, paraHoy } = resumirDia(tarjetas);
  const enCamino = entrada.objetivos.filter((o) => o.estado === "en_camino" || o.estado === "cumplido").length;
  const n = entrada.numeros;
  const vsAyer = (par: [number, number]) => T.numeros.vsAyer.replace("{n}", String(par[1]));

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-michroma text-2xl uppercase leading-tight tracking-marca text-blanco md:text-3xl">
          {saludo()}, {perfil.nombre}.
        </h1>
        <p className="font-lectura text-base text-acero">
          {(entrada.objetivos.length ? T.resumen : T.resumenSinObjetivos).replace("{u}", String(urgentes)).replace("{h}", String(paraHoy)).replace("{c}", String(enCamino))}
        </p>
      </header>

      <TarjetasHoy tarjetas={tarjetas} mes={entrada.mes} />

      <section aria-label={T.numeros.titulo} className="flex flex-col gap-3">
        <p className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{T.numeros.titulo}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador etiqueta={T.numeros.registros} valor={<Numero valor={n.registros[0]} />} acento={AURORA[1]} detalle={vsAyer(n.registros)} />
          <Indicador etiqueta={T.numeros.visitasWeb} valor={<Numero valor={n.visitasWeb[0]} />} acento={AURORA[0]} detalle={vsAyer(n.visitasWeb)} />
          <Indicador etiqueta={T.numeros.visitasLocales} valor={<Numero valor={n.visitasLocales[0]} />} acento={ACENTO_CANAL.contacto} detalle={vsAyer(n.visitasLocales)} />
          <Indicador etiqueta={T.numeros.cobradoMes} valor={conUnidad(n.cobradoMes, "ars")} acento={AURORA[2]} />
        </div>
      </section>
    </>
  );
}
