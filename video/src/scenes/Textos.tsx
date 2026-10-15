import React from "react";
import { Easing } from "remotion";
import { COLOR, FUENTE, TEXTO, TRACKING } from "../brand/tokens";
import { firma } from "./Cierre";
import { curvaMarca, recorte, tramo } from "./comun";

/**
 * Los textos del spot, en el DOM encima del lienzo 3D (nítidos, sin
 * gradación). Michroma solo en QUVANT, YUNQUE, FORJA y BY QUVANT; todo lo
 * demás en IBM Plex Mono. Cada línea entra subiendo detrás de una máscara
 * y se va antes del salto: el cambio de escena siempre es el salto.
 *
 * Las medidas están pensadas a 4K y se escalan con el ancho del cuadro.
 */

const salida = Easing.in(Easing.cubic);
const MARGEN = 230;

/** Una línea que entra desde abajo de su máscara y sale hacia arriba. */
const Linea: React.FC<{
  t: number;
  entra: number;
  sale?: number;
  children: React.ReactNode;
  estilo?: React.CSSProperties;
}> = ({ t, entra, sale = Infinity, children, estilo }) => {
  if (t < entra || t > sale + 0.35) return null;
  const e = curvaMarca(tramo(t, entra, entra + 0.6));
  const s = salida(tramo(t, sale, sale + 0.35));
  const y = (1 - e) * 110 - s * 110;
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em", ...estilo }}>
      <div style={{ transform: `translateY(${y}%)` }}>{children}</div>
    </div>
  );
};

const plex = (px: number, bold = false): React.CSSProperties => ({
  fontFamily: FUENTE.plex.familia,
  fontWeight: bold ? 700 : 400,
  fontSize: px,
  lineHeight: 1.15,
});

const michroma = (px: number): React.CSSProperties => ({
  fontFamily: FUENTE.michroma.familia,
  fontSize: px,
  letterSpacing: TRACKING.logotipo,
  lineHeight: 1,
  textTransform: "uppercase",
});

const Cuadrado: React.FC<{ lado: number; color?: string }> = ({ lado, color = COLOR.blanco }) => (
  <div style={{ width: lado, height: lado, background: color, flexShrink: 0 }} />
);

/** "■ 01 · PROGRAMACIÓN": la etiqueta chica abajo a la izquierda. */
const Etiqueta: React.FC<{ t: number; entra: number; sale: number; texto: string; u: number }> = ({ t, entra, sale, texto, u }) => (
  <div style={{ position: "absolute", left: MARGEN * u, top: 1880 * u }}>
    <Linea t={t} entra={entra} sale={sale}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 * u }}>
        <Cuadrado lado={16 * u} />
        <span style={{ ...plex(40 * u), letterSpacing: TRACKING.etiqueta, color: COLOR.acero, textTransform: "uppercase" }}>
          {texto}
        </span>
      </div>
    </Linea>
  </div>
);

/** Firma de producto: "Yunque · BY QUVANT" (el nombre en Plex, BY QUVANT en Michroma). */
const FirmaProducto: React.FC<{ producto: string; u: number }> = ({ producto, u }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18 * u, color: COLOR.acero }}>
    <span style={plex(40 * u)}>{producto}</span>
    <span style={plex(40 * u)}>·</span>
    <span style={{ ...michroma(30 * u) }}>BY QUVANT</span>
  </div>
);

const Producto: React.FC<{
  t: number;
  desde: number;
  hasta: number;
  titulo: string;
  bajada: string;
  producto: string;
  u: number;
}> = ({ t, desde, hasta, titulo, bajada, producto, u }) => (
  <>
    <div style={{ position: "absolute", left: MARGEN * u, top: 690 * u, width: 1250 * u }}>
      <Linea t={t} entra={desde} sale={hasta}>
        <div style={{ ...michroma(150 * u), color: COLOR.blanco }}>{titulo}</div>
      </Linea>
      <div style={{ height: 70 * u }} />
      <Linea t={t} entra={desde + 0.2} sale={hasta}>
        <div style={{ ...plex(76 * u, true), color: COLOR.blanco }}>{bajada}</div>
      </Linea>
    </div>
    <div style={{ position: "absolute", left: MARGEN * u, top: 1880 * u }}>
      <Linea t={t} entra={desde + 0.4} sale={hasta}>
        <FirmaProducto producto={producto} u={u} />
      </Linea>
    </div>
  </>
);

/** Titulares de Plex Mono Bold (la voz del manual), una línea por frase. */
const Frases: React.FC<{ t: number; u: number; top: number; lineas: [string, number][]; sale: number }> = ({ t, u, top, lineas, sale }) => (
  <div style={{ position: "absolute", left: MARGEN * u, top: top * u, width: 1600 * u }}>
    {lineas.map(([texto, entra]) => (
      <Linea key={texto} t={t} entra={entra} sale={sale}>
        <div style={{ ...plex(100 * u, true), color: COLOR.blanco }}>{texto}</div>
      </Linea>
    ))}
  </div>
);

