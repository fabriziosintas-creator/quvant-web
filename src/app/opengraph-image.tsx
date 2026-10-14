import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITIO } from "@/datos/sitio";
import { MARCA } from "@/datos/textos";

/**
 * Imagen Open Graph de la portada, generada en el build con la identidad
 * real: negro Quvant, QUVANT en Michroma, la bajada en Plex Mono y la Q
 * de cromo (misma geometría y degradado que IsotipoQ, como SVG embebido).
 */

export const alt = SITIO.titulo;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// La Q del manual: aro (44,44) r31 trazo 10, cola 45°, punto cuadrado,
// degradado de cromo (8,20) → (97,85). Va como fondo en data URI porque
// el motor de la imagen no dibuja SVG anidado con degradados.
const SVG_Q = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 105">
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="8" y1="20" x2="97" y2="85">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.1667" stop-color="#D9DCE0"/>
      <stop offset="0.3333" stop-color="#3A3D42"/><stop offset="0.5" stop-color="#F2F4F6"/>
      <stop offset="0.6667" stop-color="#6C7076"/><stop offset="0.8333" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#9DA1A7"/>
    </linearGradient>
  </defs>
  <circle cx="44" cy="44" r="31" fill="none" stroke="url(#g)" stroke-width="10"/>
  <line x1="63" y1="63" x2="80" y2="80" stroke="url(#g)" stroke-width="10"/>
  <rect x="86" y="86" width="11" height="11" fill="url(#g)"/>
</svg>`;

const FONDO_Q = `url("data:image/svg+xml,${encodeURIComponent(SVG_Q)}")`;

async function fuente(archivo: string) {
  return readFile(path.join(process.cwd(), "src", "recursos", "fuentes", archivo));
}

export default async function ImagenOpenGraph() {
  const [michroma, plexMono] = await Promise.all([
    fuente("Michroma-Regular.ttf"),
    fuente("IBMPlexMono-Regular.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px 90px",
          backgroundColor: "#0D0D0F",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          {/* La grilla y el salto: una fila de puntos, uno se escapa. */}
          <div style={{ display: "flex", gap: 18 }}>
            {[0, 1, 2, 3, 4, 5].map((punto) => (
              <div
                key={punto}
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: punto === 4 ? "#ECECEE" : "#26262B",
                  // El motor solo acepta largos absolutos: translateY(0px) en vez de "none".
                  transform: punto === 4 ? "translateY(-10px)" : "translateY(0px)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 44,
              fontFamily: "Michroma",
              fontSize: 84,
              letterSpacing: 15,
              color: "#ECECEE",
            }}
          >
            {MARCA.logotipo}
          </div>
          <div
            style={{
              marginTop: 30,
              fontFamily: "IBM Plex Mono",
              fontSize: 28,
              lineHeight: 1.45,
              color: "#9C9CA3",
            }}
          >
            {MARCA.bajada}
          </div>
        </div>
        <div
          style={{
            width: 340,
            height: 340,
            backgroundImage: FONDO_Q,
            backgroundSize: "340px 340px",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Michroma", data: michroma, style: "normal", weight: 400 },
        { name: "IBM Plex Mono", data: plexMono, style: "normal", weight: 400 },
      ],
    },
  );
}
