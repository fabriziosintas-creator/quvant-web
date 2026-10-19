"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { CAPTURAS, PARADAS, type Parada } from "@/datos/sistema";
import { PLATAFORMAS } from "@/datos/textos";
import { useVista } from "@/estado/vista";

/**
 * Recorrido por el tablero real del sistema. Una sola ventana con la
 * captura; cada función de la lista mueve la "cámara" (traslación y zoom
 * de la imagen) hasta el lugar exacto donde eso pasa y lo enmarca.
 *
 * Las funciones son fichas en una rueda con perspectiva: la activa viene
 * al frente, plana y blanca; las demás se inclinan y retroceden según la
 * distancia. Cada vez que el recorrido avanza, la rueda gira.
 *
 * Se recorre solo cada pocos segundos, aunque el puntero esté encima
 * (antes se frenaba con el puntero y, como el bloque es ancho, parecía
 * trabado). Se frena con el botón de pausa, mientras alguien lo recorre
 * con el teclado, o cuando la ventana no está a la vista. Tocar una
 * función salta ahí y sigue desde esa. En vista texto no hay recorrido
 * automático ni animación: el cambio es directo.
 */

const SEGUNDOS_POR_PARADA = 4.6;
const AIRE = 0.86; // cuánto de la ventana ocupa la zona en modo "encajar"
const ZOOM_MAXIMO = 2.7; // más que esto y la captura se ve pixelada
const ANCHO_PARA_CUBRIR = 560; // por debajo, la vista general se encaja en vez de cubrir

type Encuadre = {
  escala: number;
  x: number;
  y: number;
  marco: { x: number; y: number; w: number; h: number } | null;
};

/** Dónde queda la imagen (y el marco) para que la zona pedida entre en la ventana. */
function calcularEncuadre(parada: Parada, anchoVentana: number, altoVentana: number): Encuadre {
  const captura = CAPTURAS[parada.captura];
  // La imagen se dibuja con el ancho de la ventana; de ahí sale su alto base.
  const altoBase = (anchoVentana * captura.alto) / captura.ancho;
  const zx = parada.zona.x * anchoVentana;
  const zy = parada.zona.y * altoBase;
  const zw = parada.zona.w * anchoVentana;
  const zh = parada.zona.h * altoBase;
  // En una ventana angosta (celular), "cubrir" recortaba los costados del
  // tablero ("…enas noches, Martín"): ahí la zona se encaja entera.
  const cubrir = parada.modo === "cubrir" && anchoVentana >= ANCHO_PARA_CUBRIR;

  let escala = cubrir
    ? Math.max(anchoVentana / zw, altoVentana / zh)
    : Math.min(anchoVentana / zw, altoVentana / zh) * (parada.modo === "cubrir" ? 1 : AIRE);
  escala = Math.min(escala, ZOOM_MAXIMO);

  const anchoEscalado = anchoVentana * escala;
  const altoEscalado = altoBase * escala;

  // Centrar la zona; si la imagen escalada es más grande que la ventana,
  // no dejar que asome el fondo por los bordes.
  let x = anchoVentana / 2 - escala * (zx + zw / 2);
  let y = altoVentana / 2 - escala * (zy + zh / 2);
  x =
    anchoEscalado >= anchoVentana
      ? Math.min(0, Math.max(anchoVentana - anchoEscalado, x))
      : (anchoVentana - anchoEscalado) / 2;
  y =
    altoEscalado >= altoVentana
      ? Math.min(0, Math.max(altoVentana - altoEscalado, y))
      : (altoVentana - altoEscalado) / 2;

  const marco =
    parada.modo === "cubrir"
      ? null
      : { x: x + escala * zx, y: y + escala * zy, w: escala * zw, h: escala * zh };

  return { escala, x, y, marco };
}

/**
 * Los glifos de cada parada: líneas finas, como el resto del sitio. Cada
 * trazo lleva pathLength=1 para que el dibujado (keyframe `dibujar`) sea
 * el mismo sin importar su largo.
 */
const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  pathLength: 1,
};

