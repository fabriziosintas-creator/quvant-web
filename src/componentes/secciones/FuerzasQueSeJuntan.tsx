"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";
import { NOSOTROS } from "@/datos/textos";
import { useVista } from "@/estado/vista";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Las dos fuerzas que se juntan con el scroll: desarrollo desde la
 * izquierda, comercial desde la derecha, y al encontrarse aparece
 * "= QUVANT". Cada fuerza tiene su color, un dato que cuenta solo y una
 * ventana viva: el código que se escribe solo (desarrollo) y una charla
 * que se va armando (comercial). En vista texto todo aparece completo y
 * quieto.
 */

const COLOR_DESARROLLO = "#6C8CFF";
const COLOR_COMERCIAL = "#F0A33A";

/** Si el elemento está a la vista (para no animar lo que nadie mira). */
function useEnVista(ref: RefObject<HTMLElement | null>) {
  const [enVista, setEnVista] = useState(false);
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(([e]) => setEnVista(e.isIntersecting), {
      threshold: 0.3,
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [ref]);
  return enVista;
}

/** El dato grande que cuenta de 0 a su número la primera vez que se ve. */
function Contador({ numero, prefijo }: { numero: number; prefijo: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enVista = useEnVista(ref);
  const vista = useVista();
  const [valor, setValor] = useState(0);
  const contado = useRef(false);

  useEffect(() => {
    // En vista texto no se cuenta: el render ya muestra el número final.
    if (!enVista || contado.current || vista !== "3d") return;
    contado.current = true;
    const estado = { v: 0 };
    const animacion = gsap.to(estado, {
      v: numero,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => setValor(Math.round(estado.v)),
    });
    return () => {
      animacion.kill();
    };
  }, [enVista, numero, vista]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefijo}
      {vista === "3d" ? valor : numero}
    </span>
  );
}

type Ficha = { t: string; c?: "clave" | "func" | "texto" | "nota" };

/** Las líneas del editor: el método de trabajo, escrito como código. */
const CODIGO: Ficha[][] = [
  [{ t: "const ", c: "clave" }, { t: "negocio = " }, { t: "escuchar", c: "func" }, { t: "(cliente);" }],
  [{ t: "const ", c: "clave" }, { t: "plan = " }, { t: "bajarATierra", c: "func" }, { t: "(negocio.ideas);" }],
  [{ t: "await ", c: "clave" }, { t: "construir", c: "func" }, { t: "(plan, { porFases: " }, { t: "true", c: "clave" }, { t: " });" }],
  [{ t: "entregar", c: "func" }, { t: "(); " }, { t: "// tu equipo lo usa desde el día uno", c: "nota" }],
];

const COLOR_FICHA: Record<NonNullable<Ficha["c"]>, string> = {
  clave: "#B388FF",
  func: COLOR_DESARROLLO,
  texto: "#7BD389",
  nota: "#9C9CA3",
};

/** Dónde empieza cada ficha y cada línea dentro del texto completo. */
const POSICIONES = (() => {
  let cursor = 0;
  return CODIGO.map((linea) => {
    const inicioLinea = cursor;
    const fichas = linea.map((ficha) => {
      const inicio = cursor;
      cursor += ficha.t.length;
      return { ...ficha, inicio };
    });
    return { fichas, inicio: inicioLinea, fin: cursor };
  });
})();

const TOTAL_CODIGO = POSICIONES[POSICIONES.length - 1].fin;

/** Un editor que escribe solo, letra por letra, y vuelve a empezar. */
function PanelCodigo({ titulo }: { titulo: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useEnVista(ref);
  const vista = useVista();
  const [letras, setLetras] = useState(0);
  const animar = vista === "3d" && enVista;
  const mostradas = vista === "3d" ? letras : TOTAL_CODIGO;

  useEffect(() => {
    if (!animar) return;
    const espera = letras >= TOTAL_CODIGO ? 3200 : 34;
    const temporizador = setTimeout(
      () => setLetras((n) => (n >= TOTAL_CODIGO ? 0 : n + 1)),
      espera,
    );
    return () => clearTimeout(temporizador);
  }, [animar, letras]);

  return (
    <div ref={ref} aria-hidden className="overflow-hidden rounded-[8px] border border-profundo bg-[#0a0a0c]">
      <div className="flex items-center gap-2 border-b border-profundo px-4 py-2">
        <span className="size-2 rounded-full bg-[#F26B5B]/70" />
        <span className="size-2 rounded-full bg-[#F0A33A]/70" />
        <span className="size-2 rounded-full bg-[#7BD389]/70" />
        <span className="ml-2 font-plex text-[10px] text-acero">{titulo}</span>
      </div>
      <div className="min-h-[124px] px-4 py-3 font-plex text-[11px] leading-[1.9] md:text-xs">
        {POSICIONES.map((linea, i) => {
          const terminado = mostradas >= TOTAL_CODIGO;
          const conCursor = terminado
            ? i === POSICIONES.length - 1
            : mostradas >= linea.inicio && mostradas < linea.fin;
          return (
            <div key={i} className="flex whitespace-pre">
              <span className="mr-3 w-3 select-none text-right text-profundo">{i + 1}</span>
              <span className="min-w-0 truncate">
                {linea.fichas.map((ficha, j) => {
                  const visible = ficha.t.slice(0, Math.max(0, mostradas - ficha.inicio));
                  return visible ? (
                    <span key={j} style={{ color: ficha.c ? COLOR_FICHA[ficha.c] : "#ECECEE" }}>
                      {visible}
                    </span>
                  ) : null;
                })}
                {conCursor ? (
                  <span
                    className="ml-0.5 inline-block size-[0.6em] translate-y-[1px] motion-safe:animate-[parpadeo_1.1s_steps(2,end)_infinite]"
                    style={{ background: COLOR_DESARROLLO }}
                  />
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** La charla de ejemplo: así arranca el trabajo comercial. */
const CHARLA = [
  { quien: "cliente", texto: "Pierdo horas cruzando planillas de stock." },
  { quien: "quvant", texto: "Contanos cómo lo hacen hoy, paso a paso." },
  { quien: "cliente", texto: "Tres sucursales, cada una con su Excel." },
  { quien: "quvant", texto: "Entonces empezamos por un solo stock, en vivo." },
] as const;

function PanelCharla({ titulo }: { titulo: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useEnVista(ref);
  const vista = useVista();
  const [visibles, setVisibles] = useState(0);
  const animar = vista === "3d" && enVista;
  const mostrados = vista === "3d" ? visibles : CHARLA.length;

  useEffect(() => {
    if (!animar) return;
    const espera = visibles >= CHARLA.length ? 3600 : 1300;
    const temporizador = setTimeout(
      () => setVisibles((n) => (n >= CHARLA.length ? 0 : n + 1)),
      espera,
    );
    return () => clearTimeout(temporizador);
  }, [animar, visibles]);

  const siguiente = CHARLA[mostrados];

  return (
    <div ref={ref} aria-hidden className="overflow-hidden rounded-[8px] border border-profundo bg-[#0a0a0c]">
      <div className="flex items-center gap-2 border-b border-profundo px-4 py-2">
        <span className="size-1.5" style={{ background: COLOR_COMERCIAL }} />
        <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">{titulo}</span>
      </div>
      <div className="flex min-h-[148px] flex-col gap-2 px-4 py-3">
        {CHARLA.slice(0, mostrados).map((mensaje, i) => {
          const esCliente = mensaje.quien === "cliente";
          return (
            <p
              key={`${i}-${mensaje.texto}`}
              className={`charla-burbuja max-w-[85%] rounded-[10px] px-3 py-1.5 font-plex text-[11px] leading-snug md:text-xs ${
                esCliente
                  ? "self-start rounded-bl-[2px] border border-profundo text-blanco"
                  : "self-end rounded-br-[2px] text-negro"
              }`}
              style={esCliente ? undefined : { background: COLOR_COMERCIAL }}
            >
              {mensaje.texto}
            </p>
          );
        })}
        {/* Los tres puntos de "escribiendo", del lado de quien habla después. */}
        {siguiente && vista === "3d" ? (
          <span
            className={`flex gap-1 px-2 py-1.5 ${siguiente.quien === "cliente" ? "self-start" : "self-end"}`}
          >
            {[0, 1, 2].map((p) => (
              <span
                key={p}
                className="size-1.5 rounded-full bg-acero motion-safe:animate-[latido_1s_ease-in-out_infinite]"
                style={{ animationDelay: `${p * 0.15}s` }}
              />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

type Fuerza = typeof NOSOTROS.fuerzas.desarrollo | typeof NOSOTROS.fuerzas.comercial;

function TarjetaFuerza({
  fuerza,
  color,
  lado,
  panel,
}: {
  fuerza: Fuerza;
  color: string;
  lado: "izquierda" | "derecha";
  panel: React.ReactNode;
}) {
  return (
    <div data-fuerza={lado} className="h-full" style={{ "--acento": color } as CSSProperties}>
      <TarjetaViva className="border border-profundo bg-negro p-7 md:p-9">
        {/* El resplandor del color de la fuerza, arriba. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: color }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <p className="flex items-center gap-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-[var(--acento)]">
            <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
            {fuerza.etiqueta}
          </p>
          <p className="text-right">
            <span className="block font-michroma text-3xl leading-none text-blanco md:text-4xl">
              <Contador numero={fuerza.dato.numero} prefijo={fuerza.dato.prefijo} />
            </span>
            <span className="mt-1 block max-w-[11rem] font-plex text-[10px] uppercase leading-snug tracking-etiqueta text-acero">
              {fuerza.dato.etiqueta}
            </span>
          </p>
        </div>
        <h3 className="relative mt-5 font-plex text-xl font-bold leading-snug text-blanco md:text-2xl">
          {fuerza.titular}
        </h3>
        {fuerza.parrafos.map((parrafo) => (
          <p key={parrafo.slice(0, 20)} className="relative mt-4 font-lectura text-[15px] leading-relaxed text-acero">
            {parrafo}
          </p>
        ))}
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {fuerza.puntos.map((punto) => (
            <li
              key={punto}
              className="flex items-center gap-2 border border-profundo px-3 py-1.5 font-plex text-[11px] text-blanco transition-colors hover:border-[var(--acento)]"
            >
              <span aria-hidden className="size-1 bg-[var(--acento)]" />
              {punto}
            </li>
          ))}
        </ul>
        <div className="relative mt-auto pt-6">{panel}</div>
      </TarjetaViva>
    </div>
  );
}

export function FuerzasQueSeJuntan() {
  const raiz = useRef<HTMLDivElement>(null);
  const vista = useVista();
  const { desarrollo, comercial, resultado } = NOSOTROS.fuerzas;

  useGSAP(
    () => {
      if (vista !== "3d") return;
      const mm = gsap.matchMedia();
      mm.add(
        {
          animable: "(prefers-reduced-motion: no-preference)",
          ancho: "(min-width: 768px)",
        },
        (contexto) => {
          const condiciones = contexto.conditions as
            | { animable: boolean; ancho: boolean }
            | undefined;
          if (!condiciones?.animable) return;
          const linea = gsap.timeline({
            scrollTrigger: {
              trigger: raiz.current,
              start: "top 80%",
              end: "center 42%",
              scrub: 1,
            },
          });
          if (condiciones.ancho) {
            linea
              .from('[data-fuerza="izquierda"]', { xPercent: -24, opacity: 0, ease: "none" }, 0)
              .from('[data-fuerza="derecha"]', { xPercent: 24, opacity: 0, ease: "none" }, 0);
          } else {
            linea
              .from('[data-fuerza="izquierda"]', { y: 36, opacity: 0, ease: "none" }, 0)
              .from('[data-fuerza="derecha"]', { y: 36, opacity: 0, ease: "none" }, 0.15);
          }
          linea.from(
            '[data-fuerza="resultado"]',
            { opacity: 0, y: 18, scale: 0.95, ease: "none" },
            0.55,
          );
        },
      );
    },
    // Al cambiar la vista se revierte todo: en vista texto el contenido
    // queda quieto y completo, sin estados a medio animar.
    { scope: raiz, dependencies: [vista], revertOnUpdate: true },
  );

  return (
    <div ref={raiz}>
      <div className="grid gap-5 md:grid-cols-2 md:gap-8">
        <TarjetaFuerza
          fuerza={desarrollo}
          color={COLOR_DESARROLLO}
          lado="izquierda"
          panel={<PanelCodigo titulo={desarrollo.ventana} />}
        />
        <TarjetaFuerza
          fuerza={comercial}
          color={COLOR_COMERCIAL}
          lado="derecha"
          panel={<PanelCharla titulo={comercial.ventana} />}
        />
      </div>
      <p data-fuerza="resultado" className="mt-10 flex flex-col items-center md:mt-12">
        <span className="flex items-center">
          <span className="mr-4 font-plex text-lg text-acero">=</span>
          <span className="font-michroma text-2xl tracking-marca text-blanco md:text-4xl">
            {resultado}
          </span>
        </span>
        {/* Las dos fuerzas, juntas en una sola línea de color. */}
        <span
          aria-hidden
          className="mt-4 h-px w-40 md:w-64"
          style={{ background: `linear-gradient(90deg, ${COLOR_DESARROLLO}, ${COLOR_COMERCIAL})` }}
        />
      </p>
    </div>
  );
}
