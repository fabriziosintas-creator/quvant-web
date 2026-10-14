import React from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  Html5Video,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { COLOR, FUENTE, TRACKING } from "../brand/tokens";
import { useFuentes } from "../brand/fuentes";
import { DotGrid } from "../three/DotGrid";
import { Revelado, VueloDelPunto } from "../transitions/Salto";
import trayectoria from "./forja/cursor.json";

/**
 * Recorrido real por Forja (demo pública), para la ventana de Forja en la
 * web: la red con todas las sucursales, la entrada a Casa Central en 3D,
 * los racks con faltantes, la lista de críticos y la sala de control.
 *
 * La base es una sola toma grabada en vivo (npm run grabar-forja). Acá se
 * edita: cortes, velocidad por escena, una cámara lenta por escena, el
 * cursor dibujado a 30 fps a partir de la trayectoria grabada, rótulos, y
 * "el salto" entre escenas con la grilla en GLSL. Loop perfecto: el último
 * salto revela el primer cuadro.
 */

export const FPS = 30;
export const ANCHO = 1600;
export const ALTO = 1000;
const VUELO = 13; // 420 ms
const REVELADO = 16;
/** La escena entra unos cuadros después que la grilla: queda una franja de grilla a la vista. */
const RETRASO = 6;

type Escena = {
  id: string;
  /** Tramo de la grabación, en segundos. */
  desde: number;
  hasta: number;
  velocidad: number;
  etiqueta: string | null;
  /** Hacia dónde empuja la cámara (fracciones del cuadro) y cuánto. */
  foco: [number, number];
  escala: [number, number];
  /** Si se llega a esta escena con un salto (si no, es un corte seguido). */
  salto: boolean;
};

const ESCENAS: Escena[] = [
  { id: "fragua", desde: 15.0, hasta: 18.6, velocidad: 1.2, etiqueta: null, foco: [0.5, 0.5], escala: [1, 1.06], salto: false },
  { id: "red", desde: 19.5, hasta: 29.5, velocidad: 2, etiqueta: "01 · Todas tus sucursales", foco: [0.55, 0.45], escala: [1.05, 1], salto: false },
  { id: "entrar", desde: 31.3, hasta: 39.0, velocidad: 1.5, etiqueta: "02 · Entrás a una sucursal", foco: [0.5, 0.5], escala: [1, 1.05], salto: true },
  { id: "racks", desde: 43.7, hasta: 56.0, velocidad: 2.2, etiqueta: "03 · Rack por rack, lo que falta", foco: [0.45, 0.35], escala: [1, 1.12], salto: true },
  { id: "criticos", desde: 75.2, hasta: 77.6, velocidad: 0.8, etiqueta: "04 · Los críticos, en una lista", foco: [0.93, 0.45], escala: [1, 1.25], salto: true },
  { id: "sala", desde: 83.0, hasta: 87.4, velocidad: 1, etiqueta: "05 · Toda la red, en una pantalla", foco: [0.3, 0.75], escala: [1, 1.06], salto: true },
];

const duracionDe = (e: Escena) => Math.round(((e.hasta - e.desde) / e.velocidad) * FPS);

/** Dónde arranca cada escena en la línea de tiempo. */
const INICIOS = ESCENAS.reduce<number[]>((acc, e, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + duracionDe(ESCENAS[i - 1]));
  return acc;
}, []);

const ULTIMA = ESCENAS.length - 1;
export const DURACION = INICIOS[ULTIMA] + duracionDe(ESCENAS[ULTIMA]) + REVELADO + RETRASO;

// El salto sale de un punto de la grilla abajo a la izquierda y aterriza a
// la derecha del centro, donde suele estar la acción.
const ORIGEN: [number, number] = [150, 860];
const DESTINO: [number, number] = [1010, 470];

type PuntoCursor = { s: number; x: number; y: number; a: boolean };
const PUNTOS = trayectoria as PuntoCursor[];
const CLICS = PUNTOS.filter((p, i) => p.a && !PUNTOS[i - 1]?.a).map((p) => p.s);

/** El cursor en un instante de la grabación, interpolado entre los puntos anotados. */
function cursorEn(segundo: number) {
  if (segundo < PUNTOS[0].s) return null;
  let i = 0;
  while (i < PUNTOS.length - 1 && PUNTOS[i + 1].s <= segundo) i++;
  const a = PUNTOS[i];
  const b = PUNTOS[Math.min(i + 1, PUNTOS.length - 1)];
  const t = b.s > a.s ? Math.min(1, (segundo - a.s) / (b.s - a.s)) : 0;
  const clic = [...CLICS].reverse().find((c) => c <= segundo);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, desdeClic: clic === undefined ? 99 : segundo - clic };
}

