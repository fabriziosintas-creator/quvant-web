"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  DURACION_RECORRIDO,
  EMPRESAS,
  INICIO_CAPITULOS,
  SEGUNDOS_POR_EMPRESA,
  type IdEmpresa,
} from "@/datos/multinucleo";

/**
 * Núcleos Quvant, en WebGL con shaders GLSL propios: un "video" que se
 * reproduce solo y que se puede tocar.
 *
 *  1. Cada empresa, su núcleo: cuatro esferas de puntos cuadrados (la
 *     grilla del manual en 3D), cada una del color de su rubro, se arman
 *     punto por punto. Alrededor, su sistema: un anillo con sus módulos.
 *  2. Todas, en un panel: de cada núcleo sube un haz hasta el panel multi
 *     núcleo, un vidrio que se enciende de abajo hacia arriba.
 *  3. Seguimiento en vivo: los haces llevan pulsos de datos y el panel
 *     dibuja la curva de cada empresa (todo en el fragment shader).
 *  4. Cada una, por su lado: la cámara visita cada empresa; las demás se
 *     apagan y en el panel queda su curva sola.
 *
 * El reloj del recorrido vive acá (useFrame) y avisa afuera solo cuando
 * cambia el capítulo o la empresa; el avance de la barra se escribe
 * directo en el DOM, sin renders de React por cuadro.
 */

const BLANCO = "#ececee";
const PROFUNDO = "#26262b";
const NEGRO = "#0d0d0f";
const FUENTE_MICHROMA = "/fuentes/Michroma-Regular.ttf";
const CARACTERES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚ ·";

const N = EMPRESAS.length;
const POSICIONES: Array<[number, number, number]> = [
  [-3.3, 0, 0.45],
  [-1.1, 0, 1.1],
  [1.1, 0, 1.1],
  [3.3, 0, 0.45],
];
const RADIO_NUCLEO = 0.44;
const RADIO_SISTEMA = 0.8;
const PANEL = { x: 0, y: 2.5, z: -1.8, ancho: 4.6, alto: 2.3 };
const PISO_Y = -0.9;
const PISO = { ancho: 15, fondo: 9 };

// ---------- shaders ----------

const VERT_UV = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** El piso: la grilla de puntos del manual, con un charco de luz del color de cada empresa. */
const FRAG_PISO = /* glsl */ `
  uniform vec3 uPunto;
  uniform vec3 uColores[4];
  uniform vec2 uCentros[4];
  uniform float uLuz[4];
  uniform vec2 uTam;
  uniform float uPaso;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * uTam;
    vec2 g = fract(p / uPaso) - 0.5;
    float punto = 1.0 - smoothstep(0.08, 0.13, max(abs(g.x), abs(g.y)));

    vec3 luz = vec3(0.0);
    float suma = 0.0;
    for (int i = 0; i < 4; i++) {
      float d = distance(p, uCentros[i]);
      float w = uLuz[i] * exp(-d * d * 0.75);
      luz += uColores[i] * w;
      suma += w;
    }
    float s = clamp(suma, 0.0, 1.0);
    vec3 color = mix(uPunto, luz / max(suma, 0.0001), s);

    // Se funde a negro hacia los bordes (elipse, para que no se vea el plano).
    vec2 e = (vUv - 0.5) * vec2(1.0, 1.6);
    float fundido = 1.0 - smoothstep(0.22, 0.5, length(e));

    float alfa = punto * (0.3 + 0.7 * s) + s * 0.07;
    gl_FragColor = vec4(color, alfa * fundido);
    #include <colorspace_fragment>
  }
`;

/** El núcleo de cada empresa: puntos que llegan desde afuera y se arman en esfera. */
const VERT_NUCLEO = /* glsl */ `
  attribute float aFase;
  uniform float uTiempo;
  uniform float uAparicion;
  uniform float uFoco;
  uniform float uTam;
  uniform float uDpr;
  varying float vFrente;
  varying float vLlego;
  void main() {
    // Cada punto tiene su turno: el núcleo se construye, no aparece.
    float turno = aFase / 6.2831853;
    float llegada = clamp(uAparicion * 1.7 - turno * 0.7, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - llegada, 3.0);
    vec3 dir = normalize(position);
    float respira = 1.0 + 0.045 * sin(uTiempo * 1.5 + aFase) + 0.14 * uFoco;
    vec3 p = position * respira + dir * (1.0 - e) * 2.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 n = normalize(normalMatrix * dir);
    vFrente = clamp(n.z * 0.5 + 0.5, 0.0, 1.0);
    vLlego = e;
    gl_PointSize = uTam * uDpr * (1.0 + 0.3 * uFoco) * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG_NUCLEO = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uBlanco;
  uniform float uFoco;
  uniform float uApagado;
  varying float vFrente;
  varying float vLlego;
  void main() {
    // Punto cuadrado, como el de la marca.
    vec2 c = gl_PointCoord - 0.5;
    if (max(abs(c.x), abs(c.y)) > 0.36) discard;
    vec3 color = mix(uColor * 0.5, uColor, vFrente);
    color = mix(color, uBlanco, 0.3 * uFoco * vFrente);
    float alfa = (0.22 + 0.78 * vFrente) * vLlego * (1.0 - 0.7 * uApagado);
    gl_FragColor = vec4(color, alfa);
    #include <colorspace_fragment>
  }
`;

