import { useTexture } from "@react-three/drei";
import React, { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";

/**
 * La pantalla de un dispositivo: un plano con la captura.
 *
 * Va con MeshBasicMaterial y toneMapped en false para que la imagen se lea
 * tal cual: una pantalla emite luz, no la recibe.
 *
 * La textura se carga con useTexture, que suspende. ThreeCanvas envuelve
 * todo en un Suspense que retiene el render hasta que resuelva, así que
 * ningún cuadro sale con la pantalla vacía. (Cargarla por estado no sirve:
 * durante el render el lienzo tiene frameloop "never" y no se vuelve a
 * dibujar cuando la imagen llega tarde.)
 */

type Props = {
  /** Ruta dentro de public/, por ejemplo "pantallas/tablero-mono.webp". */
  archivo: string;
  ancho: number;
  alto: number;
  /** Cuánto bajó el contenido, de 0 a 1: el "scroll" adentro de la pantalla. */
  desplazamiento?: number;
  /** Qué parte del alto de la captura se ve, de 0 a 1 (las largas muestran un tramo). */
  ventana?: number;
};

export const Pantalla: React.FC<Props> = ({
  archivo,
  ancho,
  alto,
  desplazamiento = 0,
  ventana = 1,
}) => {
  const original = useTexture(staticFile(archivo));

  // Una copia por pantalla: si dos usan la misma captura con distinto
  // recorte, no se pisan entre ellas.
  const textura = useMemo(() => {
    const t = original.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [original]);

  textura.repeat.set(1, ventana);
  textura.offset.set(0, (1 - ventana) * (1 - desplazamiento));

  return (
    <mesh>
      <planeGeometry args={[ancho, alto]} />
      <meshBasicMaterial map={textura} toneMapped={false} />
    </mesh>
  );
};
