import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { FUNCIONES_CLAVE, type Plantilla } from "../../../medicion-sistema/catalogo";
import { CONFIG_PROCESO } from "@/nucleos/configuracion";
import type { Acompanamiento, Alerta, ClienteSistema, Indicadores } from "@/nucleos/tipos";

/**
 * El bloque de inteligencia de Núcleos (B.6): Claude resume al cliente y
 * sugiere la corrección o el mensaje de acompañamiento. Nunca manda nada
 * solo: el borrador se edita y se copia.
 *
 * Privacidad: solo le llegan indicadores agregados (semanas, módulos,
 * funciones clave con su "por qué importa", alertas y acompañamientos con
 * tipo y fecha, sin las notas), la plantilla y el catálogo. Nada del
 * negocio del cliente ni datos personales.
 *
 * Modelo rápido y económico (claude-haiku-5-5), salida JSON validada con
 * output_config.format (JSON schema), caché de prompt para la parte fija
 * (reglas + catálogo), una respuesta por cliente y por día, y un tope de
 * llamadas por día (NUCLEOS_CLAUDE_TOPE_DIARIO). Sin ANTHROPIC_API_KEY,
 * devuelve un análisis de ejemplo armado con los indicadores y lo dice.
 */

export const MODELO_NUCLEOS = process.env.NUCLEOS_CLAUDE_MODELO ?? "claude-haiku-5-5";

export type AnalisisCliente = {
  resumen: [string, string, string];
  riesgo: string;
  correcciones: Array<{ tipo: "configuracion" | "capacitacion" | "mejora"; texto: string }>;
  mensaje: string;
  /** true cuando no hay clave y el análisis se armó sin Claude. */
  ejemplo: boolean;
  modelo: string;
};

export type AnalisisNucleo = { resumen: string; patrones: string[]; ejemplo: boolean; modelo: string };

const ESQUEMA_CLIENTE = {
  type: "object",
  additionalProperties: false,
  required: ["resumen", "riesgo", "correcciones", "mensaje"],
  properties: {
    resumen: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    riesgo: { type: "string" },
    correcciones: {
      type: "array",
      maxItems: 3,
      items: { type: "object", additionalProperties: false, required: ["tipo", "texto"], properties: { tipo: { type: "string", enum: ["configuracion", "capacitacion", "mejora"] }, texto: { type: "string" } } },
    },
    mensaje: { type: "string" },
  },
} as const;

const ESQUEMA_NUCLEO = {
  type: "object",
  additionalProperties: false,
  required: ["resumen", "patrones"],
  properties: { resumen: { type: "string" }, patrones: { type: "array", maxItems: 4, items: { type: "string" } } },
} as const;

const REGLAS = `Sos parte del equipo de Quvant, una empresa argentina de dos socios (fabrizio y Michel) que vende un sistema de gestión con un núcleo común y plantillas por rubro. Analizás cómo usa el sistema cada cliente para ayudarlos a aprovecharlo.
Reglas:
- Español rioplatense, voseo, frases cortas, tono cercano y concreto. Nada de jerga técnica ni de marketing.
- Hablás solo de uso del sistema (módulos, funciones, días activos, usuarios, sucursales). Nunca inventes montos, ventas ni datos del negocio: no los tenés.
- Las correcciones son de tres tipos: configuracion (algo para ajustar en su sistema), capacitacion (mostrarle cómo usar algo) o mejora (algo que Quvant debería mejorar en el sistema).
- El mensaje de acompañamiento es un borrador corto para mandarle al dueño: saludo, una observación concreta, una propuesta (video corto, llamada de 15 minutos, visita) y la firma con el nombre del responsable. Nunca prometas integraciones (ARCA, Mercado Pago, WhatsApp) ni hables de cambios de nombre del sistema.
- El sistema se llama Quvant.`;

const catalogoComoTexto = () =>
  (Object.keys(FUNCIONES_CLAVE) as Plantilla[])
    .filter((p) => FUNCIONES_CLAVE[p].length > 0)
    .map((p) => `Plantilla ${p}:\n${FUNCIONES_CLAVE[p].map((f) => `- ${f.id} · ${f.nombre} (${f.frecuencia}): ${f.porQueImporta}`).join("\n")}`)
    .join("\n\n");

