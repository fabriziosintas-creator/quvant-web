import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, curvaMarca, michroma, suave, texto, titulo, tramo, useLetras } from "../spot2026/base";
import { Grano, Grilla, Vineta } from "../spot2026/piezas";
import { CAPITULO, CAPITULOS, FINAL, type Capitulo, type Plano } from "./guion";

/**
 * El video de "Primeros 100" (video/promo-100/GUION.md): tres capítulos
 * de 13 s (el problema, la pantalla real resolviéndolo, la línea que
 * cierra) y un cierre de 3 s. El mismo componente sirve en 16:9 (la web)
 * y en 9:16 (Reels y Stories): mira la proporción del lienzo.
 *
 * Las letras, la curva y la grilla son las del spot 2026 y la web; las
 * pantallas, en su color real al 35 % de apagado para que convivan con el
 * negro, apoyadas como en la web (bordes suaves y sombra), sin barra
 * lateral (ver preparar-promo100.mjs).
 */

const VERDE = "#7BD389";
const captura = (nombre: string) => staticFile(`promo100/${nombre}`);
/** Las capturas recortadas miden 1360 × 1000. */
const PROPORCION = 1360 / 1000;

type Medidas = { u: number; ancho: number; alto: number; vertical: boolean };

/** Una frase grande que entra subiendo y se va con un fundido. */
function Frase({ t, desde, hasta, m, children, tamano = 110 }: { t: number; desde: number; hasta: number; m: Medidas; children: React.ReactNode; tamano?: number }) {
  const entra = curvaMarca(tramo(t, desde, desde + 0.7));
  const sale = tramo(t, hasta - 0.35, hasta);
  if (t < desde || t > hasta) return null;
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: m.vertical ? "center" : "flex-start",
        padding: m.vertical ? `0 ${80 * m.u}px` : `0 ${150 * m.u}px`,
        textAlign: m.vertical ? "center" : "left",
        opacity: entra * (1 - sale),
        transform: `translateY(${(1 - entra) * 30 * m.u}px)`,
      }}
    >
      <div style={{ ...titulo(tamano * m.u), maxWidth: (m.vertical ? 920 : 1450) * m.u }}>{children}</div>
    </AbsoluteFill>
  );
}

