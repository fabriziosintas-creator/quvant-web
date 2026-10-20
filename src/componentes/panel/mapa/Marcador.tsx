import { PANEL_ADMIN } from "@/datos/textos";
import type { Local } from "@/servidor/panel/mapa";

/**
 * El marcador de un local: el cuadradito de la marca, sin colores nuevos
 * (regla de la sección 2 del brief). Su forma dice el último feedback y
 * si hay que volver:
 *   sin visitar  → cuadrado chico, borde acero
 *   bueno        → cuadrado lleno blanco
 *   regular      → cuadrado con borde blanco
 *   malo         → cuadrado con borde acero
 *   cliente      → cuadrado lleno con el centro negro
 *   descartado   → cuadrado chico apagado
 *   volver: sí   → un anillo alrededor
 */

export type AspectoLocal = Pick<Local, "estado" | "ultimo_feedback" | "volver" | "cantidad_visitas">;

export function Marcador({ local, grande = false, className = "" }: { local: AspectoLocal; grande?: boolean; className?: string }) {
  const escala = grande ? 1.5 : 1;
  const lado = (px: number) => `${px * escala}px`;
  const anillo = local.volver === "si" && local.estado !== "descartado" ? "outline outline-1 outline-offset-[3px] outline-blanco/60" : "";
  const base = `inline-block shrink-0 ${anillo} ${className}`;
  const estilo = { width: lado(14), height: lado(14) };

  if (local.estado === "descartado") return <span aria-hidden className={`${base} border border-acero/50 opacity-50`} style={{ width: lado(10), height: lado(10) }} />;
  if (local.estado === "cliente")
    return (
      <span aria-hidden className={`${base} flex items-center justify-center bg-blanco`} style={{ width: lado(16), height: lado(16) }}>
        <span className="block bg-negro" style={{ width: lado(6), height: lado(6) }} />
      </span>
    );
  if (local.cantidad_visitas === 0 || !local.ultimo_feedback) return <span aria-hidden className={`${base} border border-acero`} style={{ width: lado(10), height: lado(10) }} />;
  if (local.ultimo_feedback === "bueno") return <span aria-hidden className={`${base} bg-blanco`} style={estilo} />;
  if (local.ultimo_feedback === "regular") return <span aria-hidden className={`${base} border-2 border-blanco`} style={estilo} />;
  return <span aria-hidden className={`${base} border border-acero`} style={estilo} />;
}

/** Qué dice el marcador, en palabras (para el lector de pantalla y la lista). */
export function descripcionDe(local: AspectoLocal) {
  const T = PANEL_ADMIN.mapa;
  const partes: string[] = [T.estados[local.estado]];
  if (local.ultimo_feedback) partes.push(`${T.ficha.ultimoFeedback.toLowerCase()}: ${T.feedback[local.ultimo_feedback].toLowerCase()}`);
  if (local.volver) partes.push(`${T.ficha.volver.toLowerCase()}: ${T.volver[local.volver].toLowerCase()}`);
  return partes.join(" · ");
}

/** La leyenda: cada forma con su palabra. */
export function Leyenda() {
  const T = PANEL_ADMIN.mapa;
  const muestras: Array<{ texto: string; local: AspectoLocal }> = [
    { texto: T.leyenda.sinVisitar, local: { estado: "por_visitar", ultimo_feedback: null, volver: null, cantidad_visitas: 0 } },
    { texto: T.feedback.bueno, local: { estado: "visitado", ultimo_feedback: "bueno", volver: null, cantidad_visitas: 1 } },
    { texto: T.feedback.regular, local: { estado: "visitado", ultimo_feedback: "regular", volver: null, cantidad_visitas: 1 } },
    { texto: T.feedback.malo, local: { estado: "visitado", ultimo_feedback: "malo", volver: null, cantidad_visitas: 1 } },
    { texto: T.leyenda.volver, local: { estado: "visitado", ultimo_feedback: "bueno", volver: "si", cantidad_visitas: 1 } },
    { texto: T.leyenda.cliente, local: { estado: "cliente", ultimo_feedback: "bueno", volver: null, cantidad_visitas: 2 } },
    { texto: T.leyenda.descartado, local: { estado: "descartado", ultimo_feedback: "malo", volver: "no", cantidad_visitas: 1 } },
  ];
  return (
    <ul aria-label={T.leyenda.titulo} className="flex flex-wrap gap-x-5 gap-y-2 font-plex text-[11px] text-acero">
      {muestras.map((m) => (
        <li key={m.texto} className="flex items-center gap-2.5">
          <span className="flex w-5 justify-center">
            <Marcador local={m.local} />
          </span>
          {m.texto}
        </li>
      ))}
    </ul>
  );
}
