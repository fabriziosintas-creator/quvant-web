"use client";

import Image from "next/image";
import {
  ViewTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { ACENTO_CANAL } from "@/datos/colores";
import { TIPOS, type Proyecto, type VistaProyecto } from "@/datos/portfolio";
import { WEBS } from "@/datos/textos";
import { CONSULTA_ANGOSTA, direccionCorta, dosDigitos, useConsulta } from "./comun";

type Dispositivo = "escritorio" | "celular";
type Modo = "captura" | "vivo";

type Props = {
  proyecto: Proyecto;
  numero: number;
  total: number;
  onCerrar: () => void;
  onMover: (paso: 1 | -1) => void;
};

const TEXTOS = WEBS.visor;
/** El fondo del visor solo se funde al abrir y cerrar, no al cambiar de proyecto. */
const FONDO_ENTRA = { visor: "visor-entra", default: "none" };
const FONDO_SALE = { visor: "visor-sale", default: "none" };
const PASO = { "paso-adelante": "paso-adelante", "paso-atras": "paso-atras", default: "none" };
/** Las medidas de referencia de cada dispositivo (las de las capturas). */
const BASE = { escritorio: 1440, celular: 390 } as const;

/**
 * El visor del portfolio: la web elegida a pantalla completa, para
 * recorrerla por dentro. Muestra la captura de la página entera (con
 * scroll, en escritorio o en celular) y, si el sitio se deja, la versión en
 * vivo dentro de un iframe escalado a la medida real.
 *
 * Se monta en <body> y deja inerte el resto de la página mientras está
 * abierto: el foco no se escapa, Esc cierra y las flechas cambian de
 * proyecto. En pantallas anchas los datos van al costado; en el celular,
 * en una hoja que sube desde abajo.
 */
export function VisorProyecto({ proyecto, numero, total, onCerrar, onMover }: Props) {
  const angosta = useConsulta(CONSULTA_ANGOSTA);
  const ancha = useConsulta("(min-width: 1024px)");
  const inicial = (p: Proyecto): Dispositivo => (p.formato === "celular" || angosta ? "celular" : "escritorio");

  const [idPrevio, setIdPrevio] = useState(proyecto.id);
  const [dispositivo, setDispositivo] = useState<Dispositivo>(() => inicial(proyecto));
  const [modo, setModo] = useState<Modo>(proyecto.embebible ? "vivo" : "captura");
  const [indiceVista, setIndiceVista] = useState(0);
  const [hoja, setHoja] = useState(false);

  // Cada proyecto arranca como mejor se luce (se ajusta durante el render,
  // sin un efecto que pinte primero el estado viejo).
  if (idPrevio !== proyecto.id) {
    setIdPrevio(proyecto.id);
    setDispositivo(inicial(proyecto));
    setModo(proyecto.embebible ? "vivo" : "captura");
    setIndiceVista(0);
  }

  const vista = proyecto.vistas[Math.min(indiceVista, proyecto.vistas.length - 1)];
  const cerrar = useRef<HTMLButtonElement>(null);

  // Mientras está abierto: la página de atrás queda quieta e inerte.
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.add("visor-abierto");
    const fondo = Array.from(document.querySelectorAll<HTMLElement>("#contenido, body > header, body > footer"));
    for (const elemento of fondo) elemento.inert = true;
    cerrar.current?.focus({ preventScroll: true });
    return () => {
      raiz.classList.remove("visor-abierto");
      for (const elemento of fondo) elemento.inert = false;
    };
  }, []);

  // El último valor de las funciones, para no volver a escuchar el teclado en cada render.
  const acciones = useRef({ onCerrar, onMover });
  useLayoutEffect(() => {
    acciones.current = { onCerrar, onMover };
  });

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        acciones.current.onCerrar();
      } else if (evento.key === "ArrowRight" || evento.key === "ArrowLeft") {
        const destino = evento.target as HTMLElement | null;
        if (destino?.closest("[role='radiogroup']")) return;
        evento.preventDefault();
        acciones.current.onMover(evento.key === "ArrowRight" ? 1 : -1);
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, []);

  const detalle = (
    <Detalle
      proyecto={proyecto}
      vista={vista}
      indiceVista={indiceVista}
      onVista={setIndiceVista}
    />
  );

  return createPortal(
    <ViewTransition enter={FONDO_ENTRA} exit={FONDO_SALE} default="none">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${TEXTOS.etiqueta}: ${proyecto.nombre}`}
        data-lenis-prevent
        className="fixed inset-0 z-[70] flex flex-col bg-negro/92 backdrop-blur-md"
        style={{ "--acento": ACENTO_CANAL.trabajos } as CSSProperties}
      >
        {/* Arriba: dónde estás, anterior y siguiente, cerrar. */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-profundo px-4 md:h-16 md:px-6">
          <p className="flex min-w-0 items-center gap-3 font-plex text-[11px] uppercase tracking-etiqueta text-acero">
            <span aria-hidden className="size-1.5 shrink-0 bg-[var(--acento)]" />
            <span className="shrink-0 text-blanco">
              {dosDigitos(numero)} / {dosDigitos(total)}
            </span>
            <span className="truncate">{proyecto.nombre}</span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <BotonIcono etiqueta={TEXTOS.anterior} onClick={() => onMover(-1)}>
              ←
            </BotonIcono>
            <BotonIcono etiqueta={TEXTOS.siguiente} onClick={() => onMover(1)}>
              →
            </BotonIcono>
            <BotonIcono etiqueta={TEXTOS.cerrar} onClick={onCerrar} botonRef={cerrar} marcado>
              ✕
            </BotonIcono>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 gap-6 p-3 md:p-6">
          <ViewTransition
            key={proyecto.id}
            name={`pantalla-${proyecto.id}`}
            share="morph-web"
            enter={PASO}
            exit={PASO}
            default="none"
          >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-profundo bg-negro">
              <BarraNavegador
                proyecto={proyecto}
                vista={vista}
                dispositivo={dispositivo}
                onDispositivo={setDispositivo}
                modo={modo}
                onModo={setModo}
              />
              <Pantalla
                key={`${vista.id}-${dispositivo}-${modo}`}
                proyecto={proyecto}
                vista={vista}
                dispositivo={dispositivo}
                modo={modo}
                angosta={angosta}
              />
            </div>
          </ViewTransition>

          {ancha ? (
            <aside className="flex w-[21rem] shrink-0 flex-col overflow-y-auto border-l border-profundo pl-6 xl:w-[23rem]">
              {detalle}
            </aside>
          ) : null}
        </div>

        {/* En pantallas angostas los datos van en una hoja que sube por
            encima de la pantalla (sin achicarla: el sitio no se reacomoda). */}
        {!ancha ? (
          <div className="relative z-10 shrink-0 border-t border-profundo bg-negro">
            {hoja ? (
              <button
                type="button"
                aria-label={TEXTOS.cerrar}
                tabIndex={-1}
                onClick={() => setHoja(false)}
                className="fixed inset-0 -z-10 bg-negro/60"
              />
            ) : null}
            <div
              id="visor-hoja"
              hidden={!hoja}
              className="absolute inset-x-0 bottom-full max-h-[65svh] overflow-y-auto border-t border-profundo bg-negro px-4 pb-8 pt-5 shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.9)] motion-safe:animate-[burbuja_0.35s_cubic-bezier(0.2,0.8,0.2,1)_both]"
            >
              {detalle}
            </div>
            <button
              type="button"
              onClick={() => setHoja((abierta) => !abierta)}
              aria-expanded={hoja}
              aria-controls="visor-hoja"
              className="flex w-full items-center justify-between px-4 py-3.5 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-blanco"
            >
              <span className="flex items-center gap-3">
                <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
                {TEXTOS.sobre}
              </span>
              <span aria-hidden className={`transition-transform duration-300 ${hoja ? "rotate-180" : ""}`}>
                ↑
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </ViewTransition>,
    document.body,
  );
}

function BotonIcono({
  etiqueta,
  onClick,
  children,
  botonRef,
  marcado = false,
}: {
  etiqueta: string;
  onClick: () => void;
  children: ReactNode;
  botonRef?: Ref<HTMLButtonElement>;
  marcado?: boolean;
}) {
  return (
    <button
      ref={botonRef}
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className={`flex size-9 items-center justify-center border font-plex text-sm transition-colors md:size-10 ${
        marcado
          ? "border-blanco bg-blanco text-negro hover:bg-acero"
          : "border-profundo text-blanco hover:border-[var(--acento)]"
      }`}
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}

/** Un selector de dos o más opciones, accesible como grupo de radios. */
function Selector<T extends string>({
  etiqueta,
  valor,
  opciones,
  onCambio,
}: {
  etiqueta: string;
  valor: T;
  opciones: readonly { valor: T; texto: string }[];
  onCambio: (valor: T) => void;
}) {
  const botones = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex shrink-0 border border-profundo p-0.5">
      {opciones.map((opcion, indice) => {
        const activa = opcion.valor === valor;
        return (
          <button
            key={opcion.valor}
            ref={(elemento) => {
              botones.current[indice] = elemento;
            }}
            type="button"
            role="radio"
            aria-checked={activa}
            tabIndex={activa ? 0 : -1}
            onClick={() => onCambio(opcion.valor)}
            onKeyDown={(evento) => {
              if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
              evento.preventDefault();
              const paso = evento.key === "ArrowRight" ? 1 : -1;
              const destino = (indice + paso + opciones.length) % opciones.length;
              onCambio(opciones[destino].valor);
              botones.current[destino]?.focus();
            }}
            className={`px-2.5 py-1.5 font-plex text-[11px] font-medium uppercase tracking-etiqueta transition-colors ${
              activa ? "bg-blanco text-negro" : "text-acero hover:text-blanco"
            }`}
          >
            {opcion.texto}
          </button>
        );
      })}
    </div>
  );
}

function BarraNavegador({
  proyecto,
  vista,
  dispositivo,
  onDispositivo,
  modo,
  onModo,
}: {
  proyecto: Proyecto;
  vista: VistaProyecto;
  dispositivo: Dispositivo;
  onDispositivo: (valor: Dispositivo) => void;
  modo: Modo;
  onModo: (valor: Modo) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-profundo px-3 py-2.5 md:px-4">
      <span aria-hidden className="hidden gap-1.5 sm:flex">
        <span className="size-1.5 bg-[var(--acento)]" />
        <span className="size-1.5 bg-profundo" />
        <span className="size-1.5 bg-profundo" />
      </span>
      <a
        href={vista.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex min-w-0 flex-1 basis-40 items-center justify-center gap-2 rounded-full bg-profundo/70 px-3 py-1.5 font-plex text-[11px] text-acero transition-colors hover:text-blanco"
      >
        <span className="truncate">{direccionCorta(vista.url)}</span>
        <span aria-hidden className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          ↗
        </span>
        <span className="sr-only">({TEXTOS.abrir})</span>
      </a>
      <div className="flex items-center gap-2">
        {proyecto.embebible ? (
          <Selector
            etiqueta={TEXTOS.modo}
            valor={modo}
            onCambio={onModo}
            opciones={[
              { valor: "vivo", texto: TEXTOS.enVivo },
              { valor: "captura", texto: TEXTOS.captura },
            ]}
          />
        ) : (
          <span className="border border-profundo px-2.5 py-1.5 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
            {TEXTOS.captura}
          </span>
        )}
        <Selector
          etiqueta={TEXTOS.dispositivo}
          valor={dispositivo}
          onCambio={onDispositivo}
          opciones={[
            { valor: "escritorio", texto: TEXTOS.escritorio },
            { valor: "celular", texto: TEXTOS.celular },
          ]}
        />
      </div>
    </div>
  );
}

/**
 * Lo que se ve dentro de la ventana. En escritorio ocupa todo el ancho;
 * en celular (con pantalla ancha) va dentro de un teléfono centrado.
 */
function Pantalla({
  proyecto,
  vista,
  dispositivo,
  modo,
  angosta,
}: {
  proyecto: Proyecto;
  vista: VistaProyecto;
  dispositivo: Dispositivo;
  modo: Modo;
  angosta: boolean;
}) {
  const enTelefono = dispositivo === "celular" && !angosta;
  const contenido =
    modo === "vivo" ? (
      <EnVivo proyecto={proyecto} vista={vista} dispositivo={dispositivo} />
    ) : (
      <Captura vista={vista} dispositivo={dispositivo} />
    );

  if (!enTelefono) return <div className="relative min-h-0 flex-1">{contenido}</div>;

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 md:p-6">
      {/* El resplandor del proyecto, detrás del teléfono. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 40% 55% at 50% 55%, color-mix(in srgb, var(--acento) 18%, transparent), transparent 70%)" }}
      />
      <div className="relative h-full max-h-[844px] overflow-hidden rounded-[28px] border-[6px] border-profundo bg-negro shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] aspect-[390/844]">
        {contenido}
      </div>
    </div>
  );
}

/** La página completa en capturas, con scroll, progreso y recorrido automático. */
function Captura({ vista, dispositivo }: { vista: VistaProyecto; dispositivo: Dispositivo }) {
  const desplazable = useRef<HTMLDivElement>(null);
  const barra = useRef<HTMLDivElement>(null);
  const [recorriendo, setRecorriendo] = useState(false);
  const partes = dispositivo === "escritorio" ? vista.escritorio : vista.celular;

  const alDesplazar = () => {
    const caja = desplazable.current;
    if (!caja || !barra.current) return;
    const recorrido = caja.scrollHeight - caja.clientHeight;
    barra.current.style.setProperty("--progreso", recorrido > 0 ? String(caja.scrollTop / recorrido) : "1");
  };

  // Recorrer sola: baja a velocidad pareja hasta el final o hasta que la
  // persona toque, use la rueda o el teclado.
  useEffect(() => {
    const caja = desplazable.current;
    if (!recorriendo || !caja) return;
    let cuadro = 0;
    let antes = performance.now();
    const paso = (ahora: number) => {
      const velocidad = caja.clientHeight * 0.45; // px por segundo
      caja.scrollTop += ((ahora - antes) / 1000) * velocidad;
      antes = ahora;
      if (caja.scrollTop + caja.clientHeight >= caja.scrollHeight - 1) {
        setRecorriendo(false);
        return;
      }
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    const frenar = () => setRecorriendo(false);
    const opciones = { passive: true } as const;
    caja.addEventListener("wheel", frenar, opciones);
    caja.addEventListener("touchstart", frenar, opciones);
    caja.addEventListener("keydown", frenar);
    return () => {
      cancelAnimationFrame(cuadro);
      caja.removeEventListener("wheel", frenar);
      caja.removeEventListener("touchstart", frenar);
      caja.removeEventListener("keydown", frenar);
    };
  }, [recorriendo]);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={barra} aria-hidden className="h-[2px] shrink-0 bg-profundo">
        <div className="visor-progreso h-full bg-[var(--acento)]" />
      </div>
      <div
        ref={desplazable}
        onScroll={alDesplazar}
        tabIndex={0}
        aria-label={TEXTOS.notaCaptura}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
      >
        {partes.map((parte, indice) => (
          <Image
            key={parte.src}
            src={parte.src}
            alt={
              indice === 0
                ? `Captura de ${direccionCorta(vista.url)} en ${dispositivo === "escritorio" ? "escritorio" : "celular"}`
                : ""
            }
            width={parte.ancho}
            height={parte.alto}
            sizes={dispositivo === "escritorio" ? "(min-width: 1024px) 70vw, 100vw" : "(min-width: 768px) 390px, 100vw"}
            loading={indice === 0 ? "eager" : "lazy"}
            className="block h-auto w-full"
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRecorriendo((sigue) => !sigue)}
        aria-pressed={recorriendo}
        className="absolute bottom-3 right-3 flex items-center gap-2 border border-profundo bg-negro/85 px-3 py-2 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-blanco backdrop-blur-sm transition-colors hover:border-[var(--acento)]"
      >
        <span aria-hidden className={`size-1.5 ${recorriendo ? "bg-[var(--acento)] motion-safe:animate-[parpadeo_1s_steps(2,end)_infinite]" : "bg-blanco"}`} />
        {recorriendo ? TEXTOS.detener : TEXTOS.recorrer}
      </button>
    </div>
  );
}

/**
 * El sitio de verdad en un iframe, dibujado a su medida real (1440 o 390
 * px de ancho) y achicado para entrar en la ventana. Mientras carga se ve
 * la captura de la primera pantalla.
 */
function EnVivo({ proyecto, vista, dispositivo }: { proyecto: Proyecto; vista: VistaProyecto; dispositivo: Dispositivo }) {
  const caja = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ ancho: 0, alto: 0 });
  const [cargado, setCargado] = useState(false);

  useLayoutEffect(() => {
    const elemento = caja.current;
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) => {
      setMedida({ ancho: entrada.contentRect.width, alto: entrada.contentRect.height });
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const base = BASE[dispositivo];
  const escala = medida.ancho > 0 ? Math.min(1, medida.ancho / base) : 1;
  const ancho = medida.ancho >= base ? medida.ancho : base;
  const portada = dispositivo === "escritorio" ? vista.portada : vista.portadaCelular;

  return (
    <div ref={caja} className="absolute inset-0 overflow-hidden bg-negro">
      {/* Arriba y a todo el ancho, como va a quedar el sitio: sin recortar los costados. */}
      <Image
        src={portada.src}
        alt=""
        width={portada.ancho}
        height={portada.alto}
        sizes="70vw"
        className={`absolute inset-x-0 top-0 h-auto w-full transition-opacity duration-500 ${cargado ? "opacity-0" : "opacity-100"}`}
      />
      {medida.ancho > 0 ? (
        <iframe
          src={vista.url}
          title={`${proyecto.nombre}, en vivo`}
          onLoad={() => setCargado(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
          className={`absolute left-0 top-0 origin-top-left border-0 bg-blanco transition-opacity duration-500 ${
            cargado ? "opacity-100" : "opacity-0"
          }`}
          style={{ width: ancho, height: medida.alto / escala, transform: `scale(${escala})` }}
        />
      ) : null}
      {!cargado ? (
        <p className="absolute bottom-3 left-3 flex items-center gap-2 border border-profundo bg-negro/85 px-3 py-2 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-blanco backdrop-blur-sm">
          <span aria-hidden className="size-1.5 bg-[var(--acento)] motion-safe:animate-[parpadeo_1s_steps(2,end)_infinite]" />
          {TEXTOS.cargando}
        </p>
      ) : null}
    </div>
  );
}

/** Los datos del proyecto: al costado en pantallas anchas, en la hoja en el celular. */
function Detalle({
  proyecto,
  vista,
  indiceVista,
  onVista,
}: {
  proyecto: Proyecto;
  vista: VistaProyecto;
  indiceVista: number;
  onVista: (indice: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <p className="flex items-center gap-3 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
        <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
        {TIPOS[proyecto.tipo].singular} · {proyecto.rubro}
      </p>
      <h2 className="mt-3 titulo text-2xl leading-tight text-blanco">{proyecto.nombre}</h2>
      <p className="mt-1.5 font-plex text-xs text-acero">{proyecto.cliente}</p>
      <p className="mt-5 font-lectura text-[15px] leading-relaxed text-blanco">{proyecto.resumen}</p>

      {proyecto.vistas.length > 1 ? (
        <div className="mt-6">
          <p className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
            {TEXTOS.paginas}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {proyecto.vistas.map((otra, indice) => (
              <button
                key={otra.id}
                type="button"
                aria-pressed={indice === indiceVista}
                onClick={() => onVista(indice)}
                className={`border px-3 py-2 font-plex text-xs transition-colors ${
                  indice === indiceVista
                    ? "border-[var(--acento)] text-blanco"
                    : "border-profundo text-acero hover:text-blanco"
                }`}
              >
                {otra.nombre}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-7 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
        {TEXTOS.queTiene}
      </p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {proyecto.puntos.map((punto) => (
          <li key={punto} className="flex items-start gap-3 font-plex text-sm leading-snug text-blanco">
            <span aria-hidden className="mt-1.5 size-1 shrink-0 bg-[var(--acento)]" />
            {punto}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <p className="mb-4 flex items-center gap-2 font-plex text-[11px] text-acero">
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          {proyecto.estado}
        </p>
        <a
          href={vista.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 bg-blanco px-6 font-plex text-[12px] font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero"
        >
          {TEXTOS.abrir} <span aria-hidden>↗</span>
        </a>
        <p className="mt-4 hidden font-plex text-[11px] uppercase tracking-etiqueta text-acero lg:block">
          {TEXTOS.teclas}
        </p>
      </div>
    </div>
  );
}
