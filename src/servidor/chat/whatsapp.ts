/**
 * Los avisos por WhatsApp al equipo cuando entra un pedido o alguien pide
 * hablar con una persona. Dos formas de mandarlos, según qué variables de
 * entorno haya:
 *
 *  - CallMeBot (lo más rápido de activar, para recibir en el celular de
 *    cada uno): CALLMEBOT_DESTINOS="5491100000000:clave1,5491111111111:clave2".
 *    Cada número consigue su clave mandando "I allow callmebot to send me
 *    messages" al número de CallMeBot (ver https://www.callmebot.com).
 *  - WhatsApp Business de Meta (la oficial): WHATSAPP_TOKEN,
 *    WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_DESTINOS="5491100000000,...".
 *    Fuera de la ventana de 24 h, Meta solo deja mandar plantillas
 *    aprobadas: si hay WHATSAPP_PLANTILLA, se usa esa (con el aviso como
 *    único parámetro del cuerpo).
 *
 * Sin ninguna, no se manda nada: el pedido igual queda en el panel.
 * Un aviso que falla nunca rompe la charla del visitante.
 */

export type CanalAvisos = "callmebot" | "meta" | "ninguno";

export function canalAvisos(): CanalAvisos {
  if (process.env.CALLMEBOT_DESTINOS) return "callmebot";
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_DESTINOS) {
    return "meta";
  }
  return "ninguno";
}

const separar = (valor: string) =>
  valor
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean);

async function porCallMeBot(texto: string) {
  const destinos = separar(process.env.CALLMEBOT_DESTINOS ?? "");
  await Promise.all(
    destinos.map(async (destino) => {
      const [telefono, clave] = destino.split(":");
      if (!telefono || !clave) return;
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(telefono)}&apikey=${encodeURIComponent(clave)}&text=${encodeURIComponent(texto)}`;
      const respuesta = await fetch(url, { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`CallMeBot respondió ${respuesta.status}`);
    }),
  );
}

async function porMeta(texto: string) {
  const token = process.env.WHATSAPP_TOKEN!;
  const idNumero = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const plantilla = process.env.WHATSAPP_PLANTILLA;
  const destinos = separar(process.env.WHATSAPP_DESTINOS ?? "");
  await Promise.all(
    destinos.map(async (destino) => {
      const cuerpo = plantilla
        ? {
            messaging_product: "whatsapp",
            to: destino,
            type: "template",
            template: {
              name: plantilla,
              language: { code: process.env.WHATSAPP_PLANTILLA_IDIOMA ?? "es_AR" },
              components: [{ type: "body", parameters: [{ type: "text", text: texto.slice(0, 1000) }] }],
            },
          }
        : { messaging_product: "whatsapp", to: destino, type: "text", text: { body: texto } };
      const respuesta = await fetch(`https://graph.facebook.com/v21.0/${idNumero}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        cache: "no-store",
      });
      if (!respuesta.ok) throw new Error(`WhatsApp (Meta) respondió ${respuesta.status}`);
    }),
  );
}

/** Manda el aviso por el canal configurado. Devuelve si salió. */
export async function avisarPorWhatsApp(texto: string): Promise<boolean> {
  const canal = canalAvisos();
  if (canal === "ninguno") {
    console.info("[chat] Aviso sin WhatsApp configurado:\n" + texto);
    return false;
  }
  try {
    if (canal === "callmebot") await porCallMeBot(texto);
    else await porMeta(texto);
    return true;
  } catch (error) {
    console.error("[chat] No salió el aviso por WhatsApp:", error);
    return false;
  }
}
