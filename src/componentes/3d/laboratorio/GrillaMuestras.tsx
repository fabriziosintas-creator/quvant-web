"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { obtenerEntornoManual } from "../entornoManual";
import { VARIANTES, type RecetaCromo } from "./recetas";

/**
 * Grilla del laboratorio: la misma Q del sitio repetida con distintas
 * recetas de cromo. Todas siguen el mouse a la vez para comparar los
 * reflejos en el mismo ángulo.
 */

const ARO_CENTRO = new THREE.Vector3(-8.5, 8.5, 0);
const COLA_INICIO = new THREE.Vector3(10.5, -10.5, 0);
const COLA_LARGO = Math.hypot(17, 17);
const PUNTO_CENTRO = new THREE.Vector3(39, -39, 0);
const ESCALA = 0.042;

/** Un solo escucha de puntero compartido por las seis muestras. */
const punteroGlobal = { x: 0, y: 0 };

function usePunteroGlobal() {
  useEffect(() => {
    const alMover = (evento: PointerEvent) => {
      punteroGlobal.x = (evento.clientX / window.innerWidth) * 2 - 1;
      punteroGlobal.y = (evento.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", alMover, { passive: true });
    return () => window.removeEventListener("pointermove", alMover);
  }, []);
}

function QFigura({ receta }: { receta: RecetaCromo }) {
  const raiz = useRef<THREE.Group>(null);

  const material = useMemo(() => {
    const comun = {
      color: 0xffffff,
      metalness: 1,
      roughness: receta.rugosidad,
      envMapIntensity: receta.intensidadReflejo,
    };
    if (receta.laca != null) {
      const fisico = new THREE.MeshPhysicalMaterial(comun);
      fisico.clearcoat = receta.laca;
      fisico.clearcoatRoughness = 0.06;
      return fisico;
    }
    return new THREE.MeshStandardMaterial(comun);
  }, [receta]);

  const geometriaPunto = useMemo(() => {
    const forma = new THREE.Shape();
    forma.moveTo(-5.5, -5.5);
    forma.lineTo(5.5, -5.5);
    forma.lineTo(5.5, 5.5);
    forma.lineTo(-5.5, 5.5);
    forma.closePath();
    const geometria = new THREE.ExtrudeGeometry(forma, {
      depth: 7,
      bevelEnabled: true,
      bevelThickness: 1.2,
      bevelSize: 1.2,
      bevelSegments: 4,
    });
    geometria.center();
    return geometria;
  }, []);

  useFrame((estado3d, delta) => {
    if (!raiz.current) return;
    const tiempo = estado3d.clock.elapsedTime;
    raiz.current.rotation.y = THREE.MathUtils.damp(
      raiz.current.rotation.y,
      punteroGlobal.x * 0.55,
      3,
      delta,
    );
    raiz.current.rotation.x = THREE.MathUtils.damp(
      raiz.current.rotation.x,
      punteroGlobal.y * 0.35,
      3,
      delta,
    );
    raiz.current.position.y = Math.sin(tiempo * 0.7) * 0.05;
  });

  return (
    <group scale={ESCALA}>
      <group ref={raiz}>
        <mesh position={ARO_CENTRO} material={material}>
          <torusGeometry args={[31, 5, 32, 144]} />
        </mesh>
        <group position={COLA_INICIO} rotation={[0, 0, -Math.PI * 0.75]}>
          <mesh position={[0, COLA_LARGO / 2, 0]} material={material}>
            <cylinderGeometry args={[5, 5, COLA_LARGO, 32]} />
          </mesh>
        </group>
        <mesh geometry={geometriaPunto} position={PUNTO_CENTRO} material={material} />
      </group>
    </group>
  );
}

/** Entorno literal del manual (el que refleja la Q del video de la portada): ver entornoManual.ts. */
function EntornoDegradadoManual() {
  return <Environment map={obtenerEntornoManual()} />;
}

function EntornoReceta({ receta }: { receta: RecetaCromo }) {
  if (!receta.paneles) return <EntornoDegradadoManual />;
  return (
    <Environment resolution={256} frames={1}>
      {receta.fondo ? <color attach="background" args={[receta.fondo]} /> : null}
      {receta.paneles.map((panel, indice) => (
        <Lightformer
          key={indice}
          form="rect"
          intensity={panel.intensidad}
          color={panel.color}
          position={panel.posicion}
          rotation={panel.rotacion ?? [0, 0, 0]}
          scale={[panel.escala[0], panel.escala[1], 1]}
        />
      ))}
    </Environment>
  );
}

function Muestra({ receta }: { receta: RecetaCromo }) {
  return (
    <div className="border border-profundo">
      <div className="aspect-square" aria-hidden>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 7.5], fov: 40 }}
          gl={{ alpha: true, antialias: true }}
          style={{ pointerEvents: "none" }}
        >
          <QFigura receta={receta} />
          <EntornoReceta receta={receta} />
        </Canvas>
      </div>
      <div className="border-t border-profundo p-4 md:p-5">
        <p className="font-michroma text-base tracking-marca text-blanco">{receta.letra}</p>
        <p className="mt-2 font-plex text-sm font-medium text-blanco">{receta.nombre}</p>
        <p className="mt-1 font-plex text-xs leading-relaxed text-acero">{receta.descripcion}</p>
      </div>
    </div>
  );
}

export default function GrillaMuestras() {
  usePunteroGlobal();
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {VARIANTES.map((receta) => (
        <Muestra key={receta.letra} receta={receta} />
      ))}
    </div>
  );
}
