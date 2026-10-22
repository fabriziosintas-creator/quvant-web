/**
 * Qué IA puede leer el sitio y cuál no (22-oct-2026). Lo usan robots.ts
 * (el pedido) y proxy.ts (el bloqueo de verdad, porque algunos de estos
 * bots no respetan robots.txt).
 *
 *  · Buscadores con IA: leen el sitio para citarlo cuando alguien pregunta
 *    por sistemas de gestión. Se dejan: son vidriera.
 *  · Entrenamiento y lectura a pedido: los que juntan páginas para entrenar
 *    modelos y los que leen una página cuando alguien la pega en un chat
 *    ("copiame esta web"). Se bloquean.
 *
 * Una IA que maneja un navegador de verdad (un agente que abre Chrome) se ve
 * como una persona y no se puede distinguir con esto; tampoco se puede
 * evitar que alguien copie el código a mano y lo pegue en un chat. Ver
 * docs/proteccion-del-sitio.md.
 */

export const IA_BUSCADORES = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"];

export const IA_BLOQUEADAS = [
  // Entrenamiento de modelos.
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "meta-externalagent",
  "Amazonbot",
  "cohere-ai",
  "cohere-training-data-crawler",
  "Diffbot",
  "Omgilibot",
  "AI2Bot",
  "ImagesiftBot",
  "Timpibot",
  // Lectura a pedido desde un chat.
  "ChatGPT-User",
  "Claude-User",
  "Perplexity-User",
  "MistralAI-User",
  "meta-externalfetcher",
  "DuckAssistBot",
];

/** Para el proxy: el user-agent de un bot bloqueado (Google-Extended y Applebot-Extended son solo para robots.txt: no tienen user-agent propio). */
export const IA_BLOQUEADAS_EXPRESION = new RegExp(IA_BLOQUEADAS.map((b) => b.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")).join("|"), "i");
