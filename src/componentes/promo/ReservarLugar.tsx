"use client";

import { useActionState } from "react";
import { Aviso } from "@/componentes/cuenta/Campos";
import { CLASE_BOTON } from "@/componentes/cuenta/estilos";
import { PROMO_TEXTOS } from "@/datos/promo";
import { reservarLugar, type EstadoReserva } from "@/servidor/promo/acciones";
import { EleccionBeneficio } from "./EleccionBeneficio";

const INICIAL: EstadoReserva = { estado: "inicial" };
const T = PROMO_TEXTOS.cuenta.reservar;

/** Reservar el lugar desde la cuenta: elegir el beneficio y listo. */
export function ReservarLugar({ nicho, rubrosSistema }: { nicho: string; rubrosSistema: readonly string[] }) {
  const [estado, enviar, enviando] = useActionState(reservarLugar, INICIAL);
  return (
    <form action={enviar} className="flex flex-col gap-5">
      {estado.mensaje ? <Aviso tipo={estado.estado === "error" ? "error" : estado.estado === "espera" ? "nota" : "listo"}>{estado.mensaje}</Aviso> : null}
      <EleccionBeneficio nicho={nicho} rubrosSistema={rubrosSistema} error={estado.errores?.promo_beneficio} />
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          <span aria-hidden className="size-1.5 bg-[#7BD389]" />
          {enviando ? T.reservando : T.boton}
        </button>
      </div>
    </form>
  );
}
