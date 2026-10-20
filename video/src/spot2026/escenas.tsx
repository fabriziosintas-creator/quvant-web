import React, { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Img } from "remotion";
import { ETAPAS, PALABRAS_PARED, PALABRAS_PROBLEMA, T, TRABAJOS } from "./tiempos";
import { ACENTO, COLOR, archivo, azar, curvaMarca, etiqueta, michroma, suave, texto, titulo, tramo } from "./base";
import { Grilla, Notebook, Telefono, Ventana, type Captura } from "./piezas";

/**
 * Las escenas del spot 2026. Todas reciben el segundo global (t) y la
 * unidad (u = ancho / 1920): el mismo código sirve a 1080p y a 4K.
 */

export type Props = { t: number; u: number; ancho: number; alto: number; cuadro: number };

const MARGEN = 120;

/** Un texto que sube desde abajo de su renglón (máscara). */
const Sube: React.FC<{ k: number; children: ReactNode; style?: CSSProperties }> = ({ k, children, style }) => (
  <div style={{ overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em", ...style }}>
    <div style={{ transform: `translateY(${(1 - curvaMarca(k)) * 110}%)` }}>{children}</div>
  </div>
);

/** Separación de color (rojo y cian) que se va apagando: el "golpe" de un corte. */
const Separado: React.FC<{ fuerza: number; u: number; children: ReactNode; style?: CSSProperties }> = ({ fuerza, u, children, style }) => {
  // Más corto y más suave que antes (web más humana): un acento, no un glitch.
  const d = fuerza * 7 * u;
  return (
    <div style={{ position: "relative", ...style }}>
      {fuerza > 0.01 ? (
        <>
          {/* Las copias tiñen el blanco del texto con filtros: rojo de un lado, cian del otro. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${-d}px)`,
              filter: "brightness(0.6) sepia(1) saturate(9) hue-rotate(-48deg)",
              mixBlendMode: "screen",
              opacity: 0.85,
            }}
          >
            {children}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${d}px)`,
              filter: "brightness(0.6) sepia(1) saturate(9) hue-rotate(140deg)",
              mixBlendMode: "screen",
              opacity: 0.85,
            }}
          >
            {children}
          </div>
        </>
      ) : null}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};

// ────────────────────────────────────────────── 0–4 · La tele

const Estatica: React.FC<{ cuadro: number; fuerza: number }> = ({ cuadro, fuerza }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const img = ctx.createImageData(c.width, c.height);
    const r = azar(cuadro * 31 + 1);
    const banda = (cuadro * 3) % c.height;
    for (let y = 0; y < c.height; y++) {
      const claridad = 0.6 + 0.4 * Math.exp(-(((y - banda) / 18) ** 2)) + (y % 2 ? -0.08 : 0);
      for (let x = 0; x < c.width; x++) {
        const v = Math.floor(r() * 210 * claridad);
        const i = (y * c.width + x) * 4;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [cuadro]);
  return <canvas ref={lienzo} width={384} height={216} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: fuerza }} />;
};

export const Tele: React.FC<Props> = ({ t, u, ancho, alto, cuadro }) => {
  const enganchada = t >= T.enganche;
  const r = azar(Math.floor(t * 14) + 11);
  // El tubo se enciende: una línea que se abre.
  const abre = curvaMarca(tramo(t, 0, 0.38));
  // Antes de enganchar: borroso, corrido, con fantasma y cortes horizontales.
  const corrido = enganchada ? 0 : (Math.sin(t * 5.1) * 60 + (r() - 0.5) * 50) * u;
  const borroso = enganchada ? 0 : 7 + r() * 5;
  const visible = enganchada ? 1 : t < 0.3 ? 0 : r() > 0.82 ? 0.25 : 0.85;
  const golpe = enganchada ? 1 - tramo(t, T.enganche, T.enganche + 0.35) : 0;
  const crece = enganchada ? 1.12 - 0.12 * curvaMarca(tramo(t, T.enganche, T.enganche + 0.5)) : 0.94;
  const lento = enganchada ? 1 + 0.035 * tramo(t, T.enganche + 0.5, T.problema) : 1;
  const destello = enganchada ? Math.max(0, 1 - (t - T.enganche) / 0.2) : 0;

  const palabra = <div style={{ ...michroma(150 * u), whiteSpace: "nowrap" }}>QUVANT</div>;
  const tiras = [0, 1, 2];

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      {!enganchada ? (
        <AbsoluteFill style={{ transform: `scaleY(${Math.max(0.004, abre)})`, filter: "contrast(1.2)" }}>
          <Estatica cuadro={cuadro} fuerza={0.9} />
          {/* Las líneas de la pantalla. */}
          <AbsoluteFill style={{ background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 ${2 * u}px, transparent ${2 * u}px ${4 * u}px)` }} />
        </AbsoluteFill>
      ) : (
        <Grilla u={u} ancho={ancho} alto={alto} opacidad={0.35 * tramo(t, T.enganche + 0.2, T.enganche + 0.8)} />
      )}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: visible }}>
        <div style={{ position: "relative", transform: `scale(${crece * lento})` }}>
          {enganchada ? (
            <Separado fuerza={golpe} u={u}>
              {palabra}
            </Separado>
          ) : (
            // Tres tiras horizontales, cada una corrida distinto: la señal que no engancha.
            <div style={{ position: "relative", filter: `blur(${borroso * u}px) grayscale(1)`, color: "#bdbdc2" }}>
              <div style={{ visibility: "hidden" }}>{palabra}</div>
              {tiras.map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: `inset(${i * 33.3}% 0 ${(2 - i) * 33.3}% 0)`,
                    transform: `translateX(${corrido + (r() - 0.5) * 70 * u}px)`,
                    opacity: 0.85,
                  }}
                >
                  {palabra}
                </div>
              ))}
              <div style={{ position: "absolute", inset: 0, transform: `translateX(${corrido + 40 * u}px)`, opacity: 0.35 }}>{palabra}</div>
            </div>
          )}
        </div>
      </AbsoluteFill>
      {enganchada ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: alto / 2 + 120 * u, display: "flex", justifyContent: "center" }}>
          <Sube k={tramo(t, T.enganche + 0.55, T.enganche + 1.3)}>
            <div style={{ ...titulo(36 * u), color: COLOR.acero }}>Software de gestión, apps y webs.</div>
          </Sube>
        </div>
      ) : null}
      {destello > 0 ? <AbsoluteFill style={{ background: COLOR.blanco, opacity: destello * 0.85 }} /> : null}
    </AbsoluteFill>
  );
};

// ────────────────────────────────────────────── 4–8 · El problema

export const Problema: React.FC<Props> = ({ t, u, ancho, alto }) => {
  if (t >= T.respiro) return <AbsoluteFill style={{ background: COLOR.negro }} />;
  const actual = [...PALABRAS_PROBLEMA].reverse().find((p) => t >= p.t) ?? PALABRAS_PROBLEMA[0];
  const local = t - actual.t;
  const entra = tramo(local, 0, 0.14);
  const ordena = curvaMarca(tramo(t, 6.5, 7.35));
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <Grilla u={u} ancho={ancho} alto={alto} desorden={1 - ordena} opacidad={0.55 + 0.3 * ordena} color={ordena > 0.5 ? "#3a3b42" : COLOR.profundo} semilla={9} />
      <div style={{ position: "absolute", left: MARGEN * u, top: 0, bottom: 0, right: MARGEN * u, display: "flex", alignItems: "center" }}>
        <div
          style={{
            transform: `translateY(${(1 - curvaMarca(entra)) * 30 * u}px)`,
            filter: `blur(${(1 - entra) * 10 * u}px)`,
            opacity: entra,
          }}
        >
          <Separado fuerza={1 - tramo(local, 0, 0.1)} u={u}>
            <div style={{ ...titulo((actual.grande ? 150 : 118) * u), maxWidth: 1300 * u }}>
              {actual.texto}
              {actual.grande ? <span style={{ display: "inline-block", width: 22 * u, height: 22 * u, marginLeft: 18 * u, background: ACENTO.contacto }} /> : null}
            </div>
          </Separado>
        </div>
      </div>
      <div style={{ position: "absolute", left: MARGEN * u, top: 96 * u }}>
        <div style={etiqueta(18 * u)}>Lo que vemos en cada empresa</div>
      </div>
    </AbsoluteFill>
  );
};

// ────────────────────────────────────────────── 8–20 · Los trabajos

const DATOS: Record<(typeof TRABAJOS)[number]["id"], { tipo: string; nombre: string; detalle: string }> = {
  grimm: { tipo: "Sitio web", nombre: "Grimm Travel", detalle: "Turismo · Puerto Madryn" },
  yunque: { tipo: "Sistema de gestión", nombre: "Yunque", detalle: "Industria · by Quvant" },
  forja: { tipo: "Sistema · 3D", nombre: "Forja", detalle: "La red de sucursales, en vivo" },
  hackfit: { tipo: "App", nombre: "HackFit", detalle: "Gimnasios y fitness" },
  firmamento: { tipo: "Sistema", nombre: "Firmamento", detalle: "Todos tus proyectos en un panel" },
  "gene-keys": { tipo: "App", nombre: "Gene Keys", detalle: "Bienestar" },
};

const cap = (nombre: string, ancho: number, alto: number): Captura => ({ src: archivo(nombre), ancho, alto });

function Escenario({ id, local, u }: { id: (typeof TRABAJOS)[number]["id"]; local: number; u: number }) {
  const k = suave(tramo(local, 0, 2));
  switch (id) {
    case "grimm":
      return (
        <>
          <Notebook u={u} ancho={1040 * u} captura={cap("grimm-inicio-escritorio-1.webp", 1440, 8000)} bajada={0.04 + 0.3 * k} style={{ left: 700 * u, top: 200 * u }} />
          <Telefono u={u} ancho={250 * u} captura={cap("grimm-inicio-celular-1.webp", 780, 8000)} bajada={0.05 + 0.5 * k} style={{ left: 1580 * u, top: 360 * u, transform: `translateZ(${90 * u}px)` }} />
        </>
      );
    case "yunque":
      return (
        <>
          <Notebook u={u} ancho={1000 * u} captura={cap("yunque-sistema-escritorio-1.webp", 1440, 900)} bajada={0} zoom={1 + 0.07 * k} style={{ left: 840 * u, top: 200 * u }} />
          <Telefono u={u} ancho={250 * u} captura={cap("yunque-sitio-celular-1.webp", 780, 8000)} bajada={0.02 + 0.4 * k} style={{ left: 640 * u, top: 330 * u, transform: `translateZ(${110 * u}px)` }} />
        </>
      );
    case "forja": {
      const cuadro = Math.min(65, Math.floor(local * 30)) + 1;
      return (
        <Ventana u={u} ancho={1180 * u} alto={(1180 / 1.6 + 40) * u} titulo="yunque + forja · la red en 3D" style={{ left: 640 * u, top: 160 * u }}>
          <Img src={archivo(`forja/${String(cuadro).padStart(3, "0")}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + 0.06 * k})` }} />
        </Ventana>
      );
    }
    case "hackfit":
      return (
        <>
          <Telefono u={u} ancho={270 * u} captura={cap("hackfit-inicio-portada-celular.webp", 600, 1298)} bajada={0} style={{ left: 880 * u, top: 230 * u, transform: `translateZ(${-120 * u}px) rotateZ(-7deg)`, opacity: 0.85 }} />
          <Telefono u={u} ancho={310 * u} captura={cap("hackfit-inicio-celular-1.webp", 780, 1688)} bajada={0.1 + 0.8 * k} style={{ left: 1180 * u, top: 110 * u, transform: `translateZ(${60 * u}px)` }} />
        </>
      );
    case "firmamento":
      return (
        <>
          <Notebook u={u} ancho={1060 * u} captura={cap("firmamento-inicio-escritorio-1.webp", 1440, 900)} bajada={0} zoom={1 + 0.06 * k} style={{ left: 700 * u, top: 190 * u }} />
          <Telefono u={u} ancho={240 * u} captura={cap("firmamento-inicio-celular-1.webp", 780, 1722)} bajada={0.1 + 0.8 * k} style={{ left: 1600 * u, top: 400 * u, transform: `translateZ(${90 * u}px)` }} />
        </>
      );
    case "gene-keys":
      return (
        <>
          <Notebook u={u} ancho={920 * u} captura={cap("gene-keys-inicio-escritorio-1.webp", 1440, 900)} bajada={0} zoom={1 + 0.05 * k} style={{ left: 1000 * u, top: 230 * u, transform: `translateZ(${-130 * u}px)` }} />
          <Telefono u={u} ancho={300 * u} captura={cap("gene-keys-inicio-celular-1.webp", 780, 2578)} bajada={0.05 + 0.6 * k} style={{ left: 780 * u, top: 120 * u, transform: `translateZ(${80 * u}px)` }} />
        </>
      );
  }
}

export const Trabajos: React.FC<Props> = ({ t, u, ancho, alto }) => {
  const i = Math.min(TRABAJOS.length - 1, Math.floor((t - T.trabajos) / 2));
  const trabajo = TRABAJOS[i];
  const local = t - trabajo.t;
  const datos = DATOS[trabajo.id];
  const entra = curvaMarca(tramo(local, 0, 0.5));
  const sale = tramo(local, 1.9, 2);
  const giro = -15 + 9 * suave(tramo(local, 0, 2));
  const empuje = 70 * suave(tramo(local, 0, 2));
  return (
    <AbsoluteFill style={{ background: COLOR.negro, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 60% at 66% 52%, ${ACENTO.trabajos}2e 0%, transparent 70%)` }} />
      <Grilla u={u} ancho={ancho} alto={alto} opacidad={0.4} />
      {/* El escenario: los dispositivos en 3D, entrando desde la derecha y saliendo a la izquierda. */}
      <AbsoluteFill
        style={{
          perspective: 2200 * u,
          transform: `translateX(${(1 - entra) * 240 * u - sale * 300 * u}px)`,
          filter: `blur(${((1 - entra) * 14 + sale * 20) * u}px)`,
          opacity: Math.min(1, entra * 1.4) * (1 - sale * 0.6),
        }}
      >
        <AbsoluteFill
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: `${1240 * u}px ${540 * u}px`,
            transform: `rotateX(5deg) rotateY(${giro}deg) translateZ(${empuje * u}px)`,
          }}
        >
          <Escenario id={trabajo.id} local={local} u={u} />
        </AbsoluteFill>
      </AbsoluteFill>
      {/* El oscurecido de la izquierda, para que la etiqueta se lea. */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(13,13,15,0.92) 0%, rgba(13,13,15,0.6) 30%, transparent 52%)" }} />
      <div style={{ position: "absolute", left: MARGEN * u, top: 96 * u, display: "flex", gap: 22 * u, alignItems: "center" }}>
        <span style={{ width: 9 * u, height: 9 * u, background: ACENTO.trabajos }} />
        <span style={{ ...etiqueta(18 * u), color: COLOR.blanco }}>Trabajos</span>
        {/* Dónde vamos: un cuadradito por trabajo, sin numeración. */}
        <span style={{ display: "flex", gap: 8 * u, marginLeft: 6 * u }}>
          {TRABAJOS.map((x, n) => (
            <span key={x.id} style={{ width: 6 * u, height: 6 * u, background: n <= i ? COLOR.blanco : COLOR.profundo }} />
          ))}
        </span>
      </div>
      <div style={{ position: "absolute", left: MARGEN * u, bottom: 150 * u, width: 600 * u }}>
        <Sube k={tramo(local, 0.08, 0.62)}>
          <div style={{ ...etiqueta(19 * u), color: ACENTO.trabajos }}>{datos.tipo}</div>
        </Sube>
        <div style={{ height: 18 * u }} />
        <Sube k={tramo(local, 0.12, 0.7)}>
          <div style={titulo(96 * u)}>{datos.nombre}</div>
        </Sube>
        <div style={{ height: 14 * u }} />
        <Sube k={tramo(local, 0.2, 0.8)}>
          <div style={texto(30 * u)}>{datos.detalle}</div>
        </Sube>
      </div>
      {local < 0.06 ? <AbsoluteFill style={{ background: COLOR.blanco, opacity: 0.18 * (1 - local / 0.06) }} /> : null}
    </AbsoluteFill>
  );
};

