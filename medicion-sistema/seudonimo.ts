/**
 * El id seudónimo del usuario que viaja a PostHog: un hash del id interno
 * con una sal secreta (MEDICION_SAL). Sin la sal no se puede volver del
 * hash al usuario, y nunca viaja el email ni el nombre.
 *
 * En el navegador la sal no está (es secreta): el servidor calcula el
 * seudónimo al iniciar la sesión y se lo da a la app junto con el contexto
 * (ver posthog-navegador.ts). Si por algo no hay seudónimo, los eventos van
 * como anónimos de la organización ("org:<id>"), nunca con el id real.
 */

const codificador = new TextEncoder();

async function sha256Hex(texto: string): Promise<string> {
  const cripto = globalThis.crypto;
  if (!cripto?.subtle) throw new Error("Web Crypto no disponible: calcular el seudónimo en el servidor.");
  const bytes = await cripto.subtle.digest("SHA-256", codificador.encode(texto));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Solo en el servidor (necesita la sal). */
export async function seudonimo(idUsuario: string, sal: string): Promise<string> {
  if (!sal || sal.length < 16) throw new Error("MEDICION_SAL tiene que tener al menos 16 caracteres.");
  return `u_${(await sha256Hex(`${sal}:${idUsuario}`)).slice(0, 32)}`;
}

/** Cuando no hay seudónimo: la organización, nunca la persona. */
export const anonimoDe = (organizacionId: string) => `org_${organizacionId}`;
