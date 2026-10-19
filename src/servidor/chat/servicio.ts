import { randomUUID } from "node:crypto";
import { SITIO } from "@/datos/sitio";
import { almacen } from "./almacen";
import { hayIA, responderConIA, responderGuiado, type Acciones } from "./asistente";
import type { Autor, Conversacion, Mensaje, Necesidad, Pedido, VistaVisitante } from "./tipos";
import { avisarPorWhatsApp } from "./whatsapp";

/**
 * Lo que pasa con cada conversación: el visitante escribe, responde el
 * asistente (o nadie, si la tomó alguien del equipo), se registran los
 * pedidos y se avisa por WhatsApp. El panel usa las acciones de abajo.
 */

export const LARGO_MAXIMO = 1200;
const MENSAJES_POR_CHARLA = 60;
const MENSAJES_POR_IP_CADA_10_MIN = 40;

const NECESIDAD_TEXTO: Record<Necesidad, string> = {
  sistema: "Un sistema para su rubro",
  app: "Una app a medida",
  web: "Una web nueva o renovada",
  otro: "Otra cosa",
};

export class LimiteExcedido extends Error {}

function nuevaConversacion(pagina: string | null): Conversacion {
  const ahora = Date.now();
  return {
    id: randomUUID(),
    creada: ahora,
    actualizada: ahora,
    estado: "bot",
    atiende: null,
    pedido: null,
    noLeidos: 0,
    pagina,
    mensajesVisitante: 0,
    borrador: null,
    ultimo: null,
  };
}

function nuevoMensaje(autor: Autor, texto: string, nombre: string | null = null): Mensaje {
  return { id: randomUUID(), autor, nombre, texto, fecha: Date.now() };
}

async function agregar(conversacion: Conversacion, mensaje: Mensaje) {
  await almacen().agregarMensaje(conversacion.id, mensaje);
  conversacion.actualizada = mensaje.fecha;
  conversacion.ultimo = { autor: mensaje.autor, texto: mensaje.texto.slice(0, 140) };
}

const enlacePanel = (id: string) => `${SITIO.url}/panel?c=${id}`;

function textoAvisoPedido(id: string, p: Omit<Pedido, "registrado">) {
  return [
    "■ Nuevo pedido en la web de Quvant",
    `Nombre: ${p.nombre}`,
    p.empresa || p.rubro ? `Empresa / rubro: ${[p.empresa, p.rubro].filter(Boolean).join(" · ")}` : null,
    `Necesita: ${NECESIDAD_TEXTO[p.necesidad]}`,
    `Detalle: ${p.detalle}`,
    `Contacto: ${p.contacto} (${p.medio})`,
    `Ver la charla: ${enlacePanel(id)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Las herramientas del asistente, atadas a esta conversación. */
function accionesDe(conversacion: Conversacion): Acciones {
  return {
    async registrarPedido(pedido) {
      conversacion.pedido = { ...pedido, registrado: Date.now() };
      await almacen().guardar(conversacion);
      await avisarPorWhatsApp(textoAvisoPedido(conversacion.id, pedido));
    },
    async pedirPersona(motivo) {
      if (conversacion.estado === "bot") conversacion.estado = "espera-humano";
      await almacen().guardar(conversacion);
      await avisarPorWhatsApp(
        [
          "■ Alguien quiere hablar con una persona en la web de Quvant",
          motivo ? `Motivo: ${motivo}` : null,
          conversacion.pedido ? `Es ${conversacion.pedido.nombre} (${conversacion.pedido.contacto})` : null,
          `Responder desde el panel: ${enlacePanel(conversacion.id)}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    },
  };
}

function vista(conversacion: Conversacion, mensajes: Mensaje[]): VistaVisitante {
  return {
    conversacion: conversacion.id,
    estado: conversacion.estado,
    atiende: conversacion.atiende,
    pedido: conversacion.pedido,
    mensajes,
  };
}

