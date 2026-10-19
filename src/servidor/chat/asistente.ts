import Anthropic from "@anthropic-ai/sdk";
import { betaTool } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import { INSTRUCCIONES } from "./conocimiento";
import type { Borrador, Mensaje, Necesidad, Pedido } from "./tipos";

/**
 * El asistente del chat.
 *
 * Con una clave de la API de Anthropic (ANTHROPIC_API_KEY) responde Claude:
 * conoce todo Quvant (conocimiento.ts), arma el pedido y tiene dos
 * herramientas, registrar_pedido y pedir_persona. Sin clave, el chat sigue
 * funcionando en "modo guiado": cuatro preguntas fijas que arman el pedido.
 *
 * El modelo se puede cambiar con QUVANT_CHAT_MODELO (por ejemplo
 * "claude-haiku-5-5", más barato); por defecto, Claude Opus 5.5.
 */

export const MODELO = process.env.QUVANT_CHAT_MODELO ?? "claude-opus-5-5";

export function hayIA() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export type Acciones = {
  registrarPedido: (pedido: Omit<Pedido, "registrado">) => Promise<void>;
  pedirPersona: (motivo: string) => Promise<void>;
};

const NECESIDADES: readonly Necesidad[] = ["sistema", "app", "web", "otro"];
const MEDIOS = ["whatsapp", "email", "otro"] as const;

const RESPUESTA_DE_RESPALDO =
  "Ahora no puedo responderte bien. Dejame tu nombre y tu WhatsApp o email, y alguien del equipo te escribe.";

let cliente: Anthropic | null = null;
const anthropic = () => (cliente ??= new Anthropic());

/** La charla guardada, en el formato de la API. Los mensajes del equipo van marcados. */
function historialParaClaude(mensajes: Mensaje[]): Anthropic.Beta.BetaMessageParam[] {
  const salida: Anthropic.Beta.BetaMessageParam[] = [];
  for (const mensaje of mensajes) {
    if (mensaje.autor === "sistema") continue;
    salida.push({
      role: mensaje.autor === "visitante" ? "user" : "assistant",
      content:
        mensaje.autor === "humano"
          ? `[Equipo de Quvant · ${mensaje.nombre ?? "equipo"}] ${mensaje.texto}`
          : mensaje.texto,
    });
  }
  // La API pide que la charla empiece con el visitante.
  while (salida.length > 0 && salida[0].role !== "user") salida.shift();
  return salida;
}

function herramientas(acciones: Acciones) {
  const registrarPedido = betaTool({
    name: "registrar_pedido",
    description:
      "Registra el pedido del visitante para que el equipo de Quvant lo contacte y le avisa al equipo por WhatsApp. Usala solo cuando el visitante confirmó el resumen y tenés su nombre, cómo contactarlo, qué necesita y un detalle.",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre de la persona." },
        empresa: { type: ["string", "null"], description: "Empresa, si la dijo." },
        rubro: { type: ["string", "null"], description: "Rubro del negocio, si lo dijo." },
        necesidad: {
          type: "string",
          enum: ["sistema", "app", "web", "otro"],
          description: "sistema = sistema de gestión para su rubro; app = aplicación a medida; web = página web nueva o renovada.",
        },
        detalle: { type: "string", description: "Qué quiere resolver, en dos o tres oraciones, con lo que contó." },
        contacto: { type: "string", description: "WhatsApp o email tal como lo dio." },
        medio: { type: "string", enum: ["whatsapp", "email", "otro"], description: "Por dónde prefiere que lo contacten." },
      },
      required: ["nombre", "empresa", "rubro", "necesidad", "detalle", "contacto", "medio"],
      additionalProperties: false,
    },
    run: async (entrada) => {
      // Se valida igual: el pedido llega al equipo y no puede venir a medias.
      const faltan = (["nombre", "detalle", "contacto"] as const).filter(
        (campo) => typeof entrada[campo] !== "string" || entrada[campo].trim() === "",
      );
      if (faltan.length > 0) return `No se registró: faltan ${faltan.join(", ")}. Pedíselos al visitante.`;
      await acciones.registrarPedido({
        nombre: entrada.nombre.trim(),
        empresa: entrada.empresa?.trim() || null,
        rubro: entrada.rubro?.trim() || null,
        necesidad: NECESIDADES.includes(entrada.necesidad as Necesidad) ? (entrada.necesidad as Necesidad) : "otro",
        detalle: entrada.detalle.trim(),
        contacto: entrada.contacto.trim(),
        medio: MEDIOS.includes(entrada.medio as (typeof MEDIOS)[number]) ? entrada.medio : "otro",
      });
      return "Pedido registrado y equipo avisado. Decile que el equipo lo va a contactar por el medio que eligió y preguntale si quiere sumar algo más.";
    },
  });

  const pedirPersona = betaTool({
    name: "pedir_persona",
    description:
      "Avisa al equipo de Quvant que el visitante quiere hablar con una persona. Desde ese momento responde alguien del equipo en este mismo chat (o lo contacta).",
    inputSchema: {
      type: "object",
      properties: {
        motivo: { type: "string", description: "Para qué quiere hablar con una persona, en una oración." },
      },
      required: ["motivo"],
      additionalProperties: false,
    },
    run: async (entrada) => {
      await acciones.pedirPersona(typeof entrada.motivo === "string" ? entrada.motivo : "");
      return "Equipo avisado. Decile que alguien del equipo le va a responder por acá a la brevedad y que, si deja su WhatsApp o email, también lo pueden contactar por ahí.";
    },
  });

  return [registrarPedido, pedirPersona];
}

