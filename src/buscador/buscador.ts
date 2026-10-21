/**
 * El buscador del panel, puro (con pruebas en buscador.test.ts): qué pide
 * lo que se escribió ("nueva visita a ferretería norte", "ir a industria",
 * "cargar cobro"), qué acciones y páginas coinciden, la búsqueda en las
 * charlas del chat y los recientes.
 */

export type TipoResultado = "accion" | "pagina" | "local" | "cliente" | "socio" | "registro" | "oportunidad" | "objetivo" | "nicho" | "charla";

export type Resultado = { tipo: TipoResultado; id: string; titulo: string; contexto: string; enlace: string; nicho: string | null; puntaje: number };

/** Minúsculas, sin tildes y sin espacios de más. */
export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export type Pedido = { tipo: "visita"; resto: string } | { tipo: "ir"; resto: string } | { tipo: "texto"; resto: string };

/** Lo que se escribió: "nueva visita a…" busca locales para cargar la visita; "ir a…", nichos y páginas. */
export function interpretar(texto: string): Pedido {
  const t = normalizar(texto);
  const visita = /^(?:nueva |cargar (?:una )?)?visita(?: (?:a|en|al))?(?: (.*))?$/.exec(t);
  if (visita) return { tipo: "visita", resto: (visita[1] ?? "").trim() };
  const ir = /^(?:ir a(?:l)?|abrir|ver) (.+)$/.exec(t);
  if (ir) return { tipo: "ir", resto: ir[1].trim() };
  return { tipo: "texto", resto: t };
}

export type Accion = { id: string; titulo: string; frases: readonly string[]; enlace: string };

/** Coincide si cada palabra escrita es el comienzo de alguna palabra de la frase ("carg cob" → "cargar cobro"). */
function coincide(texto: string, frase: string): number {
  const palabras = normalizar(texto).split(" ").filter(Boolean);
  if (palabras.length === 0) return 0;
  const de = normalizar(frase).split(" ");
  if (!palabras.every((p) => de.some((d) => d.startsWith(p)))) return 0;
  return normalizar(frase).startsWith(normalizar(texto)) ? 1 : 0.8;
}

export function accionesQueCoinciden(texto: string, acciones: readonly Accion[]): Resultado[] {
  if (normalizar(texto).length < 2) return [];
  return acciones
    .map((a) => ({ a, p: Math.max(...a.frases.map((f) => coincide(texto, f)), coincide(texto, a.titulo)) }))
    .filter((x) => x.p > 0)
    .sort((x, y) => y.p - x.p)
    .map(({ a, p }) => ({ tipo: "accion" as const, id: a.id, titulo: a.titulo, contexto: "", enlace: a.enlace, nicho: null, puntaje: 1 + p }));
}

export type Pagina = { ruta: string; nombre: string; claves?: readonly string[] };

export function paginasQueCoinciden(texto: string, paginas: readonly Pagina[]): Resultado[] {
  if (normalizar(texto).length < 2) return [];
  return paginas
    .map((g) => ({ g, p: Math.max(coincide(texto, g.nombre), ...(g.claves ?? []).map((c) => coincide(texto, c))) }))
    .filter((x) => x.p > 0)
    .sort((x, y) => y.p - x.p)
    .map(({ g, p }) => ({ tipo: "pagina" as const, id: g.ruta, titulo: g.nombre, contexto: g.ruta, enlace: g.ruta, nicho: null, puntaje: 0.9 + p / 10 }));
}

export type Charla = { id: string; nombre: string | null; empresa: string | null; rubro: string | null; necesidad: string | null; ultimo: string | null; actualizada: number };

/** Las charlas del chat (vienen del almacén del chat, no de la base): por nombre, empresa, rubro o lo último que se dijo. */
export function buscarEnCharlas(texto: string, charlas: readonly Charla[], limite = 5): Resultado[] {
  const q = normalizar(texto);
  if (q.length < 2) return [];
  const palabras = q.split(" ");
  return charlas
    .map((c) => {
      const titulo = normalizar([c.nombre, c.empresa].filter(Boolean).join(" "));
      const todo = normalizar([c.nombre, c.empresa, c.rubro, c.necesidad, c.ultimo].filter(Boolean).join(" "));
      const p = palabras.every((w) => todo.includes(w)) ? (palabras.every((w) => titulo.includes(w)) ? 0.9 : 0.6) : 0;
      return { c, p };
    })
    .filter((x) => x.p > 0)
    .sort((x, y) => y.p - x.p || y.c.actualizada - x.c.actualizada)
    .slice(0, limite)
    .map(({ c, p }) => ({
      tipo: "charla" as const,
      id: c.id,
      titulo: [c.nombre, c.empresa].filter(Boolean).join(" · ") || c.id.slice(0, 8),
      contexto: (c.ultimo ?? "").slice(0, 80),
      enlace: `/panel/mensajes?c=${encodeURIComponent(c.id)}`,
      nicho: null,
      puntaje: p,
    }));
}

/** Junta y ordena lo que vino de la base, las acciones, las páginas y las charlas (sin repetir enlaces). */
export function unir(listas: Resultado[][], limite = 30): Resultado[] {
  const vistos = new Set<string>();
  return listas
    .flat()
    .sort((a, b) => b.puntaje - a.puntaje)
    .filter((r) => (vistos.has(r.enlace) ? false : (vistos.add(r.enlace), true)))
    .slice(0, limite);
}

/** "Nueva visita a…": los locales encontrados llevan al formulario de visita abierto. */
export function comoVisita(resultados: Resultado[]): Resultado[] {
  return resultados.filter((r) => r.tipo === "local").map((r) => ({ ...r, enlace: `${r.enlace}&visita=si` }));
}

export type Reciente = Pick<Resultado, "tipo" | "titulo" | "contexto" | "enlace" | "nicho">;

/** Lo último que se abrió (solo en este navegador): sin repetir, lo más nuevo primero. */
export function agregarReciente(lista: readonly Reciente[], r: Reciente, maximo = 8): Reciente[] {
  return [r, ...lista.filter((x) => x.enlace !== r.enlace)].slice(0, maximo);
}
