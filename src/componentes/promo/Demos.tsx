"use client";

import { useEffect, useRef, useState } from "react";
import { PROMO_TEXTOS } from "@/datos/promo";
import { usoDemo } from "./MedirPromo";

/**
 * Las tres situaciones de la promo como mini demostraciones: el visitante
 * toca y ve qué hace el sistema. Son ilustraciones (lo dice la página),
 * con productos y precios de ejemplo; cuando esté el video, cada una
 * convive con su capítulo.
 *
 * Sin animaciones que dependan de nada más que una transición de color:
 * con "menos movimiento" se ven igual, sin esperas.
 */

const S = PROMO_TEXTOS.situaciones;
const PESOS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/** El marco común: una pantalla apoyada (.pantalla), con su barra de arriba. */
function Marco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="pantalla flex min-h-full flex-col overflow-hidden">
      <p className="flex items-center gap-3 px-4 py-2.5 font-lectura text-sm font-medium text-acero">
        <span aria-hidden className="size-1.5 bg-acero" />
        {titulo}
      </p>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-1 md:p-5 md:pt-1">{children}</div>
    </div>
  );
}

const CLASE_BOTON_CHICO =
  "rounded-full inline-flex h-10 items-center justify-center gap-2 px-5 font-lectura text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

// ─────────────────────────────────────────── Se cortó internet

type Venta = { id: number; hora: string; total: number; estado: "enviada" | "pendiente" | "enviando" };
const TOTALES = [4800, 12350, 2100, 7900, 15600, 3450];

function Wifi({ conectado }: { conectado: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M2.5 9a14 14 0 0 1 19 0" opacity={conectado ? 1 : 0.35} />
      <path d="M5.5 12.5a9.5 9.5 0 0 1 13 0" opacity={conectado ? 1 : 0.35} />
      <path d="M8.5 16a5 5 0 0 1 7 0" opacity={conectado ? 1 : 0.35} />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" />
      {conectado ? null : <path d="M4 4l16 16" />}
    </svg>
  );
}

export function DemoSinInternet() {
  const T = S.sinInternet;
  const [conectado, setConectado] = useState(true);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const siguiente = useRef(0);
  const temporizadores = useRef<number[]>([]);
  useEffect(() => () => temporizadores.current.forEach((t) => window.clearTimeout(t)), []);

  const cobrar = () => {
    usoDemo("sin-internet");
    const n = siguiente.current++;
    const minutos = 42 + n * 3;
    const hora = `${10 + Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, "0")}`;
    const venta: Venta = { id: n, hora, total: TOTALES[n % TOTALES.length], estado: conectado ? "enviada" : "pendiente" };
    setVentas((v) => [venta, ...v].slice(0, 5));
  };

  const alternar = () => {
    usoDemo("sin-internet");
    if (conectado) return setConectado(false);
    setConectado(true);
    // Vuelve la conexión: lo pendiente se manda solo, de a una.
    setVentas((v) => v.map((x): Venta => (x.estado === "pendiente" ? { ...x, estado: "enviando" } : x)));
    const pendientes = ventas.filter((x) => x.estado === "pendiente").map((x) => x.id).reverse();
    pendientes.forEach((id, i) => {
      temporizadores.current.push(
        window.setTimeout(() => setVentas((v) => v.map((x): Venta => (x.id === id ? { ...x, estado: "enviada" } : x))), 500 + i * 450),
      );
    });
  };

  const paraMandar = ventas.filter((x) => x.estado !== "enviada").length;

  return (
    <Marco titulo="Mostrador · Caja 1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`flex items-center gap-2 font-lectura text-sm font-medium ${conectado ? "text-blanco" : "text-[var(--acento)]"}`}>
          <Wifi conectado={conectado} />
          {conectado ? T.conectado : T.cortado}
        </span>
        <button type="button" onClick={alternar} aria-pressed={!conectado} className={`${CLASE_BOTON_CHICO} border border-profundo text-blanco hover:border-acero`}>
          {conectado ? T.cortar : T.volver}
        </button>
      </div>

      <button type="button" onClick={cobrar} className={`${CLASE_BOTON_CHICO} h-12 bg-blanco text-negro hover:bg-acero`}>
        {T.cobrar}
      </button>

      <ul className="flex flex-col gap-1.5" aria-label="Ventas de hoy">
        {ventas.length === 0 ? <li className="font-lectura text-sm text-acero">{T.vacio}</li> : null}
        {ventas.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 rounded-lg bg-profundo/40 px-3 py-2 font-plex text-xs">
            <span className="tabular-nums text-acero">{v.hora}</span>
            <span className="tabular-nums text-blanco">{PESOS.format(v.total)}</span>
            <span className={`flex items-center gap-1.5 ${v.estado === "enviada" ? "text-acero" : "text-blanco"}`}>
              <span aria-hidden className={`size-1.5 ${v.estado === "enviada" ? "bg-acero" : "border border-[var(--acento)]"}`} />
              {v.estado === "enviada" ? T.enviada : v.estado === "enviando" ? T.enviando : T.pendiente}
            </span>
          </li>
        ))}
      </ul>

      <p aria-live="polite" className="mt-auto font-lectura text-sm text-acero">
        {conectado ? (paraMandar > 0 ? T.enviando : ventas.length ? T.estadoConectado : "") : T.estadoCortado.replace("{n}", String(paraMandar))}
      </p>
    </Marco>
  );
}

