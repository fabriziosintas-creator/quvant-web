import React, { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Img } from "remotion";
import { COLOR, azar } from "./base";

/**
 * Las piezas que se repiten: el grano de película, la viñeta, la grilla de
 * puntos, y los dispositivos (una notebook y un celular) con una captura
 * que se desplaza adentro como si alguien bajara por la página.
 */

/** Grano de película: ruido gris que cambia en cada cuadro. */
export const Grano: React.FC<{ cuadro: number; fuerza?: number }> = ({ cuadro, fuerza = 0.07 }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(c.width, c.height);
    const r = azar(cuadro + 7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [cuadro]);
  return (
    <canvas
      ref={lienzo}
      width={640}
      height={360}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: fuerza, mixBlendMode: "overlay", pointerEvents: "none" }}
    />
  );
};

export const Vineta: React.FC<{ fuerza?: number }> = ({ fuerza = 0.75 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(13,13,15,${fuerza}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** La grilla de puntos cuadrados de la marca. `desorden` los desparrama (0 = en su lugar). */
export const Grilla: React.FC<{ u: number; ancho: number; alto: number; desorden?: number; opacidad?: number; color?: string; semilla?: number }> = ({
  u,
  ancho,
  alto,
  desorden = 0,
  opacidad = 0.5,
  color = COLOR.profundo,
  semilla = 3,
}) => {
  const paso = 48 * u;
  const columnas = Math.ceil(ancho / paso) + 1;
  const filas = Math.ceil(alto / paso) + 1;
  const r = azar(semilla);
  const puntos: ReactNode[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const dx = (r() - 0.5) * 2 * paso * 2.2 * desorden;
      const dy = (r() - 0.5) * 2 * paso * 2.2 * desorden;
      const giro = (r() - 0.5) * 180 * desorden;
      puntos.push(
        <div
          key={`${f}-${c}`}
          style={{
            position: "absolute",
            left: c * paso + dx,
            top: f * paso + dy,
            width: 3 * u,
            height: 3 * u,
            background: color,
            transform: `rotate(${giro}deg)`,
          }}
        />,
      );
    }
  }
  return <AbsoluteFill style={{ opacity: opacidad }}>{puntos}</AbsoluteFill>;
};

/** Una captura que se desplaza dentro de una pantalla (progreso 0..1 de cuánto bajó). */
const Pantalla: React.FC<{ src: string; anchoImagen: number; altoImagen: number; anchoPantalla: number; altoPantalla: number; bajada: number; zoom?: number }> = ({
  src,
  anchoImagen,
  altoImagen,
  anchoPantalla,
  altoPantalla,
  bajada,
  zoom = 1,
}) => {
  const escala = anchoPantalla / anchoImagen;
  const altoEscalado = altoImagen * escala;
  const recorrido = Math.max(0, altoEscalado - altoPantalla);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: COLOR.negro }}>
      <Img
        src={src}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: anchoPantalla,
          height: altoEscalado,
          transform: `translateY(${-recorrido * bajada}px) scale(${zoom})`,
          transformOrigin: "50% 0%",
        }}
      />
    </div>
  );
};

export type Captura = { src: string; ancho: number; alto: number };