// ────────────────────────────────────────────── 20–24 · La pared

const PORTADAS = [
  "grimm-inicio-portada.webp",
  "yunque-sistema-portada.webp",
  "forja-red-portada.webp",
  "hackfit-inicio-portada.webp",
  "firmamento-inicio-portada.webp",
  "millonarios-inicio-portada.webp",
  "ideario-inicio-portada.webp",
  "gene-keys-inicio-portada.webp",
  "yunque-sitio-portada.webp",
];

export const Pared: React.FC<Props> = ({ t, u }) => {
  const local = t - T.pared;
  const actual = [...PALABRAS_PARED].reverse().find((p) => t >= p.t) ?? PALABRAS_PARED[0];
  const dePalabra = t - actual.t;
  const golpe = 1 - tramo(dePalabra, 0, 0.35);
  const anchoTile = 440 * u;
  const altoTile = anchoTile / 1.6;
  const filas = 4;
  const columnas = 5;
  return (
    <AbsoluteFill style={{ background: COLOR.negro, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: 1800 * u }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: columnas * (anchoTile + 28 * u),
            transformStyle: "preserve-3d",
            transform: `translate(-50%, -50%) rotateX(32deg) rotateZ(-12deg) translateY(${(-local * 70 + 120) * u}px) scale(1.25)`,
            display: "grid",
            gridTemplateColumns: `repeat(${columnas}, ${anchoTile}px)`,
            gap: 28 * u,
          }}
        >
          {Array.from({ length: filas * columnas }, (_, n) => (
            <div
              key={n}
              style={{
                width: anchoTile,
                height: altoTile,
                borderRadius: 10 * u,
                overflow: "hidden",
                boxShadow: `inset 0 0 0 ${1.5 * u}px ${COLOR.profundo}`,
              }}
            >
              <Img src={archivo(PORTADAS[(n * 4 + Math.floor(n / columnas)) % PORTADAS.length])} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `brightness(${0.42 + 0.3 * golpe})` }} />
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 50% 46% at 50% 50%, rgba(13,13,15,0.92) 0%, rgba(13,13,15,0.55) 60%, rgba(13,13,15,0.25) 100%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `scale(${1 + 0.07 * golpe})`, filter: `blur(${(1 - tramo(dePalabra, 0, 0.07)) * 8 * u}px)` }}>
          <Separado fuerza={golpe * 0.8} u={u}>
            <div style={{ ...titulo((actual.texto.length > 8 ? 170 : 210) * u), whiteSpace: "nowrap" }}>{actual.texto}</div>
          </Separado>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110 * u, display: "flex", justifyContent: "center" }}>
        <div style={etiqueta(18 * u)}>8 proyectos andando · pymes y empresas de primer nivel</div>
      </div>
    </AbsoluteFill>
  );
};

