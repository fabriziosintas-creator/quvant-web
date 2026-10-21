import Link from "next/link";
import { PROMO, PROMO_TEXTOS } from "@/datos/promo";
import { obtenerEstadoPromo, promoAbierta } from "@/servidor/promo/estado";

const T = PROMO_TEXTOS.entrada;

/**
 * Una línea con link a "Primeros 100", para Sistemas, Contacto y el pie.
 * Solo mientras queden lugares (los números salen de la base, en caché).
 * `origen` marca de dónde vino, para la medición.
 */
export async function EntradaPromo({ origen, className = "" }: { origen: string; className?: string }) {
  const estado = await obtenerEstadoPromo();
  if (!promoAbierta(estado) || !estado) return null;
  return (
    <p
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-lectura text-sm leading-relaxed text-acero ${className}`}
      style={{ "--acento-promo": "#7BD389" } as React.CSSProperties}
    >
      <span aria-hidden className="size-1.5 shrink-0 bg-[var(--acento-promo)]" />
      <span>
        {T.texto} <span className="text-blanco">{PROMO_TEXTOS.cinta.quedan.replace("{n}", String(estado.quedan))}.</span>
      </span>
      <Link href={`${PROMO.ruta}?utm_source=${origen}`} className="text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">
        {T.link}
      </Link>
    </p>
  );
}