/** Una notebook: pantalla 16:10 con marco fino y la base, en 3D (CSS). */
export const Notebook: React.FC<{ u: number; ancho: number; captura: Captura; bajada: number; zoom?: number; style?: CSSProperties }> = ({
  u,
  ancho,
  captura,
  bajada,
  zoom,
  style,
}) => {
  const marco = 14 * u;
  const anchoPantalla = ancho - marco * 2;
  const altoPantalla = anchoPantalla / 1.6;
  return (
    <div style={{ position: "absolute", width: ancho, transformStyle: "preserve-3d", ...style }}>
      <div
        style={{
          position: "relative",
          width: ancho,
          height: altoPantalla + marco * 2,
          borderRadius: 18 * u,
          background: "linear-gradient(160deg, #2a2b30, #121215 60%)",
          boxShadow: `0 ${40 * u}px ${110 * u}px rgba(0,0,0,0.65), inset 0 0 0 ${1.5 * u}px #3a3b42`,
          padding: marco,
        }}
      >
        <div style={{ position: "relative", width: anchoPantalla, height: altoPantalla, borderRadius: 6 * u, overflow: "hidden" }}>
          <Pantalla src={captura.src} anchoImagen={captura.ancho} altoImagen={captura.alto} anchoPantalla={anchoPantalla} altoPantalla={altoPantalla} bajada={bajada} zoom={zoom} />
          {/* Una luz grande y difusa de un costado, en vez de un reflejo duro. */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 30%, transparent 55%)" }} />
        </div>
      </div>
      {/* La base. */}
      <div
        style={{
          width: ancho * 1.14,
          height: 18 * u,
          marginLeft: -ancho * 0.07,
          borderRadius: `0 0 ${16 * u}px ${16 * u}px`,
          background: "linear-gradient(180deg, #3a3b40, #1a1a1e)",
          // La sombra de contacto, para que se apoye en algo.
          boxShadow: `0 ${6 * u}px ${14 * u}px rgba(0,0,0,0.85), 0 ${18 * u}px ${40 * u}px rgba(0,0,0,0.6)`,
        }}
      />
    </div>
  );
};

/** Un celular con la isla de arriba. */
export const Telefono: React.FC<{ u: number; ancho: number; captura: Captura; bajada: number; style?: CSSProperties }> = ({ u, ancho, captura, bajada, style }) => {
  const marco = 9 * u;
  const anchoPantalla = ancho - marco * 2;
  const altoPantalla = anchoPantalla * (844 / 390);
  return (
    <div
      style={{
        position: "absolute",
        width: ancho,
        height: altoPantalla + marco * 2,
        borderRadius: 46 * u,
        background: "linear-gradient(160deg, #34353b, #121215 55%)",
        boxShadow: `0 ${40 * u}px ${90 * u}px rgba(0,0,0,0.7), inset 0 0 0 ${1.5 * u}px #44454c`,
        padding: marco,
        ...style,
      }}
    >
      <div style={{ position: "relative", width: anchoPantalla, height: altoPantalla, borderRadius: 38 * u, overflow: "hidden" }}>
        <Pantalla src={captura.src} anchoImagen={captura.ancho} altoImagen={captura.alto} anchoPantalla={anchoPantalla} altoPantalla={altoPantalla} bajada={bajada} />
        <div
          style={{
            position: "absolute",
            top: 12 * u,
            left: "50%",
            width: anchoPantalla * 0.3,
            height: 26 * u,
            marginLeft: -anchoPantalla * 0.15,
            borderRadius: 20 * u,
            background: "#050506",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 30%, transparent 55%)" }} />
      </div>
    </div>
  );
};

/** Una ventana de aplicación (para Forja): marco fino, barra de arriba y el contenido. */
export const Ventana: React.FC<{ u: number; ancho: number; alto: number; titulo: string; children: ReactNode; style?: CSSProperties }> = ({
  u,
  ancho,
  alto,
  titulo,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      width: ancho,
      height: alto,
      borderRadius: 14 * u,
      overflow: "hidden",
      background: COLOR.negro,
      boxShadow: `0 ${50 * u}px ${120 * u}px rgba(0,0,0,0.7), inset 0 0 0 ${1.5 * u}px ${COLOR.profundo}`,
      ...style,
    }}
  >
    {/* La barra de arriba, como las pantallas de la web: el cuadradito y el título, sin semáforo de colores. */}
    <div style={{ height: 40 * u, display: "flex", alignItems: "center", gap: 12 * u, padding: `0 ${18 * u}px` }}>
      <span style={{ width: 6 * u, height: 6 * u, background: COLOR.acero }} />
      <span style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 600, fontSize: 16 * u, color: COLOR.acero }}>{titulo}</span>
    </div>
    <div style={{ position: "absolute", top: 40 * u, left: 0, right: 0, bottom: 0 }}>{children}</div>
  </div>
);