/** La pantalla real, apoyada, acercándose a lo que importa (con una marca verde suave). */
function Pantalla({ plano, k, opacidad, m }: { plano: Plano; k: number; opacidad: number; m: Medidas }) {
  const ancho = (m.vertical ? 980 : 1150) * m.u;
  const alto = ancho / PROPORCION;
  const zoom = 1 + (plano.zoom - 1) * suave(k);
  const [fx, fy] = plano.foco;
  const marca = plano.marca;
  return (
    <div
      style={{
        position: "absolute",
        left: (m.ancho - ancho) / 2,
        top: m.vertical ? 470 * m.u : 70 * m.u,
        width: ancho,
        height: alto,
        borderRadius: 18 * m.u,
        overflow: "hidden",
        opacity: opacidad,
        boxShadow: `0 ${30 * m.u}px ${80 * m.u}px -${30 * m.u}px rgba(0,0,0,0.85), 0 0 0 ${1.5 * m.u}px rgba(236,236,238,0.06)`,
        background: "#131316",
      }}
    >
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }}>
        <Img src={captura(plano.captura)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.65) brightness(0.96)" }} />
        {marca ? (
          <div
            style={{
              position: "absolute",
              left: `${marca[0] * 100}%`,
              top: `${marca[1] * 100}%`,
              width: `${marca[2] * 100}%`,
              height: `${marca[3] * 100}%`,
              borderRadius: 8 * m.u,
              boxShadow: `0 0 0 ${2.5 * m.u}px ${VERDE}, 0 0 ${30 * m.u}px ${VERDE}55`,
              opacity: tramo(k, 0.35, 0.6),
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

/** El subtítulo de abajo, quemado en la imagen en los dos formatos (el video no tiene sonido; en la web no va el .vtt, si no se leería dos veces). */
function Subtitulo({ textoVisible, opacidad, m }: { textoVisible: string; opacidad: number; m: Medidas }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: m.vertical ? 1300 * m.u : 960 * m.u,
        display: "flex",
        justifyContent: "center",
        padding: `0 ${70 * m.u}px`,
        opacity: opacidad,
      }}
    >
      <div style={{ ...texto((m.vertical ? 50 : 38) * m.u), color: COLOR.blanco, textAlign: "center", maxWidth: 1500 * m.u }}>{textoVisible}</div>
    </div>
  );
}

function EscenaCapitulo({ capitulo, t, m }: { capitulo: Capitulo; t: number; m: Medidas }) {
  const enPantalla = t >= 2.5 && t < 10;
  const planos = capitulo.planos;
  return (
    <AbsoluteFill>
      <Frase t={t} desde={0} hasta={2.5} m={m}>
        {capitulo.problema}
      </Frase>
      {enPantalla
        ? planos.map((plano, i) => {
            const hasta = planos[i + 1]?.desde ?? 10;
            if (t < plano.desde - 0.3 || t > hasta) return null;
            const k = tramo(t, plano.desde, hasta);
            const opacidad = Math.min(tramo(t, plano.desde - 0.3, plano.desde + 0.2), 1 - tramo(t, hasta - 0.3, hasta));
            return <Pantalla key={`${plano.captura}-${i}`} plano={plano} k={k} opacidad={i === planos.length - 1 ? Math.min(opacidad, 1 - tramo(t, 9.6, 10)) : opacidad} m={m} />;
          })
        : null}
      {capitulo.subtitulos.map((s) =>
        t >= s.desde && t < s.hasta ? (
          <Subtitulo key={s.texto} textoVisible={s.texto} opacidad={Math.min(tramo(t, s.desde, s.desde + 0.25), 1 - tramo(t, s.hasta - 0.25, s.hasta))} m={m} />
        ) : null,
      )}
      <Frase t={t} desde={10} hasta={CAPITULO} m={m} tamano={96}>
        {capitulo.cierre}
      </Frase>
    </AbsoluteFill>
  );
}

function Final({ t, m }: { t: number; m: Medidas }) {
  const entra = curvaMarca(tramo(t, 0, 0.8));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: entra, textAlign: "center", padding: `0 ${80 * m.u}px` }}>
      <div style={{ ...michroma(34 * m.u), color: COLOR.acero, marginBottom: 40 * m.u }}>QUVANT</div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 * m.u }}>
        <span style={{ width: 22 * m.u, height: 22 * m.u, background: VERDE }} />
        <span style={titulo(130 * m.u)}>{FINAL.titulo}</span>
      </div>
      <div style={{ ...texto(44 * m.u), color: COLOR.blanco, marginTop: 30 * m.u, maxWidth: 1400 * m.u }}>{FINAL.texto}</div>
      <div style={{ ...texto(36 * m.u), marginTop: 26 * m.u }}>{FINAL.link}</div>
    </AbsoluteFill>
  );
}

export const Promo100: React.FC = () => {
  useLetras();
  const cuadro = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = cuadro / fps;
  const vertical = height > width;
  const m: Medidas = { u: vertical ? width / 1080 : width / 1920, ancho: width, alto: height, vertical };
  const i = Math.floor(t / CAPITULO);

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <Grilla u={m.u} ancho={width} alto={height} opacidad={0.35} />
      {i < CAPITULOS.length ? <EscenaCapitulo capitulo={CAPITULOS[i]} t={t - i * CAPITULO} m={m} /> : <Final t={t - CAPITULOS.length * CAPITULO} m={m} />}
      <Vineta fuerza={0.6} />
      <Grano cuadro={cuadro} fuerza={0.05} />
    </AbsoluteFill>
  );
};