/** El visitante escribe: se guarda y, si corresponde, responde el asistente. */
export async function recibirDelVisitante(datos: {
  id: string | null;
  texto: string;
  pagina: string | null;
  ip: string;
}): Promise<VistaVisitante> {
  const texto = datos.texto.trim().slice(0, LARGO_MAXIMO);
  if (!texto) throw new Error("Mensaje vacío");
  if ((await almacen().contar(`ip:${datos.ip}`, 600)) > MENSAJES_POR_IP_CADA_10_MIN) {
    throw new LimiteExcedido("Demasiados mensajes seguidos. Probá de nuevo en unos minutos.");
  }

  const existente = datos.id ? await almacen().obtener(datos.id) : null;
  const conversacion = existente ?? nuevaConversacion(datos.pagina);
  const nuevos: Mensaje[] = [];

  const delVisitante = nuevoMensaje("visitante", texto);
  await agregar(conversacion, delVisitante);
  nuevos.push(delVisitante);
  conversacion.noLeidos += 1;
  conversacion.mensajesVisitante += 1;
  // Si el equipo la había cerrado y vuelve a escribir, la retoma el asistente.
  if (conversacion.estado === "cerrada") {
    conversacion.estado = "bot";
    conversacion.atiende = null;
  }

  if (conversacion.mensajesVisitante > MENSAJES_POR_CHARLA && conversacion.estado === "bot") {
    conversacion.estado = "espera-humano";
    const aviso = nuevoMensaje(
      "sistema",
      "Esta charla ya es larga: le pasamos todo al equipo para que te responda una persona.",
    );
    await agregar(conversacion, aviso);
    nuevos.push(aviso);
  } else if (conversacion.estado === "bot") {
    const acciones = accionesDe(conversacion);
    let respuesta: string;
    if (hayIA()) {
      respuesta = await responderConIA(await almacen().mensajes(conversacion.id), acciones);
    } else {
      const guiado = await responderGuiado(texto, conversacion.borrador, acciones);
      conversacion.borrador = guiado.borrador;
      respuesta = guiado.respuesta;
    }
    const delBot = nuevoMensaje("bot", respuesta);
    await agregar(conversacion, delBot);
    nuevos.push(delBot);
  }

  await almacen().guardar(conversacion);
  return vista(conversacion, nuevos);
}

/** Lo nuevo de una conversación (el visitante pregunta cada pocos segundos). */
export async function novedadesParaVisitante(id: string, desde: number): Promise<VistaVisitante | null> {
  const conversacion = await almacen().obtener(id);
  if (!conversacion) return null;
  const mensajes = (await almacen().mensajes(id)).filter((m) => m.fecha > desde);
  return vista(conversacion, mensajes);
}

// ── Panel ─────────────────────────────────────────────────────────────

export async function listarParaPanel() {
  return almacen().listar(200);
}

export async function detalleParaPanel(id: string) {
  const conversacion = await almacen().obtener(id);
  if (!conversacion) return null;
  return { conversacion, mensajes: await almacen().mensajes(id) };
}

export type AccionPanel = "leer" | "tomar" | "devolver" | "cerrar" | "reabrir" | "responder";

export async function accionDelPanel(id: string, accion: AccionPanel, quien: string, texto?: string) {
  const conversacion = await almacen().obtener(id);
  if (!conversacion) return null;

  const tomar = async () => {
    if (conversacion.estado === "humano" && conversacion.atiende === quien) return;
    conversacion.estado = "humano";
    conversacion.atiende = quien;
    await agregar(conversacion, nuevoMensaje("sistema", `${quien}, del equipo de Quvant, se sumó a la charla.`));
  };

  switch (accion) {
    case "leer":
      conversacion.noLeidos = 0;
      break;
    case "tomar":
      await tomar();
      break;
    case "devolver":
      conversacion.estado = "bot";
      conversacion.atiende = null;
      await agregar(conversacion, nuevoMensaje("sistema", "Te sigue atendiendo el asistente de Quvant."));
      break;
    case "cerrar":
      conversacion.estado = "cerrada";
      await agregar(
        conversacion,
        nuevoMensaje("sistema", "El equipo dio por terminada la charla. Si necesitás algo más, escribinos acá."),
      );
      break;
    case "reabrir":
      conversacion.estado = "espera-humano";
      break;
    case "responder": {
      const limpio = (texto ?? "").trim().slice(0, LARGO_MAXIMO * 2);
      if (!limpio) return detalleParaPanel(id);
      await tomar();
      await agregar(conversacion, nuevoMensaje("humano", limpio, quien));
      conversacion.noLeidos = 0;
      break;
    }
  }
  await almacen().guardar(conversacion);
  return detalleParaPanel(id);
}
