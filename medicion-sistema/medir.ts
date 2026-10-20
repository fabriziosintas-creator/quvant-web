/**
 * medir(evento, propiedades): la única puerta de salida de la medición.
 *
 *  1. Valida el evento y sus propiedades contra el catálogo (con el tipo de
 *     TypeScript y, otra vez, en tiempo de ejecución): lo que no está en el
 *     catálogo, no sale; una propiedad de más, se descarta.
 *  2. Respeta "Compartir métricas de uso con Quvant": apagado, no sale nada
 *     (ni a la cola).
 *  3. Agrega las propiedades comunes (organización, plantilla, sucursal,
 *     rol, dispositivo, versiones, prueba).
 *  4. Sin conexión, encola con la hora original; al volver, vacía la cola.
 *  5. Nunca rompe la app: cualquier error queda en consola y nada más.
 *
 * El envío real lo hace un adaptador (posthog-navegador.ts o
 * posthog-servidor.ts): medir() no sabe de PostHog.
 */
import { EVENTOS, PLANTILLAS, ROLES, VERSION_CATALOGO, type DefinicionEvento, type Dispositivo, type NombreEvento, type Plantilla, type Rol, type TipoPropiedad } from "./catalogo";
import { Cola, almacenEnMemoria, type Almacen, type EventoEncolado } from "./cola";
import { anonimoDe } from "./seudonimo";

/** Lo que el sistema sabe de quién está usándolo. Lo fija al iniciar sesión. */
export type Contexto = {
  organizacionId: string;
  plantilla: Plantilla;
  sucursalId: string;
  rol: Rol;
  dispositivo: Dispositivo;
  versionApp: string;
  /** La opción del dueño "Compartir métricas de uso con Quvant" (prendida por defecto). */
  compartirMetricas: boolean;
  /** Organización de demo o de prueba. */
  prueba: boolean;
  /** El id seudónimo calculado en el servidor (seudonimo.ts). Sin él, va la organización. */
  seudonimo?: string;
};

export type Enviador = (evento: { nombre: string; propiedades: Record<string, unknown>; hora: Date; distinctId: string }) => Promise<void>;

type ValorDe<T> = T extends "booleano" ? boolean : T extends "contador" ? number : T extends { opciones: readonly (infer O)[] } ? O : never;

/** Las propiedades permitidas de un evento, con su tipo. */
export type PropiedadesDe<E extends NombreEvento> = { [K in keyof (typeof EVENTOS)[E]["propiedades"]]: ValorDe<(typeof EVENTOS)[E]["propiedades"][K]> };

export type Opciones = {
  enviador: Enviador;
  /** Dónde guardar la cola sin conexión. Por defecto, en memoria. */
  almacen?: Almacen;
  /** ¿Hay internet? Por defecto, navigator.onLine (o true). */
  hayConexion?: () => boolean;
  /** Qué hacer con los problemas (por defecto, console.warn). */
  avisar?: (mensaje: string) => void;
  ahora?: () => Date;
};

/** Devuelve el valor validado o un mensaje de por qué no vale. */
export function validarPropiedad(tipo: TipoPropiedad, valor: unknown): { ok: true; valor: boolean | number | string } | { ok: false; motivo: string } {
  if (tipo === "booleano") return typeof valor === "boolean" ? { ok: true, valor } : { ok: false, motivo: "tiene que ser true o false" };
  if (tipo === "contador") {
    return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor < 1_000_000_000
      ? { ok: true, valor }
      : { ok: false, motivo: "tiene que ser un número entero positivo" };
  }
  return typeof valor === "string" && tipo.opciones.includes(valor) ? { ok: true, valor } : { ok: false, motivo: `tiene que ser una de: ${tipo.opciones.join(", ")}` };
}

export function validarContexto(contexto: Contexto): string | null {
  if (!contexto.organizacionId) return "falta organizacionId";
  if (!PLANTILLAS.includes(contexto.plantilla)) return `plantilla desconocida: ${contexto.plantilla}`;
  if (!ROLES.includes(contexto.rol)) return `rol desconocido: ${contexto.rol}`;
  if (contexto.dispositivo !== "celular" && contexto.dispositivo !== "computadora") return "dispositivo tiene que ser celular o computadora";
  return null;
}

export class Medicion {
  private contexto: Contexto | null = null;
  private readonly cola: Cola;
  private readonly avisar: (m: string) => void;
  private readonly hayConexion: () => boolean;
  private readonly ahora: () => Date;
  private vaciando = false;

