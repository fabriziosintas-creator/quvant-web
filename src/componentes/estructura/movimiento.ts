import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

/**
 * El ritmo del sitio en JavaScript: las mismas curvas y duraciones que
 * globals.css (--ease-* y --duracion-*), para que lo que anima GSAP y lo
 * que anima el CSS se sientan de la misma marca.
 *
 *  quvant  entrar o cambiar: arranca rápido y frena suave.
 *  salida  irse: arranca suave y se va rápido.
 *  vaiven  lo que va y vuelve (cámaras, bucles).
 *
 * Importar este módulo registra las curvas en GSAP y las deja por defecto:
 * un tween sin curva propia ya usa la de la marca.
 */

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
  CustomEase.create("quvant", "0.2,0.8,0.2,1");
  CustomEase.create("salida", "0.55,0,0.75,0.2");
  CustomEase.create("vaiven", "0.45,0,0.55,1");
  gsap.defaults({ ease: "quvant", duration: 0.45 });
}

export const CURVA = { entrar: "quvant", salir: "salida", vaiven: "vaiven" } as const;

/** En segundos, como los pide GSAP. */
export const DURACION = { instante: 0.15, rapida: 0.25, media: 0.45, lenta: 0.9 } as const;