// ─────────────────────────────────────────── La lista nueva del proveedor

const PRODUCTOS = [
  { nombre: "Disco de corte 115 mm", costo: 1850 },
  { nombre: "Guantes de trabajo", costo: 2400 },
  { nombre: "Cinta métrica 5 m", costo: 5600 },
  { nombre: "Mecha para metal 8 mm", costo: 3100 },
];
const MARGEN = 40;

const PESOS_CENTAVOS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Redondeo = (typeof S.aumento.opciones)[number]["id"];

/** Como el sistema: al múltiplo más cercano, terminado en ,99 o sin redondear. */
function redondear(valor: number, modo: Redondeo) {
  if (modo === "sin") return Math.round(valor * 100) / 100;
  if (modo === "99") return Math.ceil(valor) - 0.01;
  const paso = Number(modo);
  return Math.max(paso, Math.round(valor / paso) * paso);
}
const formatoPrecio = (valor: number, modo: Redondeo) => (modo === "99" || modo === "sin" ? PESOS_CENTAVOS : PESOS).format(valor);

export function DemoAumento() {
  const T = S.aumento;
  const [aumento, setAumento] = useState(12);
  const [modo, setModo] = useState<Redondeo>("10");
  const precio = (costo: number) => redondear(costo * (1 + MARGEN / 100), modo);
  const filas = PRODUCTOS.map((p) => {
    const nuevoCosto = Math.round(p.costo * (1 + aumento / 100));
    return { ...p, nuevoCosto, hoy: redondear(p.costo * (1 + MARGEN / 100), "10"), nuevo: precio(nuevoCosto) };
  });
  const margenPromedio = filas.reduce((suma, f) => suma + (f.nuevo / f.nuevoCosto - 1), 0) / filas.length;

  return (
    <Marco titulo="Precios · Lista del proveedor">
      <label className="flex flex-col gap-3">
        <span className="flex items-baseline justify-between gap-3 font-lectura text-sm text-acero">
          {T.cuanto}
          <span className="titulo text-2xl tabular-nums text-blanco">{aumento} %</span>
        </span>
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={aumento}
          onChange={(e) => {
            usoDemo("aumento");
            setAumento(Number(e.target.value));
          }}
          className="w-full accent-[#ECECEE]"
        />
      </label>

      <label className="flex items-center justify-between gap-3 font-lectura text-sm text-acero">
        {T.redondeo}
        <select
          value={modo}
          onChange={(e) => {
            usoDemo("aumento");
            setModo(e.target.value as Redondeo);
          }}
          className="h-10 rounded-full border border-profundo bg-negro px-4 font-lectura text-sm text-blanco focus:border-acero focus:outline-none"
        >
          {T.opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.texto}
            </option>
          ))}
        </select>
      </label>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[19rem] border-collapse font-plex text-xs">
          <thead>
            <tr className="text-left text-acero">
              <th scope="col" className="py-2 pr-2 font-lectura font-medium">{T.columnas.producto}</th>
              <th scope="col" className="py-2 pr-2 text-right font-lectura font-medium">{T.columnas.hoy}</th>
              <th scope="col" className="py-2 text-right font-lectura font-medium">{T.columnas.nuevo}</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.nombre} className="border-t border-profundo/70">
                <th scope="row" className="py-2 pr-2 text-left font-lectura font-normal text-blanco">
                  {f.nombre}
                  <span className="block font-plex text-[11px] text-acero">
                    {T.columnas.costo}: {PESOS.format(f.nuevoCosto)}
                  </span>
                </th>
                <td className="py-2 pr-2 text-right tabular-nums text-acero">{PESOS.format(f.hoy)}</td>
                <td className="py-2 text-right tabular-nums text-blanco">{formatoPrecio(f.nuevo, modo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-auto flex items-center gap-2 font-lectura text-sm text-acero">
        <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
        {T.margen.replace("{m}", (margenPromedio * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 }))}
      </p>
    </Marco>
  );
}

