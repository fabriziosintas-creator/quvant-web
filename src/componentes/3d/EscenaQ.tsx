"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { obtenerEntornoManual } from "./entornoManual";
import { QCromo } from "./QCromo";

/**
 * Lienzo 3D fijo de la página: la Q de cromo flotando sobre negro, con el
 * contador 000 → 100 en Michroma mientras se arma, estilo Lusion.
 *
 * El cromo refleja el entorno "degradado del manual" (variante D elegida
 * por fabrizio en /laboratorio-cromo): las siete paradas del degradado
 * oficial del logo como cielo equirectangular. Sin HDRI descargado.
 *
 * El lienzo no recibe clics (pointer-events: none): el texto y los botones
 * de la portada quedan siempre usables por encima.
 */
export default function EscenaQ() {
  const [progreso, setProgreso] = useState(0);

  return (
    <div aria-hidden className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 9], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <QCromo alProgresar={setProgreso} />
        <Environment map={obtenerEntornoManual()} />
      </Canvas>

      {/* Contador del armado, abajo a la izquierda (recomendación del estudio). */}
      <div
        className={`absolute inset-x-0 bottom-9 transition-opacity duration-700 ${
          progreso >= 100 ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="contenedor">
          <span className="font-michroma text-sm tracking-marca text-acero">
            {String(Math.min(progreso, 100)).padStart(3, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