/** Los módulos de cada empresa: cuatro puntos que orbitan su núcleo. */
const VERT_MODULOS = /* glsl */ `
  attribute float aIndice;
  uniform float uTiempo;
  uniform float uRadio;
  uniform float uTam;
  uniform float uDpr;
  uniform float uVelocidad;
  void main() {
    float a = aIndice * 1.5707963 + uTiempo * uVelocidad;
    vec3 p = vec3(cos(a) * uRadio, 0.0, sin(a) * uRadio);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uTam * uDpr * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG_MODULOS = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uBlanco;
  uniform float uAlfa;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = max(abs(c.x), abs(c.y));
    if (d > 0.4) discard;
    // Borde del color de la empresa, centro claro: un módulo "encendido".
    vec3 color = mix(uBlanco, uColor, smoothstep(0.18, 0.3, d));
    gl_FragColor = vec4(color, uAlfa);
    #include <colorspace_fragment>
  }
`;

/** El halo detrás de cada núcleo: luz del color de la empresa (se suma). */
const FRAG_HALO = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensidad;
  varying vec2 vUv;
  void main() {
    float r = distance(vUv, vec2(0.5)) * 2.0;
    float a = exp(-r * r * 5.5) * uIntensidad;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

/** Los haces: se dibujan del núcleo al panel y después llevan pulsos de datos. */
const FRAG_HAZ = /* glsl */ `
  uniform float uTiempo;
  uniform float uTrazo;
  uniform float uFlujo;
  uniform float uDesfase;
  uniform float uFoco;
  uniform float uApagado;
  uniform vec3 uColor;
  uniform vec3 uBlanco;
  varying vec2 vUv;
  void main() {
    float x = vUv.x;
    if (x > uTrazo) discard;
    float pulsos = 0.0;
    for (int k = 0; k < 3; k++) {
      float p = fract(uTiempo * (0.3 + 0.2 * uFoco) + uDesfase + float(k) / 3.0);
      pulsos += smoothstep(0.075, 0.0, abs(x - p));
    }
    pulsos *= uFlujo;
    // La punta brilla mientras el haz se está dibujando.
    float punta = smoothstep(0.1, 0.0, uTrazo - x) * step(uTrazo, 0.995);
    vec3 color = mix(uColor, uBlanco, 0.4 * pulsos + 0.6 * punta);
    float alfa = (0.16 + 0.3 * uFoco + 0.9 * pulsos + punta) * (1.0 - 0.75 * uApagado);
    gl_FragColor = vec4(color, clamp(alfa, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

/**
 * El panel multi núcleo: un vidrio oscuro con su grilla, la curva de ventas
 * de cada empresa (12 muestras por empresa, interpoladas en el shader), las
 * barras de cada una, un barrido de luz y el borde con esquinas claras. Se
 * enciende de abajo hacia arriba con una línea blanca.
 */
const FRAG_PANEL = /* glsl */ `
  uniform float uTiempo;
  uniform float uAparicion;
  uniform float uDibujo;
  uniform float uApagado;
  uniform vec3 uColores[4];
  uniform float uSerie[48];
  uniform float uFoco[4];
  uniform float uBarras[4];
  uniform vec3 uBlanco;
  uniform vec3 uProfundo;
  uniform vec3 uNegro;
  uniform vec2 uTam;
  varying vec2 vUv;

  float valor(int c, float x) {
    float f = clamp(x, 0.0, 1.0) * 11.0;
    int i = int(floor(min(f, 10.999)));
    return mix(uSerie[c * 12 + i], uSerie[c * 12 + i + 1], f - float(i));
  }

  float linea1px(float d, float grosor) {
    return 1.0 - smoothstep(grosor - 0.5, grosor + 0.75, d);
  }

  void main() {
    vec2 uv = vUv;
    float aspecto = uTam.x / uTam.y;
    vec3 color = uNegro;

    // La grilla de puntos, por dentro del vidrio.
    vec2 celda = fract(vec2(uv.x * aspecto, uv.y) * 20.0) - 0.5;
    float punto = 1.0 - smoothstep(0.06, 0.1, max(abs(celda.x), abs(celda.y)));
    color = mix(color, uProfundo * 1.5, punto * 0.7);

    // Cabecera.
    color = mix(color, uProfundo * 2.0, linea1px(abs(uv.y - 0.83) / fwidth(uv.y), 0.75));
    vec2 q = (uv - vec2(0.955, 0.915)) * vec2(aspecto, 1.0);
    color = mix(color, uBlanco, step(max(abs(q.x), abs(q.y)), 0.024));

    // Zona del gráfico.
    vec2 g0 = vec2(0.05, 0.11);
    vec2 g1 = vec2(0.69, 0.76);
    vec2 gq = (uv - g0) / (g1 - g0);
    float dentro = step(0.0, gq.x) * step(gq.x, 1.0) * step(0.0, gq.y) * step(gq.y, 1.0);
    for (int k = 1; k < 4; k++) {
      float d = abs(gq.y - float(k) / 4.0) / fwidth(gq.y);
      color = mix(color, uProfundo * 1.8, dentro * linea1px(d, 0.5) * 0.8);
    }

    float dibujado = dentro * step(gq.x, uDibujo);
    for (int c = 0; c < 4; c++) {
      float alto = 0.08 + valor(c, gq.x) * 0.84;
      float f = gq.y - alto;
      float d = abs(f) / max(length(vec2(dFdx(f), dFdy(f))), 0.00001);
      float peso = mix(1.0, 0.18, uApagado * (1.0 - uFoco[c]));
      // Debajo de la curva enfocada, el área con su color.
      float area = step(f, 0.0) * dibujado * uFoco[c] * 0.22 * clamp(gq.y / alto, 0.0, 1.0);
      color = mix(color, uColores[c], area);
      color = mix(color, uColores[c], linea1px(d, 1.0 + 1.5 * uFoco[c]) * dibujado * peso);
      // La cabeza de cada curva: un punto cuadrado que avanza con el dibujo.
      vec2 cabeza = vec2(uDibujo, 0.08 + valor(c, uDibujo) * 0.84);
      vec2 dq = (gq - cabeza) * (g1 - g0) * vec2(aspecto, 1.0);
      float cab = step(max(abs(dq.x), abs(dq.y)), 0.011 * (1.0 + 0.6 * uFoco[c]));
      color = mix(color, mix(uColores[c], uBlanco, 0.45), cab * peso * step(0.002, uDibujo));
    }

    // Barras: cuánto pesa cada empresa.
    for (int c = 0; c < 4; c++) {
      float x0 = 0.755 + float(c) * 0.052;
      float alto = uBarras[c] * 0.6 * uAparicion;
      float enBarra = step(x0, uv.x) * step(uv.x, x0 + 0.03) * step(0.11, uv.y) * step(uv.y, 0.11 + alto);
      float peso = mix(1.0, 0.25, uApagado * (1.0 - uFoco[c]));
      color = mix(color, uColores[c], enBarra * peso * 0.9);
    }

    // Un barrido de luz que baja despacio: el panel está vivo.
    color += smoothstep(0.035, 0.0, abs(uv.y - (1.0 - fract(uTiempo * 0.11)))) * 0.05;

    // Borde de 1,5 px; las esquinas, más claras.
    vec2 b = min(uv, 1.0 - uv);
    float borde = 1.0 - smoothstep(1.0, 2.0, min(b.x / fwidth(uv.x), b.y / fwidth(uv.y)));
    vec2 bq = b * vec2(aspecto, 1.0);
    float esquina = step(bq.x, 0.16) * step(bq.y, 0.16);
    color = mix(color, uBlanco, borde * (0.22 + 0.6 * esquina));

    // Se enciende de abajo hacia arriba.
    float frente = uAparicion * 1.08;
    float visible = smoothstep(frente, frente - 0.05, uv.y);
    float barrido = smoothstep(0.012, 0.0, abs(uv.y - frente)) * step(uAparicion, 0.995);
    color = mix(color, uBlanco, barrido * 0.85);
    float alfa = max(0.86 * visible, barrido) * step(0.001, uAparicion);
    gl_FragColor = vec4(color, alfa);
    #include <colorspace_fragment>
  }
`;

/** Partículas: datos que suben despacio, del color de cada empresa. */
const VERT_POLVO = /* glsl */ `
  attribute vec3 aBase;
  attribute float aIndice;
  uniform float uTiempo;
  uniform float uFlujo;
  uniform float uDpr;
  uniform vec3 uColores[4];
  varying vec3 vColor;
  varying float vAlfa;
  void main() {
    float alto = 4.4;
    float sube = mod(aBase.y + uTiempo * (0.16 + 0.12 * fract(aIndice * 0.37)), alto);
    vec3 p = vec3(aBase.x + sin(uTiempo * 0.35 + aIndice) * 0.14, -0.85 + sube, aBase.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vColor = uColores[int(mod(aIndice, 4.0))];
    vAlfa = smoothstep(0.0, 0.7, sube) * smoothstep(alto, alto - 1.2, sube) * (0.12 + 0.45 * uFlujo);
    gl_PointSize = 4.5 * uDpr * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG_POLVO = /* glsl */ `
  varying vec3 vColor;
  varying float vAlfa;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (max(abs(c.x), abs(c.y)) > 0.4) discard;
    gl_FragColor = vec4(vColor, vAlfa);
    #include <colorspace_fragment>
  }
`;

// ---------- el estado compartido del recorrido ----------

type Estado = {
  /** Segundo del recorrido (0 a DURACION_RECORRIDO). */
  tiempo: number;
  /** Reloj continuo para lo que late o fluye. */
  reloj: number;
  aparicion: number[];
  trazo: number[];
  foco: number[];
  panel: number;
  flujo: number;
  dibujo: number;
  apagado: number;
  capitulo: number;
  focoAuto: number | null;
};

const lleno = () => EMPRESAS.map(() => 0);
const sat = (x: number) => Math.min(1, Math.max(0, x));
const suave = (x: number) => 1 - Math.pow(1 - sat(x), 3);

/** Qué debería verse en el segundo `t` del recorrido. */
function metas(t: number, enfocada: number | null) {
  const [, c2, c3, c4] = INICIO_CAPITULOS;
  if (enfocada !== null) {
    return {
      aparicion: EMPRESAS.map(() => 1),
      trazo: EMPRESAS.map(() => 1),
      panel: 1,
      flujo: 1,
      dibujo: 1,
      foco: enfocada,
    };
  }
  const panel = t < c2 ? 0 : suave((t - c2 - 0.75) / 1.1);
  return {
    aparicion: EMPRESAS.map((_, i) => suave((t - 0.25 - i * 0.6) / 1.1)),
    trazo: EMPRESAS.map((_, i) => (t < c2 ? 0 : suave((t - c2 - 0.1 - i * 0.22) / 1.3))),
    panel,
    flujo: t < c2 ? 0 : t < c3 ? 0.35 * suave((t - c2 - 1.4) / 1) : 1,
    dibujo: t < c3 ? 0.1 * panel : Math.max(0.1, suave((t - c3) / 2.8)),
    foco: t >= c4 ? Math.min(N - 1, Math.floor((t - c4) / SEGUNDOS_POR_EMPRESA)) : null,
  };
}

function capituloEn(t: number) {
  let c = 0;
  for (let i = 0; i < INICIO_CAPITULOS.length; i++) if (t >= INICIO_CAPITULOS[i]) c = i;
  return c;
}

// ---------- piezas ----------

type Ref = RefObject<Estado>;

/** Los puntos se dibujan en píxeles: se escalan con el alto del lienzo (diseñados para ~460 px). */
function escalaDePuntos(s: { viewport: { dpr: number }; size: { height: number } }) {
  return s.viewport.dpr * Math.min(1.25, Math.max(0.55, s.size.height / 460));
}

function Piso({ estado }: { estado: Ref }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uPunto: { value: new THREE.Color(PROFUNDO).multiplyScalar(1.6) },
      uColores: { value: EMPRESAS.map((e) => new THREE.Color(e.color)) },
      uCentros: { value: POSICIONES.map(([x, , z]) => new THREE.Vector2(x, -z)) },
      uLuz: { value: EMPRESAS.map(() => 0) },
      uTam: { value: new THREE.Vector2(PISO.ancho, PISO.fondo) },
      uPaso: { value: 0.3 },
    }),
    [],
  );
  useFrame(() => {
    const e = estado.current;
    const u = material.current?.uniforms;
    if (!e || !u) return;
    for (let i = 0; i < N; i++) {
      u.uLuz.value[i] = e.aparicion[i] * (0.55 + 0.6 * e.foco[i]) * (1 - 0.6 * e.apagado * (1 - e.foco[i]));
    }
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PISO_Y, 0]}>
      <planeGeometry args={[PISO.ancho, PISO.fondo]} />
      <shaderMaterial
        ref={material}
        vertexShader={VERT_UV}
        fragmentShader={FRAG_PISO}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

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
    fases[i] = ((i * 2.399963) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  }
  return { posiciones, fases };
}