const GLIFOS: Record<string, ReactNode> = {
  inicio: (
    <>
      <rect x="3" y="3" width="7" height="7" {...TRAZO} />
      <rect x="14" y="3" width="7" height="7" {...TRAZO} />
      <rect x="3" y="14" width="7" height="7" {...TRAZO} />
      <rect x="14" y="14" width="7" height="7" {...TRAZO} />
    </>
  ),
  margen: (
    <>
      <path d="M3 20h18" {...TRAZO} />
      <path d="M5 16V9M10 16V5M15 16v-5M20 16V7" {...TRAZO} />
      <rect x="18" y="3" width="4" height="4" fill="currentColor" stroke="none" />
    </>
  ),
  offline: (
    <>
      <path d="M4 15a5 5 0 0 1 1-9.9A6 6 0 0 1 16.5 7 4 4 0 0 1 18 15" {...TRAZO} />
      <path d="M8 19h8" {...TRAZO} />
      <path d="M3 21 21 3" {...TRAZO} />
    </>
  ),
  tablero: (
    <>
      <rect x="3" y="4" width="18" height="16" {...TRAZO} />
      <path d="M3 9h18" {...TRAZO} />
      <path d="M7 13h6M7 16.5h4" {...TRAZO} />
      <rect x="15" y="12.5" width="3" height="3" fill="currentColor" stroke="none" />
    </>
  ),
  stock: (
    <>
      <rect x="3" y="14" width="8" height="7" {...TRAZO} />
      <rect x="13" y="14" width="8" height="7" {...TRAZO} />
      <rect x="8" y="6" width="8" height="7" {...TRAZO} />
    </>
  ),
  compras: (
    <>
      <rect x="4" y="10" width="16" height="11" {...TRAZO} />
      <path d="M12 3v11" {...TRAZO} />
      <path d="M8.5 10.5 12 14l3.5-3.5" {...TRAZO} />
    </>
  ),
};

