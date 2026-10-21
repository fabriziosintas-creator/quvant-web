import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { CLASE_BOTON_SECUNDARIO } from "@/componentes/cuenta/estilos";
import { urlWhatsApp } from "@/datos/contacto";
import { PROMO, PROMO_TEXTOS, type IdBeneficio } from "@/datos/promo";
import type { Perfil } from "@/servidor/cuenta/sesion";
import { obtenerEstadoPromo, promoAbierta } from "@/servidor/promo/estado";
import { ReservarLugar } from "./ReservarLugar";

const T = PROMO_TEXTOS.cuenta;

type Lugar = {
  numero: number | null;
  estado: keyof typeof T.estados;
  beneficio: IdBeneficio;
  posicion_espera: number | null;
};

/**
 * "Primeros 100" en la cuenta: el lugar de la persona (número, beneficio,
 * estado y el WhatsApp para coordinar) o, si todavía no tiene y quedan
 * lugares, el botón para reservarlo. Nada si la base no tiene la promo o
 * si es una cuenta de admin.
 */
export async function LugarPromo({ perfil, supabase }: { perfil: Perfil; supabase: unknown }) {
  if (perfil.rol === "admin") return null;
  const cliente = supabase as SupabaseClient;
  const [estadoPromo, respuesta] = await Promise.all([obtenerEstadoPromo(), cliente.rpc("mi_lugar_promo")]);
  if (!estadoPromo) return null;
  const lugar = (respuesta.error ? null : respuesta.data) as Lugar | null;

  if (!lugar) {
    if (!promoAbierta(estadoPromo) || !perfil.email_confirmado_en) return null;
    return (
      <Marco>
        <p className="titulo text-2xl text-blanco md:text-3xl">{T.reservar.titulo.replace("{n}", String(estadoPromo.quedan))}</p>
        <p className="mt-3 font-lectura text-base leading-relaxed text-blanco">{T.reservar.texto}</p>
        <div className="mt-6">
          <ReservarLugar nicho={perfil.nicho_id} rubrosSistema={estadoPromo.rubros_sistema} />
        </div>
        <Bases />
      </Marco>
    );
  }

  const beneficio = PROMO_TEXTOS.beneficiosCortos[lugar.beneficio];
  const titulo =
    lugar.numero !== null
      ? T.tuLugar.replace("{n}", String(lugar.numero)).replace("{tope}", String(estadoPromo.tope))
      : lugar.estado === "espera"
        ? T.espera
        : T.pedido;
  const mensaje = T.mensaje
    .replace("{nombre}", perfil.nombre)
    .replace("{n}", String(lugar.numero ?? "—"))
    .replace("{beneficio}", beneficio.toLowerCase());

  return (
    <Marco>
      <p className="titulo text-2xl text-blanco md:text-3xl">{titulo}</p>
      <p className="mt-3 font-lectura text-base leading-relaxed text-blanco">{T.beneficio.replace("{beneficio}", beneficio)}</p>
      <p className="mt-2 font-lectura text-base leading-relaxed text-acero">
        {T.estados[lugar.estado].replace("{n}", String(lugar.posicion_espera ?? ""))}
      </p>
      {lugar.numero !== null && ["reservado", "coordinando", "en_uso"].includes(lugar.estado) ? (
        <a href={urlWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer" className={`mt-6 ${CLASE_BOTON_SECUNDARIO}`}>
          <span aria-hidden className="size-1.5 bg-[var(--acento-promo)]" />
          {T.whatsapp}
        </a>
      ) : null}
      <Bases />
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label={T.etiqueta}
      className="rounded-2xl border border-[#7BD389]/40 bg-profundo/35 p-6 md:p-8"
      style={{ "--acento-promo": "#7BD389" } as React.CSSProperties}
    >
      <p className="mb-5 flex items-center gap-3 font-lectura text-sm font-medium text-acero">
        <span aria-hidden className="size-1.5 bg-[var(--acento-promo)]" />
        {T.etiqueta}
      </p>
      {children}
    </section>
  );
}

function Bases() {
  return (
    <p className="mt-6">
      <Link href={`${PROMO.ruta}#como-funciona`} className="font-lectura text-sm text-acero underline decoration-profundo underline-offset-4 hover:text-blanco">
        {T.bases}
      </Link>
    </p>
  );
}