/** Lo que se le manda: solo agregados. */
export function entradaDeCliente(cliente: ClienteSistema, indicadores: Indicadores, alertas: Alerta[], acompanamientos: Acompanamiento[]) {
  return {
    plantilla: cliente.plantilla,
    semanasDeAlta: Math.floor((Date.now() - new Date(cliente.alta).getTime()) / (7 * 86_400_000)),
    sucursalesContratadas: cliente.sucursalesContratadas,
    usuariosContratados: cliente.usuariosContratados,
    responsable: cliente.responsable === "michel" ? "Michel" : "fabrizio",
    salud: indicadores.salud,
    semaforo: indicadores.semaforo,
    adopcion: Math.round(indicadores.adopcion * 100),
    tendencia: indicadores.tendencia,
    diasActivos4Semanas: indicadores.diasActivos4Semanas,
    amplitud: { usuarios: Math.round(indicadores.amplitud.usuarios * 100), sucursales: Math.round(indicadores.amplitud.sucursales * 100) },
    semanas: indicadores.semanas.slice(-8).map((s) => ({ semana: s.inicio, diasActivos: s.diasActivos, acciones: s.acciones, usuarios: s.usuariosActivos, sucursales: s.sucursalesActivas, porModulo: s.accionesPorModulo })),
    funcionesClave: indicadores.funcionesClave.map((f) => ({ id: f.id, estado: f.estado, ultimaVez: f.ultimaVez?.slice(0, 10) ?? null })),
    accionesPorRol: indicadores.accionesPorRol,
    alertasAbiertas: alertas.map((a) => ({ tipo: a.tipo, funcion: a.funcionClave })),
    acompanamientos: acompanamientos.slice(0, 6).map((a) => ({ tipo: a.tipo, fecha: a.fecha })),
  };
}

// ── Tope diario y caché cuando no hay tablas (modo ejemplo) ───────────
const memoria = new Map<string, { dia: string; valor: unknown }>();
let llamadasHoy = { dia: "", n: 0 };
const hoyIso = () => new Date().toISOString().slice(0, 10);

function tope(): boolean {
  const dia = hoyIso();
  if (llamadasHoy.dia !== dia) llamadasHoy = { dia, n: 0 };
  if (llamadasHoy.n >= CONFIG_PROCESO.topeClaudeDiario) return false;
  llamadasHoy.n++;
  return true;
}

function cliente(): Anthropic | null {
  return process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
}