/** Las tres fases: tres puntos cuadrados en línea, de a uno; cada uno nace redondo y aterriza cuadrado. */
const Fases: React.FC<{ t: number; u: number; entradas: number[]; sale: number }> = ({ t, u, entradas, sale }) => {
  const s = salida(tramo(t, sale, sale + 0.35));
  return (
    <div style={{ position: "absolute", left: MARGEN * u, top: 1010 * u, display: "flex", gap: 44 * u }}>
      {entradas.map((entra) => {
        const e = curvaMarca(tramo(t, entra, entra + 0.42));
        const lado = 56 * u;
        return (
          <div
            key={entra}
            style={{
              width: lado,
              height: lado,
              background: COLOR.blanco,
              borderRadius: `${50 * (1 - recorte(e / 0.85))}%`,
              transform: `translateY(${(1 - e) * -60 * u}px) scale(${(0.55 + 0.45 * e) * (1 - s)})`,
              opacity: t < entra ? 0 : 1,
            }}
          />
        );
      })}
    </div>
  );
};

/** QUVANT y la bajada del cierre, alineados con la Q 3D (firma() en Cierre.tsx). */
const FirmaCierre: React.FC<{ t: number; ancho: number; alto: number; u: number }> = ({ t, ancho, alto, u }) => {
  const f = firma(ancho, alto);
  // Con line-height 1, el centro de las mayúsculas de Michroma queda a 0,565 em del borde superior de la línea.
  const top = f.centroMayusculas - 0.565 * f.tamano;
  const letras = TEXTO.logotipo.split("");
  return (
    <>
      <div style={{ position: "absolute", left: f.textoX, top, display: "flex", ...michroma(f.tamano), color: COLOR.blanco }}>
        {letras.map((letra, i) => {
          const e = curvaMarca(tramo(t, 41.85 + i * 0.05, 41.85 + i * 0.05 + 0.6));
          return (
            <div key={i} style={{ overflow: "hidden", paddingBottom: "0.2em", marginBottom: "-0.2em" }}>
              <div style={{ transform: `translateY(${(1 - e) * 110}%)`, marginRight: i === letras.length - 1 ? "-0.18em" : 0 }}>
                {letra}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, width: ancho, top: f.bajadaY, display: "flex", justifyContent: "center" }}>
        <Linea t={t} entra={42.35}>
          <div style={{ ...plex(60 * u), color: COLOR.acero }}>{TEXTO.bajada}</div>
        </Linea>
      </div>
    </>
  );
};

export const Textos: React.FC<{ t: number; ancho: number; alto: number }> = ({ t, ancho, alto }) => {
  const u = ancho / 3840;
  return (
    <>
      <Etiqueta t={t} entra={3.25} sale={6.65} texto={TEXTO.etiquetaProgramacion} u={u} />
      <Etiqueta t={t} entra={8.25} sale={11.65} texto={TEXTO.etiquetaDiseno} u={u} />
      <Producto t={t} desde={14.3} hasta={21.9} titulo={TEXTO.yunque} bajada={TEXTO.yunqueBajada} producto="Yunque" u={u} />
      <Producto t={t} desde={24.3} hasta={31.65} titulo={TEXTO.forja} bajada={TEXTO.forjaBajada} producto="Forja" u={u} />
      <Frases
        t={t}
        u={u}
        top={860}
        sale={34.65}
        lineas={[
          ["Entramos en un rubro.", 33.25],
          ["Entendemos cómo trabaja.", 33.6],
        ]}
      />
      <Frases t={t} u={u} top={760} sale={38.65} lineas={[[TEXTO.metodo1, 36.25]]} />
      <Fases t={t} u={u} entradas={[36.7, 36.95, 37.2]} sale={38.65} />
      <div style={{ position: "absolute", left: 0, top: (1180 - 760) * u, width: "100%" }}>
        <Frases t={t} u={u} top={760} sale={38.65} lineas={[[TEXTO.metodo2, 37.55]]} />
      </div>
      <FirmaCierre t={t} ancho={ancho} alto={alto} u={u} />
    </>
  );
};

/** Para el render de prueba: el segundo y el cuadro, arriba a la derecha. */
export const MarcaDeTiempo: React.FC<{ cuadro: number; fps: number; u: number }> = ({ cuadro, fps, u }) => (
  <div
    style={{
      position: "absolute",
      right: 60 * u,
      top: 50 * u,
      ...plex(44 * u),
      color: COLOR.blanco,
      background: COLOR.negro,
      padding: `${8 * u}px ${18 * u}px`,
    }}
  >
    {(cuadro / fps).toFixed(2).padStart(5, "0")} s · {String(cuadro).padStart(4, "0")}
  </div>
);
