import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TituloPanel } from "@/componentes/panel/Graficos";
import { FormOportunidad, type ValoresOportunidad } from "@/componentes/panel/comercial/Formularios";
import { PANEL_ADMIN } from "@/datos/textos";
import { detalleParaPanel } from "@/servidor/chat/servicio";
import { uuidValido } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";

const T = PANEL_ADMIN.comercial;
export const metadata: Metadata = { title: `${T.nueva} · ${PANEL_ADMIN.titulo} · Quvant` };

/** Nueva oportunidad: a mano, o precargada desde un registro (?perfil=), un local (?local=) o una charla (?conversacion=). */
export default function Nueva({ searchParams }: PageProps<"/panel/comercial/nueva">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Link href="/panel/comercial" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        {T.ficha.volver}
      </Link>
      <TituloPanel titulo={T.nueva} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/comercial/nueva">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/comercial/nueva");
  const p = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const [nichos] = await Promise.all([cargarNichos(supabase)]);
  let inicial: ValoresOportunidad = { responsable: "fabrizio" };

  const perfil = uno(p.perfil);
  const local = uno(p.local);
  const conversacion = uno(p.conversacion);
  if (uuidValido(perfil)) {
    const { data } = await supabase.from("perfiles").select("id, nombre, apellido, empresa, telefono, email, nicho_id, ciudad").eq("id", perfil).maybeSingle();
    if (data) {
      const persona = [data.nombre, data.apellido].filter(Boolean).join(" ");
      inicial = { ...inicial, perfil_id: data.id, negocio: data.empresa || persona, contacto: persona, telefono: data.telefono ?? "", email: data.email, nicho: data.nicho_id, ciudad: data.ciudad ?? "" };
    }
  } else if (uuidValido(local)) {
    const { data } = await supabase.from("locales").select("id, nombre, contacto, telefono, nicho_id, ciudad").eq("id", local).maybeSingle();
    if (data) inicial = { ...inicial, local_id: data.id, negocio: data.nombre, contacto: data.contacto ?? "", telefono: data.telefono ?? "", nicho: data.nicho_id ?? "", ciudad: data.ciudad ?? "" };
  } else if (/^[\w-]{1,80}$/.test(conversacion)) {
    const charla = await detalleParaPanel(conversacion);
    const pedido = charla?.conversacion.pedido;
    inicial = {
      ...inicial,
      conversacion_id: conversacion,
      negocio: pedido?.empresa || pedido?.nombre || "",
      contacto: pedido?.nombre ?? "",
      telefono: pedido && !pedido.contacto.includes("@") ? pedido.contacto : "",
      email: pedido?.contacto.includes("@") ? pedido.contacto : "",
      proximo_paso: pedido ? `${pedido.necesidad}: ${pedido.detalle}`.slice(0, 300) : "",
    };
  }
  return <FormOportunidad inicial={inicial} nichos={nichos.filter((n) => n.id !== "otro").map((n) => ({ id: n.id, nombre: n.nombre }))} />;
}