// ────────────────────────────────────────────── 24–32 · El método

/** La capa gráfica de la marca sobre cada foto (la misma idea que en el sitio), dibujándose. */
function Capa({ id, k, u }: { id: (typeof ETAPAS)[number]["id"]; k: number; u: number }) {
  const trazo = (demora: number) => ({
    fill: "none",
    stroke: ACENTO.metodo,
    strokeWidth: 2.2 * u,
    vectorEffect: "non-scaling-stroke" as const,
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - curvaMarca(tramo(k, demora, demora + 0.55)),
  });
  const punto = (x: number, y: number, demora = 0.6, lado = 1.4) => (
    <rect x={x - lado / 2} y={y - lado / 2} width={lado} height={lado} fill={ACENTO.metodo} opacity={tramo(k, demora, demora + 0.15)} />
  );
  switch (id) {
    case "escuchar":
      return (
        <>
          {[0, 0.25, 0.5].map((d) => (
            <circle key={d} cx={98} cy={52} r={4 + 14 * ((k * 1.3 + d) % 1)} fill="none" stroke={ACENTO.metodo} strokeWidth={1.4 * u} vectorEffect="non-scaling-stroke" opacity={(1 - ((k * 1.3 + d) % 1)) * tramo(k, 0.1, 0.25)} />
          ))}
          <circle cx={98} cy={52} r={3.2} {...trazo(0.05)} />
          {punto(98, 52, 0.4)}
          <path d="M101 52 L136 60" {...trazo(0.3)} />
          {punto(136, 60, 0.7)}
        </>
      );
    case "sonar":
      return (
        <>
          <path d="M84 72 L104 40 L124 52 L148 22" {...trazo(0)} />
          <path d="M104 40 L118 80 L124 52 M118 80 L150 70 L148 22" {...trazo(0.25)} />
          {[
            [84, 72],
            [104, 40],
            [124, 52],
            [148, 22],
            [118, 80],
            [150, 70],
          ].map(([x, y], n) => (
            <React.Fragment key={n}>{punto(x, y, 0.45 + n * 0.05, 1.8)}</React.Fragment>
          ))}
        </>
      );
    case "bajar":
      return (
        <>
          <path d="M140 14 C140 40 96 36 96 62" {...trazo(0)} />
          <path d="M146 18 C146 44 120 40 120 62" {...trazo(0.12)} />
          <path d="M152 22 C152 46 144 44 144 62" {...trazo(0.24)} />
          {[84, 108, 132].map((x, n) => (
            <rect key={x} x={x} y={64} width={24} height={12} {...trazo(0.4 + n * 0.1)} />
          ))}
          {[96, 120, 144].map((x, n) => (
            <React.Fragment key={x}>{punto(x, 70, 0.75 + n * 0.05, 1.8)}</React.Fragment>
          ))}
        </>
      );
    case "construir":
      return (
        <>
          <rect x={100} y={26} width={50} height={36} rx={2} {...trazo(0)} />
          <path d="M106 56 L106 48 M113 56 L113 42 M120 56 L120 45 M127 56 L127 38 M134 56 L134 41 M141 56 L141 35" {...trazo(0.3)} />
          {punto(146, 30, 0.7, 2.4)}
        </>
      );
  }
}

