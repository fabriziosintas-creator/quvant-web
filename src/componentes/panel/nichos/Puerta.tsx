"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { precargarTunel } from "./Tunel";

/**
 * Una puerta a un nicho: cualquier lugar del panel donde aparece un nicho
 * (tarjetas de Plantillas, barras del Resumen, Núcleos, Objetivos…). Al
 * pasar el mouse o apoyar el dedo, precarga la página y el túnel 3D, así
 * el clic entra sin espera.
 */
export function Puerta({ nicho, children, className, etiqueta }: { nicho: string; children: ReactNode; className?: string; etiqueta?: string }) {
  const router = useRouter();
  const ruta = `/panel/nichos/${nicho}`;
  const precargar = () => {
    router.prefetch(ruta);
    precargarTunel();
  };
  return (
    <Link href={ruta} aria-label={etiqueta} onPointerEnter={precargar} onTouchStart={precargar} onFocus={precargar} transitionTypes={["entrar-nicho"]} className={className}>
      {children}
    </Link>
  );
}
