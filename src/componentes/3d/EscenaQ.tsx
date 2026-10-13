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
        {/* Estudio propio con la lógica del degradado del manual: casi todo
            plateado claro y una sola veta oscura. Se renderiza una vez. */}
        <Environment resolution={256} frames={1}>
          {/* Base gris plata: es lo que el cromo refleja donde no hay luces,
              en lugar de negro. De acá sale el "plateado" general. */}
          <color attach="background" args={["#7c7f85"]} />
          {/* Cielo blanco amplio (las zonas #FFFFFF / #F2F4F6 del degradado). */}
          <Lightformer
            form="rect"
            intensity={2.6}
            position={[0, 6, 0]}
            rotation-x={Math.PI / 2}
            scale={[16, 12, 1]}
          />
          {/* Tiras laterales claras. */}
          <Lightformer
            form="rect"
            intensity={1.4}
            position={[-6, 1, 2]}
            rotation-y={Math.PI / 2}
            scale={[7, 2, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1}
            position={[6, 2, 2]}
            rotation-y={-Math.PI / 2}
            scale={[7, 1.6, 1]}
          />
          {/* Piso claro, para que la panza del aro no quede apagada. */}
          <Lightformer
            form="rect"
            intensity={0.9}
            position={[0, -5, 2]}
            rotation-x={-Math.PI / 2}
            scale={[14, 10, 1]}
          />
          {/* La única veta oscura (la vena #3A3D42 del degradado): una banda
              angosta al frente y otra atrás, no un fondo entero. */}
          <Lightformer
            form="rect"
            color="#26262b"
            intensity={1}
            position={[0, -0.6, 5]}
            rotation-y={Math.PI}
            scale={[18, 1.3, 1]}
          />
          <Lightformer
            form="rect"
            color="#3a3d42"
            intensity={1}
            position={[-3, 3.4, -5]}
            scale={[12, 1, 1]}
          />
          {/* La veta diagonal brillante, firma clásica del cromo pulido. */}
          <Lightformer
            form="rect"
            intensity={3.2}
            position={[2, 3, 4]}
            rotation={[Math.PI / 2.6, 0.4, 0]}
            scale={[8, 0.6, 1]}
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
