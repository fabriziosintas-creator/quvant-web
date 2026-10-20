/**
 * La cola sin conexión. El mostrador vende sin internet: los eventos se
 * guardan con su hora original y salen al volver la conexión.
 *
 * El almacenamiento se inyecta (localStorage en el navegador, o la cola que
 * ya use el sistema): así se prueba sin navegador y se puede enchufar a la
 * cola existente del sistema sin tocar esta lógica.
 */

export type EventoEncolado = {
  evento: string;
  propiedades: Record<string, unknown>;
  /** ISO 8601, la hora en que pasó de verdad. */
  hora: string;
  distinctId: string;
};

export type Almacen = {
  leer(): EventoEncolado[];
  guardar(eventos: EventoEncolado[]): void;
};

export const LIMITE_COLA = 500;

/** Un almacén sobre localStorage (o cualquier objeto con getItem/setItem). */
export function almacenEnStorage(storage: Pick<Storage, "getItem" | "setItem">, clave = "quvant-medicion-cola"): Almacen {
  return {
    leer() {
      try {
        const crudo = storage.getItem(clave);
        const lista = crudo ? (JSON.parse(crudo) as unknown) : [];
        return Array.isArray(lista) ? (lista as EventoEncolado[]) : [];
      } catch {
        return [];
      }
    },
    guardar(eventos) {
      try {
        storage.setItem(clave, JSON.stringify(eventos));
      } catch {
        // Sin lugar o sin permiso: se pierde la cola, nunca la venta.
      }
    },
  };
}

/** Un almacén en memoria (pruebas y servidor). */
export function almacenEnMemoria(): Almacen {
  let eventos: EventoEncolado[] = [];
  return { leer: () => eventos, guardar: (lista) => (eventos = lista) };
}

export class Cola {
  constructor(private readonly almacen: Almacen) {}

  encolar(evento: EventoEncolado) {
    const lista = this.almacen.leer();
    lista.push(evento);
    // Si se pasa del límite, se van los más viejos: la cola no crece sin fin.
    this.almacen.guardar(lista.slice(-LIMITE_COLA));
  }

  pendientes() {
    return this.almacen.leer().length;
  }

  /** Manda lo encolado, en orden, con su hora original. Lo que falla vuelve a la cola. */
  async vaciar(enviar: (evento: EventoEncolado) => Promise<void>): Promise<number> {
    const lista = this.almacen.leer();
    if (lista.length === 0) return 0;
    const quedan: EventoEncolado[] = [];
    let enviados = 0;
    for (const evento of lista) {
      if (quedan.length > 0) {
        quedan.push(evento); // Después de una falla, el resto se queda esperando (se conserva el orden).
        continue;
      }
      try {
        await enviar({ ...evento, propiedades: { ...evento.propiedades, sin_conexion: true } });
        enviados++;
      } catch {
        quedan.push(evento);
      }
    }
    this.almacen.guardar(quedan);
    return enviados;
  }
}
