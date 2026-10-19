import { promises as fs } from "node:fs";
import path from "node:path";
import type { Conversacion, Mensaje } from "./tipos";

/**
 * Dónde se guardan las conversaciones. Tres variantes con la misma forma:
 *
 *  - Redis (Upstash, por su API REST): la de producción. Se activa sola si
 *    están KV_REST_API_URL + KV_REST_API_TOKEN (lo que crea la integración
 *    de Upstash en Vercel) o UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
 *  - Archivo (.datos/chat.json): para probar en la computadora sin
 *    configurar nada. No sirve en Vercel (su disco no persiste).
 *  - Memoria: si el sitio corre en Vercel sin Redis. Funciona, pero se
 *    pierde con cada reinicio; el panel lo avisa.
 */

export type TipoAlmacen = "redis" | "archivo" | "memoria";

export interface Almacen {
  tipo: TipoAlmacen;
  obtener(id: string): Promise<Conversacion | null>;
  guardar(conversacion: Conversacion): Promise<void>;
  agregarMensaje(id: string, mensaje: Mensaje): Promise<void>;
  mensajes(id: string): Promise<Mensaje[]>;
  /** Las más recientes primero. */
  listar(limite: number): Promise<Conversacion[]>;
  /** Suma uno a un contador que vence a los `segundos`; devuelve el valor. */
  contar(clave: string, segundos: number): Promise<number>;
}

const PREFIJO = "quvant:chat";

function crearRedis(url: string, token: string): Almacen {
  const base = url.replace(/\/$/, "");
  const ejecutar = async (comandos: (string | number)[][]) => {
    const respuesta = await fetch(`${base}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(comandos),
      cache: "no-store",
    });
    if (!respuesta.ok) throw new Error(`Redis respondió ${respuesta.status}`);
    const resultados = (await respuesta.json()) as { result?: unknown; error?: string }[];
    const error = resultados.find((r) => r.error);
    if (error) throw new Error(`Redis: ${error.error}`);
    return resultados.map((r) => r.result);
  };
  const clave = (id: string) => `${PREFIJO}:${id}`;

  return {
    tipo: "redis",
    async obtener(id) {
      const [valor] = await ejecutar([["GET", clave(id)]]);
      return typeof valor === "string" ? (JSON.parse(valor) as Conversacion) : null;
    },
    async guardar(c) {
      await ejecutar([
        ["SET", clave(c.id), JSON.stringify(c)],
        ["ZADD", `${PREFIJO}s`, c.actualizada, c.id],
      ]);
    },
    async agregarMensaje(id, mensaje) {
      await ejecutar([["RPUSH", `${clave(id)}:mensajes`, JSON.stringify(mensaje)]]);
    },
    async mensajes(id) {
      const [lista] = await ejecutar([["LRANGE", `${clave(id)}:mensajes`, 0, -1]]);
      return Array.isArray(lista) ? lista.map((m) => JSON.parse(String(m)) as Mensaje) : [];
    },
    async listar(limite) {
      const [ids] = await ejecutar([["ZRANGE", `${PREFIJO}s`, 0, limite - 1, "REV"]]);
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const [valores] = await ejecutar([["MGET", ...ids.map((id) => clave(String(id)))]]);
      return (Array.isArray(valores) ? valores : [])
        .filter((v): v is string => typeof v === "string")
        .map((v) => JSON.parse(v) as Conversacion);
    },
    async contar(nombre, segundos) {
      const k = `${PREFIJO}:limite:${nombre}`;
      const [valor] = await ejecutar([["INCR", k], ["EXPIRE", k, segundos, "NX"]]);
      return Number(valor);
    },
  };
}

type Datos = { conversaciones: Record<string, Conversacion>; mensajes: Record<string, Mensaje[]> };

/** Archivo o memoria: el mismo manejo, cambia solo si se escribe al disco. */
function crearLocal(tipo: "archivo" | "memoria"): Almacen {
  const ruta = path.join(process.cwd(), ".datos", "chat.json");
  let datos: Datos | null = null;
  const contadores = new Map<string, { valor: number; vence: number }>();
  // Las escrituras van en fila: dos mensajes a la vez no se pisan.
  let fila: Promise<unknown> = Promise.resolve();

  const cargar = async (): Promise<Datos> => {
    if (datos) return datos;
    if (tipo === "archivo") {
      try {
        datos = JSON.parse(await fs.readFile(ruta, "utf8")) as Datos;
        return datos;
      } catch {
        // Todavía no hay archivo: se arranca vacío.
      }
    }
    datos = { conversaciones: {}, mensajes: {} };
    return datos;
  };
  const escribir = async () => {
    if (tipo !== "archivo" || !datos) return;
    await fs.mkdir(path.dirname(ruta), { recursive: true });
    await fs.writeFile(ruta, JSON.stringify(datos, null, 1), "utf8");
  };
  const enFila = <T,>(trabajo: () => Promise<T>) => {
    const siguiente = fila.then(trabajo, trabajo);
    fila = siguiente.catch(() => undefined);
    return siguiente;
  };

  return {
    tipo,
    async obtener(id) {
      return (await cargar()).conversaciones[id] ?? null;
    },
    guardar(c) {
      return enFila(async () => {
        (await cargar()).conversaciones[c.id] = c;
        await escribir();
      });
    },
    agregarMensaje(id, mensaje) {
      return enFila(async () => {
        const d = await cargar();
        (d.mensajes[id] ??= []).push(mensaje);
        await escribir();
      });
    },
    async mensajes(id) {
      return [...((await cargar()).mensajes[id] ?? [])];
    },
    async listar(limite) {
      return Object.values((await cargar()).conversaciones)
        .sort((a, b) => b.actualizada - a.actualizada)
        .slice(0, limite);
    },
    async contar(nombre, segundos) {
      const ahora = Date.now();
      const actual = contadores.get(nombre);
      const nuevo =
        actual && actual.vence > ahora
          ? { valor: actual.valor + 1, vence: actual.vence }
          : { valor: 1, vence: ahora + segundos * 1000 };
      contadores.set(nombre, nuevo);
      return nuevo.valor;
    },
  };
}

let unico: Almacen | null = null;

export function almacen(): Almacen {
  if (unico) return unico;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) unico = crearRedis(url, token);
  else if (process.env.VERCEL) {
    console.warn("[chat] Sin Redis configurado: las conversaciones se guardan en memoria y se pierden.");
    unico = crearLocal("memoria");
  } else unico = crearLocal("archivo");
  return unico;
}
