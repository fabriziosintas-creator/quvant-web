import Link from "next/link";
import type { CSSProperties } from "react";
import { Barras, Bloque, Indicador } from "@/componentes/panel/Graficos";
import { Numero } from "@/componentes/panel/nucleos/comunes";
import { ChipEstado, Anillo } from "@/componentes/panel/objetivos/Piezas";
import { ACENTO_CANAL, AURORA, COLOR_ESTADO, aRgb } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { anomalia, cohortes, dosProporciones, funcionesQueRetienen, holtLineal, percentil, wilson, type Proporcion } from "@/nichos/estadistica";
import type { DatosNicho, EmbudoWeb, SocioNicho } from "@/nichos/tipos";
import { conUnidad } from "@/objetivos/formato";
import type { EstadoMeta } from "@/objetivos/tipos";
import { FUNCIONES_CLAVE, type Plantilla } from "../../../../medicion-sistema/catalogo";
import { ProyeccionMrr } from "./ProyeccionMrr";

/**
 * Las secciones de "Dentro del nicho" que se arman en el servidor (sin
 * JavaScript en el navegador salvo los números que cuentan y el gráfico
 * de proyección). Cada bloque entra con "nicho-entra", uno detrás de otro.
 */

const T = PANEL_ADMIN.nichos;
const pct = (p: number) => `${Math.round(p * 1000) / 10} %`.replace(".", ",");
const entra = (i: number) => ({ className: "nicho-entra", style: { animationDelay: `${i * 90}ms` } as CSSProperties });

const activoHoy = (s: SocioNicho, hoy: string) => s.alta !== null && s.alta <= hoy && (s.baja === null || s.baja > hoy);

// ── 4.1 Pulso ─────────────────────────────────────────────────────────
function tendencia(actual: number, anterior: number) {
  const d = actual - anterior;
  if (d === 0) return T.pulso.sinCambio;
  return T.pulso.vsAnterior.replace("{signo}", d > 0 ? "+" : "−").replace("{n}", String(Math.abs(d)));
}

export function Pulso({ d, acento }: { d: DatosNicho; acento: string }) {
  const P = T.pulso;
  const activos = d.socios.filter((s) => activoHoy(s, d.hoy));
  const mrr = d.mrrMensual.at(-1)?.mrr ?? 0;
  const alEmpezar = d.socios.filter((s) => s.alta !== null && s.alta < d.periodo.desde && (s.baja === null || s.baja >= d.periodo.desde)).length;
  const bajas = d.socios.filter((s) => s.baja !== null && s.baja >= d.periodo.desde && s.baja <= d.hoy).length;
  const saludes = d.socios.flatMap((s) => (s.salud === null ? [] : [s.salud]));
  const e = d.embudo.actual;
  const a = d.embudo.anterior;
  const conversion = e && e.vistas > 0 ? wilson(Math.min(e.registros, e.vistas), e.vistas) : null;
  const visitasPeriodo = d.visitas.length;
  const calientes = d.prospectos.filter((p) => p.estado === "interesado" || p.volver === "si").length;
  return (
    <section aria-label={P.titulo} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div {...entra(0)}><Indicador etiqueta={P.socios} valor={<Numero valor={activos.length} />} acento={acento} detalle={P.fuentes.socios} /></div>
      <div {...entra(1)}><Indicador etiqueta={P.mrr} valor={conUnidad(mrr, "ars")} acento={acento} detalle={P.fuentes.mrr} /></div>
      <div {...entra(2)}><Indicador etiqueta={P.churn} valor={alEmpezar ? pct(bajas / alEmpezar) : "—"} acento={COLOR_ESTADO.atrasado} detalle={P.fuentes.churn} /></div>
      <div {...entra(3)}><Indicador etiqueta={P.salud} valor={saludes.length ? <Numero valor={Math.round(saludes.reduce((s, x) => s + x, 0) / saludes.length)} /> : "—"} acento={COLOR_ESTADO.cumplido} detalle={P.fuentes.salud} /></div>
      <div {...entra(4)}><Indicador etiqueta={P.interesados} valor={<Numero valor={e?.registros ?? 0} />} acento={AURORA[1]} detalle={e && a ? tendencia(e.registros, a.registros) : P.fuentes.interesados} /></div>
      <div {...entra(5)}><Indicador etiqueta={P.conversion} valor={conversion ? pct(conversion.p) : "—"} acento={AURORA[0]} medidor={conversion?.p ?? 0} detalle={conversion ? `${pct(conversion.bajo)} a ${pct(conversion.alto)}${conversion.chica ? ` · ${T.embudo.chica}` : ""}` : P.fuentes.conversion} /></div>
      <div {...entra(6)}><Indicador etiqueta={P.visitasLocales} valor={<Numero valor={visitasPeriodo} />} acento={ACENTO_CANAL.contacto} detalle={P.fuentes.visitasLocales} /></div>
      <div {...entra(7)}><Indicador etiqueta={P.calientes} valor={<Numero valor={calientes} />} acento={AURORA[2]} detalle={P.fuentes.calientes} /></div>
    </section>
  );
}