const Cursor: React.FC<{ segundo: number }> = ({ segundo }) => {
  const c = cursorEn(segundo);
  if (!c) return null;
  const onda = Math.min(1, c.desdeClic / 0.4);
  return (
    <>
      {onda < 1 ? (
        <div
          style={{
            position: "absolute",
            left: c.x,
            top: c.y,
            width: 16 + onda * 40,
            height: 16 + onda * 40,
            transform: "translate(-50%, -50%)",
            border: `2px solid ${COLOR.blanco}`,
            opacity: 1 - onda,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: c.x,
          top: c.y,
          width: 14,
          height: 14,
          transform: "translate(-50%, -50%)",
          background: COLOR.blanco,
          boxShadow: `0 0 0 2px ${COLOR.negro}D9, 0 0 18px ${COLOR.blanco}59`,
        }}
      />
    </>
  );
};

const Rotulo: React.FC<{ texto: string; cuadro: number; duracion: number }> = ({ texto, cuadro, duracion }) => {
  const entrada = interpolate(cuadro, [REVELADO, REVELADO + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salida = interpolate(cuadro, [duracion - VUELO - 8, duracion - VUELO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const visible = Math.min(entrada, salida);
  return (
    <div
      style={{
        position: "absolute",
        left: 28,
        top: 72,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 18px",
        background: `${COLOR.negro}E6`,
        border: `1px solid ${COLOR.profundo}`,
        borderRadius: 8,
        opacity: visible,
        transform: `translateY(${(1 - visible) * 10}px)`,
        fontFamily: FUENTE.plex.familia,
        fontSize: 20,
        letterSpacing: TRACKING.etiqueta,
        textTransform: "uppercase",
        color: COLOR.blanco,
      }}
    >
      <span style={{ width: 9, height: 9, background: COLOR.blanco, transform: `scale(${entrada})` }} />
      {texto}
    </div>
  );
};

/** Una escena: su tramo de la grabación, con cámara, cursor y rótulo. */
const Toma: React.FC<{ escena: Escena }> = ({ escena }) => {
  const cuadro = useCurrentFrame();
  const duracion = duracionDe(escena);
  const segundo = escena.desde + (cuadro / FPS) * escena.velocidad;
  const avance = Easing.inOut(Easing.cubic)(Math.min(1, cuadro / duracion));
  const escala = escena.escala[0] + (escena.escala[1] - escena.escala[0]) * avance;

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <AbsoluteFill
        style={{
          transform: `scale(${escala})`,
          transformOrigin: `${escena.foco[0] * 100}% ${escena.foco[1] * 100}%`,
        }}
      >
        {/* Html5Video y no OffthreadVideo: el compositor de Remotion (remotion.exe)
            está bloqueado en esta máquina; el navegador del render decodifica igual. */}
        <Html5Video
          src={staticFile("forja/recorrido.mp4")}
          trimBefore={Math.round(escena.desde * FPS)}
          playbackRate={escena.velocidad}
          muted
          style={{ width: ANCHO, height: ALTO }}
        />
        <Cursor segundo={segundo} />
      </AbsoluteFill>
      {escena.etiqueta ? <Rotulo texto={escena.etiqueta} cuadro={cuadro} duracion={duracion} /> : null}
    </AbsoluteFill>
  );
};

/** La escena que llega con un salto: primero la grilla, detrás la escena. */
const ConSalto: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cuadro = useCurrentFrame();
  const grilla = cuadro / REVELADO;
  const escena = (cuadro - RETRASO) / REVELADO;
  // Revelada del todo, la grilla ya no se ve: se deja de dibujar.
  if (escena >= 1) return <>{children}</>;
  return (
    <>
      <Revelado progreso={grilla} centro={DESTINO} ancho={ANCHO} alto={ALTO}>
        {/* Paso más ancho que el del 4K: este video se ve achicado en la web
            y los puntos de 2 px desaparecen. */}
        <DotGrid ancho={ANCHO} alto={ALTO} paso={32} periodo={DURACION / FPS} />
      </Revelado>
      {escena > 0 ? (
        <Revelado progreso={escena} centro={DESTINO} ancho={ANCHO} alto={ALTO}>
          {children}
        </Revelado>
      ) : null}
    </>
  );
};

const Vuelo: React.FC = () => {
  const cuadro = useCurrentFrame();
  return <VueloDelPunto progreso={cuadro / VUELO} origen={ORIGEN} destino={DESTINO} lado={16} />;
};

// Sobre una placa, como los rótulos: abajo a la derecha la app tiene su
// propia barra (línea de tiempo, "En vivo") y el texto solo se pisaba.
const Firma: React.FC = () => (
  <div
    style={{
      position: "absolute",
      right: 24,
      bottom: 48,
      padding: "9px 14px",
      background: `${COLOR.negro}E6`,
      border: `1px solid ${COLOR.profundo}`,
      borderRadius: 6,
      fontFamily: FUENTE.michroma.familia,
      fontSize: 14,
      letterSpacing: TRACKING.logotipo,
      color: COLOR.acero,
    }}
  >
    FORJA · BY QUVANT
  </div>
);

export const ForjaRecorrido: React.FC = () => {
  useFuentes();
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      {ESCENAS.map((escena, i) => {
        const siguienteConSalto = ESCENAS[i + 1]?.salto ?? true;
        // La escena sigue corriendo debajo mientras la próxima se revela.
        const cola = siguienteConSalto ? REVELADO : 0;
        return (
          <Sequence key={escena.id} from={INICIOS[i]} durationInFrames={duracionDe(escena) + cola}>
            {escena.salto ? (
              <ConSalto>
                <Toma escena={escena} />
              </ConSalto>
            ) : (
              <Toma escena={escena} />
            )}
          </Sequence>
        );
      })}

      {/* Los vuelos del punto, al final de cada escena que termina en salto (y el del loop). */}
      {ESCENAS.map((escena, i) =>
        (ESCENAS[i + 1]?.salto ?? true) ? (
          <Sequence key={`vuelo-${escena.id}`} from={INICIOS[i] + duracionDe(escena) - VUELO} durationInFrames={VUELO}>
            <Vuelo />
          </Sequence>
        ) : null,
      )}

      {/* El loop: el último salto revela el primer cuadro, quieto. */}
      <Sequence from={INICIOS[ULTIMA] + duracionDe(ESCENAS[ULTIMA])} durationInFrames={REVELADO + RETRASO}>
        <ConSalto>
          <Freeze frame={0}>
            <Toma escena={ESCENAS[0]} />
          </Freeze>
        </ConSalto>
      </Sequence>

      <Firma />
    </AbsoluteFill>
  );
};
