import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, ViewTransition } from "react";
import { FormularioCliente } from "@/componentes/panel/FormularioCliente";
import { Puerta } from "@/componentes/panel/nichos/Puerta";
import { Barras, Bloque, PuntoRubro, TituloPanel } from "@/componentes/panel/Graficos";
import { fecha, numero, pesos, porcentaje } from "@/componentes/panel/formato";
import { ACENTO_NICHO } from "@/datos/colores";
import { PANEL_ADMIN, PLATAFORMAS } from "@/datos/textos";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { borrarCliente, cambiarEstadoCliente } from "@/servidor/panel/clientes";
import {
  RANGOS,
  cargarClientes,
  cargarMetricas,
  cargarNichos,
  leerRango,
  type ClientePlantilla,
  type Metricas,
} from "@/servidor/panel/datos";

const T = PANEL_ADMIN.plantillas;
const acentoDe = (nicho: string) => (nicho in ACENTO_NICHO ? ACENTO_NICHO[nicho as keyof typeof ACENTO_NICHO] : undefined);

export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

type Metrica = keyof typeof T.metricas;
const METRICAS = Object.keys(T.metricas) as Metrica[];
const leerMetrica = (valor: string | string[] | undefined): Metrica => {
  const m = Array.isArray(valor) ? valor[0] : valor;
  return METRICAS.includes(m as Metrica) ? (m as Metrica) : "vistas";
};

/** Una fila por rubro: lo medido en la web más lo cargado a mano. */
type Tarjeta = {
  id: string;
  nombre: string;
  estado: keyof typeof T.estadosRubro;
  tienePlantilla: boolean;
  vistas: number;
  clics_demo: number;
  clics_contacto: number;
  inicios_registro: number;
  registros: number;
  conversion: number;
  clientes: Record<string, number>;
  activos: number;
  abono: number;
};

