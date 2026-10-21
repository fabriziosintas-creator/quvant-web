/**
 * La medición propia de la web: qué rubro se mira, dónde se toca "demo" o
 * "Hablemos", y los pasos del registro. Sin cookies de terceros ni Google
 * Analytics: un id anónimo que vive en el localStorage de este navegador
 * (el mismo que el registro guarda como visita_id), y nada más.
 *
 * Respeta a quien no quiere ser medido: con Do Not Track o Global Privacy
 * Control no se manda nada (el servidor también lo chequea). Los eventos
 * se juntan y van de a tandas con sendBeacon (no frenan la navegación).
 */

export type TipoEvento =
  | "vista_nicho"
  | "clic_demo"
  | "clic_contacto"
  | "inicio_registro"
  // La promo "Primeros 100" (el lugar asignado lo anota la base).
  | "vista_cinta_promo"
  | "cierre_cinta_promo"
  | "clic_cinta_promo"
  | "vista_promo"
  | "uso_demo_promo"
  | "play_video_promo"
  | "inicio_registro_promo";

export const CLAVE_VISITA = "quvant-visita";

type Evento = { tipo: TipoEvento; nicho?: string | null; pagina: string; visita: string };

const esperando: Evento[] = [];
let temporizador: ReturnType<typeof setTimeout> | null = null;
let escuchando = false;

function noRastrear() {
  if (typeof navigator === "undefined") return true;
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return navigator.doNotTrack === "1" || n.globalPrivacyControl === true;
}

/** El id anónimo de la visita (se crea la primera vez; sin localStorage, no se mide). */
export function idVisita(): string | null {
  try {
    let id = window.localStorage.getItem(CLAVE_VISITA);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(CLAVE_VISITA, id);
    }
    return id;
  } catch {
    return null;
  }
}

function enviar() {
  temporizador = null;
  if (esperando.length === 0) return;
  const cuerpo = JSON.stringify({ eventos: esperando.splice(0, 20) });
  const mandado = navigator.sendBeacon?.("/api/eventos", new Blob([cuerpo], { type: "application/json" }));
  if (!mandado) fetch("/api/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo, keepalive: true }).catch(() => {});
  if (esperando.length > 0) enviar();
}

/**
 * Anota un evento. Se manda enseguida si la página se oculta; si no, en un
 * segundo. `pagina` reemplaza a la dirección actual cuando el evento
 * necesita decir algo más (por ejemplo, qué demostración se usó).
 */
export function medir(tipo: TipoEvento, nicho?: string | null, pagina?: string) {
  if (typeof window === "undefined" || noRastrear()) return;
  const visita = idVisita();
  if (!visita) return;
  esperando.push({ tipo, nicho: nicho ?? null, pagina: pagina ?? window.location.pathname, visita });
  if (!escuchando) {
    escuchando = true;
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && enviar());
    window.addEventListener("pagehide", enviar);
  }
  if (!temporizador) temporizador = setTimeout(enviar, 1000);
}
