"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { PROMO } from "@/datos/promo";

/**
 * "Quiero mi lugar": al registro con la promo, llevando de qué canal vino
 * la persona (?utm_source= de la página: visita, instagram, whatsapp…)
 * para que el registro lo guarde como origen. Sin parámetros, el link va
 * igual (el fallback del <Suspense> es el mismo botón sin origen).
 */
export function BotonLugar({ className, children }: { className: string; children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <Link href={`${PROMO.registro}&origen=${PROMO.id}`} className={className}>
          {children}
        </Link>
      }
    >
      <ConOrigen className={className}>{children}</ConOrigen>
    </Suspense>
  );
}

function ConOrigen({ className, children }: { className: string; children: ReactNode }) {
  const parametros = useSearchParams();
  const canal = (parametros.get("utm_source") ?? parametros.get("origen") ?? "").replace(/[^\w-]/g, "").slice(0, 40);
  const origen = canal ? `${PROMO.id}/${canal}` : PROMO.id;
  return (
    <Link href={`${PROMO.registro}&origen=${encodeURIComponent(origen)}`} className={className}>
      {children}
    </Link>
  );
}