export const Metodo: React.FC<Props> = ({ t, u }) => {
  const i = Math.min(ETAPAS.length - 1, Math.floor((t - T.metodo) / 2));
  const etapa = ETAPAS[i];
  const local = t - etapa.t;
  const k = tramo(local, 0, 2);
  const entra = tramo(local, 0, 0.12);
  return (
    <AbsoluteFill style={{ background: COLOR.negro, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: entra }}>
        <Img
          src={archivo(`objetivo-${etapa.id}.webp`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            // Color real al 35 % (como las fotos de la web), no monocromo.
            filter: "saturate(0.35) contrast(1.08) brightness(0.66)",
            transform: `scale(${1.12 - 0.07 * k}) translateX(${(i % 2 ? -1 : 1) * 18 * k * u}px)`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(13,13,15,0.92) 0%, rgba(13,13,15,0.55) 42%, rgba(13,13,15,0.1) 75%)" }} />
      <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <Capa id={etapa.id} k={k} u={u} />
      </svg>
      {/* Dónde estamos en el método: la línea con los cuatro pasos. */}
      <div style={{ position: "absolute", left: MARGEN * u, top: 96 * u, display: "flex", alignItems: "center", gap: 22 * u }}>
        <span style={{ width: 9 * u, height: 9 * u, background: ACENTO.metodo }} />
        <span style={{ ...etiqueta(18 * u), color: COLOR.blanco }}>Cómo trabajamos</span>
        <div style={{ position: "relative", width: 360 * u, height: 2 * u, background: COLOR.profundo, marginLeft: 12 * u }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${((i + curvaMarca(tramo(local, 0, 0.5))) / ETAPAS.length) * 100}%`, background: ACENTO.metodo }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: MARGEN * u, bottom: 170 * u, width: 1000 * u }}>
        <Sube k={tramo(local, 0.05, 0.65)}>
          <div style={titulo(118 * u)}>{etapa.titulo}</div>
        </Sube>
        <div style={{ height: 24 * u }} />
        <Sube k={tramo(local, 0.18, 0.8)}>
          <div style={{ ...texto(34 * u), color: COLOR.blanco, opacity: 0.8 }}>{etapa.nota}</div>
        </Sube>
      </div>
    </AbsoluteFill>
  );
};

// ────────────────────────────────────────────── 32–36 · Vuelve a subir

export const Subida: React.FC<Props> = ({ t, u, ancho, alto }) => {
  if (t >= T.firma - 0.25) return <AbsoluteFill style={{ background: COLOR.negro }} />;
  const local = t - T.subida;
  const palabras: [string, number][] = [
    ["Contanos", 0],
    ["qué", 0.5],
    ["querés", 0.75],
    ["armar.", 1],
  ];
  const hablemos = local >= 2;
  const k = tramo(local, 2, 3.75);
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <Grilla u={u} ancho={ancho} alto={alto} opacidad={0.45 + 0.3 * k} color="#2f3036" />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 45% 50% at 50% 55%, ${ACENTO.contacto}${hablemos ? "26" : "10"} 0%, transparent 70%)` }} />
      {!hablemos ? (
        <div style={{ position: "absolute", left: MARGEN * u, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 28 * u }}>
          {palabras.map(([p, desde]) =>
            local >= desde ? (
              <div key={p} style={{ opacity: tramo(local, desde, desde + 0.08), filter: `blur(${(1 - tramo(local, desde, desde + 0.1)) * 8 * u}px)` }}>
                <div style={titulo(104 * u)}>{p}</div>
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `scale(${1 + 0.12 * k})` }}>
            <Separado fuerza={(1 - tramo(local, 2, 2.3)) + tramo(local, 3.3, 3.75) * 0.9} u={u}>
              <div style={{ ...titulo(210 * u), whiteSpace: "nowrap" }}>
                Hablemos
                <span style={{ display: "inline-block", width: 30 * u, height: 30 * u, marginLeft: 26 * u, background: ACENTO.contacto }} />
              </div>
            </Separado>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
