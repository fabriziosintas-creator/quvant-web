import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO } from "@/componentes/cuenta/estilos";
import { CambiarContrasena, DatosCuenta } from "@/componentes/cuenta/FormulariosCuenta";
import { MarcoCuenta } from "@/componentes/cuenta/MarcoCuenta";
import { ACENTO_NICHO } from "@/datos/colores";
import { CUENTA, PLATAFORMAS } from "@/datos/textos";
import { salir } from "@/servidor/cuenta/acciones";
import { exigirPerfil, type Perfil } from "@/servidor/cuenta/sesion";

export const metadata: Metadata = {
  title: `${CUENTA.cuenta.metaTitulo} | Quvant`,
  robots: { index: false, follow: false },
};

const { cuenta } = CUENTA;

/**
 * La cuenta de la persona. Lee la sesión, así que va entera detrás de un
 * <Suspense>: sin sesión, el proxy ya la mandó a /ingresar; si la sesión
 * venció, exigirPerfil la manda ahí. Los datos salen de la base con su
 * propia sesión (RLS: solo ve su perfil).
 */
export default function Cuenta({ searchParams }: PageProps<"/cuenta">) {
  return (
    <Suspense
      fallback={
        <MarcoCuenta titulo={cuenta.cargando}>
          <div aria-hidden className="h-96 border border-profundo" />
        </MarcoCuenta>
      }
    >
      <ContenidoCuenta searchParams={searchParams} />
    </Suspense>
  );
}

async function ContenidoCuenta({ searchParams }: { searchParams: PageProps<"/cuenta">["searchParams"] }) {
  const [{ perfil }, parametros] = await Promise.all([exigirPerfil("/cuenta"), searchParams]);
  const bienvenida = parametros.bienvenida === "1";
  const nuevaContrasena = parametros.contrasena === "nueva";
  const acento = perfil.nicho_id in ACENTO_NICHO ? ACENTO_NICHO[perfil.nicho_id as keyof typeof ACENTO_NICHO] : "#9C9CA3";

  const contrasena = <CambiarContrasena destacar={nuevaContrasena} />;

  return (
    <MarcoCuenta titulo={cuenta.hola.replace("{nombre}", perfil.nombre)} bajada={cuenta.bajada} acento={acento}>
      <div className="flex flex-col gap-14">
        {bienvenida || nuevaContrasena ? (
          <p
            role="status"
            className="flex items-start gap-3 border border-acero/60 px-4 py-3 font-plex text-sm leading-relaxed text-blanco"
          >
            <span aria-hidden className="mt-[5px] size-2.5 shrink-0 bg-blanco" />
            {nuevaContrasena ? cuenta.avisos.nuevaContrasena : cuenta.avisos.bienvenida}
          </p>
        ) : null}

        {nuevaContrasena ? contrasena : null}

        <Sugerencia perfil={perfil} />

        {perfil.rol === "admin" ? (
          <div>
            <Link href="/panel" className={CLASE_BOTON_SECUNDARIO}>
              <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
              {cuenta.panel}
            </Link>
          </div>
        ) : null}

        <DatosCuenta
          perfil={{
            email: perfil.email,
            nombre: perfil.nombre,
            apellido: perfil.apellido ?? "",
            nicho: perfil.nicho_id,
            nichoOtro: perfil.nicho_otro ?? "",
            objetivo: perfil.objetivo_id,
            empresa: perfil.empresa ?? "",
            ciudad: perfil.ciudad ?? "",
            telefono: perfil.telefono ?? "",
            novedades: perfil.acepta_novedades,
          }}
        />

        {nuevaContrasena ? null : contrasena}

        <form action={salir} className="border-t border-profundo pt-8">
          <button type="submit" className={CLASE_BOTON_SECUNDARIO}>
            {cuenta.salir}
          </button>
        </form>
      </div>
    </MarcoCuenta>
  );
}

/** Lo útil según lo que la trajo a Quvant: su plantilla, la web o los trabajos. */
function Sugerencia({ perfil }: { perfil: Perfil }) {
  const objetivo = perfil.objetivo_id as keyof typeof cuenta.sugerencias;
  const sugerencia = cuenta.sugerencias[objetivo] ?? cuenta.sugerencias.curiosidad;
  const rubro =
    perfil.nicho_id === "otro"
      ? perfil.nicho_otro || "tu rubro"
      : (CUENTA.nichos.find((n) => n.id === perfil.nicho_id)?.nombre ?? "tu rubro");
  const conPlantilla = PLATAFORMAS.rubros.items.some((item) => item.id === perfil.nicho_id);
  const destino =
    objetivo === "mejorar_clientela"
      ? conPlantilla
        ? `/plataformas#rubro-${perfil.nicho_id}`
        : "/plataformas#rubros"
      : objetivo === "hacer_web"
        ? "/contacto"
        : "/trabajos";

  return (
    <section className="border border-profundo p-6 md:p-8">
      <h2 className="flex items-start gap-3 font-plex text-xs font-medium uppercase leading-relaxed tracking-etiqueta text-acero">
        <span aria-hidden className="mt-[7px] size-1.5 shrink-0 bg-[var(--acento)]" />
        {CUENTA.objetivos.find((o) => o.id === perfil.objetivo_id)?.texto}
      </h2>
      <p className="mt-5 titulo text-2xl text-blanco md:text-3xl">{sugerencia.titulo}</p>
      <p className="mt-3 font-lectura text-base leading-relaxed text-acero">
        {sugerencia.texto.replace("{rubro}", rubro.toLowerCase())}
      </p>
      <Link href={destino} className={`mt-6 ${CLASE_BOTON}`}>
        {sugerencia.boton}
      </Link>
    </section>
  );
}
