import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FIRMA } from "../scenes/Cierre";
import { CadenaPost } from "../three/Gradacion";
import { QChrome } from "../three/QChrome";
import { ACENTO, COLOR, curvaMarca, etiqueta, michroma, texto, tramo, useLetras } from "./base";
import { Metodo, Pared, Problema, Subida, Tele, Trabajos, type Props } from "./escenas";
import { Grano, Vineta } from "./piezas";
import { DURACION, T } from "./tiempos";

/**
 * Spot 2026 · 42 s a 60 fps, con la imagen cortada a la música
 * (src/spot2026/tiempos.ts y scripts/componer-musica-2026.ts).
 *
 *  0–4   La tele: la misma intro de la web. Estática, QUVANT borroso que
 *        se corre y se corta; a los 2 s engancha la señal.
 *  4–8   El problema, una palabra por pulso, con la grilla desparramada
 *        que se ordena en "Lo ordenamos.".
 *  8–20  Cae el beat: los trabajos reales, uno por compás, en una
 *        notebook y un celular que se mueven en 3D.
 *  20–24 La pared con todos los trabajos: Webs. Sistemas. Apps.
 *  24–32 El método, con las fotos en blanco y negro y la capa de la marca.
 *  32–36 Vuelve a subir: "Contanos qué querés armar." y "Hablemos.".
 *  36–42 La Q de cromo, la firma y la bajada.
 *
 * Todo es DOM (barato de dibujar) salvo la Q del final, que va en un
 * lienzo 3D con la gradación de la marca. La música se mezcla después con
 * ffmpeg (npm run entregas-2026).
 */

export const SPOT_2026 = { segundos: DURACION, fps: 60 };

/**
 * La firma "Q. QUVANT" del manual (la misma geometría que firma() del spot
 * anterior), un 35 % más grande: a 1080p la de 4K quedaba chica.
 */
function firmaGrande(ancho: number, alto: number) {
  const u = ancho / 3840;
  const tamano = 180 * u * 1.35;
  const ladoQ = FIRMA.ladoQEm * tamano;
  const espacio = FIRMA.espacioEm * tamano;
  const total = ladoQ + espacio + FIRMA.quvantEm * tamano;
  const x0 = (ancho - total) / 2;
  const centroY = alto * 0.44;
  return {
    tamano,
    ladoQ,
    centroQ: [x0 + ladoQ / 2, centroY] as [number, number],
    textoX: x0 + ladoQ + espacio,
    centroMayusculas: centroY + FIRMA.bajaMayusculasEm * tamano,
    bajadaY: centroY + ladoQ / 2 + 110 * u,
  };
}

const Firma: React.FC<Props> = ({ t, u, ancho, alto, cuadro }) => {
  const local = t - T.firma;
  const f = firmaGrande(ancho, alto);
  const pxPorUnidad = alto / (2 * 9 * Math.tan((20 * Math.PI) / 180));
  const entrada = curvaMarca(tramo(local, 0, 1.35));
  const separa = curvaMarca(tramo(local, 1.55, 2.0));
  const x = (f.centroQ[0] - ancho / 2 + (1 - entrada) * ancho * 0.9) / pxPorUnidad;
  const y = (alto / 2 - f.centroQ[1]) / pxPorUnidad;
  const top = f.centroMayusculas - 0.565 * f.tamano;
  const letras = "QUVANT".split("");
  const destello = Math.max(0, 1 - local / 0.25);
  const onda = tramo(local, 0, 0.9);
  const cierre = tramo(local, DURACION - T.firma - 0.6, DURACION - T.firma);
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      {/* La onda de luz del golpe. */}
      <div
        style={{
          position: "absolute",
          left: f.centroQ[0],
          top: f.centroQ[1],
          width: 1600 * u * onda,
          height: 1600 * u * onda,
          marginLeft: -800 * u * onda,
          marginTop: -800 * u * onda,
          borderRadius: "50%",
          border: `${2 * u}px solid ${COLOR.blanco}`,
          opacity: (1 - onda) * 0.5,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 45% at ${(f.centroQ[0] / ancho) * 100}% 46%, rgba(236,236,238,${0.1 * entrada}) 0%, transparent 70%)` }} />
      <ThreeCanvas width={ancho} height={alto} flat linear gl={{ antialias: false }} camera={{ position: [0, 0, 9], fov: 40 }}>
        <QChrome posicion={[x, y, 0]} rotacion={[(1 - entrada) * 0.25, (1 - entrada) * -1.2]} escala={f.ladoQ / pxPorUnidad / 105} adelanto={-0.8 * (1 - separa)} />
        <CadenaPost ancho={ancho} alto={alto} cuadro={cuadro} multisampling={4} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: f.textoX, top, display: "flex", ...michroma(f.tamano) }}>
        {letras.map((letra, i) => {
          const e = curvaMarca(tramo(local, 2.0 + i * 0.05, 2.6 + i * 0.05));
          return (
            <div key={i} style={{ overflow: "hidden", paddingBottom: "0.2em", marginBottom: "-0.2em" }}>
              <div style={{ transform: `translateY(${(1 - e) * 110}%)`, marginRight: i === letras.length - 1 ? "-0.18em" : 0 }}>{letra}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: f.bajadaY, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 * u }}>
        <div style={{ ...texto(34 * u), color: COLOR.acero, opacity: tramo(local, 2.5, 3.0), transform: `translateY(${(1 - curvaMarca(tramo(local, 2.5, 3.1))) * 16 * u}px)` }}>
          Software de gestión, apps y webs para pymes y empresas de primer nivel.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 * u, opacity: tramo(local, 3.1, 3.5) }}>
          <span style={{ width: 9 * u, height: 9 * u, background: ACENTO.contacto }} />
          <span style={{ ...etiqueta(18 * u), color: COLOR.blanco }}>Hablemos · @quvant.ar</span>
        </div>
      </div>
      {destello > 0 ? <AbsoluteFill style={{ background: COLOR.blanco, opacity: destello * 0.9 }} /> : null}
      {cierre > 0 ? <AbsoluteFill style={{ background: COLOR.negro, opacity: cierre }} /> : null}
    </AbsoluteFill>
  );
};

export const Spot2026: React.FC = () => {
  useLetras();
  const cuadro = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = cuadro / fps;
  const props: Props = { t, u: width / 1920, ancho: width, alto: height, cuadro };

  let escena: React.ReactNode;
  if (t < T.problema) escena = <Tele {...props} />;
  else if (t < T.trabajos) escena = <Problema {...props} />;
  else if (t < T.pared) escena = <Trabajos {...props} />;
  else if (t < T.metodo) escena = <Pared {...props} />;
  else if (t < T.subida) escena = <Metodo {...props} />;
  else if (t < T.firma) escena = <Subida {...props} />;
  else escena = <Firma {...props} />;

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      {escena}
      <Vineta fuerza={t < T.enganche ? 0.9 : 0.7} />
      <Grano cuadro={cuadro} fuerza={t < T.metodo || t >= T.subida ? 0.06 : 0.1} />
    </AbsoluteFill>
  );
};