function NucleoEmpresa({
  indice,
  estado,
  onElegir,
}: {
  indice: number;
  estado: Ref;
  onElegir: (id: IdEmpresa | null) => void;
}) {
  const empresa = EMPRESAS[indice];
  const [x, y, z] = POSICIONES[indice];
  const puntos = useRef<THREE.ShaderMaterial>(null);
  const modulos = useRef<THREE.ShaderMaterial>(null);
  const halo = useRef<THREE.ShaderMaterial>(null);
  const anillo = useRef<THREE.LineBasicMaterial>(null);
  const sistema = useRef<THREE.Group>(null);
  const rotulo = useRef<THREE.Mesh>(null);
  const encima = useRef(0);
  const encimaMeta = useRef(0);

  const { posiciones, fases } = useMemo(() => esferaDePuntos(190, RADIO_NUCLEO), []);
  const indices = useMemo(() => new Float32Array([0, 1, 2, 3]), []);
  const posicionesModulos = useMemo(() => new Float32Array(12), []);
  const circulo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * RADIO_SISTEMA, 0, Math.sin(a) * RADIO_SISTEMA));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const color = useMemo(() => new THREE.Color(empresa.color), [empresa.color]);
  const blanco = useMemo(() => new THREE.Color(BLANCO), []);

  const uPuntos = useMemo(
    () => ({
      uTiempo: { value: 0 },
      uAparicion: { value: 0 },
      uFoco: { value: 0 },
      uTam: { value: 6.5 },
      uDpr: { value: 1 },
      uColor: { value: color },
      uBlanco: { value: blanco },
      uApagado: { value: 0 },
    }),
    [color, blanco],
  );
  const uModulos = useMemo(
    () => ({
      uTiempo: { value: 0 },
      uRadio: { value: RADIO_SISTEMA },
      uTam: { value: 11 },
      uDpr: { value: 1 },
      uVelocidad: { value: 0.55 + indice * 0.07 },
      uColor: { value: color },
      uBlanco: { value: blanco },
      uAlfa: { value: 0 },
    }),
    [color, blanco, indice],
  );
  const uHalo = useMemo(() => ({ uColor: { value: color }, uIntensidad: { value: 0 } }), [color]);

  useFrame((estado3d, delta) => {
    const e = estado.current;
    if (!e || !puntos.current || !modulos.current || !halo.current || !anillo.current) return;
    const aparicion = e.aparicion[indice];
    const foco = Math.max(e.foco[indice], encima.current * 0.5);
    const apagado = e.apagado * (1 - e.foco[indice]);
    // Tamaño de punto proporcional al lienzo: en un celular no se agrandan.
    const dpr = escalaDePuntos(estado3d);

    const p = puntos.current.uniforms;
    p.uTiempo.value = e.reloj;
    p.uAparicion.value = aparicion;
    p.uFoco.value = foco;
    p.uApagado.value = apagado;
    p.uDpr.value = dpr;

    const m = modulos.current.uniforms;
    m.uTiempo.value = e.reloj;
    m.uDpr.value = dpr;
    m.uRadio.value = RADIO_SISTEMA * (1 + 0.28 * foco);
    m.uTam.value = 11 * (1 + 0.4 * foco);
    m.uAlfa.value = sat(aparicion * 1.4 - 0.4) * (1 - 0.7 * apagado);

    halo.current.uniforms.uIntensidad.value = aparicion * (0.32 + 0.4 * foco) * (1 - 0.7 * apagado);
    anillo.current.opacity = sat(aparicion * 1.4 - 0.4) * (0.28 + 0.4 * foco) * (1 - 0.7 * apagado);
    if (sistema.current) sistema.current.scale.setScalar(1 + 0.28 * foco);

    const texto = rotulo.current as unknown as { fillOpacity: number } | null;
    if (texto) texto.fillOpacity = sat(aparicion * 1.5 - 0.5) * (0.55 + 0.45 * foco) * (1 - 0.7 * apagado);

    encima.current = THREE.MathUtils.damp(encima.current, encimaMeta.current, 6, delta);
  });

  return (
    <group position={[x, y, z]}>
      <Billboard>
        <mesh position={[0, 0, -0.3]}>
          <planeGeometry args={[2.6, 2.6]} />
          <shaderMaterial
            ref={halo}
            vertexShader={VERT_UV}
            fragmentShader={FRAG_HALO}
            uniforms={uHalo}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[posiciones, 3]} />
          <bufferAttribute attach="attributes-aFase" args={[fases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={puntos}
          vertexShader={VERT_NUCLEO}
          fragmentShader={FRAG_NUCLEO}
          uniforms={uPuntos}
          transparent
          depthWrite={false}
        />
      </points>

      {/* Su sistema: el anillo y los módulos que lo recorren. */}
      <group ref={sistema} rotation={[0.28, 0, 0.12]}>
        <lineLoop geometry={circulo}>
          <lineBasicMaterial ref={anillo} color={empresa.color} transparent opacity={0} depthWrite={false} />
        </lineLoop>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[posicionesModulos, 3]} />
            <bufferAttribute attach="attributes-aIndice" args={[indices, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={modulos}
            vertexShader={VERT_MODULOS}
            fragmentShader={FRAG_MODULOS}
            uniforms={uModulos}
            transparent
            depthWrite={false}
          />
        </points>
      </group>

      <Billboard position={[0, -RADIO_NUCLEO - 0.42, 0]}>
        <Text
          ref={rotulo}
          font={FUENTE_MICHROMA}
          fontSize={0.15}
          letterSpacing={0.14}
          color={empresa.color}
          anchorX="center"
          anchorY="middle"
          characters={CARACTERES}
          fillOpacity={0}
        >
          {empresa.rotulo}
        </Text>
      </Billboard>

      {/* Superficie invisible para que el puntero encuentre la empresa. */}
      <mesh
        onPointerOver={(evento) => {
          evento.stopPropagation();
          encimaMeta.current = 1;
        }}
        onPointerOut={() => {
          encimaMeta.current = 0;
        }}
        onClick={(evento) => {
          evento.stopPropagation();
          onElegir(empresa.id);
        }}
      >
        <sphereGeometry args={[0.85, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Dónde toca cada haz el borde inferior del panel. */
function anclaPanel(indice: number) {
  const x = PANEL.x - PANEL.ancho * 0.36 + (indice / (N - 1)) * PANEL.ancho * 0.72;
  return new THREE.Vector3(x, PANEL.y - PANEL.alto / 2 + 0.02, PANEL.z + 0.02);
}

function Haz({ indice, estado }: { indice: number; estado: Ref }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometria = useMemo(() => {
    const [x, y, z] = POSICIONES[indice];
    const desde = new THREE.Vector3(x, y + RADIO_NUCLEO + 0.08, z);
    const hasta = anclaPanel(indice);
    const control = new THREE.Vector3(x * 0.85, 1.75, (z + hasta.z) / 2 + 0.2);
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(desde, control, hasta), 48, 0.018, 6, false);
  }, [indice]);
  const uniforms = useMemo(
    () => ({
      uTiempo: { value: 0 },
      uTrazo: { value: 0 },
      uFlujo: { value: 0 },
      uDesfase: { value: indice * 0.19 },
      uFoco: { value: 0 },
      uApagado: { value: 0 },
      uColor: { value: new THREE.Color(EMPRESAS[indice].color) },
      uBlanco: { value: new THREE.Color(BLANCO) },
    }),
    [indice],
  );
  useFrame(() => {
    const e = estado.current;
    const u = material.current?.uniforms;
    if (!e || !u) return;
    u.uTiempo.value = e.reloj;
    u.uTrazo.value = e.trazo[indice];
    u.uFlujo.value = e.flujo;
    u.uFoco.value = e.foco[indice];
    u.uApagado.value = e.apagado * (1 - e.foco[indice]);
  });
  return (
    <mesh geometry={geometria}>
      <shaderMaterial
        ref={material}
        vertexShader={VERT_UV}
        fragmentShader={FRAG_HAZ}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Panel({ estado }: { estado: Ref }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const titulo = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTiempo: { value: 0 },
      uAparicion: { value: 0 },
      uDibujo: { value: 0 },
      uApagado: { value: 0 },
      uColores: { value: EMPRESAS.map((e) => new THREE.Color(e.color)) },
      uSerie: { value: EMPRESAS.flatMap((e) => [...e.serie]) },
      uFoco: { value: EMPRESAS.map(() => 0) },
      uBarras: { value: EMPRESAS.map((e) => e.serie[e.serie.length - 1]) },
      uBlanco: { value: new THREE.Color(BLANCO) },
      uProfundo: { value: new THREE.Color(PROFUNDO) },
      uNegro: { value: new THREE.Color(NEGRO) },
      uTam: { value: new THREE.Vector2(PANEL.ancho, PANEL.alto) },
    }),
    [],
  );
  useFrame(() => {
    const e = estado.current;
    const u = material.current?.uniforms;
    if (!e || !u) return;
    u.uTiempo.value = e.reloj;
    u.uAparicion.value = e.panel;
    u.uDibujo.value = e.dibujo;
    u.uApagado.value = e.apagado;
    for (let i = 0; i < N; i++) u.uFoco.value[i] = e.foco[i];
    const texto = titulo.current as unknown as { fillOpacity: number } | null;
    if (texto) texto.fillOpacity = sat(e.panel * 1.6 - 0.6);
  });
  return (
    <group position={[PANEL.x, PANEL.y, PANEL.z]} rotation={[-0.05, 0, 0]}>
      <mesh>
        <planeGeometry args={[PANEL.ancho, PANEL.alto]} />
        <shaderMaterial
          ref={material}
          vertexShader={VERT_UV}
          fragmentShader={FRAG_PANEL}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
      <Text
        ref={titulo}
        font={FUENTE_MICHROMA}
        fontSize={0.12}
        letterSpacing={0.18}
        color={BLANCO}
        anchorX="left"
        anchorY="middle"
        position={[-PANEL.ancho / 2 + 0.2, PANEL.alto / 2 - 0.2, 0.01]}
        characters={CARACTERES}
        fillOpacity={0}
      >
        NÚCLEOS QUVANT
      </Text>
    </group>
  );
}

function Polvo({ estado }: { estado: Ref }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { bases, indices, posiciones } = useMemo(() => {
    const cantidad = 110;
    const bases = new Float32Array(cantidad * 3);
    const indices = new Float32Array(cantidad);
    // Determinístico: el mismo polvo en cada carga.
    let semilla = 7;
    const azar = () => {
      semilla = (semilla * 16807) % 2147483647;
      return semilla / 2147483647;
    };
    for (let i = 0; i < cantidad; i++) {
      bases[i * 3] = (azar() - 0.5) * 10;
      bases[i * 3 + 1] = azar() * 4.4;
      bases[i * 3 + 2] = (azar() - 0.5) * 5 - 0.4;
      indices[i] = i;
    }
    return { bases, indices, posiciones: new Float32Array(cantidad * 3) };
  }, []);
  const uniforms = useMemo(
    () => ({
      uTiempo: { value: 0 },
      uFlujo: { value: 0 },
      uDpr: { value: 1 },
      uColores: { value: EMPRESAS.map((e) => new THREE.Color(e.color)) },
    }),
    [],
  );
  useFrame((estado3d) => {
    const e = estado.current;
    const u = material.current?.uniforms;
    if (!e || !u) return;
    u.uTiempo.value = e.reloj;
    u.uFlujo.value = e.flujo;
    u.uDpr.value = escalaDePuntos(estado3d);
  });
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posiciones, 3]} />
        <bufferAttribute attach="attributes-aBase" args={[bases, 3]} />
        <bufferAttribute attach="attributes-aIndice" args={[indices, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={VERT_POLVO}
        fragmentShader={FRAG_POLVO}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** La cámara: se acerca a la empresa enfocada y sigue apenas al puntero. */
function Camara({ estado }: { estado: Ref }) {
  const camara = useThree((s) => s.camera);
  const mirada = useRef(new THREE.Vector3(0, 1.0, 0));
  const destino = useMemo(() => new THREE.Vector3(), []);
  const miradaDestino = useMemo(() => new THREE.Vector3(), []);

  useFrame((s, delta) => {
    const e = estado.current;
    if (!e) return;
    const aspecto = s.size.width / Math.max(1, s.size.height);
    const z0 = aspecto < 1.55 ? (10 * 1.55) / Math.max(aspecto, 0.9) : 10;
    let peso = 0;
    let fx = 0;
    let fz = 0;
    for (let i = 0; i < N; i++) {
      peso += e.foco[i];
      fx += e.foco[i] * POSICIONES[i][0];
      fz += e.foco[i] * POSICIONES[i][2];
    }
    const k = Math.min(1, peso);
    if (peso > 0) {
      fx /= peso;
      fz /= peso;
    }
    destino.set(
      fx * 0.5 * k + s.pointer.x * 0.35,
      2.2 - 0.35 * k + s.pointer.y * 0.18,
      z0 * (1 - 0.22 * k) + fz * 0.3 * k,
    );
    miradaDestino.set(fx * 0.75 * k, 1.0 - 0.15 * k, fz * 0.4 * k);
    const t = 1 - Math.exp(-2.6 * Math.min(delta, 0.05));
    camara.position.lerp(destino, t);
    mirada.current.lerp(miradaDestino, t);
    camara.lookAt(mirada.current);
  });
  return null;
}

export type PropsMultiNucleo = {
  reproduciendo: boolean;
  enfocada: IdEmpresa | null;
  /** Pedido de saltar a un capítulo; `marca` cambia en cada pedido. */
  salto: { capitulo: number; marca: number } | null;
  onCapitulo: (capitulo: number) => void;
  onFocoAuto: (id: IdEmpresa | null) => void;
  /** Cada cuadro: dónde va el recorrido. Para escribir la barra sin renders. */
  onProgreso: (capitulo: number, fraccion: number) => void;
  onElegir: (id: IdEmpresa | null) => void;
};

function Escena(props: PropsMultiNucleo) {
  const { reproduciendo, enfocada, salto, onCapitulo, onFocoAuto, onProgreso, onElegir } = props;
  const estado = useRef<Estado>({
    tiempo: 0,
    reloj: 0,
    aparicion: lleno(),
    trazo: lleno(),
    foco: lleno(),
    panel: 0,
    flujo: 0,
    dibujo: 0,
    apagado: 0,
    capitulo: -1,
    focoAuto: null,
  });

  useEffect(() => {
    if (!salto) return;
    estado.current.tiempo = INICIO_CAPITULOS[salto.capitulo] + 0.001;
  }, [salto]);

  // Entrar a una empresa es ir a su tramo del capítulo 4: el rótulo y la
  // barra quedan en "Cada una, por su lado", y al seguir, sigue la próxima.
  useEffect(() => {
    if (enfocada === null) return;
    const i = EMPRESAS.findIndex((x) => x.id === enfocada);
    estado.current.tiempo = INICIO_CAPITULOS[3] + i * SEGUNDOS_POR_EMPRESA + 0.05;
  }, [enfocada]);

  // El director: corre antes que todas las piezas (prioridad negativa).
  useFrame((_, delta) => {
    const e = estado.current;
    const dt = Math.min(delta, 0.05);
    e.reloj += dt;
    if (reproduciendo && enfocada === null) e.tiempo = (e.tiempo + dt) % DURACION_RECORRIDO;

    const indiceEnfocada = enfocada === null ? null : EMPRESAS.findIndex((x) => x.id === enfocada);
    const m = metas(e.tiempo, indiceEnfocada);
    const d = (actual: number, meta: number, l = 5) => THREE.MathUtils.damp(actual, meta, l, dt);
    for (let i = 0; i < N; i++) {
      e.aparicion[i] = d(e.aparicion[i], m.aparicion[i], 6);
      e.trazo[i] = d(e.trazo[i], m.trazo[i], 7);
      e.foco[i] = d(e.foco[i], m.foco === i ? 1 : 0, 4.5);
    }
    e.panel = d(e.panel, m.panel, 6);
    e.flujo = d(e.flujo, m.flujo, 4);
    e.dibujo = d(e.dibujo, m.dibujo, 6);
    e.apagado = d(e.apagado, m.foco === null ? 0 : 1, 4.5);

    const capitulo = capituloEn(e.tiempo);
    if (capitulo !== e.capitulo) {
      e.capitulo = capitulo;
      onCapitulo(capitulo);
    }
    const focoAuto = indiceEnfocada === null ? m.foco : null;
    if (focoAuto !== e.focoAuto) {
      e.focoAuto = focoAuto;
      onFocoAuto(focoAuto === null ? null : EMPRESAS[focoAuto].id);
    }
    const inicio = INICIO_CAPITULOS[capitulo];
    const fin = INICIO_CAPITULOS[capitulo + 1] ?? DURACION_RECORRIDO;
    onProgreso(capitulo, (e.tiempo - inicio) / (fin - inicio));
  }, -1);

  return (
    <>
      <Camara estado={estado} />
      <Piso estado={estado} />
      <Polvo estado={estado} />
      <Panel estado={estado} />
      {EMPRESAS.map((empresa, i) => (
        <group key={empresa.id}>
          <Haz indice={i} estado={estado} />
          <NucleoEmpresa indice={i} estado={estado} onElegir={onElegir} />
        </group>
      ))}
    </>
  );
}

export default function MultiNucleo({ activo, ...props }: PropsMultiNucleo & { activo: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={activo ? "always" : "never"}
      camera={{ position: [0, 2.2, 10], fov: 34 }}
      gl={{ alpha: false, antialias: true }}
      onPointerMissed={() => props.onElegir(null)}
    >
      <color attach="background" args={[NEGRO]} />
      <Escena {...props} />
    </Canvas>
  );
}