// ── 4.3 Embudo (Sankey en SVG) ───────────────────────────────────────
type Paso = { etiqueta: string; n: number };

/**
 * Un Sankey horizontal: cada paso es una columna con altura proporcional,
 * unida al siguiente por una banda del ancho de lo que pasa; lo que se
 * pierde cae hacia abajo y se apaga. Las tasas, con Wilson.
 */
function Sankey({ pasos, color, id }: { pasos: Paso[]; color: string; id: string }) {
  const ancho = 720;
  const alto = 220;
  const maximo = Math.max(1, ...pasos.map((p) => p.n));
  const col = 18;
  const hueco = (ancho - col * pasos.length) / Math.max(1, pasos.length - 1);
  const h = (n: number) => Math.max(2, (n / maximo) * (alto - 60));
  const x = (i: number) => i * (col + hueco);
  const arriba = 24;
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto w-full" role="img" aria-labelledby={`${id}-desc`}>
      <desc id={`${id}-desc`}>{pasos.map((p) => `${p.etiqueta}: ${p.n}`).join(". ")}</desc>
      {pasos.slice(0, -1).map((p, i) => {
        const sig = pasos[i + 1];
        const pasa = Math.min(sig.n, p.n);
        const x0 = x(i) + col;
        const x1 = x(i + 1);
        const hPasa = h(pasa);
        const mitad = (x0 + x1) / 2;
        const perdido = h(p.n) - hPasa;
        return (
          <g key={p.etiqueta} className="nicho-entra" style={{ animationDelay: `${300 + i * 140}ms` }}>
            <path d={`M${x0},${arriba} C${mitad},${arriba} ${mitad},${arriba} ${x1},${arriba} L${x1},${arriba + hPasa} C${mitad},${arriba + hPasa} ${mitad},${arriba + hPasa} ${x0},${arriba + hPasa} Z`} fill={color} fillOpacity="0.28" />
            {perdido > 1 ? (
              <path d={`M${x0},${arriba + hPasa} C${mitad},${arriba + hPasa} ${mitad},${alto - 18} ${mitad + 30},${alto - 18} L${mitad + 30},${alto - 16} C${mitad},${alto - 16} ${mitad},${arriba + hPasa + perdido} ${x0},${arriba + hPasa + perdido} Z`} fill="#26262B" fillOpacity="0.7" />
            ) : null}
          </g>
        );
      })}
      {pasos.map((p, i) => (
        <g key={p.etiqueta} className="nicho-entra" style={{ animationDelay: `${i * 140}ms` }}>
          <rect x={x(i)} y={arriba} width={col} height={h(p.n)} fill={color} />
          <text x={x(i) + col / 2} y={14} textAnchor="middle" className="fill-blanco font-plex text-[12px]">
            {p.n}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TasaPaso({ de, a, etiqueta }: { de: number; a: number; etiqueta: string }) {
  const w: Proporcion | null = de > 0 ? wilson(Math.min(a, de), de) : null;
  return (
    <li className="flex flex-col gap-0.5 font-plex text-xs">
      <span className="text-acero">{etiqueta}</span>
      <span className="tabular-nums text-blanco">
        {w ? T.embudo.tasa.replace("{p}", pct(w.p)).replace("{bajo}", pct(w.bajo)).replace("{alto}", pct(w.alto)) : T.embudo.sinDatos}
        {w?.chica ? <span className="ml-2 text-acero/80">· {T.embudo.chica}</span> : null}
      </span>
    </li>
  );
}

export function Embudo({ d, acento }: { d: DatosNicho; acento: string }) {
  const E = T.embudo;
  const e: EmbudoWeb = d.embudo.actual ?? { vistas: 0, demos: 0, contacto: 0, inicios: 0, registros: 0, confirmados: 0 };
  const a = d.embudo.anterior;
  const web: Paso[] = [
    { etiqueta: E.pasos.vistas, n: e.vistas },
    { etiqueta: E.pasos.demos, n: e.demos },
    { etiqueta: E.pasos.inicios, n: e.inicios },
    { etiqueta: E.pasos.registros, n: e.registros },
    { etiqueta: E.pasos.confirmados, n: e.confirmados },
  ];
  const visitados = d.prospectos.filter((p) => p.visitas > 0).length;
  const interesados = d.prospectos.filter((p) => p.estado === "interesado" || p.estado === "cliente").length;
  const socios = d.prospectos.filter((p) => p.estado === "cliente").length;
  const calle: Paso[] = [
    { etiqueta: E.pasos.prospectos, n: d.prospectos.length },
    { etiqueta: E.pasos.visitados, n: visitados },
    { etiqueta: E.pasos.interesados, n: interesados },
    { etiqueta: E.pasos.socios, n: socios },
  ];
  const comparacion = a ? dosProporciones(Math.min(a.registros, a.vistas), a.vistas, Math.min(e.registros, e.vistas), e.vistas) : null;
  const sePasa = e.registros > e.inicios || e.inicios > e.vistas;
  return (
    <Bloque titulo={E.titulo} nota={E.nota}>
      <div className="grid gap-4 lg:grid-cols-2">
        <figure className="flex flex-col gap-3 border border-profundo p-4">
          <figcaption className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{E.web}</figcaption>
          <Sankey id="sankey-web" pasos={web} color={acento} />
          <ul className="grid grid-cols-2 gap-3">
            <TasaPaso de={e.vistas} a={e.demos} etiqueta={`${E.pasos.vistas} → ${E.pasos.demos}`} />
            <TasaPaso de={e.vistas} a={e.registros} etiqueta={`${E.pasos.vistas} → ${E.pasos.registros}`} />
            <TasaPaso de={e.inicios} a={e.registros} etiqueta={`${E.pasos.inicios} → ${E.pasos.registros}`} />
            <TasaPaso de={e.registros} a={e.confirmados} etiqueta={`${E.pasos.registros} → ${E.pasos.confirmados}`} />
          </ul>
          {sePasa ? <p className="font-plex text-[11px] text-acero">{E.mayorQueAntes}</p> : null}
          {comparacion ? (
            <p className="flex flex-wrap items-center gap-2 font-plex text-xs">
              <span className="text-acero">{E.comparacion}:</span>
              <span style={{ color: comparacion.veredicto === "mejoro" ? COLOR_ESTADO.cumplido : comparacion.veredicto === "empeoro" ? COLOR_ESTADO.atrasado : "#9C9CA3" }}>{E.veredictos[comparacion.veredicto]}</span>
              {comparacion.veredicto !== "sin_datos" ? <span className="text-acero/70">(p = {comparacion.pValor.toFixed(3).replace(".", ",")})</span> : null}
            </p>
          ) : null}
        </figure>
        <figure className="flex flex-col gap-3 border border-profundo p-4">
          <figcaption className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{E.calle}</figcaption>
          <Sankey id="sankey-calle" pasos={calle} color={ACENTO_CANAL.contacto} />
          <ul className="grid grid-cols-2 gap-3">
            <TasaPaso de={d.prospectos.length} a={visitados} etiqueta={`${E.pasos.prospectos} → ${E.pasos.visitados}`} />
            <TasaPaso de={visitados} a={interesados} etiqueta={`${E.pasos.visitados} → ${E.pasos.interesados}`} />
            <TasaPaso de={interesados} a={socios} etiqueta={`${E.pasos.interesados} → ${E.pasos.socios}`} />
          </ul>
        </figure>
      </div>
    </Bloque>
  );
}

// ── Cohortes y tiempos ───────────────────────────────────────────────
export function Cohortes({ d, acento }: { d: DatosNicho; acento: string }) {
  const C = T.cohortes;
  const filas = cohortes(d.socios.filter((s) => s.alta !== null).map((s) => ({ alta: s.alta!, baja: s.baja })), d.hoy);
  const desfases = [1, 2, 3, 6];
  return (
    <Bloque titulo={C.titulo} nota={C.nota}>
      {filas.length === 0 ? (
        <p className="font-plex text-sm text-acero">{C.vacio}</p>
      ) : (
        <div className="overflow-x-auto border border-profundo">
          <table className="w-full min-w-[28rem] border-collapse font-plex text-xs">
            <thead>
              <tr className="text-left text-acero">
                <th scope="col" className="p-3 font-medium uppercase tracking-etiqueta">{C.mes}</th>
                <th scope="col" className="p-3 text-right font-medium uppercase tracking-etiqueta">{C.cuantos}</th>
                {desfases.map((n) => (
                  <th key={n} scope="col" className="p-3 text-right font-medium uppercase tracking-etiqueta">{C.despues.replace("{n}", String(n))}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.mes} className="border-t border-profundo">
                  <th scope="row" className="p-3 text-left font-normal text-blanco">{f.mes.split("-").reverse().join("/")}</th>
                  <td className="p-3 text-right tabular-nums text-acero">{f.tamano}</td>
                  {f.retencion.map((r, i) => (
                    <td key={i} className="p-3 text-right tabular-nums text-blanco" style={{ background: r === null ? undefined : `rgb(${aRgb(acento)} / ${0.08 + 0.5 * r})` }}>
                      {r === null ? <span className="text-acero/50">·</span> : pct(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Bloque>
  );
}

export function Tiempos({ d }: { d: DatosNicho }) {
  const X = T.tiempo;
  const mediana = percentil(d.diasDesdeVisitaHastaAlta, 0.5);
  const p75 = percentil(d.diasDesdeVisitaHastaAlta, 0.75);
  return (
    <Bloque titulo={X.titulo}>
      <div className="flex flex-col gap-2 border border-profundo p-4 font-plex text-sm">
        <p className="text-acero">{X.desdeVisita}</p>
        {mediana === null ? (
          <p className="text-acero">{X.vacio}</p>
        ) : (
          <>
            <p className="font-michroma text-2xl text-blanco">{X.mediana.replace("{n}", String(Math.round(mediana)))}</p>
            <p className="text-acero">{X.p75.replace("{n}", String(Math.round(p75 ?? mediana)))}</p>
          </>
        )}
        <p className="text-xs text-acero/70">{X.registro}</p>
      </div>
    </Bloque>
  );
}

// ── Atención en la web ────────────────────────────────────────────────
export function Atencion({ d, acento }: { d: DatosNicho; acento: string }) {
  const A = T.atencion;
  const de = (tipo: string, nombres: Record<string, string>) =>
    Object.entries(nombres).map(([k, v], i) => ({ id: k, etiqueta: v, valor: d.atencion.find((x) => x.tipo === tipo && x.detalle === k)?.visitas ?? 0, acento: i % 2 ? acento : AURORA[i % AURORA.length] }));
  if (d.atencion.length === 0) {
    return (
      <Bloque titulo={A.titulo}>
        <p className="font-plex text-sm text-acero">{A.vacio}</p>
      </Bloque>
    );
  }
  return (
    <Bloque titulo={A.titulo}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Barras titulo={A.tiempo} filas={de("tiempo_nicho", A.tramos)} />
        <Barras titulo={A.profundidad} filas={de("profundidad_nicho", A.profundidades)} />
        <Barras titulo={A.origen} filas={de("origen", A.origenes)} />
      </div>
    </Bloque>
  );
}

// ── 4.5 Plantilla ────────────────────────────────────────────────────
export function Plantilla({ d, acento }: { d: DatosNicho; acento: string }) {
  const P = T.plantilla;
  const conUso = d.socios.filter((s) => s.conUso);
  const nombres = new Map(d.funcionesClave.length ? FUNCIONES_CLAVE[d.nicho.id as Plantilla].map((f) => [f.id, f.nombre]) : []);
  const retienen = funcionesQueRetienen(
    conUso.map((s) => ({ activo: activoHoy(s, d.hoy) && s.semaforo !== "rojo", usadas: s.funcionesUsadas })),
    d.funcionesClave,
  );
  const estadoDe = (s: SocioNicho, f: string) => (s.funcionesUsadas.includes(f) ? "usada" : s.funcionesSinUsar.includes(f) ? "sin_usar" : "dejo_de_usar");
  return (
    <Bloque titulo={P.titulo}>
      <p className="font-plex text-sm text-blanco">
        {P.demos}: <span className="font-michroma">{d.embudo.actual?.demos ?? 0}</span>
      </p>
      <p className="font-plex text-xs text-acero">{P.demosNota}</p>
      {d.funcionesClave.length === 0 || conUso.length === 0 ? (
        <p className="font-plex text-sm text-acero">{P.sinPlantilla}</p>
      ) : (
        <>
          <p className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{P.adopcion}</p>
          <p className="font-plex text-xs text-acero">{P.adopcionNota}</p>
          <div className="overflow-x-auto border border-profundo">
            <table className="w-full border-collapse font-plex text-[11px]">
              <thead>
                <tr className="text-acero">
                  <th scope="col" className="p-2 text-left font-medium" />
                  {conUso.map((s) => (
                    <th key={s.id} scope="col" className="max-w-24 truncate p-2 text-left font-medium" title={s.nombre}>
                      {s.nombre.replace(" (ejemplo)", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.funcionesClave.map((f) => (
                  <tr key={f} className="border-t border-profundo">
                    <th scope="row" className="max-w-56 p-2 text-left font-normal text-blanco">{nombres.get(f) ?? f}</th>
                    {conUso.map((s) => {
                      const e = estadoDe(s, f);
                      return (
                        <td key={s.id} className="p-2" title={P.estados[e]}>
                          <span aria-label={P.estados[e]} className="block size-3" style={{ background: e === "usada" ? acento : "transparent", border: `1px solid ${e === "dejo_de_usar" ? COLOR_ESTADO.atrasado : e === "usada" ? acento : "#26262B"}` }} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-wrap gap-4 font-plex text-[11px] text-acero">
            {(["usada", "sin_usar", "dejo_de_usar"] as const).map((e) => (
              <li key={e} className="flex items-center gap-2">
                <span aria-hidden className="block size-3" style={{ background: e === "usada" ? acento : "transparent", border: `1px solid ${e === "dejo_de_usar" ? COLOR_ESTADO.atrasado : e === "usada" ? acento : "#26262B"}` }} />
                {P.estados[e]}
              </li>
            ))}
          </ul>
          <Barras
            titulo={P.retienen}
            filas={retienen
              .filter((r) => r.conLaFuncion && r.conLaFuncion.n > 0)
              .map((r) => ({ id: r.funcion, etiqueta: nombres.get(r.funcion) ?? r.funcion, valor: Math.round((r.conLaFuncion?.p ?? 0) * 100), acento, detalle: r.sinLaFuncion ? `sin la función: ${Math.round(r.sinLaFuncion.p * 100)} %` : undefined }))}
            formato={(v) => `${v} %`}
          />
          <p className="font-plex text-xs text-acero">{P.retienenNota}</p>
        </>
      )}
    </Bloque>
  );
}

// ── 4.6 Inteligencia ─────────────────────────────────────────────────
export function Inteligencia({ d, acento }: { d: DatosNicho; acento: string }) {
  const I = T.inteligencia;
  const R = I.reglas;
  // La serie desde el primer mes con MRR (los ceros de antes no son historia).
  const primera = d.mrrMensual.findIndex((m) => m.mrr > 0);
  const serie = primera < 0 ? [] : d.mrrMensual.slice(primera);
  const pronostico = holtLineal(serie.map((m) => m.mrr), 6);
  const anomalias = d.socios.flatMap((s) => {
    const a = anomalia(s.semanas);
    return a ? [{ socio: s, ...a }] : [];
  });

  // Próxima mejor acción: reglas sobre los datos, hasta 5.
  const acciones: string[] = [];
  const dejaron = new Map<string, number>();
  for (const s of d.socios) for (const f of s.dejoDeUsar) dejaron.set(f, (dejaron.get(f) ?? 0) + 1);
  const peor = [...dejaron.entries()].sort((a, b) => b[1] - a[1])[0];
  if (peor && peor[1] >= 2) acciones.push(R.dejoDeUsar.replace("{n}", String(peor[1])).replace("{funcion}", peor[0]));
  for (const s of d.socios.filter((x) => x.semaforo === "rojo").slice(0, 2)) acciones.push(R.riesgo.replace("{nombre}", s.nombre));
  const alertas = d.socios.reduce((sum, s) => sum + s.alertas, 0);
  if (alertas > 0) acciones.push(R.alertas.replace("{n}", String(alertas)));
  const hace14 = new Date(Date.parse(d.hoy) - 14 * 86_400_000).toISOString().slice(0, 10);
  const calientes = d.prospectos.filter((p) => p.estado === "interesado" && (p.ultimaVisita === null || p.ultimaVisita < hace14)).length;
  if (calientes > 0) acciones.push(R.calientes.replace("{n}", String(calientes)));
  const e = d.embudo.actual;
  if (e && e.vistas >= 30 && e.registros / e.vistas < 0.01) acciones.push(R.conversionBaja.replace("{vistas}", String(e.vistas)).replace("{registros}", String(e.registros)));
  if (d.prospectos.length === 0) acciones.push(R.sinProspectos);
  if (d.socios.length === 0) acciones.push(R.sinSocios);

  return (
    <Bloque titulo={I.titulo}>
      <div className="grid gap-4 lg:grid-cols-2">
        <figure className="flex flex-col gap-3 border border-profundo p-4">
          <figcaption className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{I.proyeccion}</figcaption>
          {pronostico ? (
            <>
              <ProyeccionMrr historia={serie} pronostico={pronostico} color={acento} />
              <p className="flex flex-wrap gap-x-5 font-plex text-xs text-acero">
                <span>
                  {I.a3}: <span className="text-blanco">{conUnidad(pronostico.valores[2], "ars")}</span> ({conUnidad(pronostico.bajo[2], "ars")} a {conUnidad(pronostico.alto[2], "ars")})
                </span>
                <span>
                  {I.a6}: <span className="text-blanco">{conUnidad(pronostico.valores[5], "ars")}</span>
                </span>
              </p>
              <p className="font-plex text-[11px] text-acero/80">{I.proyeccionNota}</p>
            </>
          ) : (
            <p className="font-plex text-sm text-acero">{I.sinProyeccion}</p>
          )}
        </figure>
        <div className="flex flex-col gap-3 border border-profundo p-4">
          <p className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{I.acciones}</p>
          <p className="font-plex text-[11px] text-acero/80">{I.accionesNota}</p>
          {acciones.length === 0 ? (
            <p className="font-plex text-sm text-acero">{I.sinAcciones}</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {acciones.slice(0, 5).map((a, i) => (
                <li key={a} className="nicho-entra flex gap-3 font-lectura text-sm text-blanco" style={{ animationDelay: `${i * 80}ms` }}>
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0" style={{ background: acento }} />
                  {a}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 border border-profundo p-4">
          <p className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{I.anomalias}</p>
          <p className="font-plex text-[11px] text-acero/80">{I.anomaliasNota}</p>
          {anomalias.length === 0 ? (
            <p className="font-plex text-sm text-acero">{I.sinAnomalias}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {anomalias.map((a) => (
                <li key={a.socio.id} className="flex items-center justify-between gap-3 font-plex text-xs">
                  <span className="text-blanco">{a.socio.nombre}</span>
                  <span style={{ color: a.tipo === "alza" ? COLOR_ESTADO.cumplido : COLOR_ESTADO.atrasado }}>
                    {a.tipo === "alza" ? I.alza : I.baja} (z = {a.z.toFixed(1).replace(".", ",")})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-3 border border-profundo p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{I.objetivos}</p>
            <Link href={`/panel/objetivos/nueva?nicho=${d.nicho.id}`} className="font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
              + {I.nuevoObjetivo}
            </Link>
          </div>
          {d.objetivos.length === 0 ? (
            <p className="font-plex text-sm text-acero">{I.sinObjetivos}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {d.objetivos.map((o) => (
                <li key={o.id}>
                  <Link href={`/panel/objetivos/${o.id}`} className="flex items-center gap-3 border border-profundo p-2 transition-colors hover:border-acero">
                    <Anillo avance={o.avance} estado={o.estado as EstadoMeta} tamano={40} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate font-lectura text-sm text-blanco">{o.nombre}</span>
                      <span className="font-plex text-[11px] text-acero">
                        {o.valor} / {o.meta}
                      </span>
                    </span>
                    <ChipEstado estado={o.estado as EstadoMeta} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Bloque>
  );
}
