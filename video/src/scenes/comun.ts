import { Easing } from "remotion";
import type { Camara } from "../transitions/Jump";

/**
 * Lo que comparten las escenas del spot: curvas, tramos de tiempo y la
 * cámara por paradas (se acerca a un punto de una captura y lo deja en un
 * lugar de la pantalla).
 */

/** La curva del manual para todo lo que entra: cubic-bezier(.2,.8,.2,1). */
export const curvaMarca = Easing.bezier(0.2, 0.8, 0.2, 1);
export const suave = Easing.inOut(Easing.cubic);

export const recorte = (x: number) => Math.min(1, Math.max(0, x));
/** 0..1 según dónde cae t entre desde y hasta. */
export const tramo = (t: number, desde: number, hasta: number) => recorte((t - desde) / (hasta - desde));
export const mezcla = (a: number, b: number, k: number) => a + (b - a) * k;

type V3 = [number, number, number];

/** Un plano en el mundo: dónde está, cuánto gira en Y y su tamaño. */
export type Plano = { posicion: V3; giro: number; ancho: number; aspecto: number };

/** El punto del mundo que corresponde a (u, v) del plano (origen arriba-izquierda). */
export function puntoDelPlano(p: Plano, [u, v]: [number, number]): V3 {
  const x = (u - 0.5) * p.ancho;
  const y = (0.5 - v) * (p.ancho / p.aspecto);
  return [p.posicion[0] + x * Math.cos(p.giro), p.posicion[1] + y, p.posicion[2] - x * Math.sin(p.giro)];
}

export type Parada = {
  /** Segundo (local de la escena) en el que la cámara llega a esta parada. */
  t: number;
  punto: V3;
  /** Dónde queda el punto en pantalla, en fracción (origen arriba-izquierda). */
  pantalla: [number, number];
  distancia: number;
  /** Órbita alrededor del punto, en radianes. */
  giro?: number;
  cabeceo?: number;
  /** Cómo llega desde la parada anterior: deslizando (suave) o a velocidad pareja (lineal, para los empujes lentos). */
  curva?: "suave" | "lineal" | "marca";
};

/**
 * La cámara en el segundo t, interpolando entre paradas. La distancia se
 * interpola en logaritmo: el acercamiento se siente parejo.
 */
export function camaraDeParadas(paradas: Parada[], t: number, aspecto: number, fov = 30): Camara {
  let i = 0;
  while (i < paradas.length - 2 && t >= paradas[i + 1].t) i++;
  const a = paradas[i];
  const b = paradas[Math.min(i + 1, paradas.length - 1)];
  const k = b.t > a.t ? tramo(t, a.t, b.t) : 1;
  const curva = b.curva ?? "suave";
  const e = curva === "lineal" ? k : curva === "marca" ? curvaMarca(k) : suave(k);

  const punto = a.punto.map((x, j) => mezcla(x, b.punto[j], e)) as V3;
  const sx = mezcla(a.pantalla[0], b.pantalla[0], e);
  const sy = mezcla(a.pantalla[1], b.pantalla[1], e);
  const d = Math.exp(mezcla(Math.log(a.distancia), Math.log(b.distancia), e));
  const g = mezcla(a.giro ?? 0, b.giro ?? 0, e);
  const c = mezcla(a.cabeceo ?? 0, b.cabeceo ?? 0, e);

  const altoVisible = 2 * d * Math.tan((fov * Math.PI) / 360);
  const anchoVisible = altoVisible * aspecto;
  const derecha: V3 = [Math.cos(g), 0, -Math.sin(g)];
  const arriba: V3 = [-Math.sin(g) * Math.sin(c), Math.cos(c), -Math.cos(g) * Math.sin(c)];
  const dx = (sx - 0.5) * anchoVisible;
  const dy = (0.5 - sy) * altoVisible;
  const mira = punto.map((x, j) => x - derecha[j] * dx - arriba[j] * dy) as V3;
  const direccion: V3 = [Math.sin(g) * Math.cos(c), Math.sin(c), Math.cos(g) * Math.cos(c)];
  const posicion = mira.map((x, j) => x + direccion[j] * d) as V3;
  return { posicion, mira, fov };
}

/** El cuadro de una secuencia de stock (c0001.jpg…) para el segundo t, sin pasarse del último. */
export function cuadroDeSecuencia(carpeta: string, t: number, fps: number, total: number, desde = 0) {
  const n = Math.min(total, Math.max(1, Math.floor((t + desde) * fps) + 1));
  return `${carpeta}/c${String(n).padStart(4, "0")}.jpg`;
}