/** 6.2 Rendimiento de plantillas: qué rubro atrae, cuál convierte y cuál vende. */
export default function Plantillas({ searchParams }: PageProps<"/panel/plantillas">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/plantillas">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/plantillas");
  const parametros = await searchParams;
  const rango = leerRango(parametros);
  const orden = leerMetrica(parametros.orden);
  const [metricas, clientes, nichos] = await Promise.all([cargarMetricas(supabase, rango), cargarClientes(supabase), cargarNichos(supabase)]);

  const tarjetas: Tarjeta[] = nichos
    .filter((n) => n.id !== "otro")
    .map((n) => {
      const m: Metricas = metricas.find((x) => x.nicho_id === n.id) ?? {
        nicho_id: n.id, vistas: 0, clics_demo: 0, clics_contacto: 0, inicios_registro: 0, registros: 0, confirmados: 0,
      };
      const propios = clientes.filter((c) => c.nicho_id === n.id);
      const porEstado: Record<string, number> = {};
      for (const c of propios) porEstado[c.estado] = (porEstado[c.estado] ?? 0) + 1;
      const enLaWeb = PLATAFORMAS.rubros.items.find((item) => item.id === n.id);
      return {
        id: n.id,
        nombre: n.nombre,
        estado: (enLaWeb?.estado ?? "otro") as Tarjeta["estado"],
        tienePlantilla: n.tiene_plantilla,
        vistas: m.vistas,
        clics_demo: m.clics_demo,
        clics_contacto: m.clics_contacto,
        inicios_registro: m.inicios_registro,
        registros: m.registros,
        // Sin visitas medidas suficientes (más registros que visitas: la medición del rubro empezó después), no hay conversión.
        conversion: m.vistas > 0 && m.registros <= m.vistas ? m.registros / m.vistas : 0,
        clientes: porEstado,
        activos: porEstado.activo ?? 0,
        abono: propios.filter((c) => c.estado === "activo").reduce((suma, c) => suma + (c.abono_mensual ?? 0), 0),
      };
    });

  const valorDe = (t: Tarjeta, m: Metrica) => (m === "abono" ? t.abono : m === "activos" ? t.activos : t[m]);
  const ordenadas = [...tarjetas].sort((a, b) => valorDe(b, orden) - valorDe(a, orden) || b.vistas - a.vistas);
  const hayEventos = metricas.some((m) => m.vistas + m.clics_demo + m.clics_contacto + m.inicios_registro + m.registros > 0);
  const sinRubro = metricas.find((m) => m.nicho_id === null);

  const mejor = (m: Metrica) => {
    const t = [...tarjetas].sort((a, b) => valorDe(b, m) - valorDe(a, m))[0];
    return t && valorDe(t, m) > 0 ? t : null;
  };
  const conVistas = tarjetas.filter((t) => t.vistas > 0);
  const menosInteres = conVistas.length > 1 ? [...conVistas].sort((a, b) => a.vistas - b.vistas || a.registros - b.registros)[0] : null;

  const conversionTexto = (t: Tarjeta) => (t.vistas > 0 && t.registros <= t.vistas ? porcentaje(t.registros, t.vistas) : "—");
  const formatoDe = (m: Metrica, t: Tarjeta) =>
    m === "abono" ? pesos(t.abono) : m === "conversion" ? conversionTexto(t) : numero(valorDe(t, m));

  return (
    <>
      {/* Lo que importa, arriba: quién más vende, quién más interesa, quién menos. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Destacado etiqueta={T.destacados.ingresos} tarjeta={mejor("abono")} valor={(t) => `${pesos(t.abono)}/mes`} />
        <Destacado etiqueta={T.destacados.interes} tarjeta={mejor("vistas")} valor={(t) => `${numero(t.vistas)} ${T.metricas.vistas.toLowerCase()}`} />
        <Destacado etiqueta={T.destacados.conversion} tarjeta={mejor("conversion")} valor={conversionTexto} />
        <Destacado etiqueta={T.destacados.menosInteres} tarjeta={menosInteres} valor={(t) => `${numero(t.vistas)} ${T.metricas.vistas.toLowerCase()}`} />
      </div>

      <Bloque titulo={T.comparacion} acciones={<Controles rango={rango} orden={orden} />}>
        {!hayEventos ? <p className="border border-profundo p-5 font-lectura text-sm text-acero">{T.sinEventos}</p> : null}
        <Barras
          titulo={`${T.metricas[orden]} · ${T.rangos[String(rango) as keyof typeof T.rangos]}`}
          filas={ordenadas.map((t) => ({
            id: t.id,
            etiqueta: t.nombre,
            valor: orden === "conversion" ? Math.round(t.conversion * 1000) / 10 : valorDe(t, orden),
            acento: acentoDe(t.id),
            detalle: orden === "conversion" ? `${t.registros}/${t.vistas}` : undefined,
          }))}
          formato={(v) => (orden === "abono" ? pesos(v) : orden === "conversion" ? `${v}%` : numero(v))}
        />
        {sinRubro && sinRubro.clics_contacto > 0 ? (
          <p className="font-plex text-xs text-acero">
            {numero(sinRubro.clics_contacto)} {T.metricas.clics_contacto.toLowerCase()} · {T.sinRubroNota}
          </p>
        ) : null}
      </Bloque>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ordenadas.map((t) => (
          <article key={t.id} className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
            <header className="flex items-start justify-between gap-3">
              {/* Una puerta al nicho: el punto y el nombre se vuelven la cabecera de adentro. */}
              <Puerta nicho={t.id} etiqueta={PANEL_ADMIN.nichos.entrar.replace("{nombre}", t.nombre)} className="group min-w-0">
                <ViewTransition name={`nicho-${t.id}`} share="entrar-nicho" default="none">
                  <h3 className="flex min-w-0 items-center gap-2 break-words font-michroma text-sm uppercase tracking-marca text-blanco transition-colors group-hover:text-acero">
                    <PuntoRubro acento={acentoDe(t.id)} />
                    {t.nombre}
                    <span aria-hidden className="font-plex text-xs text-acero transition-transform group-hover:translate-x-1">→</span>
                  </h3>
                </ViewTransition>
              </Puerta>
              <span className="shrink-0 border border-profundo px-2 py-1 font-plex text-[10px] uppercase tracking-etiqueta text-acero">
                {T.estadosRubro[t.estado]}
              </span>
            </header>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-plex text-xs">
              {(["vistas", "clics_demo", "clics_contacto", "inicios_registro", "registros", "conversion"] as Metrica[]).map((m) => (
                <div key={m} className="flex flex-col gap-1">
                  <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{T.metricas[m]}</dt>
                  <dd className="text-base tabular-nums text-blanco">{formatoDe(m, t)}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-profundo pt-4">
              <p className="mb-2 font-plex text-[10px] uppercase tracking-etiqueta text-acero">{T.clientesPorEstado}</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 font-plex text-xs">
                {Object.entries(T.estadosCliente).map(([id, nombre]) => (
                  <li key={id} className={t.clientes[id] ? "text-blanco" : "text-acero/60"}>
                    {nombre} <span className="tabular-nums">{t.clientes[id] ?? 0}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-plex text-xs text-acero">
                {T.metricas.abono}: <span className="tabular-nums text-blanco">{pesos(t.abono)}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      <Bloque titulo={PANEL_ADMIN.clientes.titulo} nota={PANEL_ADMIN.clientes.bajada}>
        <FormularioCliente nichos={nichos.filter((n) => n.id !== "otro").map((n) => ({ id: n.id, nombre: n.nombre }))} />
        <ListaClientes clientes={clientes} nombreNicho={(id) => nichos.find((n) => n.id === id)?.nombre ?? id} />
      </Bloque>
    </>
  );
}

function Destacado({ etiqueta, tarjeta, valor }: { etiqueta: string; tarjeta: Tarjeta | null; valor: (t: Tarjeta) => string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border border-profundo p-4 md:p-5">
      <p className="font-plex text-[11px] font-medium uppercase leading-snug tracking-etiqueta text-acero">{etiqueta}</p>
      {tarjeta ? (
        <>
          <p className="flex items-center gap-2 font-michroma text-sm uppercase tracking-marca text-blanco md:text-base">
            <PuntoRubro acento={acentoDe(tarjeta.id)} />
            <span className="truncate">{tarjeta.nombre}</span>
          </p>
          <p className="font-plex text-xs tabular-nums text-acero">{valor(tarjeta)}</p>
        </>
      ) : (
        <p className="font-plex text-xs text-acero">{T.destacados.sinDatos}</p>
      )}
    </div>
  );
}

/** Período y métrica, como links: funcionan sin JavaScript y quedan en la dirección. */
function Controles({ rango, orden }: { rango: number; orden: Metrica }) {
  const clase = (activo: boolean) =>
    `inline-flex h-9 items-center border px-3 font-plex text-[11px] font-medium uppercase tracking-etiqueta transition-colors ${
      activo ? "border-blanco text-blanco" : "border-profundo text-acero hover:text-blanco"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex items-center gap-2" role="group" aria-label={T.rango}>
        {RANGOS.map((dias) => (
          <Link key={dias} href={`/panel/plantillas?rango=${dias}&orden=${orden}`} className={clase(dias === rango)} aria-current={dias === rango ? "true" : undefined}>
            {T.rangos[String(dias) as keyof typeof T.rangos]}
          </Link>
        ))}
      </div>
      <form method="get" className="flex items-center gap-2">
        <input type="hidden" name="rango" value={rango} />
        <label htmlFor="orden" className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">
          {T.ordenar}
        </label>
        <select
          id="orden"
          name="orden"
          defaultValue={orden}
          className="h-9 border border-profundo bg-negro px-2 font-plex text-xs text-blanco focus:border-acero focus:outline-none"
        >
          {METRICAS.map((m) => (
            <option key={m} value={m}>
              {T.metricas[m]}
            </option>
          ))}
        </select>
        <button type="submit" className="h-9 border border-profundo px-3 font-plex text-[11px] uppercase tracking-etiqueta text-blanco hover:border-acero">
          {T.aplicar}
        </button>
      </form>
    </div>
  );
}

function ListaClientes({ clientes, nombreNicho }: { clientes: ClientePlantilla[]; nombreNicho: (id: string) => string }) {
  const C = PANEL_ADMIN.clientes;
  if (clientes.length === 0) return <p className="border border-profundo p-5 font-lectura text-sm text-acero">{C.vacio}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {clientes.map((c) => (
        <li key={c.id} className="flex flex-col gap-3 border border-profundo p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-lectura text-[15px] font-semibold text-blanco">{c.empresa}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-plex text-xs text-acero">
              <span className="flex items-center gap-2">
                <PuntoRubro acento={acentoDe(c.nicho_id)} />
                {nombreNicho(c.nicho_id)}
              </span>
              <span>{fecha(c.fecha)}</span>
              {c.abono_mensual ? <span className="tabular-nums">{pesos(c.abono_mensual)}/mes</span> : null}
              {c.es_prueba ? <span className="border border-profundo px-1.5 py-0.5 text-[10px] uppercase tracking-etiqueta">prueba</span> : null}
            </p>
            {c.notas ? <p className="font-lectura text-sm text-acero">{c.notas}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <form action={cambiarEstadoCliente} className="flex items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <select
                name="estado"
                defaultValue={c.estado}
                aria-label={C.cambiarEstado}
                className="h-9 border border-profundo bg-negro px-2 font-plex text-xs text-blanco focus:border-acero focus:outline-none"
              >
                {Object.entries(PANEL_ADMIN.plantillas.estadosCliente).map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </select>
              <button type="submit" className="h-9 border border-profundo px-3 font-plex text-[11px] uppercase tracking-etiqueta text-blanco hover:border-acero">
                {C.cambiarEstado}
              </button>
            </form>
            <form action={borrarCliente}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" className="h-9 px-2 font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
                {C.borrar}
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
