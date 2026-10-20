"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { EMPRESAS, type Empresa, type IdEmpresa } from "@/datos/multinucleo";
import { NOSOTROS } from "@/datos/textos";
import { useVista } from "@/estado/vista";

const MultiNucleo = dynamic(() => import("@/componentes/3d/MultiNucleo"), {
  ssr: false,
  loading: () => <DiagramaMultiNucleo />,
});

const T = NOSOTROS.servicios.multinucleo;

/**
 * Núcleos Quvant en la ventana del servicio 01: a la izquierda, la escena
 * 3D que se reproduce sola como un video (con capítulos, pausa y saltos);
 * a la derecha, el panel multi núcleo en HTML, con el mismo estado: la
 * lista de empresas y, al entrar a una, su administración por separado.
 *
 * Todo el contenido está en el panel (y en el HTML del servidor): la
 * escena ilustra. En vista texto no hay lienzo: queda el diagrama en SVG
 * y el panel funciona igual, tocando cada empresa.
 */
export function NucleosQuvant() {
  const vista = useVista();
  const en3d = vista === "3d";
  const escena = useRef<HTMLDivElement>(null);
  const barras = useRef<Array<HTMLSpanElement | null>>([]);
  const [aLaVista, setALaVista] = useState(false);
  const [montada, setMontada] = useState(false);
  const [capitulo, setCapitulo] = useState(0);
  const [enfocada, setEnfocada] = useState<IdEmpresa | null>(null);
  const [focoAuto, setFocoAuto] = useState<IdEmpresa | null>(null);
  const [reproduciendo, setReproduciendo] = useState(true);
  const [salto, setSalto] = useState<{ capitulo: number; marca: number } | null>(null);

  // El lienzo se crea cuando la ventana se acerca y solo dibuja a la vista.
  useEffect(() => {
    const elemento = escena.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        setALaVista(entrada.isIntersecting);
        if (entrada.isIntersecting) setMontada(true);
      },
      { rootMargin: "160px 0px" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const alProgresar = useCallback((cap: number, fraccion: number) => {
    barras.current.forEach((barra, i) => {
      if (!barra) return;
      const lleno = i < cap ? 1 : i === cap ? Math.min(1, Math.max(0, fraccion)) : 0;
      barra.style.transform = `scaleX(${lleno})`;
    });
  }, []);

  // Sin escena (vista texto), la barra marca el capítulo elegido; la escena
  // la vuelve a escribir cuadro a cuadro cuando está.
  useEffect(() => {
    if (en3d) return;
    alProgresar(capitulo, 1);
  }, [en3d, capitulo, alProgresar]);

  const elegir = useCallback((id: IdEmpresa | null) => {
    setEnfocada(id);
    if (id) {
      setReproduciendo(false);
      setCapitulo(3);
    }
  }, []);

  const alternar = () => {
    if (reproduciendo) {
      setReproduciendo(false);
    } else {
      setEnfocada(null);
      setReproduciendo(true);
    }
  };

  const irACapitulo = (i: number) => {
    setCapitulo(i);
    setEnfocada(null);
    setSalto((anterior) => ({ capitulo: i, marca: (anterior?.marca ?? 0) + 1 }));
    if (en3d) setReproduciendo(true);
  };

  // Qué empresa muestra el panel: la que eligió la persona o, en el último
  // capítulo del recorrido, la que está visitando la cámara.
  const idMostrada = enfocada ?? (en3d && reproduciendo && capitulo === 3 ? focoAuto : null);
  const mostrada = EMPRESAS.find((e) => e.id === idMostrada) ?? null;
  const cap = T.capitulos[capitulo];

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr]">
      {/* La escena. */}
      <div
        ref={escena}
        className="relative aspect-square min-w-0 overflow-hidden border-b border-profundo bg-negro sm:aspect-[16/10] lg:aspect-auto lg:min-h-[440px] lg:border-b-0 lg:border-r"
      >
        <p className="sr-only">{T.escena}</p>
        <div aria-hidden className="absolute inset-0">
          {en3d && montada ? (
            <MultiNucleo
              activo={aLaVista}
              reproduciendo={reproduciendo}
              enfocada={enfocada}
              salto={salto}
              onCapitulo={setCapitulo}
              onFocoAuto={setFocoAuto}
              onProgreso={alProgresar}
              onElegir={elegir}
            />
          ) : (
            <DiagramaMultiNucleo />
          )}
        </div>

        {/* El capítulo, como el rótulo de un video. */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2.5 rounded-lg border border-profundo bg-negro/85 px-3 py-2 md:left-4 md:top-4">
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          <span className="font-lectura text-[13px] font-medium text-blanco md:text-[11px]">
            0{capitulo + 1} · {cap.titulo}
          </span>
        </div>

        {/* Controles: pausa y un tramo por capítulo (se puede saltar). */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 md:inset-x-4 md:bottom-4">
          {en3d ? (
            <button
              type="button"
              onClick={alternar}
              aria-label={reproduciendo ? T.pausar : T.reproducir}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-profundo bg-negro/85 text-blanco transition-colors hover:border-acero"
            >
              {reproduciendo ? (
                <svg aria-hidden viewBox="0 0 12 12" className="size-2.5 fill-current">
                  <rect x="2" y="1.5" width="3" height="9" />
                  <rect x="7" y="1.5" width="3" height="9" />
                </svg>
              ) : (
                <svg aria-hidden viewBox="0 0 12 12" className="size-2.5 fill-current">
                  <path d="M3 1.5 10.5 6 3 10.5Z" />
                </svg>
              )}
            </button>
          ) : null}
          <div className="flex min-w-0 flex-1 gap-1.5">
            {T.capitulos.map((c, i) => (
              <button
                key={c.titulo}
                type="button"
                onClick={() => irACapitulo(i)}
                aria-label={`${T.capitulo} ${i + 1}: ${c.titulo}`}
                aria-current={i === capitulo ? "step" : undefined}
                className="group relative h-6 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-profundo transition-[height] group-hover:h-[5px]">
                  <span
                    ref={(elemento) => {
                      barras.current[i] = elemento;
                    }}
                    className="absolute inset-0 origin-left bg-[var(--acento)]"
                    style={{ transform: "scaleX(0)" }}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* El panel multi núcleo. */}
      <div className="flex min-w-0 flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-michroma text-[11px] uppercase tracking-marca text-blanco">{T.panel}</p>
          <span className="rounded-2xl bg-profundo/35 px-2 py-1 font-lectura text-[13px] text-acero">
            {T.datosEjemplo}
          </span>
        </div>
        <p className="mt-3 min-h-[2.75rem] font-lectura text-[15px] leading-relaxed text-blanco">{cap.texto}</p>

        <div className="mt-4 flex-1 lg:min-h-[17rem]">
          {mostrada ? (
            <DetalleEmpresa
              key={mostrada.id}
              empresa={mostrada}
              alVolver={() => irACapitulo(2)}
            />
          ) : (
            <ListaEmpresas alElegir={elegir} />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-profundo pt-3">
          <p className="font-lectura text-[13px] text-acero">{T.resumen}</p>
          <p className="font-plex text-[11px] text-acero">{T.ayuda}</p>
        </div>
      </div>
    </div>
  );
}

/** La curva de ventas de una empresa, en SVG. */
function Curva({ serie, color, area = false }: { serie: readonly number[]; color: string; area?: boolean }) {
  const ancho = 100;
  const alto = 30;
  const puntos = serie
    .map((v, i) => `${((i / (serie.length - 1)) * ancho).toFixed(1)},${(alto - 2 - v * (alto - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg aria-hidden viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" className="h-full w-full">
      {area ? <polygon points={`0,${alto} ${puntos} ${ancho},${alto}`} fill={color} opacity={0.16} /> : null}
      <polyline
        points={puntos}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListaEmpresas({ alElegir }: { alElegir: (id: IdEmpresa) => void }) {
  return (
    <ul className="panel-entra divide-y divide-profundo border-y border-profundo">
      {EMPRESAS.map((empresa) => (
        <li key={empresa.id} style={{ "--empresa": empresa.color } as CSSProperties}>
          <button
            type="button"
            onClick={() => alElegir(empresa.id)}
            className="group grid w-full grid-cols-[auto_1fr_4.5rem] items-center gap-x-3 py-3 text-left"
          >
            <span aria-hidden className="size-2 bg-[var(--empresa)]" />
            <span className="min-w-0">
              <span className="block truncate font-plex text-sm text-blanco transition-colors group-hover:text-[var(--empresa)]">
                {empresa.nombre}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 font-plex text-[11px] text-acero">
                {empresa.estado.alerta ? (
                  <span aria-hidden className="size-1.5 animate-[latido_1.6s_var(--ease-vaiven)_infinite] bg-[var(--empresa)]" />
                ) : null}
                <span className="truncate">
                  {empresa.estado.texto} · {empresa.variacion}
                </span>
              </span>
            </span>
            <span className="h-7">
              <Curva serie={empresa.serie} color={empresa.color} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function DetalleEmpresa({ empresa, alVolver }: { empresa: Empresa; alVolver: () => void }) {
  return (
    <div className="panel-entra" style={{ "--empresa": empresa.color } as CSSProperties}>
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="size-2 bg-[var(--empresa)]" />
        <p className="titulo text-base text-blanco">{empresa.nombre}</p>
      </div>
      <p className="mt-1 font-plex text-[11px] text-acero">{T.suAdministracion}</p>

      <div className="mt-3 border border-profundo p-3">
        <p className="font-lectura text-[13px] text-acero">{T.ultimos12}</p>
        <div className="mt-2 h-12">
          <Curva serie={empresa.serie} color={empresa.color} area />
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {empresa.modulos.map((modulo) => (
          <li key={modulo.nombre} className="border border-profundo p-2.5">
            <p className="font-lectura text-[13px] text-acero">{modulo.nombre}</p>
            <p className="mt-1 font-plex text-xs leading-snug text-blanco">{modulo.valor}</p>
            <span aria-hidden className="mt-2 block h-[3px] bg-profundo">
              <span
                className="block h-full bg-[var(--empresa)]"
                style={{ width: `${Math.round(modulo.nivel * 100)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={alVolver}
        className="mt-3 font-lectura text-[13px] text-acero transition-colors hover:text-blanco"
      >
        ← {T.verTodas}
      </button>
    </div>
  );
}

/**
 * El mismo esquema, quieto y en SVG: para vista texto y mientras carga el
 * lienzo. Las empresas abajo, cada una con su núcleo y su anillo; los haces
 * suben al panel, que muestra la curva de cada una.
 */
export function DiagramaMultiNucleo() {
  const xs = [70, 190, 290, 410];
  return (
    <svg viewBox="0 0 480 300" className="h-full w-full" aria-hidden preserveAspectRatio="xMidYMid meet">
      <rect x={110} y={28} width={260} height={112} rx={4} className="fill-negro stroke-acero" strokeWidth={1.2} />
      <line x1={110} y1={48} x2={370} y2={48} className="stroke-profundo" strokeWidth={1.2} />
      <rect x={354} y={34} width={7} height={7} className="fill-blanco" />
      {EMPRESAS.map((empresa, i) => {
        const puntos = empresa.serie
          .map((v, k) => `${126 + (k / (empresa.serie.length - 1)) * 228},${130 - v * 72}`)
          .join(" ");
        const ancla = 150 + i * 60;
        return (
          <g key={empresa.id}>
            <polyline points={puntos} fill="none" stroke={empresa.color} strokeWidth={1.6} />
            <path
              d={`M ${xs[i]} 214 Q ${xs[i]} 170 ${ancla} 140`}
              fill="none"
              stroke={empresa.color}
              strokeWidth={1.2}
              strokeDasharray="3 5"
              opacity={0.8}
            />
            <ellipse cx={xs[i]} cy={234} rx={30} ry={9} fill="none" stroke={empresa.color} opacity={0.45} />
            <rect x={xs[i] - 9} y={225} width={18} height={18} fill={empresa.color} />
            <text
              x={xs[i]}
              y={272}
              textAnchor="middle"
              className="fill-acero font-plex"
              fontSize={10}
              letterSpacing={1.5}
            >
              {empresa.rotulo}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
