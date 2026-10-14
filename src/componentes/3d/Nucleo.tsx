"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { NICHOS, type Nicho } from "@/datos/nucleo";

/**
 * El núcleo y sus ramas, en WebGL con shaders GLSL propios.
 *
 * - El núcleo es "la grilla" del manual en tres dimensiones: una esfera de
 *   puntos cuadrados que respira (shader de puntos: tamaño por distancia,
 *   recorte cuadrado en gl_PointCoord, más brillo de frente que de atrás).
 * - De él salen ramas (tubos sobre curvas) con un shader que hace viajar
 *   un pulso de luz del núcleo a cada plantilla: el dato que fluye.
 * - Cada nicho es una plantilla: un panel de líneas con sus widgets, que
 *   siempre mira a la cámara. La activa se agranda y pasa a blanco.
 * - El piso es otra grilla de puntos, dibujada entera en el fragment.
 *
 * No hay materiales PBR ni mapa de entorno: todo es línea, punto y
 * shader, liviano a propósito. La selección la maneja quien lo monta.
 */

const BLANCO = "#ececee";
const ACERO = "#9c9ca3";
const PROFUNDO = "#26262b";

const RADIO_ANILLO = 3.4;
const FUENTE_MICHROMA = "/fuentes/Michroma-Regular.ttf";
const CARACTERES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚ ·";
const RADIO_NUCLEO = 1.05;

// ---------- shaders ----------

const VERT_PUNTOS = /* glsl */ `
  attribute float aFase;
  uniform float uTime;
  uniform float uPulso;
  uniform float uTam;
  uniform float uDpr;
  varying float vFrente;
  void main() {
    // Respira: cada punto late con su propia fase; al activarse, se abre.
    vec3 p = position * (1.0 + 0.035 * sin(uTime * 1.3 + aFase) + 0.06 * uPulso);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFrente = clamp(dot(n, vec3(0.0, 0.0, 1.0)) * 0.5 + 0.5, 0.0, 1.0);
    gl_PointSize = uTam * uDpr * (1.0 + 0.5 * uPulso) * (5.5 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG_PUNTOS = /* glsl */ `
  uniform vec3 uAtras;
  uniform vec3 uFrente;
  uniform float uPulso;
  varying float vFrente;
  void main() {
    // Punto cuadrado, como el de la marca: se recorta el sprite redondo.
    vec2 c = gl_PointCoord - 0.5;
    if (max(abs(c.x), abs(c.y)) > 0.38) discard;
    vec3 col = mix(uAtras, uFrente, vFrente * (0.55 + 0.45 * uPulso));
    float a = 0.22 + 0.78 * vFrente;
    gl_FragColor = vec4(col, a);
  }
`;

const VERT_RAMA = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_RAMA = /* glsl */ `
  uniform float uTime;
  uniform float uDesfase;
  uniform float uActivo;
  uniform vec3 uAcero;
  uniform vec3 uBlanco;
  varying vec2 vUv;
  void main() {
    // Un pulso recorre el tubo del núcleo (u = 0) a la plantilla (u = 1).
    float velocidad = 0.26 + 0.24 * uActivo;
    float p = fract(uTime * velocidad + uDesfase);
    float d = abs(vUv.x - p);
    float ancho = 0.05 + 0.07 * uActivo;
    float brillo = smoothstep(ancho, 0.0, d);
    float base = 0.16 + 0.4 * uActivo;
    vec3 col = mix(uAcero, uBlanco, brillo);
    gl_FragColor = vec4(col, base + brillo * 0.9);
  }
`;

const FRAG_PISO = /* glsl */ `
  uniform vec3 uColor;
  uniform float uRep;
  varying vec2 vUv;
  void main() {
    // La grilla de puntos, dibujada entera acá: un punto por celda.
    vec2 g = fract(vUv * uRep) - 0.5;
    float d = max(abs(g.x), abs(g.y));
    float punto = 1.0 - smoothstep(0.05, 0.085, d);
    float radio = distance(vUv, vec2(0.5));
    float fundido = 1.0 - smoothstep(0.16, 0.5, radio);
    gl_FragColor = vec4(uColor, punto * fundido * 0.6);
  }
