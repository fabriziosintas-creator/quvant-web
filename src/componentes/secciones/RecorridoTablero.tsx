"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
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
 * Se recorre solo cada pocos segundos y se frena cuando el puntero o el
 * foco están encima, o cuando la ventana no está a la vista. En vista
 * texto no hay recorrido automático ni animación: el cambio es directo.
 */

const SEGUNDOS_POR_PARADA = 4.6;
const AIRE = 0.86; // cuánto de la ventana ocupa la zona en modo "encajar"
const ZOOM_MAXIMO = 2.7; // más que esto y la captura se ve pixelada

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

  let escala =
    parada.modo === "cubrir"
      ? Math.max(anchoVentana / zw, altoVentana / zh)
      : Math.min(anchoVentana / zw, altoVentana / zh) * AIRE;
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

export function RecorridoTablero() {
  const { recorrido, destacadas } = PLATAFORMAS.hoy;
  const vista = useVista();
  const [activa, setActiva] = useState(0);
  const [enPausa, setEnPausa] = useState(false);
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

  const recorriendo = vista === "3d" && aLaVista && !enPausa;

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
      className="mt-8 grid gap-6 lg:grid-cols-[0.78fr_1.35fr] lg:gap-10"
      onPointerEnter={() => setEnPausa(true)}
      onPointerLeave={() => setEnPausa(false)}
      onFocus={() => setEnPausa(true)}
      onBlur={() => setEnPausa(false)}
    >
      {/* Las paradas: una por función. */}
      <div className="order-2 lg:order-1">
        <p className="mb-4 font-plex text-xs text-acero">{recorrido.ayuda}</p>
        <div role="tablist" aria-label={PLATAFORMAS.hoy.etiqueta} aria-orientation="vertical">
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
                className="group relative block w-full border-b border-profundo py-4 text-left first:border-t"
              >
                <span className="flex items-baseline gap-4">
                  <span className="font-plex text-xs text-acero">0{indice + 1}</span>
                  <span
                    className={`font-plex text-base font-bold leading-snug transition-colors group-hover:text-blanco ${
                      seleccionada ? "text-blanco" : "text-acero"
                    }`}
                  >
                    {texto.titulo}
                  </span>
                </span>
                {/* El texto solo se despliega en la parada activa. */}
                <span
                  className={`block overflow-hidden pl-9 font-plex text-sm leading-relaxed text-acero transition-[max-height,opacity,margin] duration-500 ${
                    seleccionada ? "mt-2 max-h-24 opacity-100" : "mt-0 max-h-0 opacity-0"
                  }`}
                >
                  {texto.texto}
                </span>
                {/* El tiempo que queda antes de la próxima parada. */}
                {seleccionada && recorriendo ? (
                  <span
                    key={activa}
                    aria-hidden
                    className="absolute bottom-[-1px] left-0 h-px bg-blanco"
                    style={{ animation: `avance ${SEGUNDOS_POR_PARADA}s linear forwards` }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-4 flex items-center gap-2 font-plex text-[11px] uppercase tracking-etiqueta text-acero">
          <span
            aria-hidden
            className={`size-1.5 ${
              recorriendo
                ? "bg-blanco motion-safe:animate-[parpadeo_1.4s_steps(2,end)_infinite]"
                : "bg-profundo"
            }`}
          />
          {recorriendo ? recorrido.reproduciendo : recorrido.pausado}
        </p>
      </div>

      {/* La ventana con la pantalla real. */}
      <figure className="order-1 lg:order-2">
        <div className="overflow-hidden rounded-[8px] border border-profundo">
          <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
            <span aria-hidden className="size-1.5 bg-acero" />
            <span className="truncate font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
              {recorrido.ventana}
            </span>
          </figcaption>
          <div
            ref={ventana}
            id="ventana-tablero"
            role="tabpanel"
            aria-labelledby={`parada-${PARADAS[activa].id}`}
            className="relative aspect-[4/3] overflow-hidden bg-negro sm:aspect-[16/10] lg:aspect-[16/9]"
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
