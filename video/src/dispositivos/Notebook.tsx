import { RoundedBox } from "@react-three/drei";
import React from "react";
import { ALUMINIO, COLORES } from "../marca";
import { Pantalla } from "./Pantalla";

/**
 * Notebook negra: base con bisagra atrás y tapa que se abre girando.
 * `apertura` va de 0 (cerrada) a 1 (abierta en su ángulo de trabajo).
 */

const ANCHO = 32;
const FONDO = 22;
const ESPESOR_BASE = 1.3;
const ALTO_TAPA = 21;
const ESPESOR_TAPA = 0.9;

const ANGULO_CERRADA = Math.PI / 2; // tapa acostada sobre la base
const ANGULO_ABIERTA = -0.33; // apenas pasada de la vertical, como se usa

type Props = {
  archivoPantalla: string;
  apertura?: number;
  desplazamiento?: number;
  ventana?: number;
};

export const Notebook: React.FC<Props> = ({
  archivoPantalla,
  apertura = 1,
  desplazamiento = 0,
  ventana = 1,
}) => {
  const angulo = ANGULO_CERRADA + (ANGULO_ABIERTA - ANGULO_CERRADA) * apertura;

  return (
    <group>
      {/* Base */}
      <RoundedBox args={[ANCHO, ESPESOR_BASE, FONDO]} radius={0.35} smoothness={4} castShadow>
        <meshStandardMaterial {...ALUMINIO} />
      </RoundedBox>

      {/* Hueco del teclado, apenas insinuado: una placa más oscura. */}
      <mesh position={[0, ESPESOR_BASE / 2 + 0.01, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ANCHO - 5, FONDO - 7]} />
        <meshStandardMaterial color={COLORES.negro} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Tapa: gira sobre la bisagra del borde de atrás. */}
      <group position={[0, ESPESOR_BASE / 2, -FONDO / 2]} rotation={[angulo, 0, 0]}>
        <group position={[0, ALTO_TAPA / 2, 0]}>
          <RoundedBox args={[ANCHO, ALTO_TAPA, ESPESOR_TAPA]} radius={0.3} smoothness={4} castShadow>
            <meshStandardMaterial {...ALUMINIO} />
          </RoundedBox>
          {/* La pantalla, justo por delante del panel de la tapa. */}
          <group position={[0, 0, ESPESOR_TAPA / 2 + 0.02]}>
            <Pantalla
              archivo={archivoPantalla}
              ancho={ANCHO - 2.4}
              alto={ALTO_TAPA - 2.4}
              desplazamiento={desplazamiento}
              ventana={ventana}
            />
          </group>
        </group>
      </group>
    </group>
  );
};