`;

// ---------- geometría de apoyo ----------

/** Puntos repartidos parejo sobre una esfera (espiral de Fibonacci). */
function esferaDePuntos(cantidad: number, radio: number) {
  const posiciones = new Float32Array(cantidad * 3);
  const fases = new Float32Array(cantidad);
  const dorado = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < cantidad; i++) {
    const y = 1 - (i / (cantidad - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = dorado * i;
    posiciones[i * 3] = Math.cos(t) * r * radio;
    posiciones[i * 3 + 1] = y * radio;
    posiciones[i * 3 + 2] = Math.sin(t) * r * radio;
    fases[i] = (i % 17) * 0.37;
  }
  return { posiciones, fases };
}

/** Segmentos (pares de puntos) de un rectángulo en el plano XY. */
function rectangulo(x: number, y: number, w: number, h: number, salida: number[]) {
  const x2 = x + w;
  const y2 = y + h;
  salida.push(x, y, 0, x2, y, 0, x2, y, 0, x2, y2, 0, x2, y2, 0, x, y2, 0, x, y2, 0, x, y, 0);
}

/** El panel de una plantilla: marco, cabecera y tres widgets. */
function geometriaPlantilla() {
  const s: number[] = [];
  const W = 0.96;
  const H = 0.62;
  rectangulo(-W / 2, -H / 2, W, H, s);
  // La cabecera.
  s.push(-W / 2, H / 2 - 0.14, 0, W / 2, H / 2 - 0.14, 0);
  // Tres widgets: uno ancho arriba, dos abajo.
  rectangulo(-W / 2 + 0.07, H / 2 - 0.36, W - 0.14, 0.16, s);
  rectangulo(-W / 2 + 0.07, -H / 2 + 0.07, (W - 0.21) / 2, 0.14, s);
  rectangulo(0.035, -H / 2 + 0.07, (W - 0.21) / 2, 0.14, s);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(s, 3));
  return g;
}

function posicionDe(indice: number, total: number) {
  const angulo = (indice / total) * Math.PI * 2 - Math.PI / 2;
  const y = indice % 2 === 0 ? 0.14 : -0.14;
  return new THREE.Vector3(Math.cos(angulo) * RADIO_ANILLO, y, Math.sin(angulo) * RADIO_ANILLO);
}

// ---------- piezas ----------

function Esfera({ activo }: { activo: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { posiciones, fases } = useMemo(() => esferaDePuntos(420, RADIO_NUCLEO), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulso: { value: 0 },
      uTam: { value: 7.5 },
      uDpr: { value: 1 },
      uAtras: { value: new THREE.Color(PROFUNDO) },
      uFrente: { value: new THREE.Color(BLANCO) },
    }),
    [],
  );

  useFrame((estado, delta) => {
    if (!material.current) return;
    const u = material.current.uniforms;
    u.uTime.value = estado.clock.elapsedTime;
    u.uDpr.value = estado.viewport.dpr;
    u.uPulso.value = THREE.MathUtils.damp(u.uPulso.value, activo ? 1 : 0, 4, delta);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posiciones, 3]} />
        <bufferAttribute attach="attributes-aFase" args={[fases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={VERT_PUNTOS}
        fragmentShader={FRAG_PUNTOS}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

function Rama({
  hacia,
  desfase,
  activo,
}: {
  hacia: THREE.Vector3;
  desfase: number;
  activo: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometria = useMemo(() => {
    const desde = hacia.clone().normalize().multiplyScalar(RADIO_NUCLEO + 0.1);
    const control = desde.clone().lerp(hacia, 0.5).add(new THREE.Vector3(0, 0.55, 0));
    const fin = hacia.clone().sub(hacia.clone().normalize().multiplyScalar(0.52));
    const curva = new THREE.QuadraticBezierCurve3(desde, control, fin);
    return new THREE.TubeGeometry(curva, 28, 0.012, 5, false);
  }, [hacia]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDesfase: { value: desfase },
      uActivo: { value: 0 },
      uAcero: { value: new THREE.Color(ACERO) },
      uBlanco: { value: new THREE.Color(BLANCO) },
    }),
    [desfase],
  );

  useFrame((estado, delta) => {
    if (!material.current) return;
    const u = material.current.uniforms;
    u.uTime.value = estado.clock.elapsedTime;
    u.uActivo.value = THREE.MathUtils.damp(u.uActivo.value, activo ? 1 : 0, 4, delta);
  });

  return (
    <mesh geometry={geometria}>
      <shaderMaterial
        ref={material}
        vertexShader={VERT_RAMA}
        fragmentShader={FRAG_RAMA}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function Plantilla({
  nicho,
  posicion,
  activo,
  onElegir,
}: {
  nicho: Nicho;
  posicion: THREE.Vector3;
  activo: boolean;
  onElegir: (id: string) => void;
}) {
  const grupo = useRef<THREE.Group>(null);
  const lineas = useRef<THREE.LineBasicMaterial>(null);
  const punto = useRef<THREE.MeshBasicMaterial>(null);
  const geometria = useMemo(() => geometriaPlantilla(), []);
  const colorActivo = useMemo(() => new THREE.Color(BLANCO), []);
  const colorQuieto = useMemo(() => new THREE.Color(ACERO), []);

  useFrame((_, delta) => {
    if (!grupo.current || !lineas.current || !punto.current) return;
    const escala = THREE.MathUtils.damp(grupo.current.scale.x, activo ? 1.22 : 1, 5, delta);
    grupo.current.scale.setScalar(escala);
    lineas.current.color.lerp(activo ? colorActivo : colorQuieto, 1 - Math.exp(-5 * delta));
    lineas.current.opacity = THREE.MathUtils.damp(lineas.current.opacity, activo ? 1 : 0.55, 5, delta);
    punto.current.color.lerp(activo ? colorActivo : colorQuieto, 1 - Math.exp(-5 * delta));
  });

  return (
    <Billboard position={posicion}>
      <group ref={grupo}>
        <lineSegments geometry={geometria}>
          <lineBasicMaterial ref={lineas} color={ACERO} transparent opacity={0.55} />
        </lineSegments>
        {/* El punto de la marca en la esquina de la cabecera. */}
        <mesh position={[0.4, 0.24, 0.001]}>
          <planeGeometry args={[0.06, 0.06]} />
          <meshBasicMaterial ref={punto} color={ACERO} />
        </mesh>
        {/* Superficie invisible para que el puntero la encuentre. */}
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            onElegir(nicho.id);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onElegir(nicho.id);
          }}
        >
          <planeGeometry args={[1.1, 0.78]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {/* El nombre, en Michroma dentro del propio WebGL: se ocluye y escala con la escena. */}
        <Text
          font={FUENTE_MICHROMA}
          fontSize={0.19}
          letterSpacing={0.14}
          color={activo ? BLANCO : ACERO}
          anchorX="center"
          anchorY="top"
          position={[0, -0.42, 0]}
          characters={CARACTERES}
        >
          {nicho.nombre.toUpperCase()}
        </Text>
      </group>
    </Billboard>
  );
}

function Piso() {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(ACERO) }, uRep: { value: 30 } }),
    [],
  );
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
      <planeGeometry args={[14, 14]} />
      <shaderMaterial
        vertexShader={VERT_RAMA}
        fragmentShader={FRAG_PISO}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/** La cámara se aleja cuando la ventana es más cuadrada (celular), para que el anillo entre. */
function Encuadre() {
  const camara = useThree((estado) => estado.camera);
  const aspecto = useThree((estado) => estado.viewport.aspect);
  useEffect(() => {
    // En ventanas cuadradas el anillo necesita más aire a los costados.
    const z = aspecto < 1.45 ? 9.4 * (1.45 / Math.max(aspecto, 0.9)) * 1.32 : 9.4;
    camara.position.set(0, 4.4 * (z / 9.4), z);
    camara.lookAt(0, -0.5, 0);
    camara.updateProjectionMatrix();
  }, [camara, aspecto]);
  return null;
}

function Escena({ activo, onElegir }: { activo: string; onElegir: (id: string) => void }) {
  const rig = useRef<THREE.Group>(null);
  const puntero = useRef({ x: 0, y: 0, ultimoMovimiento: 0 });
  const posiciones = useMemo(() => NICHOS.map((_, i) => posicionDe(i, NICHOS.length)), []);

  useEffect(() => {
    const alMover = (evento: PointerEvent) => {
      puntero.current.x = (evento.clientX / window.innerWidth) * 2 - 1;
      puntero.current.y = (evento.clientY / window.innerHeight) * 2 - 1;
      puntero.current.ultimoMovimiento = performance.now();
    };
    window.addEventListener("pointermove", alMover, { passive: true });
    return () => window.removeEventListener("pointermove", alMover);
  }, []);

  // El anillo gira solo, despacio; el puntero lo inclina apenas.
  useFrame((estado, delta) => {
    if (!rig.current) return;
    rig.current.rotation.y += delta * 0.07;
    const quieto = performance.now() - puntero.current.ultimoMovimiento > 2500;
    const objetivoX = quieto ? 0 : puntero.current.y * 0.05;
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, objetivoX, 2.5, delta);
  });

  return (
    <group ref={rig} position={[0, 0, 0]}>
      <Piso />
      <Esfera activo={activo === "nucleo"} />
      {NICHOS.map((nicho, i) => (
        <group key={nicho.id}>
          <Rama hacia={posiciones[i]} desfase={i * 0.23} activo={activo === nicho.id} />
          <Plantilla
            nicho={nicho}
            posicion={posiciones[i]}
            activo={activo === nicho.id}
            onElegir={onElegir}
          />
        </group>
      ))}
    </group>
  );
}

export default function Nucleo({
  activo,
  onElegir,
}: {
  activo: string;
  onElegir: (id: string) => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 4.4, 9.4], fov: 30 }}
      gl={{ alpha: true, antialias: true }}
      onPointerMissed={() => onElegir("nucleo")}
    >
      <Encuadre />
      <Escena activo={activo} onElegir={onElegir} />
    </Canvas>
  );
}