export function RecorridoTablero() {
  const { recorrido, destacadas } = PLATAFORMAS.hoy;
  const vista = useVista();
  const [activa, setActiva] = useState(0);
  /** La pausa que pidió la persona con el botón. */
  const [enPausa, setEnPausa] = useState(false);
  /** Alguien recorre las fichas con el teclado: se espera a que termine. */
  const [conTeclado, setConTeclado] = useState(false);
  const [aLaVista, setALaVista] = useState(false);
  const ventana = useRef<HTMLDivElement>(null);
  const capas = useRef<Record<string, HTMLDivElement | null>>({});
  const marco = useRef<HTMLDivElement>(null);
  const botones = useRef<Array<HTMLButtonElement | null>>([]);
  const medidas = useRef({ ancho: 0, alto: 0 });

  const textoDe = (parada: Parada) =>
    parada.id === "inicio"
      ? recorrido.inicio
      : (destacadas.find((d) => d.id === parada.id) ?? recorrido.inicio);

  /** Lleva la cámara a una parada: animado en vista 3D, directo en texto. */
  const encuadrar = useCallback((indice: number, animar: boolean) => {
    const { ancho, alto } = medidas.current;
    if (!ancho || !alto) return;
    const parada = PARADAS[indice];
    const e = calcularEncuadre(parada, ancho, alto);
    const duracion = animar ? 1.15 : 0;
    const ease = "power3.inOut";

    for (const [clave, capa] of Object.entries(capas.current)) {
      if (!capa) continue;
      if (clave === parada.captura) {
        gsap.to(capa, { x: e.x, y: e.y, scale: e.escala, opacity: 1, duration: duracion, ease });
      } else {
        gsap.to(capa, { opacity: 0, duration: duracion * 0.6, ease });
      }
    }
    if (marco.current) {
      if (e.marco) {
        gsap.to(marco.current, {
          x: e.marco.x,
          y: e.marco.y,
          width: e.marco.w,
          height: e.marco.h,
          opacity: 1,
          duration: duracion,
          ease,
        });
      } else {
        gsap.to(marco.current, { opacity: 0, duration: duracion * 0.5 });
      }
    }
  }, []);

  // Medir la ventana y volver a encuadrar si cambia de tamaño. El cambio
  // de parada va en el efecto de abajo, por eso acá no se escucha `activa`.
  const activaRef = useRef(activa);
  useEffect(() => {
    activaRef.current = activa;
  }, [activa]);
  useLayoutEffect(() => {
    const elemento = ventana.current;
    if (!elemento) return;
    const medir = () => {
      const caja = elemento.getBoundingClientRect();
      medidas.current = { ancho: caja.width, alto: caja.height };
      encuadrar(activaRef.current, false);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [encuadrar]);

  // Cada cambio de parada mueve la cámara.
  useEffect(() => {
    encuadrar(activa, vista === "3d");
  }, [activa, vista, encuadrar]);

  // La rueda de fichas: cada una se inclina y retrocede según la distancia
  // a la activa. En vista texto quedan planas.
  useEffect(() => {
    const en3d = vista === "3d";
    botones.current.forEach((ficha, indice) => {
      if (!ficha) return;
      const d = indice - activa;
      const lejos = Math.min(Math.abs(d), 3);
      gsap.to(ficha, {
        rotateX: en3d ? -d * 7 : 0,
        z: en3d ? -lejos * 38 : 0,
        scale: en3d ? 1 - lejos * 0.03 : 1,
        opacity: en3d ? 1 - lejos * 0.2 : 1,
        transformOrigin: "50% 50%",
        duration: en3d ? 0.85 : 0,
        ease: "power3.out",
        overwrite: true,
      });
    });
  }, [activa, vista]);

  // Solo se recorre solo cuando está a la vista.
  useEffect(() => {
    const elemento = ventana.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(
      ([entrada]) => setALaVista(entrada.isIntersecting),
      { threshold: 0.35 },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const recorriendo = vista === "3d" && aLaVista && !enPausa && !conTeclado;

  useEffect(() => {
    if (!recorriendo) return;
    const temporizador = setTimeout(
      () => setActiva((i) => (i + 1) % PARADAS.length),
      SEGUNDOS_POR_PARADA * 1000,
    );
    return () => clearTimeout(temporizador);
  }, [recorriendo, activa]);

  const alTeclear = (evento: KeyboardEvent<HTMLButtonElement>, indice: number) => {
    const ultimo = PARADAS.length - 1;
    let destino: number | null = null;
    if (evento.key === "ArrowDown" || evento.key === "ArrowRight")
      destino = indice === ultimo ? 0 : indice + 1;
    if (evento.key === "ArrowUp" || evento.key === "ArrowLeft")
      destino = indice === 0 ? ultimo : indice - 1;
    if (evento.key === "Home") destino = 0;
    if (evento.key === "End") destino = ultimo;
    if (destino === null) return;
    evento.preventDefault();
    setActiva(destino);
    botones.current[destino]?.focus();
  };

  return (
    <div
      className="mt-8 grid gap-6 lg:grid-cols-[0.82fr_1.3fr] lg:gap-10"
      onFocus={(evento: FocusEvent<HTMLDivElement>) => setConTeclado(evento.target.matches(":focus-visible"))}
      onBlur={() => setConTeclado(false)}
    >
      {/* La rueda de fichas: una por función. */}
      <div className="order-2 min-w-0 lg:order-1">
        <p className="mb-4 font-plex text-xs text-acero">{recorrido.ayuda}</p>
        <div
          role="tablist"
          aria-label={PLATAFORMAS.hoy.etiqueta}
          aria-orientation="vertical"
          className="flex flex-col gap-2 [perspective:1100px] [transform-style:preserve-3d]"
        >
          {PARADAS.map((parada, indice) => {
            const seleccionada = indice === activa;
            const texto = textoDe(parada);
            return (
              <button
                key={parada.id}
                ref={(el) => {
                  botones.current[indice] = el;
                }}
                type="button"
                role="tab"
                id={`parada-${parada.id}`}
                aria-selected={seleccionada}
                aria-controls="ventana-tablero"
                tabIndex={seleccionada ? 0 : -1}
                onClick={() => setActiva(indice)}
                onKeyDown={(evento) => alTeclear(evento, indice)}
                className={`ficha-parada group relative block w-full border px-4 py-3.5 text-left will-change-transform transition-colors md:px-5 ${
                  seleccionada
                    ? "border-[var(--acento)] bg-[#131316]"
                    : "border-profundo bg-negro hover:border-acero/70"
                }`}
              >
                <span className="flex items-start gap-4">
                  {/* El glifo: se dibuja cuando la ficha pasa al frente. */}
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className={`glifo mt-0.5 size-6 shrink-0 transition-colors ${
                      seleccionada ? "text-blanco" : "text-acero"
                    }`}
                  >
                    {GLIFOS[parada.id]}
                  </svg>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-3">
                      <span className="font-plex text-[11px] text-acero">0{indice + 1}</span>
                      <span
                        className={`titulo text-base leading-snug transition-colors group-hover:text-blanco md:text-[17px] ${
                          seleccionada ? "text-blanco" : "text-acero"
                        }`}
                      >
                        {texto.titulo}
                      </span>
                    </span>
                    {/* El texto solo se despliega en la parada activa. */}
                    <span
                      className={`block overflow-hidden font-lectura text-[15px] leading-relaxed text-acero transition-[max-height,opacity,margin] duration-500 ${
                        seleccionada ? "mt-2 max-h-24 opacity-100" : "mt-0 max-h-0 opacity-0"
                      }`}
                    >
                      {texto.texto}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`mt-2 size-1.5 shrink-0 transition-colors ${
                      seleccionada ? "bg-[var(--acento)]" : "bg-profundo"
                    }`}
                  />
                </span>
                {/* El tiempo que queda antes de la próxima parada. */}
                {seleccionada && recorriendo ? (
                  <span
                    key={activa}
                    aria-hidden
                    className="absolute bottom-0 left-0 h-px bg-[var(--acento)]"
                    style={{ animation: `avance ${SEGUNDOS_POR_PARADA}s linear forwards` }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        {/* El estado del recorrido, que también es el botón para pausarlo. */}
        {vista === "3d" ? (
          <button
            type="button"
            onClick={() => setEnPausa((pausa) => !pausa)}
            aria-label={enPausa ? recorrido.seguir : recorrido.pausar}
            className="mt-4 flex items-center gap-2 font-plex text-[11px] uppercase tracking-etiqueta text-acero transition-colors hover:text-blanco"
          >
            <span
              aria-hidden
              className={`size-1.5 ${
                recorriendo
                  ? "bg-blanco motion-safe:animate-[parpadeo_1.4s_steps(2,end)_infinite]"
                  : "bg-profundo"
              }`}
            />
            {recorriendo ? recorrido.reproduciendo : recorrido.pausado}
            <svg aria-hidden viewBox="0 0 12 12" className="ml-1 size-2.5 fill-current">
              {enPausa ? (
                <path d="M3 1.5 10.5 6 3 10.5Z" />
              ) : (
                <>
                  <rect x="2" y="1.5" width="3" height="9" />
                  <rect x="7" y="1.5" width="3" height="9" />
                </>
              )}
            </svg>
          </button>
        ) : null}
      </div>

      {/* La ventana con la pantalla real. */}
      <figure className="order-1 min-w-0 lg:order-2">
        <div className="overflow-hidden rounded-[10px] border border-profundo">
          <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
            <span aria-hidden className="size-1.5 bg-acero" />
            <span className="min-w-0 truncate font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
              {recorrido.ventana}
            </span>
          </figcaption>
          <div
            ref={ventana}
            id="ventana-tablero"
            role="tabpanel"
            aria-labelledby={`parada-${PARADAS[activa].id}`}
            className="relative aspect-[16/10] overflow-hidden bg-negro lg:aspect-[16/9]"
          >
            {(Object.keys(CAPTURAS) as Array<keyof typeof CAPTURAS>).map((clave) => {
              const captura = CAPTURAS[clave];
              return (
                <div
                  key={clave}
                  ref={(el) => {
                    capas.current[clave] = el;
                  }}
                  className="absolute left-0 top-0 w-full origin-top-left opacity-0"
                >
                  <Image
                    src={captura.src}
                    alt={captura.alt}
                    width={captura.ancho}
                    height={captura.alto}
                    unoptimized
                    className="block h-auto w-full select-none"
                    draggable={false}
                  />
                </div>
              );
            })}
            {/* El marco que señala la zona; la sombra enorme oscurece todo lo demás. */}
            <div
              ref={marco}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 rounded-[6px] border border-blanco opacity-0 shadow-[0_0_0_9999px_rgba(13,13,15,0.42)]"
            />
          </div>
        </div>
        <p className="mt-3 font-plex text-[11px] text-acero">{recorrido.nota}</p>
      </figure>
    </div>
  );
}