async function pedirJson<T>(sistema: string, usuario: string, esquema: object): Promise<T | null> {
  const api = cliente();
  if (!api || !tope()) return null;
  const respuesta = await api.messages.create({
    model: MODELO_NUCLEOS,
    max_tokens: 1200,
    system: [{ type: "text", text: sistema, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: usuario }],
    output_config: { format: { type: "json_schema", schema: esquema as Record<string, unknown> } },
  });
  const texto = respuesta.content.find((b) => b.type === "text")?.text ?? "";
  try {
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
}

/** Análisis de ejemplo (sin clave): armado con los indicadores, sin inventar nada. */
function ejemploCliente(entrada: ReturnType<typeof entradaDeCliente>, nombre: string): AnalisisCliente {
  const sinUsar = entrada.funcionesClave.filter((f) => f.estado !== "usada");
  const nombres = (ids: string[]) => ids.map((id) => FUNCIONES_CLAVE[entrada.plantilla].find((f) => f.id === id)?.nombre ?? id);
  const primera = sinUsar[0] ? nombres([sinUsar[0].id])[0] : null;
  return {
    resumen: [
      `${nombre} usa el sistema ${entrada.diasActivos4Semanas} días en las últimas 4 semanas, con ${entrada.adopcion} % de las funciones clave en uso.`,
      entrada.tendencia.direccion === "baja" ? `La actividad viene bajando (${entrada.tendencia.porcentaje} % contra su promedio).` : entrada.tendencia.direccion === "sube" ? `La actividad viene subiendo (+${entrada.tendencia.porcentaje} %).` : "La actividad se mantiene estable.",
      sinUsar.length > 0 ? `Sin usar: ${nombres(sinUsar.map((f) => f.id)).join(", ")}.` : "Usa todas las funciones clave de su plantilla.",
    ],
    riesgo: entrada.alertasAbiertas.length > 0 ? `Tiene ${entrada.alertasAbiertas.length} alerta(s) abierta(s); la primera es "${entrada.alertasAbiertas[0].tipo.replace(/_/g, " ")}".` : "Sin alertas abiertas.",
    correcciones: sinUsar.slice(0, 3).map((f) => ({ tipo: f.estado === "dejo_de_usar" ? "capacitacion" : "configuracion", texto: `Mostrarle ${nombres([f.id])[0].toLowerCase()} y ver qué lo frena.` })) as AnalisisCliente["correcciones"],
    mensaje: primera
      ? `Hola, ¿cómo va? Estuve mirando cómo vienen con el sistema y vi que todavía no están usando ${primera.toLowerCase()}. Es de lo que más tiempo ahorra. Si querés, coordinamos 15 minutos esta semana y te lo muestro con tus datos. Abrazo, ${entrada.responsable}.`
      : `Hola, ¿cómo va? Vi que están usando el sistema a full, felicitaciones. Si hay algo que les gustaría que haga distinto, contame. Abrazo, ${entrada.responsable}.`,
    ejemplo: true,
    modelo: "ejemplo (sin ANTHROPIC_API_KEY)",
  };
}

export async function analizarCliente(datos: { cliente: ClienteSistema; indicadores: Indicadores; alertas: Alerta[]; acompanamientos: Acompanamiento[] }): Promise<AnalisisCliente> {
  const entrada = entradaDeCliente(datos.cliente, datos.indicadores, datos.alertas, datos.acompanamientos);
  const clave = `cliente:${datos.cliente.id}`;
  const guardado = memoria.get(clave);
  if (guardado && guardado.dia === hoyIso()) return guardado.valor as AnalisisCliente;

  const sistema = `${REGLAS}\n\nFunciones clave por plantilla (con por qué importan):\n${catalogoComoTexto()}`;
  const usuario = `Cliente "${datos.cliente.nombre}". Indicadores de uso (solo agregados):\n${JSON.stringify(entrada, null, 1)}\n\nDevolvé: resumen (3 líneas), riesgo principal, hasta 3 correcciones (configuracion, capacitacion o mejora) y un borrador de mensaje de acompañamiento firmado por ${entrada.responsable}.`;

  let resultado: AnalisisCliente;
  try {
    const json = await pedirJson<Omit<AnalisisCliente, "ejemplo" | "modelo">>(sistema, usuario, ESQUEMA_CLIENTE);
    resultado = json && Array.isArray(json.resumen) && json.resumen.length === 3 ? { ...json, ejemplo: false, modelo: MODELO_NUCLEOS } : ejemploCliente(entrada, datos.cliente.nombre);
  } catch (error) {
    console.error("[nucleos] Claude:", error);
    resultado = ejemploCliente(entrada, datos.cliente.nombre);
  }
  memoria.set(clave, { dia: hoyIso(), valor: resultado });
  return resultado;
}

export async function analizarNucleo(nucleo: { id: string; nombre: string; plantilla: Plantilla | null }, clientes: Array<{ nombre: string; indicadores: Indicadores | null }>): Promise<AnalisisNucleo> {
  const clave = `nucleo:${nucleo.id}`;
  const guardado = memoria.get(clave);
  if (guardado && guardado.dia === hoyIso()) return guardado.valor as AnalisisNucleo;

  const conDatos = clientes.filter((c) => c.indicadores);
  const funciones = nucleo.plantilla ? FUNCIONES_CLAVE[nucleo.plantilla] : [];
  const sinUso = funciones
    .map((f) => ({ f, cuantos: conDatos.filter((c) => c.indicadores!.funcionesClave.find((x) => x.id === f.id)?.estado !== "usada").length }))
    .filter((x) => x.cuantos > 0)
    .sort((a, b) => b.cuantos - a.cuantos);
  const ejemplo: AnalisisNucleo = {
    resumen: `${conDatos.length} clientes con datos en ${nucleo.nombre}. ${sinUso[0] ? `${sinUso[0].cuantos} de ${conDatos.length} no usan "${sinUso[0].f.nombre}": conviene un video corto o mejorar el acceso desde el tablero.` : "Todas las funciones clave tienen uso."}`,
    patrones: sinUso.slice(0, 4).map((x) => `${x.cuantos} de ${conDatos.length} no usan ${x.f.nombre.toLowerCase()}.`),
    ejemplo: true,
    modelo: "ejemplo (sin ANTHROPIC_API_KEY)",
  };

  let resultado = ejemplo;
  try {
    const entrada = conDatos.map((c) => ({ nombre: c.nombre, semaforo: c.indicadores!.semaforo, adopcion: Math.round(c.indicadores!.adopcion * 100), tendencia: c.indicadores!.tendencia.direccion, sinUsar: c.indicadores!.funcionesClave.filter((f) => f.estado !== "usada").map((f) => f.id) }));
    const json = await pedirJson<Omit<AnalisisNucleo, "ejemplo" | "modelo">>(
      `${REGLAS}\n\nFunciones clave por plantilla:\n${catalogoComoTexto()}`,
      `Núcleo "${nucleo.nombre}" (plantilla ${nucleo.plantilla}). Clientes y su uso (agregados):\n${JSON.stringify(entrada, null, 1)}\n\n¿Qué está pasando en este núcleo? Devolvé un resumen de 2 o 3 frases y hasta 4 patrones (por ejemplo: "6 de 9 clientes no usan el conteo con la cámara: conviene un video corto o mejorar el acceso desde el tablero").`,
      ESQUEMA_NUCLEO,
    );
    if (json?.resumen) resultado = { ...json, ejemplo: false, modelo: MODELO_NUCLEOS };
  } catch (error) {
    console.error("[nucleos] Claude:", error);
  }
  memoria.set(clave, { dia: hoyIso(), valor: resultado });
  return resultado;
}
