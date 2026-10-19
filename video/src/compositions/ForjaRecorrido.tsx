import React from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { COLOR, FUENTE, TRACKING } from "../brand/tokens";
import { useFuentes } from "../brand/fuentes";
import { Vineta } from "../spot2026/piezas";
import { DotGrid } from "../three/DotGrid";
import { Revelado, VueloDelPunto } from "../transitions/Salto";
import trayectoria from "./forja/cursor.json";
import marcas from "./forja/marcas.json";

/**
 * Recorrido real por Forja (demo pública), para la ventana de Forja en la
 * web: la fragua de la intro, la red con todas las sucursales, la entrada
 * a Casa Central en 3D, los racks con faltantes, la lista de críticos y la
 * sala de control.
 *
 * La base es una sola toma grabada cuadro por cuadro a 60 fps con un reloj
 * virtual (npm run grabar-forja): cada cuadro se dibujó entero antes de
 * fotografiarlo, así que no hay tirones aunque la máquina tarde. La toma ya
 * tiene el ritmo final, así que acá todo va a velocidad 1 (sin acelerar,
 * que era lo que hacía saltar la versión anterior).
 *
 * Acá se edita: los tramos, la cámara que se abre despacio en la fragua (en las demás
 * escenas va quieta: un empuje cortaba el logo y los controles de la demo), el cursor
 * dibujado a partir de la trayectoria grabada, los rótulos, la viñeta del
 * spot 2026 y "el salto" (la grilla en GLSL) donde la toma se corta. Loop
 * perfecto: el último salto revela el primer cuadro.
 */

export const FPS = 60;
export const ANCHO = 1600;
export const ALTO = 1000;
const s = (segundos: number) => Math.round(segundos * FPS);
const VUELO = s(0.42);
const REVELADO = s(0.53);
/** La escena entra unos cuadros después que la grilla: queda una franja de grilla a la vista. */
const RETRASO = s(0.2);

/** El segundo de la toma en que empieza un momento (marcas.json, lo anota el grabador). */
const marca = (momento: string) => {
  const m = marcas.find((x) => x.momento === momento);
  if (!m) throw new Error(`Falta la marca "${momento}" en marcas.json`);
  return m.segundo;
};

type Escena = {
  id: string;
  /** Tramo de la toma, en segundos. */
  desde: number;
  hasta: number;
  etiqueta: string | null;
  /** Hacia dónde empuja la cámara (fracciones del cuadro) y cuánto. */
  foco: [number, number];
  escala: [number, number];
  /** Si se llega con un salto (la toma se corta); si no, sigue de corrido. */
  salto: boolean;
};

const ESCENAS: Escena[] = [
  // La intro de la demo: cae el yunque, chispas, la campana y la cámara entra al fuego hasta el mapa.
  { id: "fragua", desde: 0.85, hasta: marca("red"), etiqueta: null, foco: [0.5, 0.5], escala: [1.05, 1], salto: false },
  { id: "red", desde: marca("red"), hasta: marca("entrar"), etiqueta: "01 · Todas tus sucursales", foco: [0.5, 0.62], escala: [1, 1], salto: false },
  { id: "entrar", desde: marca("entrar"), hasta: marca("racks"), etiqueta: "02 · Entrás a una sucursal", foco: [0.45, 0.45], escala: [1, 1], salto: false },
  { id: "racks", desde: marca("racks"), hasta: marca("criticos"), etiqueta: "03 · Rack por rack, lo que falta", foco: [0.4, 0.38], escala: [1, 1], salto: false },
  { id: "criticos", desde: marca("criticos"), hasta: marca("vuelta"), etiqueta: "04 · Los críticos, en una lista", foco: [0.88, 0.4], escala: [1, 1], salto: false },
  // Se saltea la vuelta a la red: la sala llega con un salto.
  { id: "sala", desde: marca("sala") + 0.45, hasta: marca("fin"), etiqueta: "05 · Toda la red, en una pantalla", foco: [0.55, 0.75], escala: [1, 1], salto: true },
];

const duracionDe = (e: Escena) => s(e.hasta - e.desde);

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

/** El cursor en un instante de la toma (un punto por cuadro). Sin puntos, no hay cursor. */
function cursorEn(segundo: number) {
  if (PUNTOS.length === 0 || segundo < PUNTOS[0].s) return null;
  let i = 0;
  while (i < PUNTOS.length - 1 && PUNTOS[i + 1].s <= segundo) i++;
  const a = PUNTOS[i];
  // Pasado el último punto anotado, el cursor ya se fue (el grabador lo escondió).
  if (i === PUNTOS.length - 1 && segundo - a.s > 1.5 / FPS) return null;
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

const Rotulo: React.FC<{ texto: string; cuadro: number; duracion: number; conSalto: boolean }> = ({
  texto,
  cuadro,
  duracion,
  conSalto,
}) => {
  // Con salto entra cuando ya se reveló la escena; de corrido, enseguida.
  const desde = conSalto ? REVELADO : s(0.25);
  const entrada = interpolate(cuadro, [desde, desde + s(0.4)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salida = interpolate(cuadro, [duracion - s(0.35), duracion], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const visible = Easing.bezier(0.2, 0.8, 0.2, 1)(Math.min(entrada, salida));
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
      <span style={{ width: 9, height: 9, background: COLOR.blanco, transform: `scale(${visible})` }} />
      {texto}
    </div>
  );
};

/** Una escena: su tramo de la toma, con cámara, cursor y rótulo. */
const Toma: React.FC<{ escena: Escena; conRotulo?: boolean }> = ({ escena, conRotulo = true }) => {
  const cuadro = useCurrentFrame();
  const duracion = duracionDe(escena);
  const segundo = escena.desde + cuadro / FPS;
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
        <OffthreadVideo
          src={staticFile("forja/recorrido.mp4")}
          trimBefore={s(escena.desde)}
          muted
          style={{ width: ANCHO, height: ALTO }}
        />
        <Cursor segundo={segundo} />
      </AbsoluteFill>
      {conRotulo && escena.etiqueta ? (
        <Rotulo texto={escena.etiqueta} cuadro={cuadro} duracion={duracion} conSalto={escena.salto} />
      ) : null}
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

// Sobre una placa, como los rótulos, abajo al centro: es el único lugar
// libre en todas las escenas (a la derecha tapaba el crédito del mapa y las
// novedades de la sala de control; abajo de todo está la barra de la demo).
const Firma: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      bottom: 64,
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
            <Toma escena={ESCENAS[0]} conRotulo={false} />
          </Freeze>
        </ConSalto>
      </Sequence>

      {/* La viñeta del spot 2026, suave: da profundidad sin apagar la interfaz. */}
      <Vineta fuerza={0.38} />
      <Firma />
    </AbsoluteFill>
  );
};
