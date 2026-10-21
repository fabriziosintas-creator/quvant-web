"use client";

import { useEffect } from "react";
import { CLAVE_EQUIPO, idVisita } from "@/componentes/medicion/medir";
import { anotarIngreso } from "@/servidor/bitacora/acciones";
import { marcarNavegadorDelEquipo } from "@/servidor/panel/equipo";

/**
 * Al abrir el panel, este navegador queda marcado como del equipo: la web
 * deja de medirlo (CLAVE_EQUIPO en localStorage) y el servidor anota su id
 * de visita para descontar lo que ya había contado. Una vez por navegador
 * alcanza; en cada dispositivo, abrir el panel una vez.
 */
export function MarcarEquipo() {
  useEffect(() => {
    let id: string | null = null;
    try {
      window.localStorage.setItem(CLAVE_EQUIPO, "si");
      id = idVisita();
    } catch {
      // Sin localStorage la web tampoco mide este navegador.
    }
    if (id) void marcarNavegadorDelEquipo(id);
    // El ingreso al panel, para la bitácora: uno por pestaña (la base además anota uno cada 8 horas).
    try {
      if (!window.sessionStorage.getItem("quvant:ingreso")) {
        window.sessionStorage.setItem("quvant:ingreso", "si");
        void anotarIngreso().catch(() => undefined);
      }
    } catch {
      // Sin sessionStorage, no se anota el ingreso: no cambia nada más.
    }
  }, []);
  return null;
}
