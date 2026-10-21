"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROMO, PROMO_TEXTOS } from "@/datos/promo";
import { CLAVE_CINTA } from "./cintaDecision";

const T = PROMO_TEXTOS.cinta;

/** Donde la promo ya está en la página, la cinta sobra. */
const SIN_CINTA = [PROMO.ruta, "/registro", "/cuenta", "/ingresar"];

/**
 * La cinta fina de "Primeros 100", primera fila del encabezado fijo (se
 * esconde con él al bajar en el celular). Una línea que lleva a la página
 * de la promo y una cruz para cerrarla 7 días.
 *
 * No hace saltar la página: el script de <head> (cintaDecision) decide
 * antes del primer pintado si estaba cerrada, y el CSS reserva su alto
 * solo cuando se ve (.cinta-promo en globals.css). Mientras corre la intro
 * de la tele queda invisible y después aparece con un fundido.
 */
export function CintaPromo({ quedan }: { quedan: number }) {
  const ruta = usePathname();
  if (SIN_CINTA.some((r) => ruta === r || ruta.startsWith(`${r}/`))) return null;

  const cerrar = () => {
    try {
      localStorage.setItem(CLAVE_CINTA, String(Date.now()));
    } catch {
      // Sin localStorage, se cierra igual por esta visita.
    }
    document.documentElement.dataset.cintaCerrada = "si";
  };

  const cuantos = T.quedan.replace("{n}", String(quedan));

  return (
    <div className="cinta-promo border-b border-profundo/70 bg-[#121214]" style={{ "--acento-promo": "#7BD389" } as React.CSSProperties}>
      <div className="contenedor flex h-8 items-center justify-center gap-3">
        <Link
          href={`${PROMO.ruta}?utm_source=cinta`}
          className="group flex min-w-0 items-center gap-2.5 font-lectura text-[13px] text-acero transition-colors hover:text-blanco"
        >
          <span aria-hidden className="size-1.5 shrink-0 bg-[var(--acento-promo)]" />
          <span className="truncate">
            <span className="hidden md:inline">{T.largo}</span>
            <span className="md:hidden">{T.corto}</span>
            <span className="text-blanco"> · {cuantos}</span>
          </span>
          <span aria-hidden className="shrink-0 text-blanco transition-transform duration-(--duracion-rapida) group-hover:translate-x-0.5">
            →
          </span>
        </Link>
        <button
          type="button"
          onClick={cerrar}
          aria-label={T.cerrar}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-acero transition-colors hover:text-blanco"
        >
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
