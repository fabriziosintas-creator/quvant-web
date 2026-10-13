"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { QCromo } from "./QCromo";

/**
 * Lienzo 3D de la portada: la Q de cromo flotando sobre negro, con un
 * entorno de estudio generado por código (sin HDRI descargado, 256 px:
 * muy por debajo del presupuesto de 1k del estudio de referencia) y el
 * contador 000 → 100 en Michroma mientras la Q se arma, estilo Lusion.
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
        {/* Estudio propio: tiras de luz sobre fondo oscuro, el contraste que
            necesita el cromo. Se renderiza una sola vez (frames={1}). */}
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={2.4}
            position={[0, 5, 1]}
            rotation-x={Math.PI / 2}
            scale={[10, 5, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.2}
            position={[-5, 0, 2]}
            rotation-y={Math.PI / 2}
            scale={[6, 1.6, 1]}
          />
          <Lightformer
            form="rect"
            intensity={0.7}
            position={[5, 1, 2]}
            rotation-y={-Math.PI / 2}
            scale={[6, 1.2, 1]}
          />
          <Lightformer
            form="rect"
            intensity={0.45}
            position={[0, -4, 3]}
            rotation-x={-Math.PI / 2.4}
            scale={[9, 2, 1]}
          />
          {/* La veta diagonal fina, firma clásica del cromo pulido. */}
          <Lightformer
            form="rect"
            intensity={3}
            position={[2, 3, 4]}
            rotation={[Math.PI / 2.6, 0.4, 0]}
            scale={[7, 0.5, 1]}
          />
        </Environment>
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