/**
 * El chat muestra texto plano: si igual llega algo de markdown (negritas,
 * títulos, viñetas), se limpia para que no se vean los asteriscos.
 */
function textoPlano(texto: string) {
  return texto
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|[.,;:!?]|$)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "· ")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 ($2)");
}

/** Una respuesta de Claude a la charla, usando las herramientas si hace falta. */
export async function responderConIA(mensajes: Mensaje[], acciones: Acciones): Promise<string> {
  const historial = historialParaClaude(mensajes);
  if (historial.length === 0) return RESPUESTA_DE_RESPALDO;
  // Haiku no tiene respaldo del lado del servidor (y la lista de modelos lo rechaza).
  const respaldo = MODELO.includes("haiku")
    ? {}
    : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

  try {
    const final = await anthropic().beta.messages.toolRunner({
      model: MODELO,
      max_tokens: 16000,
      ...respaldo,
      // Es una charla: con esfuerzo bajo alcanza y responde más rápido.
      output_config: { effort: "low" },
      system: [{ type: "text", text: INSTRUCCIONES, cache_control: { type: "ephemeral" } }],
      tools: herramientas(acciones),
      messages: historial,
      max_iterations: 4,
    });

    if (final.stop_reason === "refusal") return RESPUESTA_DE_RESPALDO;
    const texto = final.content
      .filter((bloque): bloque is Anthropic.Beta.BetaTextBlock => bloque.type === "text")
      .map((bloque) => bloque.text.trim())
      .filter(Boolean)
      .join("\n\n");
    return textoPlano(texto) || RESPUESTA_DE_RESPALDO;
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[chat] La clave de Anthropic no es válida.");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("[chat] Límite de uso de la API de Anthropic.");
    } else if (error instanceof Anthropic.APIError) {
      console.error(`[chat] Error de la API de Anthropic (${error.status}):`, error.message);
    } else {
      console.error("[chat] No se pudo responder:", error);
    }
    return RESPUESTA_DE_RESPALDO;
  }
}

// ── Modo guiado (sin IA) ──────────────────────────────────────────────

const PIDE_PERSONA = /\b(persona|humano|alguien|asesor|vendedor|llam(a|ame|en)|reuni[oó]n)\b/i;
const PREGUNTA_QUE_ES = /qu[eé] (es|hace[ns]?) quvant|qui[eé]nes son|qu[eé] hacen/i;
const PARECE_CONTACTO = /@|\d[\d\s+-]{6,}/;

function inferirNecesidad(texto: string): Necesidad {
  if (/\b(web|p[aá]gina|sitio|landing|tienda)\b/i.test(texto)) return "web";
  if (/\b(app|aplicaci[oó]n|celular|android|ios)\b/i.test(texto)) return "app";
  if (/\b(sistema|gesti[oó]n|stock|inventario|caja|ventas|sucursal|turnos)\b/i.test(texto)) return "sistema";
  return "otro";
}

/** El modo guiado: devuelve la respuesta y cómo queda el borrador. */
export async function responderGuiado(
  texto: string,
  borrador: Borrador | null,
  acciones: Acciones,
): Promise<{ respuesta: string; borrador: Borrador }> {
  const actual: Borrador = borrador ?? { paso: "detalle" };

  if (PIDE_PERSONA.test(texto) && actual.paso !== "contacto") {
    await acciones.pedirPersona(texto);
    return {
      respuesta: "Listo, ya le avisé al equipo. Alguien te responde por acá a la brevedad. Si querés, dejame tu WhatsApp o email por las dudas.",
      borrador: actual,
    };
  }

  switch (actual.paso) {
    case "detalle":
      if (PREGUNTA_QUE_ES.test(texto)) {
        return {
          respuesta:
            "Quvant hace software de gestión, apps y webs para pymes y empresas de primer nivel: sistemas listos para cada rubro, aplicaciones a medida y páginas web. ¿Qué te gustaría armar?",
          borrador: actual,
        };
      }
      return {
        respuesta: "Buenísimo, gracias por contarnos. ¿Para qué empresa o rubro es?",
        borrador: { ...actual, paso: "rubro", detalle: texto },
      };
    case "rubro":
      return { respuesta: "¿Cómo te llamás?", borrador: { ...actual, paso: "nombre", rubro: texto } };
    case "nombre": {
      const nombre = texto.replace(/^(me llamo|soy)\s+/i, "").trim();
      return {
        respuesta: `Gracias, ${nombre}. ¿Por dónde te contactamos? Dejame tu WhatsApp o tu email.`,
        borrador: { ...actual, paso: "contacto", nombre },
      };
    }
    case "contacto": {
      if (!PARECE_CONTACTO.test(texto)) {
        return { respuesta: "¿Me pasás un WhatsApp o un email para que el equipo te escriba?", borrador: actual };
      }
      const nombre = actual.nombre ?? "Sin nombre";
      const medio = texto.includes("@") ? "email" : "whatsapp";
      await acciones.registrarPedido({
        nombre,
        empresa: null,
        rubro: actual.rubro ?? null,
        necesidad: inferirNecesidad(`${actual.detalle ?? ""} ${actual.rubro ?? ""}`),
        detalle: actual.detalle ?? "",
        contacto: texto.trim(),
        medio,
      });
      return {
        respuesta: `Listo, ${nombre}. Le pasé tu pedido al equipo: te escriben a la brevedad por ${medio === "email" ? "email" : "WhatsApp"}. Si querés sumar algo, escribilo acá.`,
        borrador: { ...actual, paso: "listo" },
      };
    }
    case "listo":
      return {
        respuesta: "Anotado, se lo sumo a tu pedido. El equipo lo ve junto con lo que nos contaste.",
        borrador: actual,
      };
  }
}