// ─────────────────────────────────────────── Se está terminando algo

const INICIAL = 12;
const MINIMO = 10;
const IDEAL = 30;
const PRODUCTO = "Disco de corte 115 mm";
const PROVEEDOR = "Distribuidora del Oeste";

export function DemoStock() {
  const T = S.stock;
  const [stock, setStock] = useState(INICIAL);
  const bajo = stock < MINIMO;

  return (
    <Marco titulo="Stock · Depósito">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-lectura text-sm font-medium text-blanco">{PRODUCTO}</span>
        <span className="font-plex text-xs tabular-nums text-acero">{T.minimo.replace("{n}", String(MINIMO))}</span>
      </div>

      {/* El stock como barra, con la marca del mínimo. */}
      <div className="relative h-3 rounded-full bg-profundo/60" aria-hidden>
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-(--duracion-media) ${bajo ? "bg-[var(--acento)]" : "bg-blanco"}`}
          style={{ width: `${(stock / IDEAL) * 100}%` }}
        />
        <span className="absolute -top-1 h-5 w-px bg-acero" style={{ left: `${(MINIMO / IDEAL) * 100}%` }} />
      </div>
      <p className="font-plex text-xs tabular-nums text-blanco">{T.unidades.replace("{n}", String(stock))}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            usoDemo("stock");
            setStock((s) => Math.max(0, s - 1));
          }} disabled={stock === 0} className={`${CLASE_BOTON_CHICO} h-12 bg-blanco text-negro hover:bg-acero`}>
          {T.vender}
        </button>
        <button type="button" onClick={() => setStock(INICIAL)} className={`${CLASE_BOTON_CHICO} h-12 border border-profundo text-blanco hover:border-acero`}>
          {T.reiniciar}
        </button>
      </div>

      <div aria-live="polite" className="mt-auto">
        {bajo ? (
          <div className="flex flex-col gap-2 rounded-xl border border-[var(--acento)]/60 bg-profundo/40 p-3">
            <p className="flex items-center gap-2 font-lectura text-sm font-medium text-blanco">
              <span aria-hidden className="size-2 border border-[var(--acento)]" />
              {T.aviso.replace("{producto}", PRODUCTO)}
            </p>
            <p className="font-lectura text-sm text-acero">{T.pedido.replace("{proveedor}", PROVEEDOR)}</p>
            <p className="font-plex text-xs tabular-nums text-blanco">
              {PRODUCTO} · {T.llevar.replace("{n}", String(IDEAL - stock)).replace("{ideal}", String(IDEAL))}
            </p>
          </div>
        ) : (
          <p className="font-lectura text-sm text-acero">{T.todoBien}</p>
        )}
      </div>
    </Marco>
  );
}
