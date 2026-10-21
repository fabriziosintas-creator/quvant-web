import type { Operacion } from "./cola";

/**
 * La cola guardada en el teléfono (IndexedDB, la API del navegador, sin
 * librerías). Solo guarda lo que se cargó sin señal; al cerrar sesión se
 * borra todo (borrarTodoLoGuardado).
 */

const BASE = "quvant-panel";
const COLA = "cola";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => {
      if (!pedido.result.objectStoreNames.contains(COLA)) pedido.result.createObjectStore(COLA, { keyPath: "clave" });
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
}

async function conTienda<T>(modo: IDBTransactionMode, hacer: (tienda: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const base = await abrir();
  try {
    return await new Promise<T | undefined>((resolver, rechazar) => {
      const tx = base.transaction(COLA, modo);
      const pedido = hacer(tx.objectStore(COLA));
      tx.oncomplete = () => resolver(pedido ? pedido.result : undefined);
      tx.onerror = () => rechazar(tx.error);
      tx.onabort = () => rechazar(tx.error);
    });
  } finally {
    base.close();
  }
}

export const hayAlmacen = () => typeof indexedDB !== "undefined";

export async function leerCola(): Promise<Operacion[]> {
  if (!hayAlmacen()) return [];
  return ((await conTienda<Operacion[]>("readonly", (t) => t.getAll())) ?? []) as Operacion[];
}

export async function guardarOperacion(op: Operacion): Promise<void> {
  await conTienda("readwrite", (t) => t.put(op));
}

export async function borrarOperacion(clave: string): Promise<void> {
  await conTienda("readwrite", (t) => t.delete(clave));
}

/** Al cerrar sesión: la cola, las páginas y los mosaicos guardados. */
export async function borrarTodoLoGuardado(): Promise<void> {
  try {
    if (hayAlmacen()) {
      await new Promise<void>((resolver) => {
        const pedido = indexedDB.deleteDatabase(BASE);
        pedido.onsuccess = pedido.onerror = pedido.onblocked = () => resolver();
      });
    }
    if (typeof caches !== "undefined") {
      for (const nombre of await caches.keys()) if (nombre.startsWith("quvant-panel")) await caches.delete(nombre);
    }
  } catch {
    // Si el navegador no deja, igual se cierra la sesión.
  }
}
