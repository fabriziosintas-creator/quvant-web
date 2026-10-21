import Link from "next/link";
import { PROMO, PROMO_TEXTOS } from "@/datos/promo";

const T = PROMO_TEXTOS.registro;

/**
 * La tarjeta de la promo arriba del registro: cuántos quedan y qué pasa al
 * confirmar el email. Con la promo llena, avisa que se entra en la lista
 * de espera. Recibe los números ya leídos de la base.
 */
export function TarjetaPromo({ quedan, tope, abierta }: { quedan: number; tope: number; abierta: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#7BD389]/40 bg-profundo/35 p-5" style={{ "--acento": "#7BD389" } as React.CSSProperties}>
      <p className="flex items-center gap-3 font-lectura text-sm font-medium text-blanco">
        <span aria-hidden className="size-2 bg-[var(--acento)]" />
        {T.etiqueta}
      </p>
      <p className="font-lectura text-[15px] leading-relaxed text-blanco">
        {(abierta ? T.abierta : T.llena).replace("{n}", String(quedan)).replace("{tope}", String(tope))}
      </p>
      <Link href={`${PROMO.ruta}#como-funciona`} className="font-lectura text-sm text-acero underline decoration-profundo underline-offset-4 hover:text-blanco">
        {PROMO_TEXTOS.cuenta.bases}
      </Link>
    </div>
  );
}