  constructor(private readonly opciones: Opciones) {
    this.cola = new Cola(opciones.almacen ?? almacenEnMemoria());
    this.avisar = opciones.avisar ?? ((m) => console.warn(`[medición] ${m}`));
    this.hayConexion = opciones.hayConexion ?? (() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
    this.ahora = opciones.ahora ?? (() => new Date());
  }

  /** Al iniciar sesión (y cuando cambia la sucursal o la opción de compartir). */
  fijarContexto(contexto: Contexto) {
    const problema = validarContexto(contexto);
    if (problema) {
      this.avisar(`contexto inválido (${problema}): no se mide nada hasta corregirlo`);
      this.contexto = null;
      return;
    }
    this.contexto = contexto;
    if (!contexto.compartirMetricas) this.cola["almacen"].guardar([]); // Apagado: tampoco queda nada guardado.
  }

  /** Al cerrar sesión. */
  limpiarContexto() {
    this.contexto = null;
  }

  pendientes() {
    return this.cola.pendientes();
  }

  /**
   * Anota un evento. Nunca lanza: si algo no vale, avisa y sigue.
   * Devuelve true si el evento salió o quedó encolado.
   */
  medir<E extends NombreEvento>(nombre: E, propiedades?: PropiedadesDe<E>): boolean {
    try {
      const contexto = this.contexto;
      if (!contexto) return false;
      if (!contexto.compartirMetricas) return false;

      const definicion = (EVENTOS as Record<string, DefinicionEvento>)[nombre];
      if (!definicion) {
        this.avisar(`evento desconocido "${String(nombre)}": no está en el catálogo`);
        return false;
      }
      if (definicion.plantillas !== "todas" && !definicion.plantillas.includes(contexto.plantilla)) {
        this.avisar(`"${String(nombre)}" no existe en la plantilla ${contexto.plantilla}`);
        return false;
      }

      // Solo las propiedades del catálogo, con el tipo correcto; el resto se descarta.
      const limpias: Record<string, unknown> = {};
      const recibidas = (propiedades ?? {}) as Record<string, unknown>;
      for (const [clave, tipo] of Object.entries(definicion.propiedades)) {
        if (!(clave in recibidas)) {
          this.avisar(`"${String(nombre)}" sin la propiedad "${clave}"`);
          return false;
        }
        const resultado = validarPropiedad(tipo, recibidas[clave]);
        if (!resultado.ok) {
          this.avisar(`"${String(nombre)}.${clave}" ${resultado.motivo}`);
          return false;
        }
        limpias[clave] = resultado.valor;
      }
      for (const clave of Object.keys(recibidas)) {
        if (!(clave in definicion.propiedades)) this.avisar(`"${String(nombre)}.${clave}" no está en el catálogo: se descarta`);
      }

      const comunes = {
        organizacion_id: contexto.organizacionId,
        plantilla: contexto.plantilla,
        sucursal_id: contexto.sucursalId,
        rol: contexto.rol,
        dispositivo: contexto.dispositivo,
        version_app: contexto.versionApp,
        version_catalogo: VERSION_CATALOGO,
        prueba: contexto.prueba,
        modulo: definicion.modulo,
      };
      const evento: EventoEncolado = {
        evento: nombre,
        propiedades: { ...comunes, ...limpias, sin_conexion: false },
        hora: this.ahora().toISOString(),
        distinctId: contexto.seudonimo ?? anonimoDe(contexto.organizacionId),
      };

      if (!this.hayConexion()) {
        this.cola.encolar(evento);
        return true;
      }
      void this.enviar(evento).catch(() => this.cola.encolar(evento));
      return true;
    } catch (error) {
      this.avisar(`error inesperado: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /** Manda la cola sin conexión (llamar al volver internet y al arrancar). */
  async vaciarCola(): Promise<number> {
    if (this.vaciando || !this.contexto?.compartirMetricas || !this.hayConexion()) return 0;
    this.vaciando = true;
    try {
      return await this.cola.vaciar((evento) => this.enviar(evento));
    } finally {
      this.vaciando = false;
    }
  }

  private enviar(evento: EventoEncolado) {
    return this.opciones.enviador({ nombre: evento.evento, propiedades: evento.propiedades, hora: new Date(evento.hora), distinctId: evento.distinctId });
  }
}
